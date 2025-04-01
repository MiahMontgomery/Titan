import { Application, Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { log } from './helpers';

// ES Module replacement for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Set up all API routes
 * @param app Express application
 */
export function setRoutes(app: Application): void {
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
  app.post('/api/chat', (req: Request, res: Response) => {
    const { message, projectId } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: { message: 'Message is required' }
      });
    }
    
    // TODO: Implement chat functionality
    res.json({
      success: true,
      response: `Echo: ${message}`,
      timestamp: new Date().toISOString()
    });
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