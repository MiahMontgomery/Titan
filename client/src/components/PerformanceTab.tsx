import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, QueryClient } from '@tanstack/react-query';
import { ActivityLog } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useWebSocketContext } from '@/lib/websocket';
import { Separator } from '@/components/ui/separator';

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
  const { sendMessage } = useWebSocketContext();
  
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
      return await apiRequest('POST', '/api/activity', newLog);
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
        codeSnippet
      });
    }
  }, [projectId, addLogMutation]);
  
  // Handle sending a user message
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    // Add user message
    addChatMessage(message, 'user');
    
    // Clear input
    setMessage('');
    
    // Focus back on input
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    // Show thinking state for AI
    setIsThinking(true);
    addChatMessage('Thinking...', 'agent', null, true);
    
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
        
        // Generate AI response
        generateAIResponse(message);
      }
    }, 1000);
  };
  
  // Function to generate AI response (simulated for now)
  const generateAIResponse = (userMessage: string) => {
    const userMessageLower = userMessage.toLowerCase();
    let aiResponse = '';
    let codeResponse: string | null = null;
    
    // Remove thinking message
    setChatMessages(prev => prev.filter(msg => !msg.isThinking));
    setIsThinking(false);
    
    // Save the current code to history before making changes
    if (currentCode && !codeHistory.includes(currentCode)) {
      setCodeHistory(prev => [...prev, currentCode]);
      setCanRollback(true);
    }
    
    // Simple rule-based responses
    if (userMessageLower.includes('fix error') || userMessageLower.includes('debug')) {
      aiResponse = "I've analyzed the code and found an issue with the form submission. Let me fix that for you by adding form inputs and improving the error handling.";
      codeResponse = sampleCode.replace(
        "// Form inputs will be added here",
        `<div className="form-field">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : formType === 'login' ? 'Login' : 'Sign Up'}
        </button>
        <button type="button" onClick={() => setFormType(formType === 'login' ? 'signup' : 'login')}>
          {formType === 'login' ? 'Need an account? Sign up' : 'Have an account? Log in'}
        </button>`
      );
      setCurrentCode(codeResponse);
    } else if (userMessageLower.includes('add feature') || userMessageLower.includes('implement')) {
      aiResponse = "I'm adding a new feature to handle user sessions with localStorage. This will allow the application to remember when users are logged in.";
      codeResponse = `import React from 'react';
import { useState, useEffect } from 'react';

// Authentication component for the e-commerce site
const AuthForm = () => {
  const [formType, setFormType] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Check for existing session
  useEffect(() => {
    const session = localStorage.getItem('userSession');
    if (session) {
      try {
        const sessionData = JSON.parse(session);
        if (sessionData.loggedIn && new Date(sessionData.expiry) > new Date()) {
          setIsLoggedIn(true);
        } else {
          localStorage.removeItem('userSession');
        }
      } catch (e) {
        console.error('Error parsing session data', e);
        localStorage.removeItem('userSession');
      }
    }
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Call to authentication API will be implemented here
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(\`\${formType} successful\`);
      
      // Store session in localStorage
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 24); // 24 hour expiry
      
      localStorage.setItem('userSession', JSON.stringify({
        email,
        loggedIn: true,
        expiry: expiry.toISOString()
      }));
      
      setIsLoggedIn(true);
    } catch (err) {
      setError('Authentication failed');
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('userSession');
    setIsLoggedIn(false);
  };
  
  if (isLoggedIn) {
    return (
      <div className="user-profile">
        <h2>Welcome back!</h2>
        <p>You are logged in as {email}</p>
        <button onClick={handleLogout}>Log Out</button>
      </div>
    );
  }

  return (
    <div className="auth-form-container">
      <h2>{formType === 'login' ? 'Login' : 'Sign Up'}</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : formType === 'login' ? 'Login' : 'Sign Up'}
        </button>
        <button type="button" onClick={() => setFormType(formType === 'login' ? 'signup' : 'login')}>
          {formType === 'login' ? 'Need an account? Sign up' : 'Have an account? Log in'}
        </button>
      </form>
    </div>
  );
};`;
      setCurrentCode(codeResponse);
    } else if (userMessageLower.includes('explain') || userMessageLower.includes('how') || userMessageLower.includes('why')) {
      aiResponse = "Let me explain how the authentication flow works in this component:\n\n1. The component maintains state for `formType` (login/signup), user credentials, loading state, and errors.\n\n2. When the form is submitted, it calls the `handleSubmit` function which:\n   - Prevents the default form submission\n   - Sets loading state to true\n   - Clears any previous errors\n   - Makes an API call (currently a mock Promise)\n   - Handles success or error cases\n   - Updates the UI accordingly\n\n3. The UI conditionally renders different content based on the `formType` state.\n\nThis is a standard React pattern for handling form submissions and API calls. We can enhance it further with validation, security features, or UI improvements.";
    } else if (userMessageLower.includes('rollback') || userMessageLower.includes('undo')) {
      if (codeHistory.length > 0) {
        const previousCode = codeHistory[codeHistory.length - 1];
        setCurrentCode(previousCode);
        setCodeHistory(prev => prev.slice(0, -1));
        setCanRollback(codeHistory.length > 1);
        aiResponse = "I've rolled back to the previous version of the code. Let me know if you want to make additional changes.";
      } else {
        aiResponse = "There's no previous version to roll back to. This is the original code.";
      }
    } else {
      aiResponse = "I understand you're interested in improving this code. Would you like me to explain how it works, add new features, or fix any specific issues? I'm here to help you optimize and expand your project.";
    }
    
    // Add AI response to chat
    addChatMessage(aiResponse, 'agent', codeResponse);
  };
  
  // Handle code rollback
  const handleRollback = () => {
    if (codeHistory.length > 0) {
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
                    <div className="flex items-center mb-1">
                      <div className="w-3 h-3 bg-gray-600 rounded-full animate-bounce mr-1" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-3 h-3 bg-gray-600 rounded-full animate-bounce mr-1" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-3 h-3 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  )}
                  
                  {message.content.split('\n').map((line, i) => (
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
