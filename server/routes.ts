import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, getStorage, setStorage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { initializeFirebase, initializeFirebaseFromEnv, getFirebaseStorage } from "./firebase";
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
  insertActivityLogSchema,
  insertWebAccountSchema,
  insertPersonaSchema,
  insertChatMessageSchema,
  insertContentItemSchema,
  insertBehaviorUpdateSchema,
  Persona,
  ChatMessage,
  ContentItem,
  BehaviorUpdate
} from "@shared/schema";
import { handleChatMessage, setWebSocketServer } from "./chatHandler";
import { initializeWebAutomation, getWebAutomationService } from "./webAutomation";
import { initializeFindomAgents, getFindomAgent } from "./findomAgent";
import { getBrowserClient } from "./browserClient";
import { exportDatabase } from "./export-db";

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
  
  // We're now using LowDB as the default storage implementation
  // The storage implementation is already set to LowDB in storage.ts
  console.log('Using LowDB storage for data persistence');
  
  // For backward compatibility, still attempt to initialize Firebase
  // but don't change the storage implementation
  try {
    let firebaseInitialized = initializeFirebaseFromEnv();
    if (firebaseInitialized) {
      console.log('Firebase also initialized successfully (but not used as primary storage)');
    }
  } catch (error) {
    console.log(`Firebase initialization failed with error: ${error}. This is expected and won't affect functionality.`);
  }
  
  // We'll check if we need to initialize sample data
  const storage = getStorage();
  const projects = await storage.getAllProjects();
  
  if (projects.length === 0) {
    console.log('No projects found, initializing sample data...');
    
    // Create sample projects
    const project1 = await storage.createProject({
      name: "E-Commerce Website",
      description: "Build a full-featured e-commerce website with product catalog, cart, and checkout",
      isWorking: true,
      progress: 45,
      lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      projectType: "generic",
      agentConfig: {},
      autoMode: false,
      checkpoints: {},
      priority: 0
    });
    
    const project2 = await storage.createProject({
      name: "Mobile App",
      description: "Develop a cross-platform mobile application",
      isWorking: false,
      progress: 70,
      lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      projectType: "generic",
      agentConfig: {},
      autoMode: false,
      checkpoints: {},
      priority: 0
    });
    
    const project3 = await storage.createProject({
      name: "Content Management System",
      description: "Create a CMS for managing digital content",
      isWorking: true,
      progress: 20,
      lastUpdated: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      projectType: "generic",
      agentConfig: {},
      autoMode: false,
      checkpoints: {},
      priority: 0
    });
    
    console.log('Sample projects created:', project1.id, project2.id, project3.id);
    
    // Sample features for first project
    const feature1 = await storage.createFeature({
      projectId: project1.id,
      name: "User Authentication System",
      description: "Implement secure login and registration",
      progress: 25
    });
    
    const feature2 = await storage.createFeature({
      projectId: project1.id,
      name: "Product Catalog",
      description: "Product listings with search and filter",
      progress: 90
    });
    
    const feature3 = await storage.createFeature({
      projectId: project1.id,
      name: "Shopping Cart",
      description: "Add/remove items and checkout process",
      progress: 15
    });
    
    console.log("Created features for project", project1.id, ":", feature1.id, feature2.id, feature3.id);
    
    // Sample milestones for first feature
    const milestone1 = await storage.createMilestone({
      featureId: feature1.id,
      name: "Setup user database schema",
      description: "Define user model with required fields",
      estimatedHours: 8
    });
    
    console.log("Created milestone for feature", feature1.id, ":", milestone1.id);
    
    // Sample goals for first milestone
    const goal1 = await storage.createGoal({
      milestoneId: milestone1.id,
      name: "Define user model with required fields",
      progress: 100
    });
    
    console.log("Created goal for milestone", milestone1.id, ":", goal1.id);
  } else {
    console.log(`Found ${projects.length} existing projects, skipping sample data initialization.`);
  }
  
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
  
  app.delete('/api/projects/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProject(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Project not found or could not be deleted' });
      }
      
      // Broadcast to all clients
      broadcast(wss, { type: 'delete-project', data: { id } });
      
      // Log the deletion
      console.log(`Project ${id} deleted successfully`);
      
      res.json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({ error: 'Failed to delete project' });
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
      // Get features from all projects
      const projects = await storage.getAllProjects();
      const allFeatures = [];
      
      // Collect features from each project
      for (const project of projects) {
        const features = await storage.getFeaturesByProject(project.id);
        allFeatures.push(...features);
      }
      
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
  
  // Web Accounts
  app.get('/api/web-accounts', async (req, res) => {
    try {
      const accounts = await storage.getWebAccountsByProject(3); // Default to FINDOM project ID 3
      res.json(accounts);
    } catch (error) {
      console.error('Error fetching web accounts:', error);
      res.status(500).json({ error: 'Failed to fetch web accounts' });
    }
  });
  
  app.post('/api/web-accounts', async (req, res) => {
    try {
      const result = insertWebAccountSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error.format() });
      }
      
      const account = await storage.createWebAccount(result.data);
      
      // Create an activity log
      await storage.createActivityLog({
        projectId: account.projectId,
        message: `Added new ${account.service} account: ${account.accountName}`,
        timestamp: new Date(),
        agentId: 'findom-agent',
        activityType: 'system'
      });
      
      // Broadcast to all clients
      broadcast(wss, { 
        type: 'new-web-account', 
        projectId: account.projectId,
        data: account 
      });
      
      res.status(201).json(account);
    } catch (error) {
      console.error('Error creating web account:', error);
      res.status(500).json({ error: 'Failed to create web account' });
    }
  });
  
  app.get('/api/web-accounts/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const account = await storage.getWebAccount(id);
      
      if (!account) {
        return res.status(404).json({ error: 'Web account not found' });
      }
      
      res.json(account);
    } catch (error) {
      console.error('Error fetching web account:', error);
      res.status(500).json({ error: 'Failed to fetch web account' });
    }
  });
  
  app.delete('/api/web-accounts/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const account = await storage.getWebAccount(id);
      
      if (!account) {
        return res.status(404).json({ error: 'Web account not found' });
      }
      
      const success = await storage.deleteWebAccount(id);
      
      if (success) {
        // Create an activity log
        await storage.createActivityLog({
          projectId: account.projectId,
          message: `Removed ${account.service} account: ${account.accountName}`,
          timestamp: new Date(),
          agentId: 'findom-agent',
          activityType: 'system'
        });
        
        // Broadcast to all clients
        broadcast(wss, { 
          type: 'delete-web-account', 
          projectId: account.projectId,
          data: { id }
        });
        
        res.json({ success: true });
      } else {
        res.status(500).json({ error: 'Failed to delete web account' });
      }
    } catch (error) {
      console.error('Error deleting web account:', error);
      res.status(500).json({ error: 'Failed to delete web account' });
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
      
      const { prompt, name } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ 
          success: false, 
          error: 'Project description is required' 
        });
      }
      
      // Broadcast thinking status to clients
      broadcast(wss, { 
        type: 'thinking', 
        message: 'Generating comprehensive project structure with 30+ features from your description. This may take a minute...' 
      });
      
      console.log(`Starting autonomous project generation for prompt: "${prompt.substring(0, 100)}..."`);
      
      // Generate and create the project, passing optional name
      const project = await createProjectFromPrompt(prompt, name);
      
      // Set the project to working state immediately and ensure autoMode is enabled
      await storage.updateProject(project.id, {
        isWorking: true,
        autoMode: true,
        agentConfig: {
          model: "gpt-4o",
          maxTokens: 4000,
          temperature: 0.8
        }
      });
      
      // Fetch the updated project for broadcasting
      const updatedProject = await storage.getProject(project.id);
      
      // Log the autonomous project creation
      await storage.createActivityLog({
        projectId: project.id,
        message: `Project ${project.name} created and set to autonomous improvement mode`,
        timestamp: new Date(),
        agentId: 'system',
        activityType: 'project_autonomous_start',
        isCheckpoint: true
      });
      
      console.log(`Project ${project.name} (ID: ${project.id}) created and set to autonomous improvement mode`);
      
      // Broadcast the new project to all clients
      broadcast(wss, { 
        type: 'new-project', 
        data: updatedProject 
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
      
      // Set the feature to working state immediately
      await storage.updateFeature(feature.id, {
        isWorking: true,
        status: 'in-progress'
      });
      
      // Fetch the updated feature for broadcasting
      const updatedFeature = await storage.getFeature(feature.id);
      
      // Log the autonomous feature creation
      await storage.createActivityLog({
        projectId,
        featureId: feature.id,
        message: `Feature ${feature.name} created and set to active development`,
        timestamp: new Date(),
        agentId: 'system',
        activityType: 'feature_autonomous_start',
        isCheckpoint: true
      });
      
      console.log(`Feature ${feature.name} (ID: ${feature.id}) created and set to active development for project ${projectId}`);
      
      // Broadcast the new feature to all clients
      if (updatedFeature) {
        broadcast(wss, { 
          type: 'new-feature', 
          projectId: updatedFeature.projectId,
          data: updatedFeature 
        });
      } else {
        // If updatedFeature is undefined, fall back to the original feature
        broadcast(wss, { 
          type: 'new-feature', 
          projectId: feature.projectId,
          data: feature 
        });
      }
      
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
      
      // Save the Firebase config to environment variables for future use
      process.env.FIREBASE_PROJECT_ID = config.projectId;
      process.env.FIREBASE_API_KEY = config.apiKey;
      process.env.FIREBASE_APP_ID = config.appId;
      
      // For Firebase Admin SDK, we need a service account or app default credentials
      const serviceAccount = {
        projectId: config.projectId,
        clientEmail: config.clientEmail,
        privateKey: config.privateKey
      };
      
      // Initialize Firebase Admin SDK with service account if provided
      if (serviceAccount.clientEmail && serviceAccount.privateKey) {
        const initialized = initializeFirebase(serviceAccount);
        
        if (initialized) {
          // We're using LowDB as primary storage, but Firebase is initialized for compatibility
          // const firebaseStorage = getFirebaseStorage();
          // setStorage(firebaseStorage);
          
          return res.json({ 
            success: true, 
            message: "Firebase integration successfully configured but using LowDB for primary data persistence" 
          });
        }
      } 
      // Try to initialize with just the project ID (for environments with default credentials)
      else {
        const initialized = initializeFirebase({ projectId: config.projectId });
        
        if (initialized) {
          // We're using LowDB as primary storage, but Firebase is initialized for compatibility
          // const firebaseStorage = getFirebaseStorage();
          // setStorage(firebaseStorage);
          
          return res.json({ 
            success: true, 
            message: "Firebase integration successfully configured but using LowDB for primary data persistence" 
          });
        }
      }
      
      // If we can't initialize Firebase but do have project config for client,
      // still acknowledge success but note we're using LowDB
      return res.json({ 
        success: true, 
        message: "Firebase client configured successfully, using LowDB for data persistence",
        warning: "Firebase integration is optional and not required for system functionality"
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
  // Web Automation API Endpoints
  
  // Get all web accounts for a project
  app.get('/api/projects/:id/web-accounts', async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const webAccounts = await storage.getWebAccounts(projectId);
      res.json(webAccounts);
    } catch (error) {
      console.error('Error getting web accounts:', error);
      res.status(500).json({ error: 'Failed to get web accounts' });
    }
  });

  // Create a new web account for a project
  app.post('/api/projects/:id/web-accounts', async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const webAccountData = req.body;
      
      // Validate required fields
      if (!webAccountData.service || !webAccountData.accountName) {
        return res.status(400).json({ error: 'Service and account name are required' });
      }
      
      const accountType = webAccountData.accountType || 'social';
      const webAccount = await storage.createWebAccount({
        ...webAccountData,
        projectId,
        accountType,
        status: 'active',
        lastActivity: new Date(),
        createdAt: new Date()
      });
      
      res.status(201).json(webAccount);
    } catch (error) {
      console.error('Error creating web account:', error);
      res.status(500).json({ error: 'Failed to create web account' });
    }
  });

  // Update a web account
  app.put('/api/web-accounts/:id', async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const updateData = req.body;
      
      const updated = await storage.updateWebAccount(accountId, updateData);
      if (!updated) {
        return res.status(404).json({ error: 'Web account not found' });
      }
      
      res.json(updated);
    } catch (error) {
      console.error('Error updating web account:', error);
      res.status(500).json({ error: 'Failed to update web account' });
    }
  });

  // Delete a web account
  app.delete('/api/web-accounts/:id', async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const success = await storage.deleteWebAccount(accountId);
      
      if (!success) {
        return res.status(404).json({ error: 'Web account not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting web account:', error);
      res.status(500).json({ error: 'Failed to delete web account' });
    }
  });

  // Get automation status for a project
  app.get('/api/projects/:id/automation-status', async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      const automationService = getWebAutomationService(projectId);
      const accounts = await storage.getWebAccounts(projectId);
      
      res.json({
        projectId,
        autoMode: project.autoMode || false,
        accountsCount: accounts.length,
        lastAutomationRun: project.lastAutomationRun || null,
        isActive: accounts.length > 0 && (project.autoMode || false)
      });
    } catch (error) {
      console.error('Error getting automation status:', error);
      res.status(500).json({ error: 'Failed to get automation status' });
    }
  });

  // Toggle automation mode for a project
  app.post('/api/projects/:id/toggle-automation', async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { autoMode } = req.body;
      
      if (typeof autoMode !== 'boolean') {
        return res.status(400).json({ error: 'autoMode must be a boolean value' });
      }
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      const updatedProject = await storage.updateProject(projectId, { 
        autoMode,
        lastAutomationRun: autoMode ? new Date() : project.lastAutomationRun
      });
      
      // If turning on automation, ensure the service is running
      if (autoMode) {
        const automationService = getWebAutomationService(projectId);
        automationService.setupAutomationSchedule();
      }
      
      res.json({
        projectId,
        autoMode,
        message: autoMode ? 'Automation enabled' : 'Automation disabled'
      });
    } catch (error) {
      console.error('Error toggling automation:', error);
      res.status(500).json({ error: 'Failed to toggle automation' });
    }
  });

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
  
  // Database Export - Export the full database for VM deployment
  app.get('/api/database/export', async (req, res) => {
    try {
      console.log("Starting database export operation...");
      const result = await exportDatabase();
      
      if (!result || !result.success) {
        const errorMessage = result?.error || 'Unknown error during database export';
        console.error(`Database export failed: ${errorMessage}`);
        return res.status(500).json({ 
          success: false, 
          error: errorMessage 
        });
      }
      
      console.log(`Database successfully exported to ${result.path}`);
      res.json({ 
        success: true, 
        message: 'Database exported successfully',
        exportPath: result.path
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error during database export:', errorMessage);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to export database', 
        details: errorMessage
      });
    }
  });

  // Persona Management API Routes
  app.get('/api/personas', async (req, res) => {
    try {
      // If projectId is provided, get personas for that project
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      
      let personas: Persona[] = [];
      if (projectId) {
        personas = await storage.getPersonasByProject(projectId);
      } else {
        // Get all personas from all projects
        const projects = await storage.getAllProjects();
        for (const project of projects) {
          const projectPersonas = await storage.getPersonasByProject(project.id);
          personas.push(...projectPersonas);
        }
      }
      
      res.json(personas);
    } catch (error) {
      console.error('Error fetching personas:', error);
      res.status(500).json({ error: 'Failed to fetch personas' });
    }
  });

  app.get('/api/personas/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const persona = await storage.getPersona(id);
      
      if (!persona) {
        return res.status(404).json({ error: 'Persona not found' });
      }
      
      res.json(persona);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch persona' });
    }
  });

  app.post('/api/personas', async (req, res) => {
    try {
      const result = insertPersonaSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error.format() });
      }
      
      // Create the persona
      const persona = await storage.createPersona(result.data);
      
      // Broadcast to all clients
      broadcast(wss, { type: 'new-persona', data: persona });
      
      res.status(201).json(persona);
    } catch (error) {
      console.error('Error creating persona:', error);
      res.status(500).json({ error: 'Failed to create persona' });
    }
  });

  app.patch('/api/personas/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const updateSchema = insertPersonaSchema.partial();
      const result = updateSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error.format() });
      }
      
      const persona = await storage.updatePersona(id, result.data);
      
      if (!persona) {
        return res.status(404).json({ error: 'Persona not found' });
      }
      
      // Broadcast to all clients
      broadcast(wss, { type: 'update-persona', data: persona });
      
      res.json(persona);
    } catch (error) {
      console.error('Error updating persona:', error);
      res.status(500).json({ error: 'Failed to update persona' });
    }
  });

  app.delete('/api/personas/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const success = await storage.deletePersona(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Persona not found or could not be deleted' });
      }
      
      // Broadcast to all clients
      broadcast(wss, { type: 'delete-persona', data: { id } });
      
      res.json({ success: true, message: 'Persona deleted successfully' });
    } catch (error) {
      console.error('Error deleting persona:', error);
      res.status(500).json({ error: 'Failed to delete persona' });
    }
  });

  app.post('/api/personas/:id/toggle-active', async (req, res) => {
    try {
      const id = req.params.id;
      const { isActive } = req.body;
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ error: 'isActive must be a boolean value' });
      }
      
      const persona = await storage.togglePersonaActive(id, isActive);
      
      if (!persona) {
        return res.status(404).json({ error: 'Persona not found' });
      }
      
      // Broadcast to all clients
      broadcast(wss, { type: 'update-persona', data: persona });
      
      res.json(persona);
    } catch (error) {
      console.error('Error toggling persona active state:', error);
      res.status(500).json({ error: 'Failed to toggle persona active state' });
    }
  });

  // Chat Message API Routes
  app.get('/api/personas/:personaId/messages', async (req, res) => {
    try {
      const personaId = req.params.personaId;
      const messages = await storage.getChatMessagesByPersona(personaId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  app.post('/api/chat-messages', async (req, res) => {
    try {
      const result = insertChatMessageSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error.format() });
      }
      
      const message = await storage.createChatMessage(result.data);
      
      // Broadcast to all clients
      broadcast(wss, { 
        type: 'new-message', 
        personaId: message.personaId,
        data: message 
      });
      
      res.status(201).json(message);
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(500).json({ error: 'Failed to create message' });
    }
  });

  // Content Item API Routes
  app.get('/api/personas/:personaId/content', async (req, res) => {
    try {
      const personaId = req.params.personaId;
      const contentItems = await storage.getContentItemsByPersona(personaId);
      res.json(contentItems);
    } catch (error) {
      console.error('Error fetching content items:', error);
      res.status(500).json({ error: 'Failed to fetch content items' });
    }
  });

  app.post('/api/content-items', async (req, res) => {
    try {
      const result = insertContentItemSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error.format() });
      }
      
      const contentItem = await storage.createContentItem(result.data);
      
      // Broadcast to all clients
      broadcast(wss, { 
        type: 'new-content', 
        personaId: contentItem.personaId,
        data: contentItem 
      });
      
      res.status(201).json(contentItem);
    } catch (error) {
      console.error('Error creating content item:', error);
      res.status(500).json({ error: 'Failed to create content item' });
    }
  });

  app.patch('/api/content-items/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const updateSchema = insertContentItemSchema.partial();
      const result = updateSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error.format() });
      }
      
      const contentItem = await storage.updateContentItem(id, result.data);
      
      if (!contentItem) {
        return res.status(404).json({ error: 'Content item not found' });
      }
      
      // Broadcast to all clients
      broadcast(wss, { 
        type: 'update-content', 
        id: contentItem.id,
        data: contentItem 
      });
      
      res.json(contentItem);
    } catch (error) {
      console.error('Error updating content item:', error);
      res.status(500).json({ error: 'Failed to update content item' });
    }
  });

  // Behavior Update API Routes
  app.get('/api/personas/:personaId/behavior-updates', async (req, res) => {
    try {
      const personaId = req.params.personaId;
      const behaviorUpdates = await storage.getBehaviorUpdatesByPersona(personaId);
      res.json(behaviorUpdates);
    } catch (error) {
      console.error('Error fetching behavior updates:', error);
      res.status(500).json({ error: 'Failed to fetch behavior updates' });
    }
  });

  app.post('/api/behavior-updates', async (req, res) => {
    try {
      const result = insertBehaviorUpdateSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error.format() });
      }
      
      const behaviorUpdate = await storage.createBehaviorUpdate(result.data);
      
      // Broadcast to all clients
      broadcast(wss, { 
        type: 'new-behavior-update', 
        personaId: behaviorUpdate.personaId,
        data: behaviorUpdate 
      });
      
      res.status(201).json(behaviorUpdate);
    } catch (error) {
      console.error('Error creating behavior update:', error);
      res.status(500).json({ error: 'Failed to create behavior update' });
    }
  });

  app.post('/api/behavior-updates/:id/apply', async (req, res) => {
    try {
      const id = req.params.id;
      const behaviorUpdate = await storage.applyBehaviorUpdate(id);
      
      if (!behaviorUpdate) {
        return res.status(404).json({ error: 'Behavior update not found or already applied' });
      }
      
      // Get the updated persona
      const persona = await storage.getPersona(behaviorUpdate.personaId);
      
      // Broadcast updates to all clients
      broadcast(wss, { 
        type: 'apply-behavior-update', 
        id: behaviorUpdate.id,
        data: behaviorUpdate 
      });
      
      if (persona) {
        broadcast(wss, { 
          type: 'update-persona', 
          id: persona.id,
          data: persona 
        });
      }
      
      res.json(behaviorUpdate);
    } catch (error) {
      console.error('Error applying behavior update:', error);
      res.status(500).json({ error: 'Failed to apply behavior update' });
    }
  });

  // Start the automatic project improvement cycle if OpenAI is configured
  if (isOpenAIConfigured()) {
    console.log("OpenAI is configured, starting autonomous project improvement cycle...");
    setupProjectImprovement(5); // Check every 5 minutes for autonomous improvement
    
    // Initialize 24/7 autonomous web automation for FINDOM projects
    setTimeout(async () => {
      try {
        console.log("Initializing 24/7 autonomous web automation for FINDOM projects...");
        await initializeWebAutomation();
        console.log("FINDOM web automation initialized successfully");
        
        // Initialize FINDOM agents after web automation is ready
        try {
          console.log("Starting 24/7 autonomous FINDOM agents...");
          await initializeFindomAgents();
          console.log("FINDOM agents initialized successfully");
        } catch (agentError) {
          console.error("Error initializing FINDOM agents:", agentError);
        }
      } catch (error) {
        console.error("Error initializing web automation:", error);
      }
    }, 10000); // Wait 10 seconds after startup to ensure everything is initialized
  } else {
    console.log("OpenAI API key not configured. Autonomous project improvement is disabled.");
    console.log("Please configure the OpenAI API key in Settings to enable autonomous coding.");
  }

  return httpServer;
}
