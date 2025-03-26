import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, getStorage, setStorage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { initializeFirebase, getFirebaseStorage } from "./firebase";
import { 
  createProjectFromPrompt, 
  addFeatureFromPrompt, 
  generateThinking, 
  generateCodeForGoal,
  setupProjectImprovement,
  isOpenAIConfigured
} from "./openai";
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
  
  // OpenAI integration
  app.post('/api/openai/setup', async (req, res) => {
    try {
      const apiKey = req.body.apiKey;
      
      // Set the OpenAI API key in the environment
      process.env.OPENAI_API_KEY = apiKey;
      
      // Verify that the key is configured
      if (isOpenAIConfigured()) {
        // Setup the autonomous project improvement cycle
        setupProjectImprovement(15); // Check every 15 minutes
        
        res.json({ 
          success: true, 
          message: "OpenAI integration successfully configured" 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          error: 'Invalid OpenAI API key' 
        });
      }
    } catch (error) {
      console.error('Error setting up OpenAI:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to setup OpenAI integration',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // AI Project Generation
  app.post('/api/ai/generate-project', async (req, res) => {
    try {
      if (!isOpenAIConfigured()) {
        return res.status(400).json({ 
          success: false, 
          error: 'OpenAI API key not configured. Please configure it in Settings first.' 
        });
      }
      
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ 
          success: false, 
          error: 'Project description is required' 
        });
      }
      
      // Broadcast thinking status to clients
      broadcast(wss, { 
        type: 'thinking', 
        message: 'Generating project structure from your description. This may take a minute...' 
      });
      
      // Generate and create the project
      const project = await createProjectFromPrompt(prompt);
      
      // Broadcast the new project to all clients
      broadcast(wss, { 
        type: 'new-project', 
        data: project 
      });
      
      res.json({ 
        success: true, 
        message: 'Project generated successfully', 
        project 
      });
    } catch (error) {
      console.error('Error generating project with AI:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to generate project', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  
  // AI Feature Generation
  app.post('/api/projects/:projectId/generate-feature', async (req, res) => {
    try {
      if (!isOpenAIConfigured()) {
        return res.status(400).json({ 
          success: false, 
          error: 'OpenAI API key not configured. Please configure it in Settings first.' 
        });
      }
      
      const projectId = parseInt(req.params.projectId);
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ 
          success: false, 
          error: 'Feature description is required' 
        });
      }
      
      // Check if project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ 
          success: false, 
          error: 'Project not found' 
        });
      }
      
      // Broadcast thinking status to clients
      broadcast(wss, { 
        type: 'thinking', 
        projectId,
        message: 'Generating feature from your description. This may take a minute...' 
      });
      
      // Generate and create the feature
      const feature = await addFeatureFromPrompt(projectId, prompt);
      
      // Broadcast the new feature to all clients
      broadcast(wss, { 
        type: 'new-feature', 
        projectId: feature.projectId,
        data: feature 
      });
      
      res.json({ 
        success: true, 
        message: 'Feature generated successfully', 
        feature 
      });
    } catch (error) {
      console.error('Error generating feature with AI:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to generate feature', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  
  // AI Code Generation for Goal
  app.post('/api/goals/:goalId/generate-code', async (req, res) => {
    try {
      if (!isOpenAIConfigured()) {
        return res.status(400).json({ 
          success: false, 
          error: 'OpenAI API key not configured. Please configure it in Settings first.' 
        });
      }
      
      const goalId = parseInt(req.params.goalId);
      
      // Get the goal and its related entities
      const goal = await storage.getGoal(goalId);
      if (!goal) {
        return res.status(404).json({ 
          success: false, 
          error: 'Goal not found' 
        });
      }
      
      const milestone = await storage.getMilestone(goal.milestoneId);
      if (!milestone) {
        return res.status(404).json({ 
          success: false, 
          error: 'Milestone not found' 
        });
      }
      
      const feature = await storage.getFeature(milestone.featureId);
      if (!feature) {
        return res.status(404).json({ 
          success: false, 
          error: 'Feature not found' 
        });
      }
      
      // Broadcast thinking status to clients
      broadcast(wss, { 
        type: 'thinking', 
        projectId: feature.projectId,
        message: `Generating code for goal: ${goal.name}. This may take a minute...` 
      });
      
      // Generate code for the goal
      const codeResult = await generateCodeForGoal(
        feature.projectId,
        feature.id,
        milestone.id,
        goal.id
      );
      
      // Log the activity
      const activityLog = await storage.createActivityLog({
        projectId: feature.projectId,
        featureId: feature.id,
        milestoneId: milestone.id,
        message: `Generated code for goal: ${goal.name}`,
        timestamp: new Date(),
        agentId: 'ai-agent',
        codeSnippet: codeResult.code,
        activityType: 'code_generation',
        details: { 
          language: codeResult.language,
          goalId: goal.id
        },
        isCheckpoint: false,
        thinkingProcess: codeResult.explanation
      });
      
      // Update the goal as completed
      await storage.updateGoal(goal.id, {
        progress: 100,
        completed: true
      });
      
      // Broadcast the activity to all clients
      broadcast(wss, { 
        type: 'new-activity', 
        projectId: feature.projectId,
        data: activityLog 
      });
      
      // Broadcast the updated goal to all clients
      const updatedGoal = await storage.getGoal(goal.id);
      broadcast(wss, { 
        type: 'update-goal', 
        id: goal.id,
        data: updatedGoal 
      });
      
      res.json({ 
        success: true, 
        message: 'Code generated successfully', 
        explanation: codeResult.explanation,
        code: codeResult.code,
        language: codeResult.language
      });
    } catch (error) {
      console.error('Error generating code with AI:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to generate code', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  
  // AI Thinking/Analysis
  app.post('/api/projects/:projectId/thinking', async (req, res) => {
    try {
      if (!isOpenAIConfigured()) {
        return res.status(400).json({ 
          success: false, 
          error: 'OpenAI API key not configured. Please configure it in Settings first.' 
        });
      }
      
      const projectId = parseInt(req.params.projectId);
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ 
          success: false, 
          error: 'Thinking prompt is required' 
        });
      }
      
      // Check if project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ 
          success: false, 
          error: 'Project not found' 
        });
      }
      
      // Broadcast thinking status to clients
      broadcast(wss, { 
        type: 'thinking', 
        projectId,
        message: 'Thinking about your request. This may take a minute...' 
      });
      
      // Generate thinking about the project
      const thinking = await generateThinking(projectId, prompt);
      
      // Log the activity
      const activityLog = await storage.createActivityLog({
        projectId,
        message: `Analysis: ${prompt}`,
        timestamp: new Date(),
        agentId: 'ai-agent',
        codeSnippet: null,
        activityType: 'project_analysis',
        details: { prompt },
        isCheckpoint: true,
        thinkingProcess: thinking
      });
      
      // Broadcast the activity to all clients
      broadcast(wss, { 
        type: 'new-activity', 
        projectId,
        data: activityLog 
      });
      
      res.json({ 
        success: true, 
        message: 'Analysis generated successfully', 
        thinking 
      });
    } catch (error) {
      console.error('Error generating thinking with AI:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to generate analysis', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  
  // Firebase integration
  app.post('/api/firebase/setup', async (req, res) => {
    try {
      const config = req.body.config;
      
      if (!config || !config.projectId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Firebase configuration is missing required fields' 
        });
      }
      
      // For Firebase Admin SDK, we need a service account
      const serviceAccount = {
        projectId: config.projectId,
        clientEmail: config.clientEmail,
        privateKey: config.privateKey
      };
      
      // Initialize Firebase Admin SDK
      if (serviceAccount.clientEmail && serviceAccount.privateKey) {
        const initialized = initializeFirebase(serviceAccount);
        
        if (initialized) {
          // Switch to Firebase storage implementation
          const firebaseStorage = getFirebaseStorage();
          setStorage(firebaseStorage);
          
          return res.json({ 
            success: true, 
            message: "Firebase integration successfully configured with cloud persistence" 
          });
        }
      }
      
      // If we don't have a service account but do have project config,
      // still acknowledge success but note we're using in-memory storage
      return res.json({ 
        success: true, 
        message: "Firebase client configured successfully, using in-memory storage (no server persistence)",
        warning: "For full cloud persistence, please provide Firebase service account credentials"
      });
    } catch (error) {
      console.error('Error setting up Firebase:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to setup Firebase integration',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // AI Chat Assistant API
  app.post('/api/chat', handleChatMessage);
  
  // Project Export API
  app.post('/api/projects/:id/export', async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { includeData, includeFirebaseConfig, includeOpenAIKey } = req.body;
      
      // Get project data
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      // For MVP, create a simple JSON response that would be a ZIP file in production
      const exportData: Record<string, any> = {
        project,
        exportDate: new Date().toISOString(),
        version: '1.0.0',
      };
      
      // Export features, milestones, and goals if included
      if (includeData) {
        const features = await storage.getFeaturesByProject(projectId);
        exportData['features'] = features;
        
        // Get milestones and goals for each feature
        const milestones = [];
        const goals = [];
        
        for (const feature of features) {
          const featureMilestones = await storage.getMilestonesByFeature(feature.id);
          milestones.push(...featureMilestones);
          
          for (const milestone of featureMilestones) {
            const milestoneGoals = await storage.getGoalsByMilestone(milestone.id);
            goals.push(...milestoneGoals);
          }
        }
        
        exportData['milestones'] = milestones;
        exportData['goals'] = goals;
        
        // Get activity logs
        const logs = await storage.getActivityLogsByProject(projectId);
        exportData['activityLogs'] = logs;
      }
      
      // Include configuration if requested
      if (includeFirebaseConfig) {
        exportData['firebaseConfig'] = {
          // In a real implementation, fetch from secure storage
          // This is just a placeholder
          apiKey: "PLACEHOLDER_FIREBASE_API_KEY",
          projectId: "PLACEHOLDER_PROJECT_ID",
          appId: "PLACEHOLDER_APP_ID"
        };
      }
      
      if (includeOpenAIKey) {
        exportData['openAIConfig'] = {
          // In a real implementation, fetch from secure storage
          // This is just a placeholder
          apiKey: "PLACEHOLDER_OPENAI_API_KEY"
        };
      }
      
      // In a real implementation, we would:
      // 1. Generate all needed project files
      // 2. Include deployment scripts for Google VM
      // 3. Create a ZIP file with all content
      // 4. Return the ZIP file as a download
      
      // For MVP, return a JSON response
      res.setHeader('Content-Disposition', `attachment; filename="titan-project-${projectId}.json"`);
      res.setHeader('Content-Type', 'application/json');
      res.json(exportData);
      
    } catch (error) {
      console.error('Error exporting project:', error);
      res.status(500).json({ error: 'Failed to export project' });
    }
  });

  return httpServer;
}
