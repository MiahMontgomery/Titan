import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, QueryClient } from '@tanstack/react-query';
import { ActivityLog } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useWebSocketContext } from '@/lib/websocket';
import { Separator } from '@/components/ui/separator';
import { WebSocketMessage } from '@/lib/types';

interface PerformanceTabProps {
  projectId: number;
}

// Define chat message types
type MessageRole = 'user' | 'agent' | 'system';

interface ChatMessage {
  id: string;
  content: string;
  role: MessageRole;
  timestamp: Date;
  codeSnippet?: string | null;
  isThinking?: boolean;
  isError?: boolean;
}

// Function to generate unique IDs for messages
function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export function PerformanceTab({ projectId }: PerformanceTabProps) {
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [currentCode, setCurrentCode] = useState<string | null>(null);
  const [codeHistory, setCodeHistory] = useState<string[]>([]);
  const [canRollback, setCanRollback] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, subscribe, connected } = useWebSocketContext();
  
  // Fetch activity logs
  const { data: activityLogs = [] } = useQuery<ActivityLog[]>({
    queryKey: [`/api/projects/${projectId}/activity`],
    retry: 1,
  });
  
  // Example initial code
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

  // Set up the initial code and welcome message
  useEffect(() => {
    if (chatMessages.length === 0) {
      setCurrentCode(sampleCode);
      
      // Add welcome message
      setChatMessages([
        {
          id: generateId(),
          content: 'Welcome to the Titan AI Assistant! I can help you with coding, debugging, and planning your project. What would you like to work on today?',
          role: 'agent',
          timestamp: new Date(),
          codeSnippet: null
        }
      ]);
    }
  }, []);
  
  // Convert activity logs to chat messages when they change
  useEffect(() => {
    if (activityLogs.length > 0) {
      const newMessages = activityLogs.map(log => {
        const isUser = log.agentId === 'user';
        return {
          id: log.id.toString(),
          content: log.message.replace(/^(User: |Agent: )/, ''),
          role: isUser ? 'user' as MessageRole : 'agent' as MessageRole,
          timestamp: new Date(log.timestamp),
          codeSnippet: log.codeSnippet
        };
      });
      
      // Don't replace existing messages if we already have them
      if (chatMessages.length === 0) {
        setChatMessages(newMessages.reverse());
      }
    }
  }, [activityLogs]);
  
  // Add new log message mutation
  const addLogMutation = useMutation({
    mutationFn: async (newLog: Omit<ActivityLog, 'id'>) => {
      return await apiRequest({ 
        method: 'POST', 
        url: '/api/activity', 
        data: newLog 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/activity`] });
    }
  });
  
  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);
  
  // Function to add a message to the chat
  const addChatMessage = useCallback((content: string, role: MessageRole, codeSnippet: string | null = null, isThinking?: boolean, isError?: boolean) => {
    const newMessage: ChatMessage = {
      id: generateId(),
      content,
      role,
      timestamp: new Date(),
      codeSnippet,
      isThinking,
      isError
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    
    // If not a thinking message, also save to the activity log
    if (!isThinking && role !== 'system') {
      const rolePrefix = role === 'user' ? 'User: ' : 'Agent: ';
      addLogMutation.mutate({
        projectId,
        message: rolePrefix + content,
        timestamp: new Date(),
        agentId: role === 'user' ? 'user' : 'agent-1',
        codeSnippet: codeSnippet || null,
        featureId: null,
        milestoneId: null,
        activityType: 'chat',
        details: {},
        isCheckpoint: false,
        thinkingProcess: null
      });
    }
  }, [projectId, addLogMutation]);
  
  // Setup WebSocket subscription for chat responses and thinking updates
  useEffect(() => {
    // Subscribe to WebSocket messages
    const unsubscribe = subscribe((data: WebSocketMessage) => {
      // Handle chat responses from WebSocket
      if (data.type === 'chat-response') {
        console.log('Received chat response via WebSocket in component:', data);
        
        // Remove thinking messages
        setChatMessages(prev => prev.filter(msg => !msg.isThinking));
        setIsThinking(false);
        
        // Add the response to chat
        if (typeof data.message === 'string') {
          addChatMessage(data.message, 'agent', (data as any).codeSnippet || null);
          
          // Update code if a code snippet was provided
          if ((data as any).codeSnippet) {
            // Save current code to history before updating
            if (currentCode && Array.isArray(codeHistory) && !codeHistory.includes(currentCode)) {
              setCodeHistory(prev => [...prev, currentCode]);
              setCanRollback(true);
            }
            
            setCurrentCode((data as any).codeSnippet);
          }
        }
      }
      // Handle AI thinking status updates
      else if (data.type === 'thinking' && (data.projectId === projectId || !data.projectId)) {
        console.log('Received thinking update via WebSocket:', data);
        
        // Check if there's already a thinking message
        const hasThinkingMessage = chatMessages.some(msg => msg.isThinking);
        
        if (hasThinkingMessage) {
          // Update the existing thinking message by appending to the content
          setChatMessages(prev => {
            const updatedMessages = [...prev];
            const thinkingIndex = updatedMessages.findIndex(msg => msg.isThinking);
            if (thinkingIndex !== -1) {
              // Create a sequential thinking output
              const currentContent = updatedMessages[thinkingIndex].content;
              // Only append if it's a different message
              if (!currentContent.includes(data.message || 'Thinking...')) {
                updatedMessages[thinkingIndex] = {
                  ...updatedMessages[thinkingIndex],
                  content: currentContent + '\n→ ' + (data.message || 'Processing...')
                };
              }
            }
            return updatedMessages;
          });
        } else {
          // Add a new thinking message
          setIsThinking(true);
          addChatMessage('🧠 ' + (data.message || 'Processing request...'), 'agent', null, true);
        }
      }
      // Handle new project/feature creation events
      else if (data.type === 'new-project' || data.type === 'new-feature') {
        console.log(`Received ${data.type} event via WebSocket:`, data);
        
        // Remove thinking messages
        setChatMessages(prev => prev.filter(msg => !msg.isThinking));
        setIsThinking(false);
        
        // Add a success message about the creation
        let message = '';
        if (data.type === 'new-project') {
          message = `✅ Project "${data.data?.name}" has been successfully generated!`;
        } else if (data.type === 'new-feature') {
          message = `✅ Feature "${data.data?.name}" has been successfully added to the project!`;
        }
        
        if (message) {
          addChatMessage(message, 'system');
        }
      }
      // Handle new activity logs related to AI actions
      else if (data.type === 'new-activity' && data.projectId === projectId) {
        const activityLog = data.data;
        
        // Only process AI-generated activities
        if (activityLog && activityLog.agentId && activityLog.agentId.startsWith('ai-')) {
          console.log('Received AI activity via WebSocket:', activityLog);
          
          // If code was generated, update the editor
          if (activityLog.codeSnippet && activityLog.activityType === 'code_generation') {
            // Save current code to history before updating
            if (currentCode && Array.isArray(codeHistory) && !codeHistory.includes(currentCode)) {
              setCodeHistory(prev => [...prev, currentCode]);
              setCanRollback(true);
            }
            
            setCurrentCode(activityLog.codeSnippet);
            
            // Add message about code generation
            addChatMessage(
              `I've generated code for the goal: ${activityLog.message.replace('Generated code for goal: ', '')}`,
              'agent',
              activityLog.codeSnippet
            );
          }
          // If it's a thinking process/analysis, show it in the chat
          else if (activityLog.thinkingProcess && activityLog.activityType === 'project_analysis') {
            // Remove thinking messages first
            setChatMessages(prev => prev.filter(msg => !msg.isThinking));
            setIsThinking(false);
            
            // Add the thinking as a chat message
            addChatMessage(
              activityLog.thinkingProcess,
              'agent',
              null
            );
          }
        }
      }
    });
    
    return unsubscribe;
  }, [addChatMessage, setChatMessages, setIsThinking, setCurrentCode, subscribe, projectId, chatMessages, currentCode, codeHistory]);

  // Handle sending a user message
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    const userMessageContent = message.trim();
    
    // Add user message
    addChatMessage(userMessageContent, 'user');
    
    // Clear input
    setMessage('');
    
    // Focus back on input
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    // Show thinking state for AI
    setIsThinking(true);
    addChatMessage('🧠 Starting analysis...', 'agent', null, true);
    
    // Simulate AI "thinking" with a timer
    const thinkingSteps = [
      'Analyzing request...',
      'Processing code logic...',
      'Generating solution...',
    ];
    
    let stepIndex = 0;
    const thinkingInterval = setInterval(() => {
      if (stepIndex < thinkingSteps.length) {
        // Update the thinking message with the next step
        setChatMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.isThinking) {
            newMessages[newMessages.length - 1] = {
              ...lastMessage,
              content: thinkingSteps[stepIndex]
            };
          }
          return newMessages;
        });
        stepIndex++;
      } else {
        clearInterval(thinkingInterval);
        
        // Try WebSocket first if connected
        if (connected) {
          console.log('Sending message via WebSocket:', userMessageContent);
          sendMessage({
            type: 'chat-message',
            message: userMessageContent,
            projectId: projectId
          });
          
          // Wait for the response via WebSocket (handled in useEffect)
          
          // Fallback to REST API after timeout if no WebSocket response
          const fallbackTimeout = setTimeout(() => {
            console.log('WebSocket response timeout, falling back to REST API');
            generateAIResponse(userMessageContent);
          }, 5000);
          
          // Store the timeout ID in a ref so we can clear it when WebSocket responds
          // This logic would be cleaned up in a real implementation
        } else {
          // Use REST API directly
          console.log('WebSocket not connected, using REST API directly');
          generateAIResponse(userMessageContent);
        }
      }
    }, 1000);
  };
  
  // Function to generate AI response from the server API
  const generateAIResponse = async (userMessage: string) => {
    try {
      console.log('Sending message to AI assistant:', userMessage);
      
      // Remove thinking message
      setChatMessages(prev => prev.filter(msg => !msg.isThinking));
      
      // Save the current code to history before potential changes
      if (currentCode && Array.isArray(codeHistory) && !codeHistory.includes(currentCode)) {
        setCodeHistory(prev => [...prev, currentCode]);
        setCanRollback(true);
      }
      
      // Send request to the server
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          projectId: projectId,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Received AI response:', data);
      
      // Add the response to chat
      addChatMessage(data.response, 'agent', data.codeSnippet);
      
      // Update code if a code snippet was returned
      if (data.codeSnippet) {
        setCurrentCode(data.codeSnippet);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      // Show error message in chat
      setIsThinking(false);
      addChatMessage(
        `Sorry, I encountered an error processing your request. Please try again. Error details: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        'agent', 
        null, 
        false, 
        true
      );
    } finally {
      setIsThinking(false);
    }
  };
  
  // Handle code rollback
  const handleRollback = () => {
    if (Array.isArray(codeHistory) && codeHistory.length > 0) {
      const previousCode = codeHistory[codeHistory.length - 1];
      setCurrentCode(previousCode);
      setCodeHistory(prev => prev.slice(0, -1));
      setCanRollback(codeHistory.length > 1);
      
      // Add system message about rollback
      addChatMessage("Previous version of code restored.", 'system');
    }
  };
  
  // Handle text area auto-resize
  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Chat interface with code panel */}
      <div className="flex flex-col h-full">
        {/* Code panel (top) */}
        <div className="h-1/2 border-b border-gray-700 overflow-hidden flex flex-col">
          <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex justify-between items-center">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
              </svg>
              <span className="text-sm font-medium text-gray-300">Code Editor</span>
            </div>
            <div>
              <button 
                className={`py-1 px-3 rounded text-xs ${canRollback ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                onClick={handleRollback}
                disabled={!canRollback}
              >
                Roll Back
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-gray-900 font-mono text-sm p-4">
            {currentCode ? (
              <SyntaxHighlightedCode code={currentCode} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No code to display
              </div>
            )}
          </div>
        </div>
        
        {/* Chat panel (bottom) */}
        <div className="h-1/2 flex flex-col">
          {/* Messages area */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-800"
          >
            {chatMessages.map(message => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`
                    max-w-[80%] rounded-lg px-4 py-2 
                    ${message.role === 'user' 
                      ? 'bg-accent text-gray-900' 
                      : message.role === 'system' 
                        ? 'bg-gray-700 text-gray-300 border border-gray-600 text-xs italic' 
                        : message.isThinking 
                          ? 'bg-gray-750 text-gray-400 border border-gray-700' 
                          : 'bg-gray-700 text-gray-200'
                    }
                    ${message.isThinking ? 'animate-pulse' : ''}
                  `}
                >
                  {message.isThinking && (
                    <div className="flex items-center mb-1 border-b border-gray-600 pb-1 mb-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse mr-1" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse mr-1" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                      <span className="ml-2 text-blue-400 text-xs">AI processing...</span>
                    </div>
                  )}
                  
                  {message.content && message.content.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-2' : ''}>
                      {line}
                    </p>
                  ))}
                  
                  {/* If has code snippet, display a button to view it */}
                  {message.codeSnippet && (
                    <button 
                      className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                      onClick={() => setCurrentCode(message.codeSnippet || null)}
                    >
                      View updated code
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Input area */}
          <div className="p-4 border-t border-gray-700 bg-gray-800">
            <div className="flex">
              <div className="relative flex-1">
                <textarea 
                  ref={inputRef}
                  value={message}
                  onChange={handleTextAreaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Send a message to the AI agent..." 
                  className="bg-gray-700 text-gray-200 w-full px-4 py-3 rounded-l-md border border-gray-600 focus:outline-none focus:border-accent resize-none overflow-hidden min-h-[44px] max-h-[150px]"
                  style={{ height: '44px' }}
                  rows={1}
                />
                <div className="absolute right-3 bottom-2 text-xs text-gray-500">
                  Press Enter to send
                </div>
              </div>
              <button 
                onClick={handleSendMessage}
                disabled={isThinking || !message.trim()}
                className={`
                  px-4 rounded-r-md flex items-center justify-center transition-colors duration-150
                  ${isThinking || !message.trim() 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                    : 'bg-accent hover:bg-accent/90 text-black'
                  }
                `}
              >
                {isThinking ? (
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7"></path>
                  </svg>
                )}
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
  // A simple syntax highlighter
  const highlightedCode = code
    .replace(/(import|export|from|const|let|var|function|return|async|await|try|catch|finally|if|else|for|while)/g, '<span class="text-blue-400">$1</span>')
    .replace(/('.*?'|".*?")/g, '<span class="text-accent">$1</span>')
    .replace(/(\w+)(?=\s*\()/g, '<span class="text-yellow-400">$1</span>')
    .replace(/(\/\/.*)/g, '<span class="text-gray-500">$1</span>')
    .replace(/(\{|\}|\(|\)|\[|\]|=>|=|;|,)/g, '<span class="text-gray-300">$1</span>');
  
  return <div dangerouslySetInnerHTML={{ __html: highlightedCode }} />;
}
