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
  
  // Initialize connection tracking for ping/pong
  const connectionStatus = new Map<string, { lastPong: Date, isAlive: boolean }>();
  
  wss.on('connection', (ws: WebSocket) => {
    // Generate a unique client ID
    const clientId = generateClientId();
    
    // Store the client
    clients.set(clientId, ws);
    
    // Initialize connection status
    connectionStatus.set(clientId, { 
      lastPong: new Date(), 
      isAlive: true 
    });
    
    log(`WebSocket client connected: ${clientId}`);
    
    // Send welcome message with client ID
    sendToClient(ws, {
      type: 'connection',
      clientId,
      data: { 
        message: 'Connected to Titan WebSocket Server',
        timestamp: new Date().toISOString()
      }
    });
    
    // Set up ping handler using WebSocket protocol
    ws.on('pong', () => {
      const status = connectionStatus.get(clientId);
      if (status) {
        status.isAlive = true;
        status.lastPong = new Date();
      }
    });
    
    // Handle messages from client
    ws.on('message', (message: string) => {
      try {
        const parsedMessage = JSON.parse(message.toString()) as WebSocketMessage;
        
        // Add client ID to message
        parsedMessage.clientId = clientId;
        
        // Update connection status on any message
        const status = connectionStatus.get(clientId);
        if (status) {
          status.lastPong = new Date();
        }
        
        handleMessage(parsedMessage, ws);
      } catch (e: unknown) {
        // Safe error handling
        let errorMessage = 'Unknown error';
        if (typeof e === 'object' && e !== null && 'message' in e) {
          errorMessage = String(e.message);
        } else if (e !== null) {
          errorMessage = String(e);
        }
        
        error(`Error parsing WebSocket message: ${errorMessage}`);
        sendToClient(ws, {
          type: 'error',
          data: { 
            message: 'Invalid message format',
            error: errorMessage
          }
        });
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      clients.delete(clientId);
      connectionStatus.delete(clientId);
      log(`WebSocket client disconnected: ${clientId}`);
    });
    
    // Handle errors
    ws.on('error', (e: Error) => {
      // Safe error handling for WebSocket error event (which provides Error objects)
      const errorMessage = e?.message || 'Unknown WebSocket error';
      error(`WebSocket error for client ${clientId}: ${errorMessage}`);
      clients.delete(clientId);
      connectionStatus.delete(clientId);
    });
  });
  
  // Set up interval to ping clients and clean up dead connections
  const pingInterval = setInterval(() => {
    let removedCount = 0;
    
    clients.forEach((ws, clientId) => {
      const status = connectionStatus.get(clientId);
      
      if (!status) {
        // Missing status record, create one
        connectionStatus.set(clientId, { 
          lastPong: new Date(), 
          isAlive: true 
        });
        return;
      }
      
      if (!status.isAlive) {
        // Connection is dead - terminate and clean up
        warn(`Terminating stale WebSocket connection: ${clientId}`);
        ws.terminate();
        clients.delete(clientId);
        connectionStatus.delete(clientId);
        removedCount++;
        return;
      }
      
      // Mark as not alive until we get a pong back
      status.isAlive = false;
      
      // Send a ping
      try {
        ws.ping();
      } catch (e: unknown) {
        // Safe error handling
        let errorMessage = 'Unknown error';
        if (typeof e === 'object' && e !== null && 'message' in e) {
          errorMessage = String(e.message);
        } else if (e !== null) {
          errorMessage = String(e);
        }
        
        error(`Error sending ping to client ${clientId}: ${errorMessage}`);
        ws.terminate();
        clients.delete(clientId);
        connectionStatus.delete(clientId);
        removedCount++;
      }
    });
    
    // If we removed any clients or it's time for a status update, broadcast connected count
    if (removedCount > 0 || Math.random() < 0.2) { // 20% chance of sending status update
      broadcast({
        type: 'server_status',
        data: {
          connectedClients: clients.size,
          timestamp: new Date().toISOString()
        }
      });
      
      // Also log it
      log(`WebSocket server status: ${clients.size} connected clients`);
    }
  }, 30000); // Check every 30 seconds
  
  // Clean up the interval when the server closes
  wss.on('close', () => {
    clearInterval(pingInterval);
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
  
  // Handle system messages first
  if (type === 'heartbeat') {
    // Respond to heartbeat with a pong message
    sendToClient(ws, {
      type: 'heartbeat',
      data: { 
        timestamp: new Date().toISOString(),
        serverTime: new Date().toISOString()
      }
    });
    return;
  }
  
  // Find registered handler for the message type
  if (messageHandlers.has(type)) {
    try {
      const handler = messageHandlers.get(type);
      if (handler) {
        handler(message, ws);
      }
    } catch (e: unknown) {
      // Safe error handling
      let errorMessage = 'Unknown error';
      if (typeof e === 'object' && e !== null && 'message' in e) {
        errorMessage = String(e.message);
      } else if (e !== null) {
        errorMessage = String(e);
      }
      
      error(`Error in message handler for type ${type}: ${errorMessage}`);
      sendToClient(ws, {
        type: 'error',
        data: { 
          message: `Error processing ${type} message`, 
          error: errorMessage 
        }
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