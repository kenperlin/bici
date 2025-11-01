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

      // Broadcast to other clients connected to the same document
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === 1) {
          client.send(message);
        }
      });
    });

    ws.on('close', () => {
      console.log(`Yjs client disconnected from document: ${docName}`);
    });

    return;
  }

  // Regular WebRTC signaling connection
  const clientId = Math.random().toString(36).substr(2, 9);
  clients.set(clientId, ws);

  console.log(`Client connected: ${clientId}. Total clients: ${clients.size}`);

  // Send the client their ID
  ws.send(JSON.stringify({
    type: 'welcome',
    clientId: clientId,
    totalClients: clients.size
  }));

  // Broadcast updated client list to all clients
  broadcastClientList();

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
          // Broadcast state updates to all other clients
          console.log('Broadcasting state update from:', clientId);
          clients.forEach((client, id) => {
            if (id !== clientId && client.readyState === 1) {
              client.send(JSON.stringify({
                type: 'state-update',
                from: clientId,
                state: data.state
              }));
            }
          });
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
    clients.delete(clientId);
    console.log(`Client disconnected: ${clientId}. Total clients: ${clients.size}`);
    broadcastClientList();
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function broadcastClientList() {
  const clientIds = Array.from(clients.keys());
  const message = JSON.stringify({
    type: 'client-list',
    clients: clientIds
  });

  clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  });
}

function sendClientList(ws, excludeId) {
  const clientIds = Array.from(clients.keys()).filter(id => id !== excludeId);
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
