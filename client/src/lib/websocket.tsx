/**
 * WebSocket client for real-time communication with the server
 */
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Types
export interface WebSocketMessage {
  type: string;
  projectId?: number;
  data?: any;
  clientId?: string | null;
  message?: string;
  codeSnippet?: string;
  timestamp?: number | string;
  error?: any;
}

type MessageHandler = (message: WebSocketMessage) => void;

// WebSocket Context Types
interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (type: string, data: any, projectId?: number) => boolean;
  subscribe: (handler: (message: WebSocketMessage) => void) => () => void;
}

// Create WebSocket Context
const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  sendMessage: () => false,
  subscribe: () => () => {}
});

// WebSocket instance
let socket: WebSocket | null = null;
let clientId: string | null = null;
let reconnectTimer: number | null = null;
let connectionAttempts = 0;
const MAX_RECONNECT_DELAY = 30000; // 30 seconds
const INITIAL_RECONNECT_DELAY = 1000; // 1 second

// Message handlers for the subscription system
const subscribers = new Set<(message: WebSocketMessage) => void>();

/**
 * Initialize WebSocket connection to server
 */
function initializeWebSocket(): void {
  if (socket) return;
  
  try {
    // Determine WebSocket URL from environment or derive from API URL
    let wsUrl = import.meta.env.VITE_WS_URL as string;
    
    if (!wsUrl) {
      // Use the current host but switch protocol 
      // Instead of appending '/ws' here, we'll use the full path
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      wsUrl = `${protocol}//${host}/ws`;
      
      // Debug logging
      console.log('WebSocket URL derived from host:', {
        windowLocation: window.location.toString(),
        protocol,
        host,
        wsUrl
      });
    }
    
    console.log(`Connecting to WebSocket server at ${wsUrl}`);
    
    // Create WebSocket connection
    socket = new WebSocket(wsUrl);
    
    // Set up event handlers
    socket.onopen = handleOpen;
    socket.onmessage = handleMessage;
    socket.onclose = handleClose;
    socket.onerror = handleError;
    
    // Reset connection attempts on successful connection attempt
    connectionAttempts = 0;
    
    // Add timeout to detect connection issues
    const connectionTimeout = setTimeout(() => {
      if (socket && socket.readyState !== WebSocket.OPEN) {
        console.warn('WebSocket connection timeout');
        if (socket) socket.close();
      }
    }, 10000); // 10 second timeout
    
    // Clear timeout when connection opens
    socket.addEventListener('open', () => {
      clearTimeout(connectionTimeout);
    });
  } catch (err) {
    console.error('Failed to initialize WebSocket:', err);
    scheduleReconnect();
  }
}

/**
 * Send a message to the server
 * @param type Message type
 * @param data Message data
 * @param projectId Optional project ID
 */
function sendMessage(type: string, data: any, projectId?: number): boolean {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.warn('Cannot send message, WebSocket not connected');
    return false;
  }
  
  const message: WebSocketMessage = {
    type,
    data,
    clientId: clientId || undefined,
    projectId
  };
  
  try {
    socket.send(JSON.stringify(message));
    return true;
  } catch (err) {
    console.error('Error sending WebSocket message:', err);
    return false;
  }
}

/**
 * Close WebSocket connection
 */
