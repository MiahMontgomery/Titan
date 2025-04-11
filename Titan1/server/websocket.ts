/**
 * WebSocket Server
 * 
 * This module manages real-time communication with clients via WebSocket.
 * It handles message routing, client connections, and provides real-time
 * feedback and thinking updates to the frontend.
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { log, error } from './helpers';

// Track connected clients
interface Client {
  id: string;
  socket: WebSocket;
  lastPing: number;
  projectId?: number;
}

const clients = new Map<string, Client>();
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

let wss: WebSocketServer;

/**
 * Initialize WebSocket server
 * @param server HTTP server instance
 */
export function initWebSocketServer(server: Server): WebSocketServer {
  // Create WebSocket server on /ws path to avoid conflict with Vite HMR
  // This is crucial for Replit's webview to correctly route WebSocket connections
  wss = new WebSocketServer({ 
    server, 
    path: '/ws',
    perMessageDeflate: false // Disable compression for better compatibility
  });
  
  wss.on('connection', (socket, request) => {
    const clientId = `client_${Date.now()}_${uuidv4().substring(0, 8)}`;
    
    // Set up the client
    clients.set(clientId, {
      id: clientId,
      socket,
      lastPing: Date.now(),
    });
    
    log(`WebSocket client connected: ${clientId}`);
    
    // Send welcome message
    socket.send(JSON.stringify({
      type: 'welcome',
      clientId,
      message: 'Connected to Findom WebSocket Server',
      timestamp: Date.now()
    }));
    
    // Handle messages from client
    socket.on('message', (message) => {
      try {
        // Try to parse as JSON, but also handle plain text
        let parsedMessage;
        try {
          parsedMessage = JSON.parse(message.toString());
        } catch (e) {
          // If not valid JSON, treat as plain text
          parsedMessage = { 
            type: 'message', 
            content: message.toString() 
          };
        }
        
        // Set project ID if provided
        if (parsedMessage.projectId && clients.has(clientId)) {
          clients.get(clientId)!.projectId = parsedMessage.projectId;
        }
        
        // Handle different message types
        if (parsedMessage.type === 'ping') {
          // Respond to ping
          socket.send(JSON.stringify({
            type: 'pong',
            timestamp: Date.now()
          }));
          
          // Update last ping time
          if (clients.has(clientId)) {
            clients.get(clientId)!.lastPing = Date.now();
          }
        } else if (parsedMessage.type === 'subscribe') {
          // Handle subscription to project updates
          if (parsedMessage.projectId) {
            if (clients.has(clientId)) {
              clients.get(clientId)!.projectId = parsedMessage.projectId;
              log(`Client ${clientId} subscribed to project ${parsedMessage.projectId}`);
              
              // Confirm subscription
              socket.send(JSON.stringify({
                type: 'subscribed',
                projectId: parsedMessage.projectId,
                timestamp: Date.now()
              }));
            }
          }
        } else {
          // Log other messages
          log(`WebSocket message from ${clientId}: ${message.toString().substring(0, 100)}`);
        }
      } catch (err: any) {
        error(`Error processing WebSocket message: ${err.message}`);
      }
    });
    
    // Handle disconnection
    socket.on('close', () => {
      log(`WebSocket client disconnected: ${clientId}`);
      clients.delete(clientId);
    });
    
    // Handle errors
    socket.on('error', (err) => {
      error(`WebSocket error for client ${clientId}: ${err.message}`);
      clients.delete(clientId);
    });
  });
  
  // Set up heartbeat to keep connections alive
  startHeartbeat();
  
  return wss;
}

/**
 * Send heartbeat pings to clients to keep connections alive
 */
function startHeartbeat() {
  setInterval(() => {
    const now = Date.now();
    
    // Check each client
    clients.forEach((client, id) => {
      // If socket is not open, remove it
      if (client.socket.readyState !== WebSocket.OPEN) {
        clients.delete(id);
        return;
      }
      
      // Send heartbeat ping
      try {
        client.socket.send(JSON.stringify({
          type: 'ping',
          timestamp: now
        }));
      } catch (err) {
        error(`Error sending heartbeat to client ${id}`);
        clients.delete(id);
      }
    });
  }, HEARTBEAT_INTERVAL);
}

/**
 * Broadcast a message to all connected clients
 * @param message The message to broadcast
 */
export function broadcastToAll(message: any): void {
  const messageString = typeof message === 'string' 
    ? message 
    : JSON.stringify(message);
    
  clients.forEach((client) => {
    if (client.socket.readyState === WebSocket.OPEN) {
      try {
        client.socket.send(messageString);
      } catch (err) {
        error(`Error broadcasting to client ${client.id}`);
      }
    }
  });
}

/**
 * Send a message to clients subscribed to a specific project
 * @param projectId The project ID
 * @param message The message to send
 */
export function broadcastToProject(projectId: number, message: any): void {
  const messageString = typeof message === 'string' 
    ? message 
    : JSON.stringify(message);
  
  let sentCount = 0;
  
  clients.forEach((client) => {
    // Send to clients subscribed to this project
    if (client.projectId === projectId && client.socket.readyState === WebSocket.OPEN) {
      try {
        client.socket.send(messageString);
        sentCount++;
      } catch (err) {
        error(`Error sending to client ${client.id}`);
      }
    }
  });
  
  // Log broadcast statistics
  if (sentCount > 0) {
    log(`Broadcast to ${sentCount} clients for project ${projectId}`);
  }
}

/**
 * Send thinking updates for a project
 * @param projectId The project ID
 * @param message The thinking message
 * @param codeSnippet Optional code snippet
 */
export function sendThinking(
  projectId: number,
  message: string,
  codeSnippet?: string
): void {
  broadcastToProject(projectId, {
    type: 'thinking',
    projectId,
    message,
    codeSnippet,
    timestamp: Date.now()
  });
}

/**
 * Get number of connected clients
 */
export function getConnectedClientCount(): number {
  return clients.size;
}

/**
 * Get connected client IDs
 */
export function getConnectedClientIds(): string[] {
  return Array.from(clients.keys());
}

/**
 * Close all connections
 */
export function closeAllConnections(): void {
  clients.forEach((client) => {
    try {
      client.socket.terminate();
    } catch (err) {
      // Ignore errors on shutdown
    }
  });
  
  clients.clear();
}

/**
 * Get the WebSocket server instance
 */
export function getWebSocketServer(): WebSocketServer | null {
  return wss || null;
}