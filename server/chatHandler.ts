import { Request, Response } from 'express';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { WebSocketServer } from 'ws';
import { WebSocket } from 'ws';
import { Feature, Milestone, Goal, InsertFeature, InsertMilestone, InsertGoal } from '../shared/schema';
import { storage } from './storage';

// Create an OpenAI client instance
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Reference to the WebSocket server for live streaming of thinking process
let wss: WebSocketServer | null = null;

// Set WebSocket server reference
export function setWebSocketServer(wsServer: WebSocketServer) {
  wss = wsServer;
}

// Chat history storage for context
const chatHistories: Record<number, ChatCompletionMessageParam[]> = {};

// Function to check if a message is a project generation request
function isProjectGenerationRequest(message: string): boolean {
  const lowerMsg = message.toLowerCase();
  return (
    (lowerMsg.includes('create') || lowerMsg.includes('build') || lowerMsg.includes('make') || lowerMsg.includes('develop')) && 
    (lowerMsg.includes('project') || lowerMsg.includes('app') || lowerMsg.includes('application') || lowerMsg.includes('website'))
  );
}

// Function to check if a message is asking about features or requirements
function isFeatureRequest(message: string): boolean {
  const lowerMsg = message.toLowerCase();
  return (
    (lowerMsg.includes('what features') || lowerMsg.includes('add feature') || lowerMsg.includes('new feature') || lowerMsg.includes('implement')) &&
    !lowerMsg.includes('how to')
  );
}

// Function to send thinking updates through WebSocket
function broadcastThinking(projectId: number, message: string): void {
  if (!wss) return;
  
  const thinkingMessage = {
    type: 'thinking',
    projectId: projectId,
    message: message,
    timestamp: new Date().toISOString()
  };
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(thinkingMessage));
    }
  });
}

// Helper function to extract code snippets from AI responses
function extractCodeSnippet(response: string): string | null {
  const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)```/g;
  let matches = [];
  let match;
  
  while ((match = codeBlockRegex.exec(response)) !== null) {
    matches.push(match[1]);
  }
  
  return matches.length > 0 ? matches.join('\n\n') : null;
}

// Fallback response generator for demonstration or when OpenAI is not available
function generateFallbackResponse(message: string): { message: string; codeSnippet: string | null } {
  if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
    return { 
      message: "Hello! I'm Titan, your project management assistant. How can I help you today?",
      codeSnippet: null
    };
  }
  
  if (message.toLowerCase().includes('feature')) {
    return { 
      message: "I can help you plan and implement features. What specific feature are you looking to build?",
      codeSnippet: null
    };
  }
  
  if (message.toLowerCase().includes('code') || message.toLowerCase().includes('programming')) {
    return { 
      message: "I can assist with coding tasks. Here's a simple example of a React component:\n\n```jsx\nimport React from 'react';\n\nfunction Greeting({ name }) {\n  return <h1>Hello, {name}!</h1>;\n}\n\nexport default Greeting;\n```",
      codeSnippet: "import React from 'react';\n\nfunction Greeting({ name }) {\n  return <h1>Hello, {name}!</h1>;\n}\n\nexport default Greeting;"
    };
  }
  
  return { 
    message: "I'm here to help with your project management and development needs. Could you provide more details about what you're working on?",
    codeSnippet: null
  };
}

// AI Chat handler that processes user messages using OpenAI's GPT-4 Turbo
export async function handleChatMessage(req: Request, res: Response) {
  try {
    const { message, projectId } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }
    
    // Parse projectId to number if it's a string
    const projectIdNum = typeof projectId === 'string' ? parseInt(projectId, 10) : projectId;
    
    if (isNaN(projectIdNum) || projectIdNum < 0) {
      return res.status(400).json({ error: 'Project ID is required and must be a valid number' });
    }
    
    console.log(`Received chat message for project ${projectIdNum}: ${message}`);
    
    // Start sending thinking updates if this looks like a project or feature request
    if (isProjectGenerationRequest(message) || isFeatureRequest(message)) {
      broadcastThinking(projectIdNum, 'Analyzing your request...');
    }
    
    // Simple math expressions handler as a fallback for demo purposes
    if (message.toLowerCase().includes('what') && message.includes('+')) {
      const parts = message.match(/(\d+)\s*\+\s*(\d+)/);
      if (parts && parts.length === 3) {
        const num1 = parseInt(parts[1], 10);
        const num2 = parseInt(parts[2], 10);
        const result = num1 + num2;
        
        // Return the sum result
        return res.json({
          response: `The answer is ${result}`,
          codeSnippet: null
        });
      }
    }
    
    // Try to get project details from storage
    let projectDetails;
    try {
      const project = await storage.getProject(projectIdNum);
      projectDetails = project ? { name: project.name } : { name: "New Project" };
    } catch (error) {
      console.error("Error fetching project details:", error);
      projectDetails = { name: "Unknown Project" };
    }
    
    // Initialize chat history for this project if it doesn't exist
    if (!chatHistories[projectIdNum]) {
      chatHistories[projectIdNum] = [
        {
          role: "system",
          content: `You are Titan, an AI-powered assistant for the Titan project management system, focused on helping with project planning, coding, and debugging.
          
