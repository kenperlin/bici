import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import * as Y from 'yjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Serve static files
app.use(express.static('.'));

// Add JSON bodt parser
app.use(express.json());

// Gemini endpoint
app.post('/api/gemini', async (req, res) => {
  try {
    const { prompt, history = [] } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Import Gemini
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    // Use your own API key
    const genAI = new GoogleGenerativeAI("your-API-key");
    // adjust the model as you wish
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // Start chat with history
    const chat = model.startChat({
      history: history
    });

    // Send message
    const result = await chat.sendMessage(prompt);
    const response = result.response;
    const text = response.text();

    res.json({ response: text });
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ error: 'Failed to get response from Gemini' });
  }
});


// Endpoint to clear Yjs document cache
app.post('/api/clear-yjs-cache/:docName?', (req, res) => {
  const docName = req.params.docName;

  if (docName) {
    // Clear specific document
    if (yjsDocs.has(docName)) {
      yjsDocs.delete(docName);
      console.log(`Cleared Yjs document: ${docName}`);
      res.json({ success: true, message: `Cleared document: ${docName}` });
    } else {
      res.json({ success: false, message: `Document not found: ${docName}` });
    }
  } else {
    // Clear all documents
    const count = yjsDocs.size;
    yjsDocs.clear();
    console.log(`Cleared all ${count} Yjs documents`);
    res.json({ success: true, message: `Cleared ${count} documents` });
  }
});

// GET endpoint for easier browser access
app.get('/api/clear-yjs-cache/:docName?', (req, res) => {
  const docName = req.params.docName;

  if (docName) {
    if (yjsDocs.has(docName)) {
      yjsDocs.delete(docName);
      console.log(`Cleared Yjs document: ${docName}`);
      res.send(`<h1>Cleared document: ${docName}</h1><p><a href="/">Back to BICI</a></p>`);
    } else {
      res.send(`<h1>Document not found: ${docName}</h1><p><a href="/">Back to BICI</a></p>`);
    }
  } else {
    const count = yjsDocs.size;
    yjsDocs.clear();
    console.log(`Cleared all ${count} Yjs documents`);
    res.send(`<h1>Cleared ${count} documents</h1><p><a href="/">Back to BICI</a></p>`);
  }
});

// Store connected clients
const clients = new Map();

// Store Yjs documents (one per room/document name)
const yjsDocs = new Map();

// Store Yjs WebSocket connections per document: docName -> Set<WebSocket>
const yjsConnections = new Map();

// Store rooms: roomId -> { clients: Set<clientId>, createdAt: timestamp }
const rooms = new Map();

// Store client-to-room mapping: clientId -> roomId
const clientRooms = new Map();

// Generate short room code (6 alphanumeric characters)
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Ensure uniqueness
  return rooms.has(code) ? generateRoomCode() : code;
}

// Create a new room
function createRoom(roomId = null) {
  const id = roomId || generateRoomCode();
  if (!rooms.has(id)) {
    rooms.set(id, {
      clients: new Set(),
      createdAt: Date.now()
    });
    console.log(`Created room: ${id}`);
  }
  return id;
}

// Add client to room
function addClientToRoom(clientId, roomId) {
  const room = rooms.get(roomId);
  if (!room) {
    console.error(`Room ${roomId} does not exist`);
    return false;
  }

  // Check room capacity (max 2 for 1-on-1)
  if (room.clients.size >= 2) {
    console.log(`Room ${roomId} is full (${room.clients.size}/2)`);
    return false;
  }

  room.clients.add(clientId);
  clientRooms.set(clientId, roomId);
  console.log(`Client ${clientId} joined room ${roomId} (${room.clients.size}/2)`);
  return true;
}

// Remove client from room and cleanup if empty
function removeClientFromRoom(clientId) {
  const roomId = clientRooms.get(clientId);
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (room) {
    room.clients.delete(clientId);
    console.log(`Client ${clientId} left room ${roomId} (${room.clients.size}/2)`);

    // Auto-delete room if empty
    if (room.clients.size === 0) {
      rooms.delete(roomId);
      console.log(`Deleted empty room: ${roomId}`);
    }
  }

  clientRooms.delete(clientId);
}

// Get clients in same room
function getRoomClients(roomId) {
  const room = rooms.get(roomId);
  return room ? Array.from(room.clients) : [];
}

// Get or create a Yjs document for a room
function getYDoc(docName) {
  if (!yjsDocs.has(docName)) {
    const ydoc = new Y.Doc();
    yjsDocs.set(docName, ydoc);
    console.log(`Created new Yjs document: ${docName}`);
  }
  return yjsDocs.get(docName);
}

