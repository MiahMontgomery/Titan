/**
 * FINDOM Autonomous Agent
 * 
 * This module implements the main agent logic for the FINDOM project,
 * managing the autonomous operation of the financial domination platform.
 * It integrates web automation, AI-driven content creation, and client
 * interaction into a cohesive 24/7 autonomous system.
 */

import OpenAI from 'openai';
import { storage } from './storage';
import { getWebAutomationService } from './webAutomation';
import { broadcastThinking } from './chatHandler';
import { WebAccount } from '@shared/schema';

// Helper function to create activity logs
async function createActivityLog(log: { 
  projectId: number; 
  message: string; 
  agentId?: string;
  activityType?: string;
}): Promise<void> {
  try {
    await storage.createActivityLog({
      ...log,
      timestamp: new Date(),
      agentId: log.agentId || 'findom-agent',
      activityType: log.activityType || 'system'
    });
  } catch (error) {
    console.error('Error creating activity log:', error);
  }
}

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Types and interfaces
interface FindomAgentConfig {
  autoMode: boolean;
  checkInterval: number; // minutes
  aiPersona: string;
  contentTypes: string[];
  targetPlatforms: string[];
  responseStyle: string;
  workingHours: {
    start: number; // 0-23
    end: number; // 0-23
  };
}

interface ClientInteraction {
  clientId: string;
  platform: string;
  lastInteraction: Date;
  interactionCount: number;
  lastMessage: string;
  status: 'active' | 'inactive' | 'converted';
  notes: string;
}

interface ContentItem {
  id: string;
  title: string;
  text: string;
  platform: string;
  created: Date;
  published: boolean;
  publishedDate?: Date;
  engagementMetrics?: {
    views: number;
    likes: number;
    comments: number;
    conversions: number;
  };
}

/**
 * FINDOM Agent class
 * Manages the autonomous operation of the FINDOM platform
 */
export class FindomAgent {
  private projectId: number;
  private config: FindomAgentConfig;
  private isRunning: boolean = false;
  private clientInteractions: Map<string, ClientInteraction> = new Map();
  private contentLibrary: ContentItem[] = [];
  private lastStatusUpdate: Date = new Date();
  
  constructor(projectId: number) {
    this.projectId = projectId;
    this.config = {
      autoMode: false,
      checkInterval: 15,
      aiPersona: 'professional and confident financial domination expert',
      contentTypes: ['text', 'image'],
      targetPlatforms: ['onlyfans'],
      responseStyle: 'engaging and authoritative',
      workingHours: {
        start: 0, // 24/7 operation
        end: 23
      }
    };
    
    this.logThinking('FINDOM Agent initialized');
  }
  
  /**
   * Load configuration from storage
   */
  async loadConfig(): Promise<void> {
    try {
      const project = await storage.getProject(this.projectId);
      if (!project) {
        throw new Error(`Project ID ${this.projectId} not found`);
      }
      
      // If project has agent config, use it
      if (project.agentConfig) {
        const agentConfig = project.agentConfig as any;
        if (agentConfig.findomAgent) {
          this.logThinking('Loaded FINDOM agent configuration from project');
          this.config = {
            ...this.config,
            ...agentConfig.findomAgent
          };
        }
      }
      
      // Update auto mode from project
      this.config.autoMode = project.autoMode;
      
      this.logThinking(`Configuration loaded: autoMode=${this.config.autoMode}, checkInterval=${this.config.checkInterval}m`);
    } catch (error) {
      this.logThinking(`Error loading config: ${error instanceof Error ? error.message : String(error)}`);
      this.logThinking(`Using default configuration`);
    }
  }
  
  /**
   * Save configuration to storage
   */
  async saveConfig(): Promise<void> {
    try {
      const project = await storage.getProject(this.projectId);
      if (!project) {
        throw new Error(`Project ID ${this.projectId} not found`);
      }
      
      const agentConfig = project.agentConfig ? { ...project.agentConfig as any } : {};
      
      // Update findom agent config
      agentConfig.findomAgent = this.config;
      
      // Save back to project
      await storage.updateProject(this.projectId, {
        agentConfig: agentConfig
      });
      
      this.logThinking('Saved FINDOM agent configuration to project');
    } catch (error) {
      this.logThinking(`Error saving config: ${error instanceof Error ? error.message : String(error)}`);
      this.logThinking(`Configuration not saved`);
    }
  }
  
