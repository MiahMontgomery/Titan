import { useState, useEffect, useRef } from 'react';
import { useWebSocketContext, WebSocketMessage } from '@/lib/websocket';

interface ChatMessage {
  id: string;
  type: 'user' | 'agent' | 'system' | 'code' | 'thinking';
  content: string;
  timestamp: Date;
  codeSnippet?: string;
  filename?: string;
  language?: string;
  fileName?: string;
  filePath?: string;
  edits?: {
    before: string;
    after: string;
    lineNumbers?: [number, number];
  };
  steps?: string[];
}

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { subscribe, sendMessage, isConnected } = useWebSocketContext();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [topic, setTopic] = useState('No Topic Specified');
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Setup WebSocket subscription
  useEffect(() => {
    // Add initial welcome message
    setMessages([
      {
        id: 'welcome',
        type: 'system',
        content: 'Welcome to Findom! How can I help with your project today?',
        timestamp: new Date()
      }
    ]);
    
    // Subscribe to WebSocket messages
    const unsubscribe = subscribe((data: WebSocketMessage) => {
      console.log('WebSocket message in ChatInterface:', data);
      
      // Generate a unique ID for the message
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Handle thinking messages
      if (data.type === 'thinking') {
        setIsThinking(true);
        
        // Check if we need to add a new message or update existing one
        setMessages(prevMessages => {
          const lastMessage = prevMessages[prevMessages.length - 1];
          
          // If last message is a thinking message, update it
          if (lastMessage && lastMessage.type === 'thinking') {
            const updatedMessages = [...prevMessages];
            updatedMessages[prevMessages.length - 1] = {
              ...lastMessage,
              content: typeof data.message === 'string' ? data.message : lastMessage.content,
              timestamp: new Date(),
              steps: data.debugSteps || lastMessage.steps
            };
            return updatedMessages;
          } 
          // Otherwise add a new thinking message
          else {
            return [...prevMessages, {
              id: messageId,
              type: 'thinking',
              content: typeof data.message === 'string' ? data.message : 'Thinking...',
              timestamp: new Date(),
              codeSnippet: data.codeSnippet || undefined,
              steps: data.debugSteps || []
            }];
          }
        });
      }
      // Handle code generation messages
      else if (data.type === 'chat-response' && data.codeSnippet) {
        setIsThinking(false);
        
        // Extract filename if present
        const filename = extractFilename(data.codeSnippet) || 'generated-code.js';
        const language = determineLanguage(filename);
        
        setMessages(prev => [...prev, {
          id: messageId,
          type: 'code',
          content: typeof data.message === 'string' ? data.message : 'Generated code',
          timestamp: new Date(),
          codeSnippet: data.codeSnippet,
          filename,
          language
        }]);
      }
      // Regular chat messages
      else if (data.type === 'chat-message' || data.type === 'chat-response') {
        setIsThinking(false);
        setMessages(prev => [...prev, {
          id: messageId,
          type: data.type === 'chat-message' ? 'user' : 'agent',
          content: typeof data.message === 'string' ? data.message : '',
          timestamp: new Date()
        }]);
      }
      // File edit messages
      else if (data.type === 'file-edit' && typeof data.data === 'object') {
        setIsThinking(false);
        const editData = data.data;
        setMessages(prev => [...prev, {
          id: messageId,
          type: 'code',
          content: typeof data.message === 'string' ? data.message : `Edited ${editData.filePath || 'file'}`,
          timestamp: new Date(),
          filePath: editData.filePath,
          fileName: editData.fileName,
          edits: {
            before: editData.before || '',
            after: editData.after || '',
            lineNumbers: editData.lineNumbers
          }
        }]);
      }
    });
    
    return unsubscribe;
  }, [subscribe]);
  
  // Extract filename from code comment or generate one
  const extractFilename = (code: string): string | null => {
    // Check for filename comments
    const filenameRegex = /\/\/ Filename: (.+)$|\/\* Filename: (.+) \*\/|# Filename: (.+)$/m;
    const match = code.match(filenameRegex);
    
    if (match) {
      return match[1] || match[2] || match[3];
    }
    
    // Look for file paths in code
    const filePathRegex = /(["'])(\/[^"']+\.[a-zA-Z0-9]+)\1/;
    const pathMatch = code.match(filePathRegex);
    
    if (pathMatch) {
      const parts = pathMatch[2].split('/');
      return parts[parts.length - 1];
    }
    
    return null;
  };
  
  // Determine language from filename extension
  const determineLanguage = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js': return 'javascript';
      case 'ts': return 'typescript';
      case 'jsx': return 'jsx';
      case 'tsx': return 'tsx';
      case 'py': return 'python';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'json': return 'json';
      case 'md': return 'markdown';
      case 'yaml': case 'yml': return 'yaml';
      case 'java': return 'java';
      case 'rb': return 'ruby';
      case 'go': return 'go';
      case 'rs': return 'rust';
      case 'php': return 'php';
      case 'c': return 'c';
      case 'cpp': case 'cc': return 'cpp';
      case 'cs': return 'csharp';
      default: return 'text';
    }
  };
  
  // Handle sending a message
  const handleSendMessage = () => {
    if (!inputValue.trim() || !isConnected) return;
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Send message to server
    sendMessage('chat-message', { message: inputValue.trim() });
    
    // Clear input
    setInputValue('');
    
    // Focus on input again
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };
  
  // Handle keydown on input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Format the code for display
  const formatCode = (code: string, language: string) => {
    return (
      <pre className="p-4 rounded bg-[#0d1117] text-gray-300 overflow-x-auto whitespace-pre font-mono text-sm">
        <code>{code}</code>
      </pre>
    );
  };
  
  return (
    <div className="flex flex-col h-full bg-[#0a0e15] text-white">
      {/* Header */}
      <div className="border-b border-[#01F9C6]/20 p-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="text-[#01F9C6]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>
            <span className="font-medium text-[#01F9C6]">Findom Agent</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <button className="p-2 text-gray-400 hover:text-[#01F9C6] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Topic Header */}
      <div className="bg-[#0a0e15] border-b border-[#01F9C6]/20 p-3 flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <span className="text-sm font-medium">{topic}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            className="flex items-center px-2 py-1 bg-[#111620] hover:bg-[#1c2333] text-gray-300 hover:text-white text-xs rounded border border-gray-700 transition-colors"
            title="Clear conversation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Clear
          </button>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="mb-4">
            {/* User message */}
            {message.type === 'user' && (
              <div className="flex flex-col ml-12 mr-4 mb-6">
                <div className="self-end px-3 py-2 bg-[#01F9C6]/10 text-white rounded-md rounded-tr-none border border-[#01F9C6]/20">
                  {message.content}
                </div>
                <div className="self-end text-xs text-gray-400 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            )}
            
            {/* Agent message */}
            {message.type === 'agent' && (
              <div className="flex flex-col ml-4 mr-12 mb-6">
                <div className="self-start px-3 py-2 bg-[#111620] text-white rounded-md rounded-tl-none border border-gray-700">
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Rollback button for agent messages */}
                  <div className="mt-3 flex">
                    <button 
                      className="flex items-center text-xs px-2 py-1 bg-[#1c2333] hover:bg-[#222e47] text-gray-300 hover:text-white rounded border border-gray-700 transition-colors"
                      title="Roll back to this message"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      Rollback
                    </button>
                  </div>
                </div>
                <div className="self-start text-xs text-gray-400 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            )}
            
            {/* System message */}
            {message.type === 'system' && (
              <div className="flex justify-center my-6">
                <div className="bg-[#111620]/60 text-gray-300 rounded-lg px-3 py-1.5 text-xs border border-gray-700/50">
                  {message.content}
                </div>
              </div>
            )}
            
            {/* Thinking/Processing message */}
            {message.type === 'thinking' && (
              <div className="flex flex-col ml-4 mr-12 mb-6">
                <div className="self-start px-3 py-2 bg-[#111620] text-white rounded-md rounded-tl-none border border-gray-700">
                  <div className="flex items-center text-xs text-[#01F9C6] mb-2">
                    <svg className="animate-spin mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Agent is working...</span>
                  </div>
                  <div className="whitespace-pre-wrap">
                    {message.content.split('\n').map((line, idx) => (
                      <div key={idx} className="text-sm leading-relaxed">
                        {line.startsWith('✓') ? (
                          <span className="text-[#01F9C6]">{line}</span>
                        ) : line.startsWith('→') ? (
                          <span className="text-blue-400">{line}</span>
                        ) : line.startsWith('✗') ? (
                          <span className="text-red-400">{line}</span>
                        ) : (
                          <span>{line}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Show steps if any */}
                  {message.steps && message.steps.length > 0 && (
                    <div className="mt-3 ml-2 text-sm border-t border-gray-700 pt-2">
                      <div className="text-blue-400 mb-1">Steps:</div>
                      <ol className="list-decimal list-inside ml-1 space-y-1">
                        {message.steps.map((step, stepIdx) => (
                          <li key={stepIdx} className="text-gray-300">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
                <div className="self-start text-xs text-gray-400 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            )}
            
            {/* Code message */}
            {message.type === 'code' && (
              <div className="flex flex-col ml-4 mr-12 mb-6">
                <div className="self-start bg-[#111620] text-white rounded-md rounded-tl-none border border-gray-700 overflow-hidden">
                  <div className="px-3 py-2">
                    <div className="mb-2">{message.content}</div>
                  </div>
                  
                  {message.filePath && (
                    <div className="flex items-center text-xs px-3 py-1 bg-[#0d1117] border-t border-gray-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                      <span className="font-mono text-gray-300">{message.filePath}</span>
                    </div>
                  )}
                  
                  {message.edits ? (
                    <div className="bg-[#0d1117] overflow-hidden">
                      <div className="bg-[#161b22] text-xs px-3 py-1.5 font-mono border-t border-gray-700 flex items-center justify-between">
                        <div>
                          {message.fileName || 'file-edit.txt'}
                          {message.edits.lineNumbers && (
                            <span>
                              <span className="ml-2 text-red-500">-{message.edits.lineNumbers[0]}</span>
                              <span className="ml-1 text-green-500">+{message.edits.lineNumbers[1]}</span>
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button className="hover:text-[#01F9C6]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="p-4 overflow-x-auto">
                        <div className="whitespace-pre font-mono text-sm">
                          <div className="mb-2 text-red-400">- {message.edits.before}</div>
                          <div className="text-green-400">+ {message.edits.after}</div>
                        </div>
                      </div>
                    </div>
                  ) : message.codeSnippet ? (
                    <div className="bg-[#0d1117] overflow-hidden">
                      <div className="bg-[#161b22] text-xs px-3 py-1.5 font-mono border-t border-gray-700 flex items-center justify-between">
                        <div>
                          {message.filename || 'code-snippet.txt'}
                        </div>
                        <div className="flex space-x-2">
                          <span className="px-1.5 py-0.5 bg-gray-700/50 rounded text-xs text-gray-300">
                            {message.language || 'text'}
                          </span>
                          <button className="hover:text-[#01F9C6]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="p-4 overflow-x-auto">
                        <pre className="whitespace-pre font-mono text-sm text-gray-300">{message.codeSnippet}</pre>
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="self-start text-xs text-gray-400 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
        
        {/* Thinking indicator */}
        {isThinking && !messages.some(m => m.type === 'thinking') && (
          <div className="flex items-center justify-center py-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-[#01F9C6] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-[#01F9C6] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-[#01F9C6] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
      </div>
      
      {/* Input area */}
      <div className="border-t border-[#01F9C6]/20 p-4">
        <div className="relative">
          <textarea
            ref={inputRef}
            className="w-full bg-[#111620] border border-gray-700 px-3 py-3 rounded-md focus:outline-none focus:border-[#01F9C6]/40 focus:ring-1 focus:ring-[#01F9C6]/40 placeholder-gray-500 resize-none"
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            rows={3}
          />
          <button
            className="absolute bottom-3 right-3 bg-[#01F9C6] text-black font-medium rounded-md px-4 py-1 flex items-center gap-1 hover:bg-[#01F9C6]/90 transition-colors"
            onClick={handleSendMessage}
            disabled={!isConnected || !inputValue.trim()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
            Send
          </button>
        </div>
        
        {/* Connection status */}
        <div className="flex items-center mt-2 text-xs text-gray-400">
          <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-[#01F9C6]' : 'bg-red-500'}`}></div>
          <span>{isConnected ? 'Connected to Findom Agent' : 'Disconnected'}</span>
        </div>
      </div>
    </div>
  );
}