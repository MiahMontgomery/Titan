import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ES Module replacement for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import cors from 'cors';
import { log, error } from './helpers';
import { initWebSocketServer } from './websocket';
import { setRoutes } from './routes';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const port = process.env.PORT || 5000;

// Initialize HTTP server (needed for WebSocket)
const httpServer = createServer(app);

// Configure CORS
const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',') 
  : ['http://localhost:3000', 'https://titan-client.vercel.app'];

// Add Replit domains to allowed origins
const replitDomainRegex = /.*\.replit\.dev$/;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    // Allow Replit domains
    if (replitDomainRegex.test(origin)) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      console.warn(msg);
      return callback(new Error(msg), false);
    }
    
    return callback(null, true);
  },
  credentials: true
}));

// Parse JSON requests
app.use(express.json({ limit: '10mb' }));

// Serve client static files from client/dist
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// Initialize WebSocket server
const wss = initWebSocketServer(httpServer);

// Set up API routes
setRoutes(app, httpServer);

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  error(`Error in request: ${err.message}`);
  res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message || 'An unknown error occurred',
      code: err.code || 'INTERNAL_SERVER_ERROR'
    }
  });
});

// Start the server
httpServer.listen(port, () => {
  log(`🚀 Titan API Server running on port ${port}`);
  log(`🔌 WebSocket server available at ws://localhost:${port}/ws`);
  log(`🔑 CORS enabled for origins: ${allowedOrigins.join(', ')} and all Replit domains`);
});

// Handle server shutdown
process.on('SIGINT', () => {
  log('Server shutting down...');
  // Perform cleanup tasks here
  httpServer.close(() => {
    log('Server closed');
    process.exit(0);
  });
});

export { app, httpServer, wss };