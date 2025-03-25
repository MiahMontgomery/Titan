import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { 
  insertProjectSchema, 
  insertFeatureSchema, 
  insertMilestoneSchema, 
  insertGoalSchema,
  insertActivityLogSchema 
} from "@shared/schema";
import { handleChatMessage, setWebSocketServer } from "./chatHandler";

// Helper to broadcast to all clients
function broadcast(wss: WebSocketServer, data: any) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Pass WebSocket server to chat handler
  setWebSocketServer(wss);
  
  // WebSocket connection handler
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    // Send the current projects to the new client
    storage.getAllProjects().then(projects => {
      ws.send(JSON.stringify({ type: 'projects', data: projects }));
    });
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        } else if (data.type === 'chat-message') {
          console.log('Received chat message via WebSocket:', data.message);
          
          // Process the message using our chat handler
          const projectId = data.projectId || 1; // Default to project 1 if not specified
          
          try {
            // Parse projectId to number if it's a string
            const projectIdNum = typeof projectId === 'string' ? parseInt(projectId as string, 10) : projectId;
            
            // Call the API endpoint directly with the message data
            const mockReq = { body: { message: data.message, projectId: projectIdNum } };
            let responseData: any = null;
            
            const mockRes = {
              json: (data: any) => {
                responseData = data;
                return mockRes;
              },
              status: () => mockRes
            };
            
            // Call the handler and wait for it to complete
            await handleChatMessage(mockReq as any, mockRes as any);
            
            // Send the response back to the client
            if (ws.readyState === WebSocket.OPEN && responseData) {
              ws.send(JSON.stringify({
                type: 'chat-response',
                message: responseData.response,
                codeSnippet: responseData.codeSnippet
              }));
            } else {
              // Fallback response if something went wrong
              ws.send(JSON.stringify({
                type: 'chat-response',
                message: "I've processed your request. Would you like me to explain anything further?",
                codeSnippet: null
              }));
            }
          } catch (chatError) {
            console.error('Error processing chat message:', chatError);
            // Send error response
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'chat-response',
                message: "Sorry, I encountered an error processing your request. Please try again.",
                codeSnippet: null,
                error: true
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });
  
  // Simulate periodic activity for active projects
  setInterval(async () => {
    try {
      const projects = await storage.getAllProjects();
      for (const project of projects) {
        if (project.isWorking) {
          // Add a new activity log
          const timestamp = new Date();
          const log = {
            projectId: project.id,
            message: `Auto-generated activity at ${timestamp.toLocaleTimeString()}`,
            timestamp,
            agentId: `agent-${Math.floor(Math.random() * 3) + 1}`,
            codeSnippet: null
          };
          
          await storage.createActivityLog(log);
          
          // Broadcast the activity to all clients
          broadcast(wss, { 
            type: 'activity', 
            projectId: project.id,
            data: log 
          });
        }
      }
    } catch (error) {
      console.error('Error in activity simulation:', error);
    }
  }, 60000); // Every minute
  
  // API Routes
  
  // Projects
  app.get('/api/projects', async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  });
  
  app.get('/api/projects/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch project' });
    }
  });
  
  app.post('/api/projects', async (req, res) => {
    try {
      const result = insertProjectSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error.format() });
      }
      
      const project = await storage.createProject(result.data);
      
      // Broadcast to all clients
      broadcast(wss, { type: 'new-project', data: project });
      
      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create project' });
    }
  });
  
  app.patch('/api/projects/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateSchema = insertProjectSchema.partial();
      const result = updateSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error.format() });
      }
      
      const project = await storage.updateProject(id, result.data);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      // Broadcast to all clients
      broadcast(wss, { type: 'update-project', data: project });
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update project' });
    }
  });
  
  // Features
  app.get('/api/projects/:projectId/features', async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const features = await storage.getFeaturesByProject(projectId);
      res.json(features);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch features' });
    }
  });
  
  // Diagnostic endpoint to list all features
  app.get('/api/features/all', async (req, res) => {
    try {
      // Get all features from the storage
      const allFeatures = Array.from(storage['features'].values());
      res.json(allFeatures);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch all features' });
    }
  });
  
  app.post('/api/features', async (req, res) => {
    try {
      const result = insertFeatureSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error.format() });
      }
      
      const feature = await storage.createFeature(result.data);
      
      // Broadcast to all clients
      broadcast(wss, { 
        type: 'new-feature', 
        projectId: feature.projectId,
        data: feature 
      });
      
      res.status(201).json(feature);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create feature' });
    }
  });
  
  // Milestones
  app.get('/api/features/:featureId/milestones', async (req, res) => {
    try {
      const featureId = parseInt(req.params.featureId);
      const milestones = await storage.getMilestonesByFeature(featureId);
      res.json(milestones);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch milestones' });
    }
  });
  
  app.post('/api/milestones', async (req, res) => {
    try {
      const result = insertMilestoneSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error.format() });
      }
      
      const milestone = await storage.createMilestone(result.data);
      
      // Broadcast to all clients
      broadcast(wss, { 
        type: 'new-milestone', 
        featureId: milestone.featureId,
        data: milestone 
      });
      
      res.status(201).json(milestone);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create milestone' });
    }
  });
  
  app.patch('/api/milestones/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateSchema = insertMilestoneSchema.partial();
      const result = updateSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error.format() });
      }
      
      const milestone = await storage.updateMilestone(id, result.data);
      
      if (!milestone) {
        return res.status(404).json({ error: 'Milestone not found' });
      }
      
      // Broadcast to all clients
      broadcast(wss, { 
        type: 'update-milestone', 
        id: milestone.id,
        data: milestone 
      });
      
      res.json(milestone);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update milestone' });
    }
  });
  
  // Goals
  app.get('/api/milestones/:milestoneId/goals', async (req, res) => {
    try {
      const milestoneId = parseInt(req.params.milestoneId);
      const goals = await storage.getGoalsByMilestone(milestoneId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch goals' });
    }
  });
  
  app.post('/api/goals', async (req, res) => {
    try {
      const result = insertGoalSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error.format() });
      }
      
      const goal = await storage.createGoal(result.data);
      
      // Broadcast to all clients
      broadcast(wss, { 
        type: 'new-goal', 
        milestoneId: goal.milestoneId,
        data: goal 
      });
      
      res.status(201).json(goal);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create goal' });
    }
  });
  
  app.patch('/api/goals/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateSchema = insertGoalSchema.partial();
      const result = updateSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error.format() });
      }
      
      const goal = await storage.updateGoal(id, result.data);
      
      if (!goal) {
        return res.status(404).json({ error: 'Goal not found' });
      }
      
      // Broadcast to all clients
      broadcast(wss, { 
        type: 'update-goal', 
        id: goal.id,
        data: goal 
      });
      
      res.json(goal);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update goal' });
    }
  });
  
  // Activity Logs
  app.get('/api/projects/:projectId/activity', async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const logs = await storage.getActivityLogsByProject(projectId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
  });
  
  app.post('/api/activity', async (req, res) => {
    try {
      const result = insertActivityLogSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error.format() });
      }
      
      const log = await storage.createActivityLog(result.data);
      
      // Broadcast to all clients
      broadcast(wss, { 
        type: 'new-activity', 
        projectId: log.projectId,
        data: log 
      });
      
      res.status(201).json(log);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create activity log' });
    }
  });
  
  // Stubs for external integrations
  
  // Telegram integration stub
  app.post('/api/telegram/setup', async (req, res) => {
    try {
      const telegramToken = req.body.token;
      // This would store the Telegram bot token and setup the connection
      // For now, just return success
      res.json({ success: true, message: "Telegram integration ready for connection" });
    } catch (error) {
      res.status(500).json({ error: 'Failed to setup Telegram integration' });
    }
  });
  
  // OpenAI integration stub
  app.post('/api/openai/setup', async (req, res) => {
    try {
      const apiKey = req.body.apiKey;
      // This would setup the OpenAI API connection
      // For now, just return success
      res.json({ success: true, message: "OpenAI integration ready for connection" });
    } catch (error) {
      res.status(500).json({ error: 'Failed to setup OpenAI integration' });
    }
  });
  
  // Firebase integration stub
  app.post('/api/firebase/setup', async (req, res) => {
    try {
      const config = req.body.config;
      // This would setup the Firebase integration
      // For now, just return success
      res.json({ success: true, message: "Firebase integration ready for connection" });
    } catch (error) {
      res.status(500).json({ error: 'Failed to setup Firebase integration' });
    }
  });
  
  // AI Chat Assistant API
  app.post('/api/chat', handleChatMessage);

  return httpServer;
}