Current project context: ${projectDetails?.name || `Project ID ${projectIdNum}`}

Your capabilities:
1. Project Management:
   - Analyze project requirements and break them down into features, milestones, and goals
   - Estimate completion times for different tasks
   - Provide technical architecture recommendations

2. Coding & Development:
   - Write, debug, and optimize code in various languages (JavaScript, TypeScript, Python, etc.)
   - Implement specific features requested by the user
   - Generate complete components or functions
   - Provide step-by-step implementation plans
   
3. Guidance & Explanation:
   - Explain technical concepts clearly and concisely
   - Answer questions about development best practices
   - Recommend technologies and approaches for specific problems
   - Provide explanations for how code works or why certain decisions are made

Important guidelines:
- Always be constructive and helpful
- When providing code snippets, embed them directly in your response using markdown code blocks
- If you're extensively modifying code, return both your explanation and the complete updated code
- Provide detailed, actionable advice that the user can implement immediately
- Ask clarifying questions if the user's request is ambiguous`
        } as ChatCompletionMessageParam
      ];
    }
    
    // Add the user's message to the chat history
    chatHistories[projectIdNum].push({
      role: "user",
      content: message
    });
    
    // Filter chat history to last N messages to stay within token limits
    const recentChatHistory = chatHistories[projectIdNum].slice(-10);
    
    try {
      // Send thinking update
      broadcastThinking(projectIdNum, 'Generating a thoughtful response...');
      
      // If we have an OpenAI API key, use it to generate a response
      if (process.env.OPENAI_API_KEY) {
        // Make OpenAI API request
        const completion = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: recentChatHistory,
          max_tokens: 2000,
          temperature: 0.7,
        });
        
        // Extract the response
        const aiResponse = completion.choices[0]?.message?.content || "I'm having trouble generating a response right now.";
        
        // Extract code snippets from the response
        const codeSnippet = extractCodeSnippet(aiResponse);
        
        // Add the assistant's response to the chat history
        chatHistories[projectIdNum].push({
          role: "assistant",
          content: aiResponse
        });
        
        // Log activity for AI response (use storage API)
        try {
          await storage.createActivityLog({
            projectId: projectIdNum,
            message: `AI responded to: "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"`,
            timestamp: new Date(),
            agentId: "ai-assistant",
            codeSnippet: codeSnippet 
          });
        } catch (error) {
          console.error("Error logging activity:", error);
        }
        
        // Return the AI response to the client
        return res.json({
          response: aiResponse,
          codeSnippet: codeSnippet
        });
      } else {
        // No OpenAI API key, use fallback response
        console.warn("OpenAI API key not found, using fallback response");
        broadcastThinking(projectIdNum, 'Note: Using demo mode as OpenAI API key is not configured.');
        
        const fallbackResponse = generateFallbackResponse(message);
        
        // Add the fallback response to the chat history
        chatHistories[projectIdNum].push({
          role: "assistant",
          content: fallbackResponse.message
        });
        
        return res.json({
          response: fallbackResponse.message,
          codeSnippet: fallbackResponse.codeSnippet
        });
      }
    } catch (error) {
      console.error("Error generating AI response:", error);
      
      // Send error through WebSocket
      broadcastThinking(projectIdNum, 'Encountered an error while generating a response. Using fallback.');
      
      // Return fallback response in case of error
      const fallbackResponse = generateFallbackResponse(message);
      return res.json({
        response: fallbackResponse.message,
        codeSnippet: fallbackResponse.codeSnippet
      });
    }
  } catch (error) {
    console.error("Unexpected error in chat handler:", error);
    return res.status(500).json({ error: 'An unexpected error occurred.' });
  }
}