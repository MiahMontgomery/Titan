import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { WebSocket } from "ws";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertApiKeySchema, 
  insertProjectSchema, 
  insertAgentSchema, 
  insertActivityLogSchema, 
  insertAutomationTaskSchema,
  AgentType,
  AgentStatus
} from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { runPuppeteerTask } from "./puppeteer";
import OpenAI from "openai";
import { openai } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // WebSocket connection handler
  wss.on("connection", (ws: WebSocket) => {
    console.log("WebSocket client connected");
    
    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: "connection",
      message: "Connected to FINDOM WebSocket server"
    }));
    
    // Handle client messages
    ws.on("message", async (message: string) => {
      try {
        const data = JSON.parse(message);
        console.log("Received message:", data);
        
        // Process message based on type
        if (data.type === "ping") {
          ws.send(JSON.stringify({ type: "pong", timestamp: new Date().toISOString() }));
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
        ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
      }
    });
    
    // Handle disconnection
    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });
  });
  
  // Broadcast function to send messages to all connected clients
  function broadcast(data: any) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }
  
  // API endpoints
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  // User routes
  app.post('/api/users', async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ error: validationError.message });
      } else {
        res.status(500).json({ error: 'Failed to create user' });
      }
    }
  });
  
  // API Key routes
  app.get('/api/api-keys', async (_req: Request, res: Response) => {
    try {
      const defaultApiKey = await storage.getDefaultApiKey();
      res.json({ defaultApiKey });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch API keys' });
    }
  });
  
  app.post('/api/api-keys', async (req: Request, res: Response) => {
    try {
      const apiKeyData = insertApiKeySchema.parse(req.body);
      const apiKey = await storage.createApiKey(apiKeyData);
      res.status(201).json(apiKey);
      
      // Broadcast new API key added
      broadcast({
        type: "api-key-added",
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          provider: apiKey.provider,
          isTurbo: apiKey.isTurbo
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ error: validationError.message });
      } else {
        res.status(500).json({ error: 'Failed to create API key' });
      }
    }
  });
  
  // Project routes
  app.get('/api/projects', async (_req: Request, res: Response) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  });
  
  app.post('/api/projects', async (req: Request, res: Response) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
      
      // Broadcast new project added
      broadcast({
        type: "project-added",
        project: {
          id: project.id,
          name: project.name
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ error: validationError.message });
      } else {
        res.status(500).json({ error: 'Failed to create project' });
      }
    }
  });
  
  // Agent routes
  app.get('/api/agents', async (req: Request, res: Response) => {
    try {
      const { type } = req.query;
      
      let agents;
      if (type && Object.values(AgentType).includes(type as AgentType)) {
        agents = await storage.getAgentsByType(type as AgentType);
      } else {
        agents = await storage.getAllAgents();
      }
      
      res.json(agents);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch agents' });
    }
  });
  
  app.post('/api/agents', async (req: Request, res: Response) => {
    try {
      const agentData = insertAgentSchema.parse(req.body);
      
      // Default status to IDLE if not provided
      if (!agentData.status) {
        agentData.status = AgentStatus.IDLE;
      }
      
      const agent = await storage.createAgent(agentData);
      res.status(201).json(agent);
      
      // Create activity log for agent creation
      await storage.createActivityLog({
        agentId: agent.id,
        action: "AGENT_CREATED",
        details: `Agent "${agent.name}" created with type ${agent.type}`
      });
      
      // Broadcast new agent added
      broadcast({
        type: "agent-added",
        agent: {
          id: agent.id,
          name: agent.name,
          type: agent.type,
          status: agent.status
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ error: validationError.message });
      } else {
        res.status(500).json({ error: 'Failed to create agent' });
      }
    }
  });
  
  app.patch('/api/agents/:id/status', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const statusSchema = z.object({ status: z.enum([AgentStatus.ACTIVE, AgentStatus.IDLE, AgentStatus.ERROR]) });
      
      const { status } = statusSchema.parse(req.body);
      
      const agent = await storage.updateAgentStatus(id, status);
      
      // Create activity log for status change
      await storage.createActivityLog({
        agentId: agent.id,
        action: "STATUS_CHANGED",
        details: `Agent "${agent.name}" status changed to ${status}`
      });
      
      // Broadcast agent status change
      broadcast({
        type: "agent-status-changed",
        agentId: agent.id,
        status: agent.status
      });
      
      res.json(agent);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ error: validationError.message });
      } else {
        res.status(500).json({ error: 'Failed to update agent status' });
      }
    }
  });
  
  // Activity logs routes
  app.get('/api/activity-logs', async (req: Request, res: Response) => {
    try {
      const limitParam = req.query.limit;
      const limit = limitParam ? parseInt(limitParam as string) : 10;
      
      const activityLogs = await storage.getRecentActivityLogs(limit);
      res.json(activityLogs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
  });
  
  // Automation tasks routes
  app.get('/api/automation-tasks', async (_req: Request, res: Response) => {
    try {
      const tasks = await storage.getAllAutomationTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch automation tasks' });
    }
  });
  
  app.post('/api/automation-tasks', async (req: Request, res: Response) => {
    try {
      const taskData = insertAutomationTaskSchema.parse(req.body);
      const task = await storage.createAutomationTask(taskData);
      res.status(201).json(task);
      
      // Broadcast new task added
      broadcast({
        type: "automation-task-added",
        task: {
          id: task.id,
          name: task.name,
          agentId: task.agentId
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ error: validationError.message });
      } else {
        res.status(500).json({ error: 'Failed to create automation task' });
      }
    }
  });
  
  app.post('/api/automation-tasks/:id/run', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getAutomationTask(id);
      
      if (!task) {
        return res.status(404).json({ error: 'Automation task not found' });
      }
      
      // Update task status
      await storage.updateAutomationTask(id, {
        status: "RUNNING",
        lastRun: new Date()
      });
      
      // Broadcast task started
      broadcast({
        type: "automation-task-started",
        taskId: task.id
      });
      
      // Run the Puppeteer task
      if (task.url && task.script) {
        try {
          const result = await runPuppeteerTask(task.url, task.script);
          
          // Update task with result
          await storage.updateAutomationTask(id, {
            status: "IDLE",
            lastRun: new Date()
          });
          
          // Create activity log
          await storage.createActivityLog({
            agentId: task.agentId,
            action: "AUTOMATION_COMPLETED",
            details: `Task "${task.name}" completed successfully`
          });
          
          // Broadcast task completed
          broadcast({
            type: "automation-task-completed",
            taskId: task.id,
            success: true
          });
          
          res.json({ success: true, result });
        } catch (error) {
          // Update task with error
          await storage.updateAutomationTask(id, {
            status: "ERROR",
            lastRun: new Date()
          });
          
          // Create activity log for error
          await storage.createActivityLog({
            agentId: task.agentId,
            action: "AUTOMATION_ERROR",
            details: `Task "${task.name}" failed: ${error.message}`
          });
          
          // Broadcast task error
          broadcast({
            type: "automation-task-completed",
            taskId: task.id,
            success: false,
            error: error.message
          });
          
          res.status(500).json({ success: false, error: error.message });
        }
      } else {
        res.status(400).json({ error: 'Task missing URL or script' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to run automation task' });
    }
  });

  app.post('/api/openai/completions', async (req: Request, res: Response) => {
    try {
      const { prompt, model, maxTokens, temperature, projectId } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }
      
      let apiClient = openai;
      
      // If a project ID is provided, try to use its turbo API key
      if (projectId) {
        try {
          const project = await storage.getProject(Number(projectId));
          if (project) {
            // Check for project-specific API key
            const projectApiKeys = await storage.getApiKeysByProject(project.id);
            const turboKey = projectApiKeys.find(key => key.isTurbo);
            
            if (turboKey) {
              // Use the project's turbo API key
              apiClient = new OpenAI({ apiKey: turboKey.key });
              console.log(`Using turbo API key for project "${project.name}"`);
              
              // Log activity
              await storage.createActivityLog({
                agentId: null,
                action: "API_CALL",
                details: `Used turbo API key for project "${project.name}" in AI Testing`
              });
            }
          }
        } catch (err) {
          console.warn('Failed to get project API key:', err);
          // Continue with default API key
        }
      }
      
      const result = await apiClient.chat.completions.create({
        model: model || 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens || 1000,
        temperature: temperature || 0.7
      });
      
      res.json({ 
        content: result.choices[0].message.content,
        usage: result.usage
      });
      
      // Broadcast a notification that OpenAI was used
      if (result.usage) {
        broadcast({
          type: "openai-usage",
          model: model || 'gpt-4o',
          tokens: result.usage.total_tokens,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
      res.status(500).json({ error: 'Failed to generate completion' });
    }
  });

  return httpServer;
}
