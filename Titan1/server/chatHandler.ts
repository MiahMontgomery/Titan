import { Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { storage } from './storage';
import { generateThinking } from './openai';

let wss: WebSocketServer | null = null;

/**
 * Set the WebSocket server instance
 */
export function setWebSocketServer(wsServer: WebSocketServer) {
  wss = wsServer;
}

/**
 * Check if a message appears to be a project generation request
 */
function isProjectGenerationRequest(message: string): boolean {
  const lowerMsg = message.toLowerCase();
  return (
    (lowerMsg.includes("create") || lowerMsg.includes("generate") || lowerMsg.includes("make") || lowerMsg.includes("build")) &&
    (lowerMsg.includes("project") || lowerMsg.includes("app") || lowerMsg.includes("application") || lowerMsg.includes("site") || lowerMsg.includes("website"))
  );
}

/**
 * Check if a message appears to be a feature request
 */
function isFeatureRequest(message: string): boolean {
  const lowerMsg = message.toLowerCase();
  return (
    (lowerMsg.includes("add") || lowerMsg.includes("create") || lowerMsg.includes("implement") || lowerMsg.includes("build")) &&
    (lowerMsg.includes("feature") || lowerMsg.includes("functionality") || lowerMsg.includes("capability"))
  );
}

/**
 * Broadcast thinking message to clients for a specific project
 * @param projectId The project ID
 * @param message The thinking message
 * @param codeSnippet Optional code snippet
 * @param debugSteps Optional debugging steps as an array of strings
 * @param isDebugging Whether this is a debugging message
 * @param stepByStep Whether to display this as a step-by-step process
 */
export function broadcastThinking(
  projectId: number, 
  message: string, 
  codeSnippet?: string | null,
  debugSteps?: string[],
  isDebugging?: boolean,
  stepByStep?: boolean,
  personaId?: string
): void {
  if (!wss) return;
  
  // Log to console for debugging purposes
  console.log(`Broadcasting thinking for project ${projectId}: ${message.substring(0, 100)}...`);
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'thinking',
        projectId,
        message,
        codeSnippet,
        debugSteps,
        isDebugging,
        stepByStep,
        personaId,
        timestamp: new Date().toISOString()
      }));
    }
  });
}

/**
 * Extract code snippet from a response if present
 */
function extractCodeSnippet(response: string): string | null {
  const codeBlockRegex = /```([a-zA-Z0-9]*)\n([\s\S]*?)```/g;
  let match;
  const matches: RegExpExecArray[] = [];
  
  while ((match = codeBlockRegex.exec(response)) !== null) {
    matches.push(match);
  }
  
  if (matches.length > 0) {
    // Return the first code block found
    return matches[0][2].trim();
  }
  
  return null;
}

/**
 * Generate a fallback response when AI service isn't available
 */
function generateFallbackResponse(message: string): { message: string; codeSnippet: string | null } {
  if (isProjectGenerationRequest(message)) {
    return {
      message: "I'd be happy to help you create a new project. To generate a project with AI assistance, please configure the OpenAI integration in the Settings page first.",
      codeSnippet: null
    };
  } else if (isFeatureRequest(message)) {
    return {
      message: "I'd be happy to help you implement this feature. To generate features with AI assistance, please configure the OpenAI integration in the Settings page first.",
      codeSnippet: null
    };
  } else if (message.toLowerCase().includes("code") || message.toLowerCase().includes("implement")) {
    return {
      message: "I'd be happy to help write code for this. To generate code with AI assistance, please configure the OpenAI integration in the Settings page first.",
      codeSnippet: null
    };
  } else {
    return {
      message: "I understand your request. To provide AI-powered assistance, please configure the OpenAI integration in the Settings page first.",
      codeSnippet: null
    };
  }
}

/**
 * Handle chat messages coming from the client
 */
export async function handleChatMessage(req: Request, res: Response) {
  try {
    const { message, projectId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const projectIdNum = typeof projectId === 'string' ? parseInt(projectId, 10) : projectId;
    
    // Check if the project exists
    const project = await storage.getProject(projectIdNum);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Initial thinking broadcast
    const personaId = req.body.personaId; // Get personaId from request if available
    broadcastThinking(
      projectIdNum, 
      'Thinking about your request...', 
      null, 
      ['Analyzing request', 'Preparing response', 'Formulating code if needed'], 
      false, 
      true,
      personaId
    );
    
    try {
      // Broadcast detailed processing steps
      broadcastThinking(
        projectIdNum,
        'Analyzing project context and requirements...',
        null,
        ['Processing request parameters', 'Checking project details', 'Retrieving relevant history'],
        false,
        true,
        personaId
      );
      
      // Generate thinking with OpenAI
      await generateThinking(projectIdNum, personaId, message, 3);
      
      // Using simpler response for now
      const thinking = `I've processed your request: "${message}"
      
Let me help you with that. I've analyzed your project requirements and context, and here's my understanding:

${message.includes('code') ? `Here's a sample code approach to implement this:

\`\`\`javascript
// Implementation for: ${message}
function processRequest(input) {
  // Parse the input
  const parsedInput = JSON.parse(input);
  
  // Process according to requirements
  const result = {
    status: "success",
    data: parsedInput,
    message: "Processed successfully"
  };
  
  return result;
}
\`\`\`` : 'I can assist with your request. Would you like me to explain further or provide implementation details?'}`;
      
      // Extract code snippet if present
      const codeSnippet = extractCodeSnippet(thinking);
      
      // Broadcast detailed processing results with code
      if (codeSnippet) {
        broadcastThinking(
          projectIdNum,
          'Generated code solution based on your request:',
          codeSnippet,
          ['Parsing requirements', 'Generating solution', 'Optimizing code', 'Finalizing implementation'],
          true,
          true,
          personaId
        );
      }
      
      // Log the activity
      await storage.createActivityLog({
        projectId: projectIdNum,
        message: `Chat: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
        timestamp: new Date(),
        agentId: 'chat-assistant',
        codeSnippet,
        activityType: 'chat',
        details: { userMessage: message },
        isCheckpoint: false,
        thinkingProcess: thinking
      });
      
      // Send the response
      res.json({
        response: thinking,
        codeSnippet
      });
    } catch (error) {
      console.error('Error generating thinking with OpenAI:', error);
      
      // Use fallback response when AI service fails
      const fallback = generateFallbackResponse(message);
      
      // Log the failure
      await storage.createActivityLog({
        projectId: projectIdNum,
        message: `Failed to process chat: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
        timestamp: new Date(),
        agentId: 'chat-assistant',
        codeSnippet: null,
        activityType: 'error',
        details: { 
          userMessage: message,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        isCheckpoint: false,
        thinkingProcess: null
      });
      
      // Send fallback response
      res.json({
        response: fallback.message,
        codeSnippet: fallback.codeSnippet,
        error: true
      });
    }
  } catch (error) {
    console.error('Error in chat handler:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}