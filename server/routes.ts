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
    // TODO: Implement projects listing
    res.json({ projects: [] });
  });

  app.get('/api/projects/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    // TODO: Implement project details
    res.json({ id, name: 'Project ' + id });
  });

  // Personas routes
  app.get('/api/personas', (req: Request, res: Response) => {
    // TODO: Implement personas listing
    res.json({ personas: [] });
  });

  app.get('/api/personas/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    // TODO: Implement persona details
    res.json({ id, name: 'Persona ' + id });
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