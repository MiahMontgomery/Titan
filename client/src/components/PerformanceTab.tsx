import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityLog } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useWebSocketContext } from '@/lib/websocket';
import { Separator } from '@/components/ui/separator';
import { WebSocketMessage } from '@/lib/types';

interface PerformanceTabProps {
  projectId: number;
}

export function PerformanceTab({ projectId }: PerformanceTabProps) {
  const { connected, subscribe } = useWebSocketContext();
  const [messages, setMessages] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch activity logs
  const { data: activityLogs = [] } = useQuery<ActivityLog[]>({
    queryKey: [`/api/projects/${projectId}/activity`],
    retry: 1,
  });

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Setup WebSocket subscription
  useEffect(() => {
    // Subscribe to WebSocket messages
    const unsubscribe = subscribe((data: WebSocketMessage) => {
      if (data.type === 'thinking' || data.type === 'chat-response') {
        if (typeof data.message === 'string') {
          setMessages(prev => [...prev, data.message]);
        }
      }
    });
    
    // Clean up subscription when component unmounts
    return () => {
      unsubscribe();
    };
  }, [subscribe]);

  return (
    <div className="flex flex-col w-full h-full">
      <h2 className="text-2xl font-bold mb-4">Project Performance</h2>
      <Separator className="mb-4" />
      
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 rounded-md p-4">
        <h3 className="text-xl font-semibold mb-2">Activity Log</h3>
        
        {activityLogs.length === 0 ? (
          <p className="text-gray-500 italic">No activity logged yet</p>
        ) : (
          <ul className="space-y-2">
            {activityLogs.map((log) => (
              <li key={log.id} className="p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                <p className="text-sm font-semibold">{new Date(log.timestamp).toLocaleString()}</p>
                <p className="mt-1">{log.message}</p>
                {log.codeSnippet && (
                  <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded overflow-x-auto text-xs">
                    <code>{log.codeSnippet}</code>
                  </pre>
                )}
              </li>
            ))}
          </ul>
        )}
        
        <h3 className="text-xl font-semibold mt-6 mb-2">Real-time Updates</h3>
        <div className="bg-black text-green-400 font-mono p-4 rounded-md">
          {messages.map((msg, i) => (
            <div key={i} className="mb-2">{msg}</div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="mt-4 text-sm">
          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          {connected ? 'Connected to server' : 'Disconnected from server'}
        </div>
      </div>
    </div>
  );
}