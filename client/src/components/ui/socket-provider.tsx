import React, { createContext, useContext, useEffect, useState } from "react";
import { initializeSocket, addMessageListener, removeMessageListener, addStatusListener, removeStatusListener, sendMessage, getSocketStatus } from "@/lib/socket";
import { WebSocketMessage, SocketStatus } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

// Create context
interface SocketContextType {
  status: SocketStatus;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: any) => boolean;
}

const SocketContext = createContext<SocketContextType>({
  status: 'disconnected',
  lastMessage: null,
  sendMessage: () => false,
});

// Provider component
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SocketStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const { toast } = useToast();

  // Initialize socket connection
  useEffect(() => {
    initializeSocket();

    // Message handler
    const handleMessage = (message: WebSocketMessage) => {
      setLastMessage(message);
      
      // Handle specific message types
      if (message.type === 'error') {
        toast({
          title: 'WebSocket Error',
          description: message.message,
          variant: 'destructive',
        });
      } else if (message.type === 'agent-status-changed') {
        toast({
          title: 'Agent Status Updated',
          description: `Agent ID ${message.agentId} status changed to ${message.status}`,
          variant: 'default',
        });
      } else if (message.type === 'automation-task-completed') {
        toast({
          title: message.success ? 'Task Completed' : 'Task Failed',
          description: message.error || `Task ID ${message.taskId} has finished executing`,
          variant: message.success ? 'default' : 'destructive',
        });
      }
    };

    // Status handler
    const handleStatus = (socketStatus: string) => {
      setStatus(socketStatus as SocketStatus);
      
      if (socketStatus === 'connected') {
        toast({
          title: 'WebSocket Connected',
          description: 'Real-time updates are now active',
          variant: 'default',
        });
      } else if (socketStatus === 'disconnected') {
        toast({
          title: 'WebSocket Disconnected',
          description: 'Attempting to reconnect...',
          variant: 'destructive',
        });
      }
    };

    // Add event listeners
    addMessageListener(handleMessage);
    addStatusListener(handleStatus);

    // Set initial status
    setStatus(getSocketStatus() as SocketStatus);

    // Cleanup on unmount
    return () => {
      removeMessageListener(handleMessage);
      removeStatusListener(handleStatus);
    };
  }, [toast]);

  // Provide context
  const value = {
    status,
    lastMessage,
    sendMessage,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

// Custom hook for using the socket context
export function useSocket() {
  return useContext(SocketContext);
}
