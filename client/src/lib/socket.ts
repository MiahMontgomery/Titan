import { WebSocketMessage } from './types';

let socket: WebSocket | null = null;
let reconnectAttempts = 0;
let reconnectTimeout: NodeJS.Timeout | null = null;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3 seconds

// Event listeners
const messageListeners: ((data: WebSocketMessage) => void)[] = [];
const statusListeners: ((status: string) => void)[] = [];

// Initialize WebSocket connection
export function initializeSocket(): WebSocket {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return socket;
  }
  
  // Determine the WebSocket URL based on current protocol
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  // Create WebSocket connection
  socket = new WebSocket(wsUrl);
  
  // WebSocket event handlers
  socket.onopen = () => {
    console.log("WebSocket connection established");
    reconnectAttempts = 0;
    notifyStatusListeners('connected');
    
    // Set up ping interval to keep connection alive
    const pingInterval = setInterval(() => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "ping" }));
      } else {
        clearInterval(pingInterval);
      }
    }, 30000); // Send ping every 30 seconds
  };
  
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as WebSocketMessage;
      notifyMessageListeners(data);
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error);
    }
  };
  
  socket.onclose = () => {
    console.log("WebSocket connection closed");
    notifyStatusListeners('disconnected');
    
    // Attempt to reconnect
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      
      reconnectTimeout = setTimeout(() => {
        console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
        notifyStatusListeners('connecting');
        initializeSocket();
      }, RECONNECT_DELAY);
    }
  };
  
  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
  
  return socket;
}

// Send message through WebSocket
export function sendMessage(data: any): boolean {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error("WebSocket is not connected");
    return false;
  }
  
  try {
    socket.send(JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Failed to send WebSocket message:", error);
    return false;
  }
}

// Add message listener
export function addMessageListener(callback: (data: WebSocketMessage) => void): void {
  messageListeners.push(callback);
}

// Remove message listener
export function removeMessageListener(callback: (data: WebSocketMessage) => void): void {
  const index = messageListeners.indexOf(callback);
  if (index !== -1) {
    messageListeners.splice(index, 1);
  }
}

// Add status listener
export function addStatusListener(callback: (status: string) => void): void {
  statusListeners.push(callback);
}

// Remove status listener
export function removeStatusListener(callback: (status: string) => void): void {
  const index = statusListeners.indexOf(callback);
  if (index !== -1) {
    statusListeners.splice(index, 1);
  }
}

// Notify all message listeners
function notifyMessageListeners(data: WebSocketMessage): void {
  messageListeners.forEach(listener => {
    try {
      listener(data);
    } catch (error) {
      console.error("Error in WebSocket message listener:", error);
    }
  });
}

// Notify all status listeners
function notifyStatusListeners(status: string): void {
  statusListeners.forEach(listener => {
    try {
      listener(status);
    } catch (error) {
      console.error("Error in WebSocket status listener:", error);
    }
  });
}

// Close WebSocket connection
export function closeSocket(): void {
  if (socket) {
    socket.close();
    socket = null;
  }
  
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
}

// Get current WebSocket connection status
export function getSocketStatus(): string {
  if (!socket) return 'disconnected';
  
  switch (socket.readyState) {
    case WebSocket.CONNECTING:
      return 'connecting';
    case WebSocket.OPEN:
      return 'connected';
    case WebSocket.CLOSING:
    case WebSocket.CLOSED:
    default:
      return 'disconnected';
  }
}
