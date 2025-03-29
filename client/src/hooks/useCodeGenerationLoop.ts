import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '@/lib/websocket';

interface CodeGenerationTask {
  id: string;
  featureId: number;
  milestoneId: number;
  goalId: number;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  title: string;
  description: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

interface ProcessLog {
  message: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'success';
}

interface CodeGenerationLoopProps {
  projectId: number;
  personaId: number;
  onTaskUpdate?: (task: CodeGenerationTask) => void;
  onCodeGenerated?: (code: string, taskId: string) => void;
  onProcessLog?: (log: ProcessLog) => void;
}

/**
 * Hook to manage the continuous code generation loop from project progress tasks
 */
export function useCodeGenerationLoop({
  projectId,
  personaId,
  onTaskUpdate,
  onCodeGenerated,
  onProcessLog
}: CodeGenerationLoopProps) {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentTask, setCurrentTask] = useState<CodeGenerationTask | null>(null);
  const [pendingTasks, setPendingTasks] = useState<CodeGenerationTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<CodeGenerationTask[]>([]);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [processLogs, setProcessLogs] = useState<ProcessLog[]>([]);
  
  const ws = useWebSocket();
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const loopIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Set up WebSocket subscription
  useEffect(() => {
    // Subscribe to WebSocket messages
    const unsubscribe = ws.subscribe((data) => {
      if (typeof data === 'string') {
        setLastMessage(data);
      } else {
        // Handle WebSocketMessage object
        try {
          const messageString = JSON.stringify(data);
          setLastMessage(messageString);
        } catch (error) {
          console.error('Error converting WebSocket message to string:', error);
        }
      }
    });
    
    // Clean up subscription
    return () => {
      unsubscribe();
    };
  }, [ws]);
  
  // Start the code generation loop
  const startLoop = () => {
    if (!isActive) {
      setIsActive(true);
      
      // Log the start of the loop
      addProcessLog('Starting code generation loop', 'info');
      
      // Hook is open for implementation
      // This will fetch tasks from the Progress tab and process them
    }
  };
  
  // Stop the code generation loop
  const stopLoop = () => {
    if (isActive) {
      setIsActive(false);
      
      if (loopIntervalRef.current) {
        clearInterval(loopIntervalRef.current);
        loopIntervalRef.current = null;
      }
      
      // Log the stop of the loop
      addProcessLog('Stopped code generation loop', 'info');
    }
  };
  
  // Add a process log
  const addProcessLog = (message: string, level: 'info' | 'warning' | 'error' | 'success' = 'info') => {
    const newLog: ProcessLog = { message, timestamp: new Date(), level };
    setProcessLogs(prevLogs => [...prevLogs, newLog]);
    
    // Call the callback if provided
    if (onProcessLog) {
      onProcessLog(newLog);
    }
  };
  
  // Method to fetch pending tasks from the API
  const fetchPendingTasks = async () => {
    try {
      // Hook is open for implementation
      // This will fetch tasks from the Progress tab that need to be completed
      addProcessLog('Fetching pending tasks from project progress', 'info');
      
      // Mock implementation to be replaced
      // In the future, this will pull from the actual features, milestones, and goals
      // in the Progress tab
      const mockTask: CodeGenerationTask = {
        id: `task-${Date.now()}`,
        featureId: 1,
        milestoneId: 1,
        goalId: 1,
        status: 'pending',
        title: 'Sample Task',
        description: 'This is a placeholder task',
        createdAt: new Date()
      };
      
      setPendingTasks(prev => [...prev, mockTask]);
    } catch (error) {
      addProcessLog(`Error fetching tasks: ${error}`, 'error');
    }
  };
  
  // Process the next task in the queue
  const processNextTask = () => {
    if (pendingTasks.length > 0 && !currentTask) {
      const nextTask = pendingTasks[0];
      const updatedTask: CodeGenerationTask = { 
        ...nextTask, 
        status: 'in-progress', 
        startedAt: new Date() 
      };
      
      setCurrentTask(updatedTask);
      setPendingTasks(prev => prev.slice(1));
      
      // Call the callback if provided
      if (onTaskUpdate) {
        onTaskUpdate(updatedTask);
      }
      
      addProcessLog(`Started processing task: ${updatedTask.title}`, 'info');
      
      // Hook is open for implementation
      // This will send a message to the server to start generating code for the task
    }
  };
  
  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      try {
        // Parse the message from the WebSocket
        const data = JSON.parse(lastMessage);
        
        // Handle different message types
        if (data.type === 'thinking' && data.projectId === projectId) {
          // Handle thinking updates (process logs)
          addProcessLog(data.message, 'info');
        } else if (data.type === 'code' && data.projectId === projectId) {
          // Handle generated code
          setGeneratedCode(data.code);
          
          // Call the callback if provided
          if (onCodeGenerated && currentTask) {
            onCodeGenerated(data.code, currentTask.id);
          }
          
          // Mark the current task as completed
          if (currentTask) {
            const completedTask: CodeGenerationTask = { 
              ...currentTask, 
              status: 'completed', 
              completedAt: new Date() 
            };
            
            setCurrentTask(null);
            setCompletedTasks(prev => [...prev, completedTask]);
            
            // Call the callback if provided
            if (onTaskUpdate) {
              onTaskUpdate(completedTask);
            }
            
            addProcessLog(`Completed task: ${completedTask.title}`, 'success');
          }
        }
      } catch (error) {
        // Handle JSON parsing errors
        console.error('Error parsing WebSocket message:', error);
      }
    }
  }, [lastMessage, projectId, currentTask, onCodeGenerated, onTaskUpdate]);
  
  // Main loop interval effect
  useEffect(() => {
    if (isActive && !loopIntervalRef.current) {
      // Initial fetch of tasks
      fetchPendingTasks();
      
      // Set up the interval
      loopIntervalRef.current = setInterval(() => {
        // If there's no current task, process the next one
        if (!currentTask) {
          processNextTask();
        }
        
        // If there are no pending tasks, fetch more
        if (pendingTasks.length === 0) {
          fetchPendingTasks();
        }
      }, 5000); // Check every 5 seconds
    }
    
    return () => {
      // Clean up the interval
      if (loopIntervalRef.current) {
        clearInterval(loopIntervalRef.current);
        loopIntervalRef.current = null;
      }
    };
  }, [isActive, currentTask, pendingTasks.length]);
  
  return {
    isActive,
    startLoop,
    stopLoop,
    currentTask,
    pendingTasks,
    completedTasks,
    generatedCode,
    processLogs,
    addProcessLog
  };
}