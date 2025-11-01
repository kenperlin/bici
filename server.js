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

// Store connected clients
const clients = new Map();

// Yjs document for collaborative code editing
const ydoc = new Y.Doc();
const ytext = ydoc.getText('codemirror');

wss.on('connection', (ws) => {
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
    // Check if it's a Yjs sync message (binary)
    if (message instanceof Buffer || message instanceof Uint8Array) {
      // Broadcast Yjs sync message to all other clients
      clients.forEach((client, id) => {
        if (id !== clientId && client.readyState === 1) {
          client.send(message);
        }
      });
      return;
    }

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
