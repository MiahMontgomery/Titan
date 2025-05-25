import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getMessagesByProject, 
  createMessage, 
  createLog,
  getLogsByProject
} from "@/lib/api";
import { useWebSocket } from "@/lib/websocket";
import { SENDERS, LOG_TYPES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import type { Message, Log } from "@shared/schema";

interface InputSyncResult {
  messages: Message[];
  logs: Log[];
  isLoading: boolean;
  addUserMessage: (content: string) => Promise<void>;
  addJasonMessage: (content: string, metadata?: Record<string, any>) => Promise<void>;
  addExecutionLog: (title: string, details?: string) => Promise<void>;
  activeTask: string | null;
  wsStatus: "connecting" | "connected" | "disconnected" | "error";
}

interface WebSocketMessage {
  message?: Message;
  log?: Log;
}

interface TaskStatusMetadata {
  type: "task_status";
  [key: string]: any;
}

export function useInputSync(projectId: number | null): InputSyncResult {
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // WebSocket connection
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  const { status: wsStatus, subscribe, unsubscribe } = useWebSocket(wsUrl);

  // Queries
  const { data: messages = [], isLoading: isMessagesLoading } = useQuery<Message[]>({
    queryKey: ['/api/projects', projectId, 'messages'],
    enabled: !!projectId,
  });

  const { data: logs = [], isLoading: isLogsLoading } = useQuery<Log[]>({
    queryKey: ['/api/projects', projectId, 'logs'],
    enabled: !!projectId,
  });

  // Mutations
  const { mutateAsync: createMessageMutation } = useMutation({
    mutationFn: createMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'messages'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  const { mutateAsync: createLogMutation } = useMutation({
    mutationFn: createLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'logs'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to create log",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // WebSocket updates
  useEffect(() => {
    if (!projectId) return;

    const handleMessage = (data: WebSocketMessage) => {
      if (data?.message?.projectId === projectId) {
        queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'messages'] });
        
        // Update active task if this is a task status message
        if (data.message.sender === SENDERS.JASON && 
            data.message.metadata && 
            typeof data.message.metadata === 'object' && 
            'type' in data.message.metadata && 
            (data.message.metadata as TaskStatusMetadata).type === "task_status") {
          setActiveTask(data.message.content);
        }
      }
    };

    const handleLog = (data: WebSocketMessage) => {
      if (data?.log?.projectId === projectId) {
        queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'logs'] });
      }
    };

    subscribe('message', handleMessage);
    subscribe('log', handleLog);

    return () => {
      unsubscribe('message', handleMessage);
      unsubscribe('log', handleLog);
    };
  }, [projectId, queryClient, subscribe, unsubscribe]);

  // Check for inactivity - if no reply from user for 2 hours, add a follow-up message
  useEffect(() => {
    if (!projectId || messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    
    // If the last message is from Jason and is a question
    if (lastMessage.sender === SENDERS.JASON && lastMessage.content.endsWith('?')) {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const messageTime = new Date(lastMessage.timestamp);
      
      // If message is older than 2 hours and no response
      if (messageTime < twoHoursAgo) {
        // Schedule a follow-up message
        const timeoutId = setTimeout(async () => {
          try {
            await createMessageMutation({
              projectId,
              content: "I noticed there's been no response for a while. I'll proceed with the most reasonable approach based on our previous discussions.",
              sender: SENDERS.JASON
            });
          } catch (error) {
            console.error("Failed to send follow-up message:", error);
          }
        }, 1000); // Small delay to avoid immediate execution
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [projectId, messages, createMessageMutation]);

  // Handler functions
  const addUserMessage = useCallback(async (content: string) => {
    if (!projectId) return;
    
    await createMessageMutation({
      projectId,
      content,
      sender: SENDERS.USER
    });
  }, [projectId, createMessageMutation]);

  const addJasonMessage = useCallback(async (content: string, metadata?: Record<string, any>) => {
    if (!projectId) return;
    
    await createMessageMutation({
      projectId,
      content,
      sender: SENDERS.JASON,
      metadata
    });
  }, [projectId, createMessageMutation]);

  const addExecutionLog = useCallback(async (title: string, details?: string) => {
    if (!projectId) return;
    
    await createLogMutation({
      projectId,
      type: LOG_TYPES.EXECUTION,
      title,
      details
    });
  }, [projectId, createLogMutation]);

  const isLoading = isMessagesLoading || isLogsLoading;

  return {
    messages,
    logs,
    isLoading,
    addUserMessage,
    addJasonMessage,
    addExecutionLog,
    activeTask,
    wsStatus
  };
}
