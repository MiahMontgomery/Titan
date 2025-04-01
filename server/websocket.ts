import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { log, warn, error } from './helpers';

interface WebSocketMessage {
  type: string;
  projectId?: number;
  data?: any;
  clientId?: string;
}

type MessageHandler = (message: WebSocketMessage, ws: WebSocket) => void;

// Store all connected clients
const clients: Map<string, WebSocket> = new Map();
// Store message handlers by type
const messageHandlers: Map<string, MessageHandler> = new Map();

/**
 * Initialize WebSocket server
 * @param server HTTP server to attach WebSocket server to
 */
export function initializeWebSocketServer(server: HTTPServer): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  wss.on('connection', (ws: WebSocket) => {
    // Generate a unique client ID
    const clientId = generateClientId();
    
    // Store the client
    clients.set(clientId, ws);
    
    log(`WebSocket client connected: ${clientId}`);
    
    // Send welcome message with client ID
    sendToClient(ws, {
      type: 'connection',
      clientId,
      data: { message: 'Connected to Titan WebSocket Server' }
    });
    
    // Handle messages from client
    ws.on('message', (message: string) => {
      try {
        const parsedMessage = JSON.parse(message.toString()) as WebSocketMessage;
        
        // Add client ID to message
        parsedMessage.clientId = clientId;
        
        handleMessage(parsedMessage, ws);
      } catch (err: Error | any) {
        error(`Error parsing WebSocket message: ${err.message}`);
        sendToClient(ws, {
          type: 'error',
          data: { message: 'Invalid message format' }
        });
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      clients.delete(clientId);
      log(`WebSocket client disconnected: ${clientId}`);
    });
    
    // Handle errors
    ws.on('error', (err: Error | any) => {
      error(`WebSocket error for client ${clientId}: ${err.message}`);
      clients.delete(clientId);
    });
  });
  
  return wss;
}

/**
 * Register a message handler
 * @param type Message type to handle
 * @param handler Function to handle message
 */
export function registerMessageHandler(type: string, handler: MessageHandler): void {
  messageHandlers.set(type, handler);
  log(`Registered WebSocket message handler for type: ${type}`);
}

/**
 * Handle incoming message
 * @param message Parsed message
 * @param ws WebSocket connection
 */
function handleMessage(message: WebSocketMessage, ws: WebSocket): void {
  const { type } = message;
  
  if (messageHandlers.has(type)) {
    try {
      const handler = messageHandlers.get(type);
      if (handler) {
        handler(message, ws);
      }
    } catch (err: Error | any) {
      error(`Error in message handler for type ${type}: ${err.message}`);
      sendToClient(ws, {
        type: 'error',
        data: { message: `Error processing ${type} message` }
      });
    }
  } else {
    warn(`No handler for WebSocket message type: ${type}`);
    sendToClient(ws, {
      type: 'error',
      data: { message: `Unsupported message type: ${type}` }
    });
  }
}

/**
 * Send message to specific client
 * @param ws WebSocket connection or client ID
 * @param message Message to send
 */
export function sendToClient(ws: WebSocket | string, message: WebSocketMessage): void {
  let targetWs: WebSocket | undefined;
  
  if (typeof ws === 'string') {
    targetWs = clients.get(ws);
  } else {
    targetWs = ws;
  }
  
  if (targetWs && targetWs.readyState === WebSocket.OPEN) {
    targetWs.send(JSON.stringify(message));
  } else if (typeof ws === 'string') {
    warn(`Cannot send message to client ${ws}: Client not connected`);
  }
}

/**
 * Broadcast message to all connected clients
 * @param message Message to broadcast
 * @param excludeClientId Optional client ID to exclude
 */
export function broadcast(message: WebSocketMessage, excludeClientId?: string): void {
  clients.forEach((ws, clientId) => {
    if (excludeClientId && clientId === excludeClientId) return;
    
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

/**
 * Broadcast message to clients subscribed to a project
 * @param projectId Project ID
 * @param message Message to broadcast
 * @param excludeClientId Optional client ID to exclude
 */
export function broadcastToProject(projectId: number, message: WebSocketMessage, excludeClientId?: string): void {
  // Add project ID to message
  message.projectId = projectId;
  
  // For now, broadcast to all clients
  // In the future, implement project-specific subscriptions
  broadcast(message, excludeClientId);
}

/**
 * Generate a unique client ID
 */
function generateClientId(): string {
  return `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get number of connected clients
 */
export function getConnectedClientCount(): number {
  return clients.size;
}