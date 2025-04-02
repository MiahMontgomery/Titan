import { Application, Request, Response } from 'express';
import { Server } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { log, error } from './helpers';
import { processText, processChat, generateJsonResponse, generateProjectPlan, analyzeImage, generateImage } from './openai';
import { initWebSocketServer, broadcastToAll, sendThinking } from './websocket';

// ES Module replacement for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Set up all API routes and WebSocket server
 * @param app Express application
 * @param httpServer HTTP server instance
 */
export function setRoutes(app: Application, httpServer?: Server): void {
  // Initialize WebSocket server if HTTP server is provided
  if (httpServer) {
    const wss = initWebSocketServer(httpServer);
    log('🔌 WebSocket server available at ws://localhost:5000/ws');
  }
  // Check API keys endpoint
  app.get('/api/check-keys/:provider', (req: Request, res: Response) => {
    const { provider } = req.params;
    
    // Check if environment variable exists for the specified provider
    let hasKey = false;
    let keyName = '';
    
    if (provider === 'openai') {
      keyName = 'OPENAI_API_KEY';
      hasKey = !!process.env.OPENAI_API_KEY;
    } else if (provider === 'firebase') {
      keyName = 'FIREBASE_API_KEY';
      hasKey = !!process.env.FIREBASE_API_KEY;
    }
    
    res.json({
      success: true,
      provider,
      hasKey,
      keyName
    });
  });
  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // API version endpoint
  app.get('/api/version', (req: Request, res: Response) => {
    res.json({
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version
    });
  });

  // Projects routes
  app.get('/api/projects', (req: Request, res: Response) => {
    // Return a sample FINDOM project
    // Note: Returning the direct array format as expected by the client
    res.json([
      {
        id: 1,
        name: 'FINDOM',
        description: 'Financial Domination Autonomous Agent',
        isWorking: true,
        progress: 15,
        lastUpdated: new Date(),
        projectType: 'findom',
        autoMode: false,
        priority: 10
      }
    ]);
  });

  app.get('/api/projects/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const projectId = parseInt(id);
    
    // Special case for FINDOM project
    if (projectId === 1) {
      res.json({ 
        id: 1,
        name: 'FINDOM',
        description: 'Financial Domination Autonomous Agent - A system for automating findom content creation, client interaction, and account management across multiple platforms.',
        isWorking: true,
        progress: 15,
        lastUpdated: new Date(),
        projectType: 'findom',
        autoMode: false,
        priority: 10,
        agentConfig: {
          checkInterval: 30,
          aiPersona: 'confident',
          contentTypes: ['messages', 'photos', 'videos'],
          targetPlatforms: ['onlyfans', 'twitter', 'telegram']
        }
      });
      return;
    }
    
    // For other project IDs, return a generic project
    res.json({ 
      id: projectId, 
      name: 'Project ' + id,
      description: 'This is a placeholder project description.',
      progress: 0,
      projectType: 'general',
      isWorking: false,
      priority: 5,
      lastUpdated: new Date()
    });
  });

  // Personas routes
  app.get('/api/personas', (req: Request, res: Response) => {
    // Return an empty array for now until we implement actual data storage
    // Note: Returning the direct array format as expected by the client
    res.json([]);
  });

  app.get('/api/personas/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    // Return a simple persona object with required properties
    const now = new Date();
    res.json({ 
      id: parseInt(id), 
      name: 'persona_' + id,
      displayName: 'Persona ' + id,
      description: 'This is a placeholder persona description.',
      projectId: 1,
      createdAt: now,
      updatedAt: now,
      isActive: true,
      behavior: {
        tone: 'professional',
        style: 'conversational',
        vocabulary: 'technical',
        responsiveness: 8,
        instructions: 'Default instructions for persona.',
        lastUpdated: now
      },
      stats: {
        totalIncome: 0,
        messageCount: 0,
        responseRate: 0,
        averageResponseTime: 0,
        contentCreated: 0,
        contentPublished: 0,
        conversionRate: 0
      },
      autonomy: {
        level: 5,
        decisionHistory: [],
        canInitiateConversation: true,
        canCreateContent: true
      }
    });
  });

  // Chat endpoint
  app.post('/api/chat', async (req: Request, res: Response) => {
    const { message, projectId } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: { message: 'Message is required' }
      });
    }
    
    try {
      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        log('No OpenAI API key found, using echo response');
        return res.json({
          success: true,
          response: `Echo (no API key): ${message}`,
          timestamp: new Date().toISOString()
        });
      }
      
      // Send thinking update via WebSocket if project ID is provided
      if (projectId) {
        sendThinking(projectId, 'Processing your message...');
      }
      
      // Use OpenAI to process the message
      const response = await processText(message);
      
      // Send completion update via WebSocket if project ID is provided
      if (projectId) {
        sendThinking(projectId, 'Response ready');
      }
      
      return res.json({
        success: true,
        response,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      error(`Error processing chat: ${err.message}`);
      
      // Send error update via WebSocket if project ID is provided
      if (projectId) {
        sendThinking(projectId, `Error: ${err.message}`);
      }
      
      return res.status(500).json({
        success: false,
        error: { 
          message: 'Error processing chat message',
          details: err.message
        }
      });
    }
  });
  
  // Project planner endpoint - generates a project plan from a description
  app.post('/api/project-plan', async (req: Request, res: Response) => {
    const { description, projectId } = req.body;
    
    if (!description) {
      return res.status(400).json({
        success: false,
        error: { message: 'Project description is required' }
      });
    }
    
    try {
      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        log('No OpenAI API key found, returning sample project plan');
        return res.json({
          success: false,
          error: { 
            message: 'OpenAI API key is required for project planning',
            code: 'API_KEY_MISSING'
          }
        });
      }
      
      // Send thinking update via WebSocket if project ID is provided
      if (projectId) {
        sendThinking(projectId, 'Analyzing project description...');
      }
      
      // Use OpenAI to generate a project plan
      log(`Generating project plan for: ${description.substring(0, 50)}...`);
      
      // Send more detailed thinking updates if project ID is provided
      if (projectId) {
        sendThinking(projectId, 'Identifying key requirements and features...');
        setTimeout(() => {
          sendThinking(projectId, 'Structuring project tasks and phases...');
        }, 2000);
      }
      
      const projectPlan = await generateProjectPlan(description);
      
      // Send completion update via WebSocket if project ID is provided
      if (projectId) {
        sendThinking(projectId, 'Project plan generated successfully.');
      }
      
      return res.json({
        success: true,
        projectPlan,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      error(`Error generating project plan: ${err.message}`);
      
      // Send error update via WebSocket if project ID is provided
      if (projectId) {
        sendThinking(projectId, `Error generating project plan: ${err.message}`);
      }
      
      return res.status(500).json({
        success: false,
        error: { 
          message: 'Error generating project plan',
          details: err.message
        }
      });
    }
  });
  
  // Image analysis endpoint - analyzes an image
  app.post('/api/analyze-image', async (req: Request, res: Response) => {
    const { image, prompt } = req.body;
    
    if (!image) {
      return res.status(400).json({
        success: false,
        error: { message: 'Image data is required (base64 encoded)' }
      });
    }
    
    try {
      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        log('No OpenAI API key found, cannot analyze image');
        return res.json({
          success: false,
          error: { 
            message: 'OpenAI API key is required for image analysis',
            code: 'API_KEY_MISSING'
          }
        });
      }
      
      // Strip out the data:image/xxx;base64, prefix if present
      let base64Image = image;
      if (base64Image.includes(';base64,')) {
        base64Image = base64Image.split(';base64,')[1];
      }
      
      // Use OpenAI to analyze the image
      log('Analyzing image with OpenAI Vision');
      const analysis = await analyzeImage(base64Image, prompt || 'Analyze this image in detail');
      
      return res.json({
        success: true,
        analysis,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      error(`Error analyzing image: ${err.message}`);
      return res.status(500).json({
        success: false,
        error: { 
          message: 'Error analyzing image',
          details: err.message
        }
      });
    }
  });
  
  // Image generation endpoint - generates an image from a prompt
  app.post('/api/generate-image', async (req: Request, res: Response) => {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: { message: 'Prompt is required to generate an image' }
      });
    }
    
    try {
      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        log('No OpenAI API key found, cannot generate image');
        return res.json({
          success: false,
          error: { 
            message: 'OpenAI API key is required for image generation',
            code: 'API_KEY_MISSING'
          }
        });
      }
      
      // Use OpenAI to generate an image
      log(`Generating image with prompt: ${prompt.substring(0, 50)}...`);
      const imageUrl = await generateImage(prompt);
      
      return res.json({
        success: true,
        imageUrl,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      error(`Error generating image: ${err.message}`);
      return res.status(500).json({
        success: false,
        error: { 
          message: 'Error generating image',
          details: err.message
        }
      });
    }
  });

  // Catch-all route for API
  app.all('/api/*', (req: Request, res: Response) => {
    log(`Unhandled API request: ${req.method} ${req.path}`);
    res.status(404).json({
      success: false,
      error: { message: 'API endpoint not found' }
    });
  });

  // For client-side routing, serve index.html for all non-API routes
  app.get('*', (req: Request, res: Response) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) return;
    
    // Serve the main index.html file for client-side routing
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}