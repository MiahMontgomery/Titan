import { useState, useEffect, useRef, useCallback } from 'react';
import { WebSocketMessage } from '@shared/types';

interface UseWebSocketOptions {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);
  const socketRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    try {
      // Determine the correct WebSocket URL based on current protocol
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setReadyState(WebSocket.OPEN);
        if (options.onOpen) options.onOpen();
      };

      socket.onclose = () => {
        setReadyState(WebSocket.CLOSED);
        if (options.onClose) options.onClose();
        
        // Attempt to reconnect after a delay
        setTimeout(() => {
          connect();
        }, 3000);
      };

      socket.onerror = (error) => {
        if (options.onError) options.onError(error);
      };

      socket.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data) as WebSocketMessage;
          setLastMessage(parsedData);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }, [options]);

  useEffect(() => {
    connect();
    
    return () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  const isConnected = readyState === WebSocket.OPEN;

  return {
    sendMessage,
    lastMessage,
    readyState,
    isConnected,
  };
};
