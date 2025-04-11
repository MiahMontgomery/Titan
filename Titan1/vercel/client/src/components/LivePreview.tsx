import { useState, useEffect, useRef } from 'react';
import { useWebSocketContext } from '@/lib/websocket';
import { WebSocketMessage } from '@/lib/types';

interface LivePreviewProps {
  projectId?: number;
  height?: string;
  showLogs?: boolean;
  code?: string;
}

export function LivePreview({ projectId, height = '100%', showLogs = true, code }: LivePreviewProps) {
  const [activeTab, setActiveTab] = useState<'preview'|'logs'>('preview');
  const [currentHtml, setCurrentHtml] = useState<string | null>(null);
  const [logs, setLogs] = useState<{message: string, type: 'info' | 'error' | 'warning' | 'success', timestamp: Date}[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { subscribe } = useWebSocketContext();

  // Initial HTML for the preview pane when no content is available
  const initialHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          color: #e2e8f0;
          background-color: #1a202c;
          margin: 0;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          text-align: center;
        }
        h1 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
        }
        p {
          font-size: 0.875rem;
          color: #a0aec0;
          max-width: 500px;
          line-height: 1.5;
        }
        .spinner {
          margin: 20px auto;
          width: 40px;
          height: 40px;
          border: 3px solid rgba(45, 55, 72, 0.3);
          border-radius: 50%;
          border-top-color: #4299e1;
          animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <h1>FINDOM Project Live Preview</h1>
      <div class="spinner"></div>
      <p>The AI is currently working on implementing components for this project. Live preview will update as components are completed.</p>
      <p style="margin-top: 15px; font-size: 0.75rem;">Current focus: Document Template Management System for the Legal and Compliance Automation feature</p>
    </body>
    </html>
  `;

  // Track auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  
  // Listen for the custom auto-refresh toggle event 
  useEffect(() => {
    const handleAutoRefreshToggle = () => {
      setAutoRefresh(prev => {
        const newState = !prev;
        setLogs(prev => [...prev, {
          message: `Auto-refresh ${newState ? 'enabled' : 'disabled'}`,
          type: newState ? 'success' : 'info',
          timestamp: new Date()
        }]);
        return newState;
      });
    };
    
    window.addEventListener('toggle-auto-refresh', handleAutoRefreshToggle);
    
    return () => {
      window.removeEventListener('toggle-auto-refresh', handleAutoRefreshToggle);
    };
  }, []);
  
  // Process code prop when it changes
  useEffect(() => {
    if (code) {
      const language = detectLanguage(code);
      // If this is HTML or contains significant viewable content, update the preview
      if (language === 'html' || code.includes('<html>') || code.includes('<body>')) {
        // Extract the HTML from the code snippet
        const htmlContent = extractHtml(code);
        if (htmlContent) {
          setCurrentHtml(htmlContent);
          
          setLogs(prev => [...prev, {
            message: 'Updated live preview with new HTML content from prop',
            type: 'success',
            timestamp: new Date()
          }]);
        }
      }
      // For React/UI components, generate a demo HTML to show how it might look
      else if (
        code.includes('import React') || 
        (code.includes('function') && 
        code.includes('return') && 
        code.includes('<'))
      ) {
        const componentName = extractComponentName(code);
        const componentDemo = generateComponentDemo(componentName, code);
        
        setCurrentHtml(componentDemo);
        
        setLogs(prev => [...prev, {
          message: `Generated preview for React component: ${componentName || 'Unknown Component'}`,
          type: 'success',
          timestamp: new Date()
        }]);
      }
    }
  }, [code]);

  // Setup WebSocket subscription to capture HTML content and logs
  useEffect(() => {
    // Set initial HTML if no code prop
    if (!code) {
      setCurrentHtml(initialHtml);
    }
    
    // Add initial log
    const timestamp = new Date();
    setLogs([
      { 
        message: 'Live preview system initialized', 
        type: 'info', 
        timestamp 
      },
      { 
        message: 'Waiting for AI to generate viewable components', 
        type: 'info', 
        timestamp: new Date(timestamp.getTime() + 100) 
      },
      {
        message: 'Currently focusing on: Document Template Management for Legal Compliance Automation',
        type: 'info',
        timestamp: new Date(timestamp.getTime() + 200)
      },
      {
        message: 'Auto-refresh enabled by default',
        type: 'success',
        timestamp: new Date(timestamp.getTime() + 300)
      },
      {
        message: 'Working on Auto-Developing FINDOM Project ID #3',
        type: 'success',
        timestamp: new Date(timestamp.getTime() + 400)
      }
    ]);

    // Subscribe to WebSocket messages that might contain viewable content
    const unsubscribe = subscribe((data: WebSocketMessage) => {
      // Only process messages for the specified project (if provided)
      if (projectId && data.projectId && data.projectId !== projectId) {
        return;
      }

      // Always add to logs, regardless of auto-refresh setting
      if (data.type === 'thinking') {
        setLogs(prev => [...prev, {
          message: `AI thinking: ${data.message || 'Processing...'}`,
          type: 'info',
          timestamp: new Date()
        }]);
      } 
      else if (data.type === 'chat-response' && data.codeSnippet) {
        const snippet = data.codeSnippet || '';
        const language = detectLanguage(snippet);
        
        // Only update the preview content if auto-refresh is enabled
        if (autoRefresh) {
          // If this is HTML or contains significant viewable content, update the preview
          if (language === 'html' || data.codeSnippet && (data.codeSnippet.includes('<html>') || data.codeSnippet.includes('<body>'))) {
            // Extract the HTML from the code snippet
            const htmlContent = extractHtml(data.codeSnippet || '');
            if (htmlContent) {
              setCurrentHtml(htmlContent);
              
              setLogs(prev => [...prev, {
                message: 'Updated live preview with new HTML content',
                type: 'success',
                timestamp: new Date()
              }]);
            }
          }
          // For React/UI components, generate a demo HTML to show how it might look
          else if (
            data.codeSnippet && (
              data.codeSnippet.includes('import React') || 
              (data.codeSnippet.includes('function') && 
              data.codeSnippet.includes('return') && 
              data.codeSnippet.includes('<'))
            )
          ) {
            const snippet = data.codeSnippet || '';
            const componentName = extractComponentName(snippet);
            const componentDemo = generateComponentDemo(componentName, snippet);
            
            setCurrentHtml(componentDemo);
            
            setLogs(prev => [...prev, {
              message: `Generated preview for React component: ${componentName || 'Unknown Component'}`,
              type: 'success',
              timestamp: new Date()
            }]);
          }
        } else {
          // Log that we received an update but didn't refresh due to settings
          setLogs(prev => [...prev, {
            message: `New code received but preview not updated (auto-refresh disabled)`,
            type: 'info',
            timestamp: new Date()
          }]);
        }
        
        // Always add code generation log
        if (data.codeSnippet) {
          const snippet = data.codeSnippet || '';
          setLogs(prev => [...prev, {
            message: `Code generated: ${detectLanguage(snippet)} (${snippet.length} chars)`,
            type: 'success',
            timestamp: new Date()
          }]);
        }
      }
      // For new-feature messages
      else if (data.type === 'new-feature' && data.data?.name) {
        setLogs(prev => [...prev, {
          message: `New feature added: ${data.data.name}`,
          type: 'success',
          timestamp: new Date()
        }]);
      }
      else if (data.type === 'activity' && data.data) {
        setLogs(prev => [...prev, {
          message: `Activity: ${data.data.message || 'No description'}`,
          type: 'info',
          timestamp: new Date(data.data.timestamp || Date.now())
        }]);
      }
    });

    return unsubscribe;
  }, [projectId, subscribe, autoRefresh]);

  // Generate a demo HTML for a React component
  const generateComponentDemo = (componentName: string, code: string): string => {
    // Extract props from the component if possible
    const propsMatch = code.match(/interface\s+(\w+Props)\s*\{([^}]+)\}/);
    let propsInfo = '';
    
    if (propsMatch) {
      propsInfo = `<p class="props-info">Props: ${propsMatch[2].replace(/\n/g, ', ').replace(/;/g, '')}</p>`;
    }
    
    // Generate HTML that shows the component would look like
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            color: #e2e8f0;
            background-color: #1a202c;
            margin: 0;
            padding: 20px;
          }
          .component-preview {
            border: 1px solid #4299e1;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
          }
          .component-name {
            font-size: 1.25rem;
            font-weight: bold;
            margin-bottom: 10px;
            color: #4299e1;
          }
          .component-desc {
            font-size: 0.875rem;
            color: #a0aec0;
            margin-bottom: 15px;
          }
          .props-info {
            font-family: monospace;
            font-size: 0.75rem;
            background-color: #2d3748;
            padding: 10px;
            border-radius: 4px;
            color: #cbd5e0;
          }
          .demo-ui {
            background-color: #2d3748;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
          }
          .demo-ui-item {
            margin-bottom: 10px;
            padding: 10px;
            background-color: #4a5568;
            border-radius: 4px;
          }
          h3 {
            font-size: 1rem;
            margin-top: 20px;
            color: #e2e8f0;
          }
        </style>
      </head>
      <body>
        <div class="component-preview">
          <div class="component-name">${componentName || 'React Component'}</div>
          <div class="component-desc">
            This is a preview of how the React component would look when rendered.
          </div>
          ${propsInfo}
          
          <h3>Demo UI:</h3>
          <div class="demo-ui">
            ${generateDemoContent(code)}
          </div>
        </div>
        
        <h3>Implementation Notes:</h3>
        <ul>
          <li>This is a simulated preview of how the component might appear</li>
          <li>The actual implementation may vary based on the complete context</li>
          <li>Currently focusing on ${componentName || 'UI components'} for the FINDOM project</li>
        </ul>
      </body>
      </html>
    `;
  };

  // Generate some demo content based on code analysis
  const generateDemoContent = (code: string): string => {
    let demoHtml = '';
    
    // Check for form components
    if (code.includes('<form') || code.includes('onSubmit')) {
      demoHtml += `
        <div class="demo-ui-item">Form Component</div>
      `;
      
      // Look for inputs
      if (code.includes('<input') || code.includes('<textarea')) {
        demoHtml += `
          <div class="demo-ui-item">Input Fields</div>
        `;
      }
      
      // Look for buttons
      if (code.includes('<button') || code.includes('<Button')) {
        demoHtml += `
          <div class="demo-ui-item">Action Buttons</div>
        `;
      }
    }
    
    // Check for list components
    if (code.includes('map(') && (code.includes('<li') || code.includes('<div'))) {
      demoHtml += `
        <div class="demo-ui-item">List Component</div>
        <div class="demo-ui-item">List Item 1</div>
        <div class="demo-ui-item">List Item 2</div>
      `;
    }
    
    // Check for common UI patterns
    if (code.includes('<Modal') || code.includes('<Dialog')) {
      demoHtml += `
        <div class="demo-ui-item">Modal/Dialog Component</div>
      `;
    }
    
    if (code.includes('<Card') || code.includes('<card')) {
      demoHtml += `
        <div class="demo-ui-item">Card Component</div>
      `;
    }
    
    // If we couldn't determine anything specific, add a generic element
    if (!demoHtml) {
      demoHtml = `
        <div class="demo-ui-item">Component UI Elements</div>
      `;
    }
    
    return demoHtml;
  };

  // Extract component name from code
  const extractComponentName = (code: string): string => {
    // Look for function component definition
    const functionMatch = code.match(/function\s+([A-Z]\w+)/);
    if (functionMatch) return functionMatch[1];
    
    // Look for arrow function component
    const arrowMatch = code.match(/const\s+([A-Z]\w+)\s*=\s*\(/);
    if (arrowMatch) return arrowMatch[1];
    
    // Look for class component
    const classMatch = code.match(/class\s+([A-Z]\w+)\s+extends\s+React\.Component/);
    if (classMatch) return classMatch[1];
    
    return 'Component';
  };

  // Extract usable HTML from code
  const extractHtml = (code: string): string | null => {
    // If it's already an HTML document, return it
    if (code.includes('<!DOCTYPE html>') || code.includes('<html>')) {
      return code;
    }
    
    // If it's a fragment or component, wrap it in a basic HTML structure
    if (code.includes('<div') || code.includes('<span') || code.includes('<p')) {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              color: #e2e8f0;
              background-color: #1a202c;
              margin: 0;
              padding: 20px;
            }
          </style>
        </head>
        <body>
          ${code}
        </body>
        </html>
      `;
    }
    
    return null;
  };

  // Detect the language of the code
  const detectLanguage = (code: string): string => {
    if (code.includes('<!DOCTYPE html>') || code.includes('<html>')) {
      return 'html';
    }
    
    if (code.includes('import React') || (code.includes('function') && code.includes('return') && code.includes('<'))) {
      return 'jsx/tsx';
    }
    
    if (code.includes('function') || code.includes('const') || code.includes('let') || code.includes('var')) {
      return 'javascript';
    }
    
    if (code.includes('import') && code.includes('from') && code.includes('interface')) {
      return 'typescript';
    }
    
    if (code.includes('def ') && code.includes(':')) {
      return 'python';
    }
    
    return 'text';
  };

  return (
    <div className="flex flex-col h-full border border-gray-700 rounded-md overflow-hidden" style={{ height }}>
      {/* Tabs */}
      <div className="flex bg-gray-800 border-b border-gray-700 justify-between">
        <div className="flex">
          <button 
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'preview' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </button>
          {showLogs && (
            <button 
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'logs' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}
              onClick={() => setActiveTab('logs')}
            >
              Logs
            </button>
          )}
        </div>
        <div className="flex items-center px-3">
          <div className={`h-2 w-2 rounded-full mr-2 ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
          <span className="text-xs text-gray-400">{autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}</span>
        </div>
      </div>
      
      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {/* Preview tab */}
        {activeTab === 'preview' && (
          <div className="h-full bg-gray-900">
            <iframe 
              ref={iframeRef}
              className="w-full h-full border-0"
              srcDoc={currentHtml || initialHtml}
              title="Live Preview"
              sandbox="allow-scripts"
            />
          </div>
        )}
        
        {/* Logs tab */}
        {activeTab === 'logs' && showLogs && (
          <div className="h-full bg-gray-900 overflow-y-auto p-2">
            {logs.map((log, index) => (
              <div key={index} className="mb-1 text-xs font-mono flex">
                <span className="text-gray-500 mr-2">[{log.timestamp.toLocaleTimeString()}]</span>
                <span 
                  className={
                    log.type === 'error' ? 'text-red-400' : 
                    log.type === 'warning' ? 'text-yellow-400' :
                    log.type === 'success' ? 'text-green-400' : 
                    'text-blue-400'
                  }
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}