function closeWebSocket(): void {
  if (socket) {
    socket.close();
    socket = null;
  }
  
  if (reconnectTimer !== null) {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

/**
 * Check if WebSocket is connected
 */
function isConnected(): boolean {
  return socket !== null && socket.readyState === WebSocket.OPEN;
}

/**
 * Get client ID assigned by the server
 */
function getClientId(): string | null {
  return clientId;
}

// Private helper functions

function handleOpen(event: Event): void {
  console.log('WebSocket connection established');
  
  // Reset connection attempts
  connectionAttempts = 0;
  
  // Notify subscribers that connection is established
  subscribers.forEach(handler => {
    try {
      handler({
        type: 'connection_status',
        data: { 
          status: 'connected',
          timestamp: new Date().toISOString()
        }
      });
    } catch (err) {
      console.error('Error in open handler:', err);
    }
  });
}

function handleMessage(event: MessageEvent): void {
  try {
    const message = JSON.parse(event.data) as WebSocketMessage;
    
    // Process system messages
    if (message.type === 'connection' && message.clientId) {
      clientId = message.clientId;
      console.log(`Assigned client ID: ${clientId}`);
      
      // Also notify subscribers about successful connection
      subscribers.forEach(handler => {
        try {
          handler({
            type: 'connection_status',
            clientId: message.clientId,
            data: { 
              status: 'registered',
              clientId: message.clientId,
              message: 'WebSocket client registered with server'
            }
          });
        } catch (err) {
          console.error('Error in connection handler:', err);
        }
      });
    } else if (message.type === 'heartbeat') {
      // Handle heartbeat response - no need to forward to subscribers
      console.debug('Received heartbeat from server');
      return;
    } else if (message.type === 'error') {
      // Log server-side errors
      console.error('Server error:', message.data?.message || 'Unknown server error');
    } else if (message.type === 'thinking') {
      // Process thinking updates for active projects
      console.debug('Thinking update for project:', message.projectId);
    }
    
    // Notify all subscribers about the message
    subscribers.forEach(handler => {
      try {
        handler(message);
      } catch (err) {
        console.error('Error in message handler:', err);
      }
    });
  } catch (err) {
    console.error('Error parsing WebSocket message:', err);
    
    // Notify subscribers of the parsing error
    subscribers.forEach(handler => {
      try {
        handler({
          type: 'error',
          data: { 
            message: 'Error parsing WebSocket message',
            error: String(err)
          }
        });
      } catch (handlerErr) {
        console.error('Error in error handler:', handlerErr);
      }
    });
  }
}

function handleClose(event: CloseEvent): void {
  console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
  
  // Get a readable message for the close code
  const closeMessage = getCloseEventMessage(event);
  
  // Notify subscribers of the close event
  subscribers.forEach(handler => {
    try {
      handler({
        type: 'connection_status',
        data: { 
          status: 'disconnected',
          code: event.code,
          reason: event.reason || closeMessage
        }
      });
    } catch (err) {
      console.error('Error in close handler:', err);
    }
  });
  
  socket = null;
  
  // Only reconnect if not closed cleanly or by user
  if (event.code !== 1000) {
    scheduleReconnect();
  }
}

// Helper to get a readable message for WebSocket close codes
function getCloseEventMessage(event: CloseEvent): string {
  const codeMessages: Record<number, string> = {
    1000: 'Normal closure',
    1001: 'Server shutdown or browser navigation',
    1002: 'Protocol error',
    1003: 'Data format error',
    1004: 'Reserved',
    1005: 'No status received',
    1006: 'Connection closed abnormally',
    1007: 'Invalid frame payload data',
    1008: 'Policy violation',
    1009: 'Message too big',
    1010: 'Extension negotiation failed',
    1011: 'Unexpected server error',
    1012: 'Server restarting',
    1013: 'Try again later',
    1014: 'Bad gateway',
    1015: 'TLS handshake failed'
  };
  
  return codeMessages[event.code] || `Unknown close code: ${event.code}`;
}

function handleError(event: Event): void {
  console.error('WebSocket error:', event);
  
  // Notify subscribers of the error
  subscribers.forEach(handler => {
    try {
      handler({
        type: 'error',
        data: { message: 'WebSocket connection error', event }
      });
    } catch (err) {
      console.error('Error in error handler:', err);
    }
  });
  
  // The socket will typically be closed by the server after an error,
  // but we can force it to ensure cleanup happens properly
  if (socket && socket.readyState !== WebSocket.CLOSED) {
    socket.close();
  }
}

function scheduleReconnect(): void {
  if (reconnectTimer !== null) return;
  
  connectionAttempts++;
  const delay = Math.min(INITIAL_RECONNECT_DELAY * Math.pow(1.5, connectionAttempts - 1), MAX_RECONNECT_DELAY);
  
  console.log(`Scheduling WebSocket reconnect in ${delay}ms (attempt ${connectionAttempts})`);
  
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    initializeWebSocket();
  }, delay);
}

// Helper function to send a ping/heartbeat
function sendHeartbeat(): void {
  if (isConnected()) {
    sendMessage('heartbeat', { timestamp: new Date().toISOString() });
  }
}

// WebSocket Provider Component
export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState<boolean>(false);
  
  // Initialize WebSocket on mount
  useEffect(() => {
    // Initialize the WebSocket
    initializeWebSocket();
    
    // Create connection status checking interval
    const statusInterval = setInterval(() => {
      setConnected(isConnected());
    }, 1000);
    
    // Set up heartbeat interval to prevent connection timeouts
    const heartbeatInterval = setInterval(() => {
      sendHeartbeat();
    }, 30000); // Send heartbeat every 30 seconds
    
    // Clean up on unmount
    return () => {
      clearInterval(statusInterval);
      clearInterval(heartbeatInterval);
      closeWebSocket();
    };
  }, []);
  
  // Subscribe function for components to receive messages
  const subscribe = (handler: (message: WebSocketMessage) => void) => {
    subscribers.add(handler);
    
    // Return unsubscribe function
    return () => {
      subscribers.delete(handler);
    };
  };
  
  const contextValue: WebSocketContextType = {
    isConnected: connected,
    sendMessage,
    subscribe
  };
  
  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

// Hook for components to use the WebSocket
export function useWebSocketContext() {
  return useContext(WebSocketContext);
}