  /**
   * Start the FINDOM agent
   */
  async start(): Promise<boolean> {
    if (this.isRunning) {
      this.logThinking('FINDOM agent is already running');
      return true;
    }
    
    try {
      // Load configuration
      await this.loadConfig();
      
      // Check if auto mode is enabled
      if (!this.config.autoMode) {
        this.logThinking('Auto mode is disabled, not starting FINDOM agent');
        return false;
      }
      
      this.isRunning = true;
      this.logThinking('FINDOM agent is starting...');
      
      // Create activity log for start
      await createActivityLog({
        projectId: this.projectId,
        message: 'FINDOM agent started',
        agentId: 'findom-agent',
        activityType: 'system'
      });
      
      // Initialize web automation
      this.logThinking('Initializing web automation...');
      const webAutomation = getWebAutomationService(this.projectId);
      webAutomation.setupAutomationSchedule(this.config.checkInterval);
      
      // Log startup success
      this.logThinking('FINDOM agent successfully started');
      this.updateStatus('Running normally');
      
      return true;
    } catch (error) {
      this.isRunning = false;
      this.logThinking(`Error starting FINDOM agent: ${error instanceof Error ? error.message : String(error)}`);
      this.logThinking(`FINDOM agent start failed`);
      
      // Create activity log for error
      await createActivityLog({
        projectId: this.projectId,
        message: `FINDOM agent start failed: ${error instanceof Error ? error.message : String(error)}`,
        agentId: 'findom-agent',
        activityType: 'error'
      });
      
      return false;
    }
  }
  
  /**
   * Stop the FINDOM agent
   */
  async stop(): Promise<boolean> {
    if (!this.isRunning) {
      this.logThinking('FINDOM agent is not running');
      return true;
    }
    
    try {
      this.isRunning = false;
      this.logThinking('FINDOM agent is stopping...');
      
      // Create activity log for stop
      await createActivityLog({
        projectId: this.projectId,
        message: 'FINDOM agent stopped',
        agentId: 'findom-agent',
        activityType: 'system'
      });
      
      // Update project auto mode
      await storage.updateProject(this.projectId, {
        autoMode: false
      });
      
      // Also update our local config
      this.config.autoMode = false;
      await this.saveConfig();
      
      this.logThinking('FINDOM agent successfully stopped');
      this.updateStatus('Stopped');
      
      return true;
    } catch (error) {
      this.logThinking(`Error stopping FINDOM agent: ${error instanceof Error ? error.message : String(error)}`);
      this.logThinking(`FINDOM agent stop failed`);
      
      // Create activity log for error
      await createActivityLog({
        projectId: this.projectId,
        message: `FINDOM agent stop failed: ${error instanceof Error ? error.message : String(error)}`,
        agentId: 'findom-agent',
        activityType: 'error'
      });
      
      return false;
    }
  }
  
  /**
   * Generate a response to a client message using AI
   */
  async generateResponse(clientMessage: string, context: any): Promise<string> {
    this.logThinking(`Generating AI response to client message...`);
    
    try {
      // Simple check if OpenAI API key exists
      if (!process.env.OPENAI_API_KEY) {
        this.logThinking('OpenAI API key not found - using default response');
        return 'Thank you for your message. I\'ll respond shortly.';
      }
      
      // Build prompt with context and persona
      const prompt = `
You are a ${this.config.aiPersona}.
Respond to the following message in a ${this.config.responseStyle} style.

Client context:
${JSON.stringify(context)}

Client message:
${clientMessage}

Your response:`;
      
      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: 'system', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      });
      
      const generatedResponse = response.choices[0].message.content;
      
