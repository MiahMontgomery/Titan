/**
 * Web Automation Service for FINDOM
 * 
 * This module provides autonomous web browsing capabilities to interact
 * with financial domination platforms, content creation sites, and 
 * other web services that FINDOM needs to operate autonomously 24/7.
 * 
 * Features:
 * - Automated browser sessions
 * - Login and session management
 * - Content publishing
 * - Message management
 * - Platform-specific interaction patterns
 */

import { WebAccount } from '@shared/schema';
import { BrowserClient, getBrowserClient } from './browserClient';
import { PlatformHandler, createPlatformHandler, Content, PlatformMessage } from './platformHandlers';
import { broadcastThinking } from './chatHandler';
import { storage } from './storage';

/**
 * Types of web platform interactions
 */
export enum PlatformType {
  MESSAGING = "messaging",
  CONTENT = "content",
  MARKETPLACE = "marketplace",
  SOCIAL = "social"
}

/**
 * Interface for web interaction results
 */
interface WebInteractionResult {
  success: boolean;
  message: string;
  timestamp: Date;
  details?: any;
}

/**
 * Web automation service for the FINDOM project
 * This service handles all web interactions across multiple platforms
 */
export class WebAutomationService {
  private platformHandlers: Map<string, PlatformHandler> = new Map();
  private browserClient: BrowserClient;
  private projectId: number;
  private activeAutomation: boolean = false;
  private sessions: Map<number, any> = new Map(); // Store active sessions by account ID
  
  constructor(projectId: number) {
    this.projectId = projectId;
    this.browserClient = getBrowserClient(projectId);
    this.logThinking('Initializing web automation service');
  }
  