wss.on('connection', (ws, req) => {
  // Check if this is a y-websocket connection (has docName in URL)
  const url = new URL(req.url, `http://${req.headers.host}`);
  const docName = url.pathname.slice(1); // Remove leading '/'

  if (docName && docName !== '') {
    // This is a y-websocket connection for collaborative editing
    console.log(`Yjs client connected to document: ${docName}`);

    const ydoc = getYDoc(docName);

    // Track this WebSocket connection for this document
    if (!yjsConnections.has(docName)) {
      yjsConnections.set(docName, new Set());
    }
    yjsConnections.get(docName).add(ws);
    console.log(`Yjs connections for ${docName}: ${yjsConnections.get(docName).size}`);

    // Send current document state to new client
    const currentState = Y.encodeStateAsUpdate(ydoc);
    if (currentState.length > 0) {
      ws.send(currentState);
    }

    // Handle incoming Yjs updates (raw binary)
    ws.on('message', (message) => {
      const update = new Uint8Array(message);

      // Apply update to server's document
      Y.applyUpdate(ydoc, update);

      // Broadcast to other clients connected to the SAME document only
      const docConnections = yjsConnections.get(docName);
      if (docConnections) {
        docConnections.forEach((client) => {
          if (client !== ws && client.readyState === 1) {
            client.send(message);
          }
        });
      }
    });

    ws.on('close', () => {
      console.log(`Yjs client disconnected from document: ${docName}`);
      // Remove from document connections
      const docConnections = yjsConnections.get(docName);
      if (docConnections) {
        docConnections.delete(ws);
        console.log(`Yjs connections for ${docName}: ${docConnections.size}`);
        // Clean up empty sets
        if (docConnections.size === 0) {
          yjsConnections.delete(docName);
        }
      }
    });

    return;
  }

  // Regular WebRTC signaling connection
  const clientId = Math.random().toString(36).substr(2, 9);
  clients.set(clientId, ws);

  console.log(`Client connected: ${clientId}. Total clients: ${clients.size}`);

  // Parse room ID from URL query parameters
  const roomIdFromUrl = url.searchParams.get('room');
  let roomId = null;
  let roomJoinSuccess = false;
  let roomFull = false;

  if (roomIdFromUrl) {
    // Client wants to join a specific room
    if (!rooms.has(roomIdFromUrl)) {
      // Room doesn't exist, create it
      createRoom(roomIdFromUrl);
    }
    roomJoinSuccess = addClientToRoom(clientId, roomIdFromUrl);
    if (roomJoinSuccess) {
      roomId = roomIdFromUrl;
    } else {
      roomFull = true;
    }
  } else {
    // No room specified, auto-create a new room
    roomId = createRoom();
    addClientToRoom(clientId, roomId);
    roomJoinSuccess = true;
  }

  // Send the client their ID and room info
  ws.send(JSON.stringify({
    type: 'welcome',
    clientId: clientId,
    roomId: roomId,
    roomFull: roomFull,
    totalClients: clients.size
  }));

  if (roomJoinSuccess) {
    // Broadcast updated client list to clients in the same room
    broadcastClientListToRoom(roomId);
  }

  ws.on('message', (message) => {

    try {
      const data = JSON.parse(message.toString());

      // Handle different message types
      switch (data.type) {
        case 'offer':
        case 'answer':
        case 'ice-candidate':
          // Forward WebRTC signaling messages to the target peer
          const targetClient = clients.get(data.target);
          if (targetClient && targetClient.readyState === 1) {
            targetClient.send(JSON.stringify({
              ...data,
              from: clientId
            }));
          }
          break;

        case 'request-client-list':
          // Send current client list to requester
          sendClientList(ws, clientId);
          break;

        case 'state-update':
          // Broadcast state updates to clients in the same room only
          const senderRoomId = clientRooms.get(clientId);
          if (senderRoomId) {
            console.log('Broadcasting state update from:', clientId, 'in room:', senderRoomId);
            const roomClients = getRoomClients(senderRoomId);
            roomClients.forEach((id) => {
              if (id !== clientId) {
                const client = clients.get(id);
                if (client && client.readyState === 1) {
                  client.send(JSON.stringify({
                    type: 'state-update',
                    from: clientId,
                    state: data.state
                  }));
                }
              }
            });
          }
          break;

        case 'action':
          // Relay action from secondary client to master client
          console.log('Relaying action from:', clientId, 'to master:', data.to);
          const masterClient = clients.get(data.to);
          if (masterClient && masterClient.readyState === 1) {
            masterClient.send(JSON.stringify({
              type: 'action',
              from: clientId,
              action: data.action
            }));
          }
          break;

        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    const roomId = clientRooms.get(clientId);
    clients.delete(clientId);
    removeClientFromRoom(clientId);
    console.log(`Client disconnected: ${clientId}. Total clients: ${clients.size}`);

    // Notify other clients in the room
    if (roomId) {
      broadcastClientListToRoom(roomId);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Broadcast client list to all clients in a specific room
function broadcastClientListToRoom(roomId) {
  const roomClientIds = getRoomClients(roomId);
  const message = JSON.stringify({
    type: 'client-list',
    clients: roomClientIds
  });

  roomClientIds.forEach((clientId) => {
    const client = clients.get(clientId);
    if (client && client.readyState === 1) { // OPEN
      client.send(message);
    }
  });
}

// Legacy function for backwards compatibility (now uses rooms)
function broadcastClientList() {
  rooms.forEach((room, roomId) => {
    broadcastClientListToRoom(roomId);
  });
}

function sendClientList(ws, excludeId) {
  const roomId = clientRooms.get(excludeId);
  if (!roomId) {
    ws.send(JSON.stringify({
      type: 'client-list',
      clients: []
    }));
    return;
  }

  const clientIds = getRoomClients(roomId).filter(id => id !== excludeId);
  ws.send(JSON.stringify({
    type: 'client-list',
    clients: clientIds
  }));
}

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`🚀 BICI server running on http://localhost:${PORT}`);
  console.log(`📡 WebRTC signaling server ready for connections`);
});
