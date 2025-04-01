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
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      wsUrl = `${protocol}//${host}/ws`;
    }
    
    console.log(`Connecting to WebSocket server at ${wsUrl}`);
    
    socket = new WebSocket(wsUrl);
    
    socket.onopen = handleOpen;
    socket.onmessage = handleMessage;
    socket.onclose = handleClose;
    socket.onerror = handleError;
    
    connectionAttempts = 0;
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
  connectionAttempts = 0;
}

function handleMessage(event: MessageEvent): void {
  try {
    const message = JSON.parse(event.data) as WebSocketMessage;
    
    // Store client ID if provided
    if (message.type === 'connection' && message.clientId) {
      clientId = message.clientId;
      console.log(`Assigned client ID: ${clientId}`);
    }
    
    // Notify all subscribers
    subscribers.forEach(handler => {
      try {
        handler(message);
      } catch (err) {
        console.error('Error in message handler:', err);
      }
    });
  } catch (err) {
    console.error('Error parsing WebSocket message:', err);
  }
}

function handleClose(event: CloseEvent): void {
  console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
  socket = null;
  
  // Only reconnect if not closed cleanly or by user
  if (event.code !== 1000) {
    scheduleReconnect();
  }
}

function handleError(event: Event): void {
  console.error('WebSocket error:', event);
  // The socket will be closed by the server after this
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
    
    // Clean up on unmount
    return () => {
      clearInterval(statusInterval);
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