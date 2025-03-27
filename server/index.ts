import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { getStorage } from "./storage";
import { setupProjectImprovement } from "./openai";
import { initializeWebAutomation } from "./webAutomation";
import { initializeFindomAgents } from "./findomAgent";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
    if (path.startsWith("/api")) {
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

(async () => {
  const server = await registerRoutes(app);

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
    log(`serving on port ${port}`);
    
    // Auto-initialize all autonomous agents after server startup
    setTimeout(async () => {
      try {
        const storage = getStorage();
        const hasOpenAIKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 0;
        
        if (hasOpenAIKey) {
          log("OpenAI API key found in environment variables");
          
          // Setup autonomous project improvement cycle
          log("Starting autonomous project improvement cycle...");
          setupProjectImprovement(5); // Check every 5 minutes
          
          // Initialize web automation for all projects that need it
          log("Initializing 24/7 autonomous web automation...");
          await initializeWebAutomation();
          log("Web automation initialized successfully");
          
          // Start all FINDOM agents
          log("Starting all 24/7 autonomous FINDOM agents...");
          await initializeFindomAgents();
          log("All FINDOM agents initialized successfully");
          
          log("Autonomous agent systems initialized successfully");
        } else {
          log("WARNING: No OpenAI API key found in environment variables");
          log("Autonomous features will be disabled until an API key is provided");
          log("Set OPENAI_API_KEY in your environment or .env file to enable AI features");
        }
      } catch (error) {
        console.error("Error initializing autonomous systems:", error);
      }
    }, 5000); // Wait 5 seconds after server startup to ensure everything is initialized
  });
})();