  /**
   * Log in to all accounts and maintain sessions
   */
  async loginToAllAccounts(): Promise<number> {
    this.logThinking('Starting login process for all web accounts...');
    
    try {
      // Get all web accounts for this project
      const accounts = await storage.getWebAccounts(this.projectId);
      
      if (!accounts || accounts.length === 0) {
        this.logThinking('No web accounts found for this project.');
        return 0;
      }
      
      this.logThinking(`Found ${accounts.length} web accounts to process.`);
      let successCount = 0;
      
      // Login to each account
      for (const account of accounts) {
        try {
          // Get the appropriate platform handler
          const handler = this.getPlatformHandler(account.service);
          
          // Attempt login
          this.logThinking(`Logging in to ${account.service} as ${account.accountName}...`);
          const sessionData = await handler.login(account);
          
          // Store session data
          this.sessions.set(account.id, sessionData);
          
          // Update account's last activity timestamp
          await storage.updateWebAccount(account.id, {
            lastActivity: new Date()
          });
          
          this.logThinking(`Successfully logged in to ${account.service} as ${account.accountName}`);
          successCount++;
        } catch (error) {
          this.logThinking(`Error logging in to ${account.service} as ${account.accountName}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      this.logThinking(`Login process completed. ${successCount} of ${accounts.length} accounts logged in successfully.`);
      return successCount;
    } catch (error) {
      this.logThinking(`Error in loginToAllAccounts: ${error instanceof Error ? error.message : String(error)}`);
      return 0;
    }
  }
  
  /**
   * Check for messages across all platforms
   */
  async checkAllMessages(): Promise<{
    total: number;
    needResponse: number;
    messages: PlatformMessage[];
  }> {
    this.logThinking('Checking messages across all platforms...');
    
    const result = {
      total: 0,
      needResponse: 0,
      messages: [] as PlatformMessage[]
    };
    
    try {
      // Get all web accounts for this project
      const accounts = await storage.getWebAccounts(this.projectId);
      
      if (!accounts || accounts.length === 0) {
        this.logThinking('No web accounts found for this project.');
        return result;
      }
      
      this.logThinking(`Found ${accounts.length} web accounts to check for messages.`);
      
      // Check messages for each account
      for (const account of accounts) {
        try {
          // Get session data, or login if not available
          let sessionData = this.sessions.get(account.id);
          if (!sessionData) {
            const handler = this.getPlatformHandler(account.service);
            sessionData = await handler.login(account);
            this.sessions.set(account.id, sessionData);
          }
          
          // Get the appropriate platform handler
          const handler = this.getPlatformHandler(account.service);
          
          // Check messages
          this.logThinking(`Checking messages on ${account.service} as ${account.accountName}...`);
          const messages = await handler.checkMessages(account, sessionData);
          
          // Add messages to result
          if (messages.length > 0) {
            result.total += messages.length;
            result.needResponse += messages.filter(m => m.requiresResponse).length;
            result.messages.push(...messages);
            
            this.logThinking(`Found ${messages.length} messages on ${account.service}, ${messages.filter(m => m.requiresResponse).length} require response.`);
          } else {
            this.logThinking(`No new messages found on ${account.service}.`);
          }
          
          // Update account's last activity timestamp
          await storage.updateWebAccount(account.id, {
            lastActivity: new Date()
          });
        } catch (error) {
          this.logThinking(`Error checking messages on ${account.service} as ${account.accountName}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      this.logThinking(`Message check completed. Found ${result.total} total messages, ${result.needResponse} require response.`);
      return result;
    } catch (error) {
      this.logThinking(`Error in checkAllMessages: ${error instanceof Error ? error.message : String(error)}`);
      return result;
    }
  }
  
  /**
   * Send a message to a user on a specific platform
   */
  async sendMessage(account: WebAccount, recipient: string, message: string): Promise<boolean> {
    this.logThinking(`Sending message to ${recipient} on ${account.service}...`);
    
    try {
      // Get session data, or login if not available
      let sessionData = this.sessions.get(account.id);
      if (!sessionData) {
        const handler = this.getPlatformHandler(account.service);
        sessionData = await handler.login(account);
        this.sessions.set(account.id, sessionData);
      }
      
      // Get the appropriate platform handler
      const handler = this.getPlatformHandler(account.service);
      
      // Send message
      const success = await handler.sendMessage(account, sessionData, recipient, message);
      
      if (success) {
        this.logThinking(`Successfully sent message to ${recipient} on ${account.service}.`);
        
        // Update account's last activity timestamp
        await storage.updateWebAccount(account.id, {
          lastActivity: new Date()
        });
      } else {
        this.logThinking(`Failed to send message to ${recipient} on ${account.service}.`);
      }
      
      return success;
    } catch (error) {
      this.logThinking(`Error sending message on ${account.service}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
  
  /**
   * Generate and publish content to platforms
   */
  async generateAndPublishContent(): Promise<boolean> {
    this.logThinking('Generating and publishing content...');
    
    try {
      // Get all web accounts for this project
      const accounts = await storage.getWebAccounts(this.projectId);
      
      if (!accounts || accounts.length === 0) {
        this.logThinking('No web accounts found for this project.');
        return false;
      }
      
      // In the future, implement content generation logic here
      // For now, use a placeholder content
      const content: Content = {
        text: 'Simulated content for demo purposes (would be AI-generated in production)',
        tags: ['demo', 'test', 'simulation'],
        visibility: 'public'
      };
      
      let anySuccess = false;
      
      // Publish content to each account
      for (const account of accounts) {
        try {
          // Get session data, or login if not available
          let sessionData = this.sessions.get(account.id);
          if (!sessionData) {
            const handler = this.getPlatformHandler(account.service);
            sessionData = await handler.login(account);
            this.sessions.set(account.id, sessionData);
          }
          
          // Get the appropriate platform handler
          const handler = this.getPlatformHandler(account.service);
          
          // Post content
          this.logThinking(`Publishing content to ${account.service} as ${account.accountName}...`);
          const contentId = await handler.postContent(account, sessionData, content);
          
          if (contentId) {
            this.logThinking(`Successfully published content to ${account.service}, content ID: ${contentId}`);
            anySuccess = true;
            
            // Update account's last activity timestamp
            await storage.updateWebAccount(account.id, {
              lastActivity: new Date()
            });
          } else {
            this.logThinking(`Failed to publish content to ${account.service}.`);
          }
        } catch (error) {
          this.logThinking(`Error publishing content to ${account.service}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      this.logThinking(`Content publishing process completed.`);
      return anySuccess;
    } catch (error) {
      this.logThinking(`Error in generateAndPublishContent: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
  
  /**
   * Schedule automated tasks
   * This sets up recurring tasks for the automation system
   */
  setupAutomationSchedule(checkIntervalMinutes: number = 15): void {
    this.logThinking(`Setting up automation schedule with ${checkIntervalMinutes} minute interval...`);
    
    // Convert minutes to milliseconds
    const intervalMs = checkIntervalMinutes * 60 * 1000;
    
    // Only set up if not already active
    if (!this.activeAutomation) {
      this.activeAutomation = true;
      
      // Set up interval for login check
      setInterval(async () => {
        this.logThinking('Executing scheduled login check for web accounts...');
        await this.loginToAllAccounts();
        
        // Update the project's last automation run timestamp
        await storage.updateProject(this.projectId, {
          lastAutomationRun: new Date()
        });
      }, intervalMs);
      
      // Set up interval for message check (slightly offset to prevent concurrent runs)
      setInterval(async () => {
        this.logThinking('Executing scheduled message check...');
        const messageResult = await this.checkAllMessages();
        this.logThinking(`Scheduled message check found ${messageResult.total} messages.`);
        
        // Here you'd respond to messages that need responses
        // For those that need response, you'd call the AI agent to generate responses
        
        // Update the project's last automation run timestamp
        await storage.updateProject(this.projectId, {
          lastAutomationRun: new Date()
        });
      }, intervalMs + 30000); // 30 seconds offset
      
      // Set up interval for content generation and publishing
      setInterval(async () => {
        this.logThinking('Executing scheduled content publishing...');
        await this.generateAndPublishContent();
        
        // Update the project's last automation run timestamp
        await storage.updateProject(this.projectId, {
          lastAutomationRun: new Date()
        });
      }, intervalMs * 4); // Less frequent than other tasks
      
      this.logThinking('Automation schedule has been set up successfully.');
    } else {
      this.logThinking('Automation schedule is already active.');
    }
  }
  
  /**
   * Get a platform handler for a specific service
   */
  private getPlatformHandler(service: string): PlatformHandler {
    if (!this.platformHandlers.has(service)) {
      this.platformHandlers.set(service, createPlatformHandler(service, this.projectId));
    }
    
    return this.platformHandlers.get(service)!;
  }
  
  /**
   * Log thinking process for full transparency
   */
  private logThinking(message: string): void {
    // Display in real-time via WebSocket for the Performance tab
    broadcastThinking(this.projectId, `[WebAutomation] ${message}`);
    
    // Also log to console
    console.log(`[WebAutomation:${this.projectId}] ${message}`);
  }
}

// Map of web automation service instances by project ID
const automationServices: Map<number, WebAutomationService> = new Map();

/**
 * Get or create a web automation service for a project
 */
export function getWebAutomationService(projectId: number): WebAutomationService {
  if (!automationServices.has(projectId)) {
    automationServices.set(projectId, new WebAutomationService(projectId));
  }
  
  return automationServices.get(projectId)!;
}

/**
 * Initialize web automation for all FINDOM projects
 * Called at server startup
 */
export async function initializeWebAutomation(): Promise<void> {
  console.log('Initializing web automation for all FINDOM projects...');
  
  try {
    // Find all projects of type 'findom'
    const projects = await storage.getAllProjects();
    const findomProjects = projects.filter(p => p.projectType === 'findom');
    
    console.log(`Found ${findomProjects.length} FINDOM projects.`);
    
    // Initialize web automation for each FINDOM project
    for (const project of findomProjects) {
      const service = getWebAutomationService(project.id);
      
      // Set up automation schedule
      service.setupAutomationSchedule(15); // 15 minutes
      
      // Initial login
      await service.loginToAllAccounts();
      
      // Update the project's last automation run timestamp
      await storage.updateProject(project.id, {
        lastAutomationRun: new Date()
      });
      
      console.log(`Web automation initialized for project ${project.name} (ID: ${project.id}).`);
    }
    
    console.log('Web automation initialization completed.');
  } catch (error) {
    console.error('Error initializing web automation:', error instanceof Error ? error.message : String(error));
  }
}