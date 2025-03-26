import { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocketContext } from '@/lib/websocket';
import { WebSocketMessage } from '@/lib/types';

export function ReplitStyleWebview() {
  const [messages, setMessages] = useState<any[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [currentCode, setCurrentCode] = useState<string | null>(null);
  const [codeLanguage, setCodeLanguage] = useState<string>('text');
  const [codeFilename, setCodeFilename] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { subscribe } = useWebSocketContext();

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
        type: 'system',
        content: 'Welcome to the Titan Live WebView! Watch the AI agent work in real-time.',
        timestamp: new Date()
      }
    ]);

    // Subscribe to WebSocket messages
    const unsubscribe = subscribe((data: WebSocketMessage) => {
      console.log('WebSocket message in ReplitStyleWebview:', data);

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
              content: lastMessage.content + '\n' + (data.message || ''),
              timestamp: new Date()
            };
            return updatedMessages;
          } 
          // Otherwise add a new thinking message
          else {
            return [...prevMessages, {
              type: 'thinking',
              content: data.message || 'Thinking...',
              timestamp: new Date(),
              projectId: data.projectId,
              codeSnippet: data.codeSnippet || null,
              steps: data.debugSteps || []
            }];
          }
        });
      }
      // Handle code generation messages
      else if (data.type === 'chat-response' && data.codeSnippet) {
        setIsThinking(false);
        
        // Determine filename and language from code
        const filename = extractFilename(data.codeSnippet) || 'generated-code.js';
        const language = determineLanguage(filename);
        
        setCodeLanguage(language);
        setCodeFilename(filename);
        setCurrentCode(data.codeSnippet);
        
        // Add code completion message
        setMessages(prev => [...prev, {
          type: 'code-generation',
          content: data.message || 'Generated code',
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
          type: data.type === 'chat-message' ? 'user' : 'agent',
          content: data.message || '',
          timestamp: new Date()
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

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-200 overflow-hidden" style={{ fontFamily: 'var(--font-mono)' }}>
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 py-2">
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
          <span className="font-semibold text-sm">Titan Live View</span>
          <span className="text-gray-400 text-xs">v1.0</span>
        </div>
        <div className="text-xs text-gray-400">
          {isThinking ? 
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              AI working...
            </span> : 
            'Ready'
          }
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden divide-x divide-gray-700">
        {/* Console/Terminal panel */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <div className="bg-gray-850 text-xs text-gray-400 px-3 py-1 font-semibold border-b border-gray-800">
            Console
          </div>
          <div className="flex-1 overflow-y-auto p-2 bg-gray-850 text-sm font-mono">
            {messages.map((message, index) => (
              <div key={index} className="mb-3">
                {/* System message */}
                {message.type === 'system' && (
                  <div className="text-blue-400 opacity-75 px-2 py-1 text-xs">
                    {message.content}
                  </div>
                )}
                
                {/* User message */}
                {message.type === 'user' && (
                  <div>
                    <div className="text-gray-500 text-xs">&gt; User input:</div>
                    <div className="bg-gray-800 rounded px-2 py-1.5 text-gray-200">
                      {message.content}
                    </div>
                  </div>
                )}
                
                {/* Agent message */}
                {message.type === 'agent' && (
                  <div>
                    <div className="text-gray-500 text-xs">&gt; Agent response:</div>
                    <div className="bg-gray-800 rounded px-2 py-1.5 text-gray-200">
                      {message.content}
                    </div>
                  </div>
                )}
                
                {/* Thinking message (Replit style) */}
                {message.type === 'thinking' && (
                  <div>
                    <div className="flex items-center text-green-500 text-xs">
                      <svg className="animate-spin mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Titan thinking:
                    </div>
                    <div className="bg-gray-800 border-l-2 border-green-600 rounded px-2 py-1.5 text-gray-300 whitespace-pre-wrap">
                      {message.content.split('\n').map((line: string, idx: number) => (
                        <div key={idx} className="text-xs leading-relaxed">
                          {line.startsWith('✓') ? (
                            <span className="text-green-400">{line}</span>
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
                    
                    {/* Show debug steps if any */}
                    {message.steps && message.steps.length > 0 && (
                      <div className="mt-1 ml-3 text-xs">
                        <div className="text-blue-400">Steps:</div>
                        {message.steps.map((step: string, stepIdx: number) => (
                          <div key={stepIdx} className="flex items-start ml-2 mb-0.5">
                            <div className="text-green-500 mr-1">{stepIdx + 1}.</div>
                            <div className="text-gray-300">{step}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Code generation result */}
                {message.type === 'code-generation' && (
                  <div>
                    <div className="text-gray-500 text-xs mb-1">&gt; Generated code:</div>
                    <div className="flex items-center text-green-500 text-xs mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Successfully generated {message.filename}
                    </div>
                    <div className="text-gray-300 text-xs mb-1 italic">
                      {message.content}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Code editor panel */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <div className="bg-gray-850 text-xs text-gray-400 px-3 py-1 flex justify-between items-center border-b border-gray-800">
            <div className="font-semibold flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              {codeFilename || 'No file selected'}
            </div>
            <div>
              {codeLanguage && <span className="text-xs px-1.5 py-0.5 bg-gray-700 rounded">{codeLanguage}</span>}
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-gray-900 p-4 text-sm font-mono">
            {currentCode ? (
              <pre className="text-gray-300 whitespace-pre-wrap">{currentCode}</pre>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500 text-sm">
                No code to display yet. Watch the console for AI activity...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}