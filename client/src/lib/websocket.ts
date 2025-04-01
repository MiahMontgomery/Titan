/**
 * WebSocket client for real-time communication with the server
 */

// Types
interface WebSocketMessage {
  type: string;
  projectId?: number;
  data?: any;
  clientId?: string | null;
}

type MessageHandler = (message: WebSocketMessage) => void;

// Message handlers by type
const messageHandlers: Map<string, Set<MessageHandler>> = new Map();

// WebSocket instance
let socket: WebSocket | null = null;
let clientId: string | null = null;
let reconnectTimer: number | null = null;
let connectionAttempts = 0;
const MAX_RECONNECT_DELAY = 30000; // 30 seconds
const INITIAL_RECONNECT_DELAY = 1000; // 1 second

/**
 * Initialize WebSocket connection to server
 */
export function initializeWebSocket(): void {
  if (socket) return;
  
  try {
    // Determine WebSocket URL from environment or derive from API URL
    let wsUrl = import.meta.env.VITE_WS_URL as string;
    
    if (!wsUrl) {
      const apiUrl = import.meta.env.VITE_API_URL as string || window.location.origin;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = apiUrl.replace(/^https?:\/\//, '');
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
export function sendMessage(type: string, data: any, projectId?: number): boolean {
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
 * Register a handler for a specific message type
 * @param type Message type to handle
 * @param handler Function to handle message
 */
export function registerMessageHandler(type: string, handler: MessageHandler): void {
  if (!messageHandlers.has(type)) {
    messageHandlers.set(type, new Set());
  }
  
  messageHandlers.get(type)?.add(handler);
}

/**
 * Unregister a message handler
 * @param type Message type
 * @param handler Handler function to remove
 */
export function unregisterMessageHandler(type: string, handler: MessageHandler): void {
  if (messageHandlers.has(type)) {
    messageHandlers.get(type)?.delete(handler);
  }
}

/**
 * Close WebSocket connection
 */
export function closeWebSocket(): void {
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
export function isConnected(): boolean {
  return socket !== null && socket.readyState === WebSocket.OPEN;
}

/**
 * Get client ID assigned by the server
 */
export function getClientId(): string | null {
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
    
    // Call appropriate message handlers
    if (messageHandlers.has(message.type)) {
      messageHandlers.get(message.type)?.forEach(handler => {
        try {
          handler(message);
        } catch (err) {
          console.error(`Error in message handler for type ${message.type}:`, err);
        }
      });
    }
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

// Hook for component initialization
export function useWebSocket(): { 
  isConnected: boolean;
  sendMessage: typeof sendMessage;
  registerHandler: typeof registerMessageHandler;
  unregisterHandler: typeof unregisterMessageHandler;
} {
  // Initialize on first use
  if (!socket) {
    initializeWebSocket();
  }
  
  return {
    isConnected: isConnected(),
    sendMessage,
    registerHandler: registerMessageHandler,
    unregisterHandler: unregisterMessageHandler
  };
}