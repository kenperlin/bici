import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Serve static files
app.use(express.static('.'));

// Store connected clients
const clients = new Map();

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