      this.logThinking(`Generated response: "${generatedResponse?.substring(0, 50)}..."`);
      return generatedResponse || 'Thank you for your message. I\'ll get back to you soon.';
    } catch (error) {
      this.logThinking(`Error generating AI response: ${error instanceof Error ? error.message : String(error)}`);
      return 'Thank you for your message. I\'ll respond shortly.';
    }
  }
  
  /**
   * Generate content for publishing using AI
   */
  async generateContent(platform: string, contentType: string): Promise<ContentItem | null> {
    this.logThinking(`Generating ${contentType} content for ${platform}...`);
    
    try {
      // Simple check if OpenAI API key exists
      if (!process.env.OPENAI_API_KEY) {
        this.logThinking('OpenAI API key not found - cannot generate content');
        return null;
      }
      
      // Build prompt for content generation
      const prompt = `
Generate engaging ${contentType} content for a financial domination platform (${platform}).
The content should be attention-grabbing, professional, and effective at attracting potential clients.
Include a compelling title and main text body.
Do not include any placeholder text or placeholders for images.
`;
      
      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: 'system', content: 'You are an expert content creator for financial domination platforms.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });
      
      // Parse the response
      const responseText = response.choices[0].message.content || '{}';
      const content = JSON.parse(responseText);
      
      // Create content item
      const contentItem: ContentItem = {
        id: `content-${Date.now()}`,
        title: content.title || 'Untitled Content',
        text: content.text || content.body || 'No content generated',
        platform,
        created: new Date(),
        published: false
      };
      
      // Add to content library
      this.contentLibrary.push(contentItem);
      
      this.logThinking(`Generated content: "${contentItem.title}"`);
      return contentItem;
    } catch (error) {
      this.logThinking(`Error generating content: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
  
  /**
   * Check and process client messages needing responses
   */
  async processClientMessages(): Promise<number> {
    this.logThinking('Processing client messages...');
    
    try {
      // Get web automation service
      const webAutomation = getWebAutomationService(this.projectId);
      
      // Check for messages
      const messageResult = await webAutomation.checkAllMessages();
      
      // Process messages that need responses
      let responsesGenerated = 0;
      
      for (const message of messageResult.messages) {
        if (message.requiresResponse) {
          this.logThinking(`Generating response for message from ${message.sender}...`);
          
          // Get or create client interaction record
          let interaction = this.clientInteractions.get(message.sender);
          if (!interaction) {
            interaction = {
              clientId: message.sender,
              platform: 'unknown', // This would be set to the actual platform
              lastInteraction: new Date(),
              interactionCount: 0,
              lastMessage: '',
              status: 'active',
              notes: 'New client'
            };
          }
          
          // Update interaction record
          interaction.lastInteraction = new Date();
          interaction.interactionCount++;
          interaction.lastMessage = message.content;
          
          // Generate AI response
          const response = await this.generateResponse(message.content, {
            clientId: message.sender,
            interactionCount: interaction.interactionCount,
            status: interaction.status
          });
          
          // Get the accounts for the project
          const accounts = await storage.getWebAccounts(this.projectId);
          
          // If we have accounts, send the response
          if (accounts && accounts.length > 0) {
            const account = accounts[0]; // Just use the first account for now
            
            // Send the response
            await webAutomation.sendMessage(account, message.sender, response);
            responsesGenerated++;
            
            this.logThinking(`Sent response to ${message.sender}`);
          } else {
            this.logThinking(`No accounts available to send response to ${message.sender}`);
          }
          
          // Save updated interaction
          this.clientInteractions.set(message.sender, interaction);
        }
      }
      
      if (responsesGenerated > 0) {
        this.logThinking(`Generated and sent ${responsesGenerated} responses`);
        
        // Create activity log
        await createActivityLog({
          projectId: this.projectId,
          message: `Responded to ${responsesGenerated} client messages`,
          agentId: 'findom-agent',
          activityType: 'client'
        });
      } else {
        this.logThinking('No responses needed to be generated');
      }
      
      return responsesGenerated;
    } catch (error) {
      this.logThinking(`Error processing client messages: ${error instanceof Error ? error.message : String(error)}`);
      return 0;
    }
  }
  
  /**
   * Update agent status in project
   */
  private async updateStatus(statusMessage: string): Promise<void> {
    try {
      // Only update status if sufficient time has passed (avoid log spam)
      const now = new Date();
      const timeSinceLastUpdate = now.getTime() - this.lastStatusUpdate.getTime();
      
      if (timeSinceLastUpdate < 60000) { // 1 minute minimum between status updates
        return;
      }
      
      this.lastStatusUpdate = now;
      
      // Update project with status
      await storage.updateProject(this.projectId, {
        lastUpdated: now,
        lastCheckIn: now,
        nextCheckIn: new Date(now.getTime() + this.config.checkInterval * 60000)
      });
      
      // Log status update
      this.logThinking(`Status updated: ${statusMessage}`);
    } catch (error) {
      this.logThinking(`Error updating status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Log thinking process for full transparency
   */
  private logThinking(message: string): void {
    // Display in real-time via WebSocket for the Performance tab
    broadcastThinking(this.projectId, `[FindomAgent] ${message}`);
    
    // Also log to console
    console.log(`[FindomAgent:${this.projectId}] ${message}`);
  }
}

// Map of agent instances by project ID
const agents: Map<number, FindomAgent> = new Map();

/**
 * Get or create a FINDOM agent for a project
 */
export function getFindomAgent(projectId: number): FindomAgent {
  if (!agents.has(projectId)) {
    agents.set(projectId, new FindomAgent(projectId));
  }
  
  return agents.get(projectId)!;
}

/**
 * Initialize FINDOM agents for all applicable projects
 * Called at server startup
 */
export async function initializeFindomAgents(): Promise<void> {
  console.log('Initializing FINDOM agents for all applicable projects...');
  
  try {
    // Find all projects of type 'findom'
    const projects = await storage.getAllProjects();
    const findomProjects = projects.filter(p => p.projectType === 'findom');
    
    console.log(`Found ${findomProjects.length} FINDOM projects`);
    
    // Initialize agent for each project and start if auto mode is enabled
    for (const project of findomProjects) {
      const agent = getFindomAgent(project.id);
      
      // Load agent configuration
      await agent.loadConfig();
      
      // Start agent if auto mode is enabled
      if (project.autoMode) {
        await agent.start();
        console.log(`Started FINDOM agent for project ${project.name} (ID: ${project.id})`);
      } else {
        console.log(`FINDOM agent for project ${project.name} (ID: ${project.id}) not started (auto mode disabled)`);
      }
    }
    
    console.log('FINDOM agent initialization completed');
  } catch (error) {
    console.error('Error initializing FINDOM agents:', error instanceof Error ? error.message : String(error));
  }
}