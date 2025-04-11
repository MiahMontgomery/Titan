import { useState, useEffect, useCallback } from "react";

// Define the type for socket messages
export type SocketMessage = {
  type: string;
  message?: string;
  data?: any;
  timestamp?: string;
};

// Create a simple singleton for the WebSocket connection
class SocketManager {
  private static instance: SocketManager | null = null;
  private socket: WebSocket | null = null;
  private messageListeners: ((message: SocketMessage) => void)[] = [];
  private statusListeners: ((connected: boolean) => void)[] = [];
  private errorListeners: ((error: string) => void)[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectionAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  
  private constructor() {
    // Private constructor for singleton pattern
  }
  
  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }
  
  public connect(): void {
    if (this.socket && 
        (this.socket.readyState === WebSocket.OPEN || 
         this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }
    
    try {
      // Use the correct protocol based on whether we're on HTTPS or HTTP
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log(`Connecting to WebSocket at ${wsUrl}`);
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      this.handleError(new Event('error'));
    }
  }
  
  private handleOpen(): void {
    console.log("WebSocket connected");
    this.connectionAttempts = 0;
    this.notifyStatusListeners(true);
    
    // Send a ping to make sure the connection is working
    this.send({ type: "ping" });
  }
  
  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket closed (${event.code}): ${event.reason}`);
    this.notifyStatusListeners(false);
    
    // Attempt to reconnect
    this.attemptReconnect();
  }
  
  private handleError(event: Event): void {
    console.error("WebSocket error:", event);
    const errorMessage = "WebSocket connection error";
    this.notifyErrorListeners(errorMessage);
    
    // Error usually comes before close, so we'll let close handle reconnection
  }
  
  private handleMessage(event: MessageEvent): void {
    try {
      const data: SocketMessage = JSON.parse(event.data);
      console.log("WebSocket message received:", data);
      this.notifyMessageListeners(data);
    } catch (err) {
      console.error("Error parsing WebSocket message:", err);
      this.notifyErrorListeners("Invalid message format");
    }
  }
  
  private attemptReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.connectionAttempts++;
    
    if (this.connectionAttempts <= this.maxReconnectAttempts) {
      // Exponential backoff for reconnection attempts
      const delay = Math.min(1000 * Math.pow(2, this.connectionAttempts - 1), 30000);
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.connectionAttempts})`);
      
      this.reconnectTimer = setTimeout(() => {
        console.log(`Reconnecting... (attempt ${this.connectionAttempts})`);
        this.connect();
      }, delay);
    } else {
      console.error(`Failed to reconnect after ${this.maxReconnectAttempts} attempts`);
      this.notifyErrorListeners("Failed to reconnect to server");
    }
  }
  
  public send(message: SocketMessage): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      return true;
    }
    return false;
  }
  
  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onclose = null;
      this.socket.onerror = null;
      this.socket.onmessage = null;
      
      if (this.socket.readyState === WebSocket.OPEN || 
          this.socket.readyState === WebSocket.CONNECTING) {
        this.socket.close();
      }
      
      this.socket = null;
    }
    
    this.messageListeners = [];
    this.statusListeners = [];
    this.errorListeners = [];
  }
  
  private notifyMessageListeners(message: SocketMessage): void {
    this.messageListeners.forEach(listener => listener(message));
  }
  
  private notifyStatusListeners(connected: boolean): void {
    this.statusListeners.forEach(listener => listener(connected));
  }
  
  private notifyErrorListeners(error: string): void {
    this.errorListeners.forEach(listener => listener(error));
  }
  
  public addMessageListener(listener: (message: SocketMessage) => void): () => void {
    this.messageListeners.push(listener);
    return () => {
      this.messageListeners = this.messageListeners.filter(l => l !== listener);
    };
  }
  
  public addStatusListener(listener: (connected: boolean) => void): () => void {
    this.statusListeners.push(listener);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }
  
  public addErrorListener(listener: (error: string) => void): () => void {
    this.errorListeners.push(listener);
    return () => {
      this.errorListeners = this.errorListeners.filter(l => l !== listener);
    };
  }
  
  public getConnectionStatus(): boolean {
    return !!(this.socket && this.socket.readyState === WebSocket.OPEN);
  }
}

// Hook for using the socket in components
export function useSocket() {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<SocketMessage | null>(null);
  
  useEffect(() => {
    const socketManager = SocketManager.getInstance();
    
    // Initialize connection status
    setConnected(socketManager.getConnectionStatus());
    
    // Add listeners
    const removeStatusListener = socketManager.addStatusListener(setConnected);
    const removeErrorListener = socketManager.addErrorListener(error => setError(error));
    const removeMessageListener = socketManager.addMessageListener(message => setLastMessage(message));
    
    // Connect to WebSocket
    socketManager.connect();
    
    // Cleanup
    return () => {
      removeStatusListener();
      removeErrorListener();
      removeMessageListener();
    };
  }, []);
  
  const sendMessage = useCallback((message: SocketMessage) => {
    const socketManager = SocketManager.getInstance();
    return socketManager.send(message);
  }, []);
  
  return {
    connected,
    error,
    sendMessage,
    lastMessage,
  };
}