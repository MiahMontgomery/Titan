import React, { createContext, useContext, useEffect, useState } from 'react';
import { Project } from '@shared/schema';
import { queryClient } from './queryClient';

// Create a context for the WebSocket
interface WebSocketContextType {
  connected: boolean;
  sendMessage: (message: any) => void;
  subscribe: (callback: (data: any) => void) => () => void;
}

const defaultContextValue: WebSocketContextType = {
  connected: false,
  sendMessage: () => {},
  subscribe: () => () => {},
};

const WebSocketContext = createContext<WebSocketContextType>(defaultContextValue);

// Create a singleton WebSocket instance
let socket: WebSocket | null = null;
let connected = false;
const listeners: ((data: any) => void)[] = [];

// Function to subscribe to WebSocket messages
function subscribe(callback: (data: any) => void) {
  listeners.push(callback);
  return () => {
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  };
}

// Function to send messages through the WebSocket
function sendMessage(message: any) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  } else {
    console.error('WebSocket is not connected');
  }
}

// Initialize WebSocket connection
function initWebSocket() {
  if (socket) return;
  
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  socket = new WebSocket(wsUrl);
  
  socket.onopen = () => {
    console.log('WebSocket connected');
    connected = true;
    
    // Notify listeners of connection state change
    notifyConnectionChange();
    
    // Send a ping to keep the connection alive
    const pingInterval = setInterval(() => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'ping' }));
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);
  };
  
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('WebSocket message received:', data);
      
      // Handle different message types
      if (data.type === 'projects') {
        queryClient.setQueryData(['/api/projects'], data.data);
      }
      else if (data.type === 'new-project') {
        queryClient.setQueryData(['/api/projects'], (old: Project[] = []) => 
          [...old, data.data]
        );
      }
      else if (data.type === 'update-project') {
        queryClient.setQueryData(['/api/projects'], (old: Project[] = []) => 
          old.map(p => p.id === data.data.id ? data.data : p)
        );
      }
      else if (data.type === 'delete-project') {
        queryClient.setQueryData(['/api/projects'], (old: Project[] = []) => 
          old.filter(p => p.id !== data.data.id)
        );
      }
      else if (data.type === 'chat-response') {
        // Chat responses are handled directly by subscribers
        console.log('Received chat response via WebSocket:', data);
      }
      else if (data.type === 'pong') {
        console.log('Received pong from server');
      }
      
      // Notify all listeners
      notifyDataListeners(data);
      
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
  
  socket.onclose = () => {
    console.log('WebSocket disconnected');
    connected = false;
    socket = null;
    
    // Notify listeners of connection state change
    notifyConnectionChange();
    
    // Try to reconnect after 3 seconds
    setTimeout(() => {
      initWebSocket();
    }, 3000);
  };
  
  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}

// Helper to notify all data listeners
function notifyDataListeners(data: any) {
  listeners.forEach(listener => {
    try {
      listener(data);
    } catch (error) {
      console.error('Error in WebSocket listener:', error);
    }
  });
}

// Helper to notify all components about connection state changes
function notifyConnectionChange() {
  notifyDataListeners({ type: 'connection-status', connected });
}

// Provider component wrapper for React
export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(connected);
  
  useEffect(() => {
    // Initialize WebSocket if not already done
    initWebSocket();
    
    // Subscribe to connection changes
    const unsubscribe = subscribe((data) => {
      if (data.type === 'connection-status') {
        setIsConnected(data.connected);
      }
    });
    
    return unsubscribe;
  }, []);
  
  // Create the context value
  const value = {
    connected: isConnected,
    sendMessage,
    subscribe
  };
  
  // Use JSX directly but with proper syntax
  return (
    React.createElement(WebSocketContext.Provider, { value }, children)
  );
}

// Hook to use the WebSocket context in components
export function useWebSocketContext() {
  return useContext(WebSocketContext);
}

// For backward compatibility
export function useWebSocket() {
  const context = useWebSocketContext();
  return {
    connected: context.connected,
    sendMessage: context.sendMessage,
    subscribe: context.subscribe,
    contextValue: context
  };
}
