<<<<<<< HEAD
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
import { webhookRouter } from './webhook';
import { setupVite, serveStatic } from './vite';
=======
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
>>>>>>> 1d84bc7 (Set up Node.js project for Titan AI assistant.)

// Load environment variables
dotenv.config();

<<<<<<< HEAD
// Define async main function
async function main() {
  // Initialize express app
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;

  // Initialize HTTP server (needed for WebSocket)
  const httpServer = createServer(app);

  // Configure CORS
  const allowedOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',') 
    : ['http://localhost:3000', 'https://findom-client.vercel.app'];

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

  // Initialize WebSocket server
  const wss = initWebSocketServer(httpServer);

  // Setup Vite or static file serving based on environment
  if (process.env.NODE_ENV === 'production') {
    // Serve client static files from dist/public in production
    const clientDistPath = path.join(__dirname, '../dist/public');
    app.use(express.static(clientDistPath));
    
    // Fallback for client-side routing
    app.get('*', (req, res) => {
      // Exclude API requests
      if (!req.path.startsWith('/api') && !req.path.startsWith('/webhook')) {
        res.sendFile(path.join(clientDistPath, 'index.html'));
      }
    });
    
    log('🏗️ Serving static files from dist/public');
  } else {
    // Setup Vite for development with improved error handling
    try {
      await setupVite(app, httpServer);
      log('🔥 Vite middleware initialized');
    } catch (err) {
      error(`Failed to initialize Vite: ${err}`);
      process.exit(1); // Exit if Vite can't be initialized as the app won't work
    }
  }

  // Mount the webhook router
  app.use('/webhook', webhookRouter);
  log('📝 GitHub webhook endpoints registered at /webhook/github');

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
  httpServer.listen(port, '0.0.0.0', () => {
    log(`🚀 Findom API Server running on port ${port}`);
    log(`🔌 WebSocket server available at ws://0.0.0.0:${port}/ws`);
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

  return { app, httpServer, wss };
};

// Run the main function
const { app, httpServer, wss } = await main();

// Export for testing and modules that may need access
export { app, httpServer, wss };
=======
// Initialize Titan webhook server
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api") || path.startsWith("/webhook")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Load Titan webhook routes
app.get('/webhook/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Titan webhook server is running' });
});

(async () => {
  const server = await registerRoutes(app);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`Titan server running on port ${port}`);
    log(`Webhook endpoints available at /webhook/*`);
  });
})();
>>>>>>> 1d84bc7 (Set up Node.js project for Titan AI assistant.)
