import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityLog } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useWebSocketContext } from '@/lib/websocket';

interface PerformanceTabProps {
  projectId: number;
}

export function PerformanceTab({ projectId }: PerformanceTabProps) {
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const editorRef = useRef<HTMLPreElement>(null);
  const { sendMessage } = useWebSocketContext();
  
  // Fetch activity logs
  const { data: activityLogs = [] } = useQuery<ActivityLog[]>({
    queryKey: [`/api/projects/${projectId}/activity`],
    retry: 1,
  });
  
  useEffect(() => {
    if (activityLogs.length > 0) {
      setLogs(activityLogs);
    }
  }, [activityLogs]);
  
  // Example code to display
  const sampleCode = `import React from 'react';
import { useState, useEffect } from 'react';

// Authentication component for the e-commerce site
const AuthForm = () => {
  const [formType, setFormType] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Call to authentication API will be implemented here
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(\`\${formType} successful\`);
    } catch (err) {
      setError('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <h2>{formType === 'login' ? 'Login' : 'Sign Up'}</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        // Form inputs will be added here
      </form>
    </div>
  );
};`;

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    try {
      // Add the message to the activity log
      const newLog: Omit<ActivityLog, 'id'> = {
        projectId,
        message: `User: ${message}`,
        timestamp: new Date(),
        agentId: 'user',
        codeSnippet: null
      };
      
      await apiRequest('POST', '/api/activity', newLog);
      
      // Clear the message
      setMessage('');
      
      // Simulate an AI response after a short delay
      setTimeout(async () => {
        const aiResponse: Omit<ActivityLog, 'id'> = {
          projectId,
          message: 'Processing your request...',
          timestamp: new Date(),
          agentId: 'agent-1',
          codeSnippet: null
        };
        
        await apiRequest('POST', '/api/activity', aiResponse);
      }, 1000);
      
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };
  
  // Auto-scroll to the bottom of the code editor when new logs arrive
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.scrollTop = editorRef.current.scrollHeight;
    }
  }, [logs]);
  
  // Update activity logs when websocket receives new activities
  useEffect(() => {
    const handleActivityUpdate = (data: any) => {
      if (data.type === 'new-activity' && data.projectId === projectId) {
        setLogs(prev => [data.data, ...prev]);
      }
    };
    
    // Register listener
    const unsubscribe = useWebSocketContext().subscribe(handleActivityUpdate);
    
    return () => {
      unsubscribe();
    };
  }, [projectId]);
  
  return (
    <div className="h-full flex flex-col">
      {/* Split View */}
      <div className="flex flex-col h-full">
        {/* Top half: Visual rendering */}
        <div className="h-1/2 border-b border-gray-700 p-4 overflow-auto">
          <div className="h-full rounded-lg flex items-center justify-center bg-gray-900 text-center p-8">
            <div>
              <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              <p className="mt-4 text-gray-400">Live frontend rendering will appear here</p>
              <p className="mt-2 text-sm text-gray-500">Visual updates happen automatically as AI agents generate code</p>
            </div>
          </div>
        </div>
        
        {/* Bottom half: Code & logs */}
        <div className="h-1/2 flex flex-col">
          {/* Code editor */}
          <div className="flex-1 bg-gray-900 p-4 font-mono text-sm overflow-auto" ref={editorRef}>
            <pre className="text-gray-300">
              {logs.length > 0 && logs[0].codeSnippet ? (
                <SyntaxHighlightedCode code={logs[0].codeSnippet} />
              ) : (
                <SyntaxHighlightedCode code={sampleCode} />
              )}
            </pre>
          </div>
          
          {/* Message input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex">
              <input 
                type="text" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Send a message to the AI agent..." 
                className="bg-gray-800 text-gray-300 flex-1 px-4 py-2 rounded-l-md border border-gray-700 focus:outline-none focus:border-accent"
              />
              <button 
                onClick={handleSendMessage}
                className="bg-accent hover:bg-accentDark text-black px-4 py-2 rounded-r-md transition-colors duration-150"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SyntaxHighlightedCodeProps {
  code: string;
}

function SyntaxHighlightedCode({ code }: SyntaxHighlightedCodeProps) {
  // A very simple syntax highlighter that doesn't rely on external libraries
  // In a production app, you would use a proper syntax highlighting library like prism.js
  const highlightedCode = code
    .replace(/(import|export|from|const|let|var|function|return|async|await|try|catch|finally|if|else|for|while)/g, '<span class="text-blue-400">$1</span>')
    .replace(/('.*?'|".*?")/g, '<span class="text-accent">$1</span>')
    .replace(/(\w+)(?=\s*\()/g, '<span class="text-yellow-400">$1</span>')
    .replace(/(\/\/.*)/g, '<span class="text-gray-500">$1</span>')
    .replace(/(\{|\}|\(|\)|\[|\]|=>|=|;|,)/g, '<span class="text-gray-300">$1</span>');
  
  return <div dangerouslySetInnerHTML={{ __html: highlightedCode }} />;
}
