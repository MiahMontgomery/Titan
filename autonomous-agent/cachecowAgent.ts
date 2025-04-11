import { Agent } from "@shared/schema";
import { AIAgent } from "./agent";
import { openai } from "./openai";
import { webAutomation } from "./webAutomation";
import { AgentType, ActivityLogType } from "@shared/types";

/**
 * CacheCow AI Agent
 * Specialized in data collection, processing, and caching
 */
export class CachecowAgent extends AIAgent {
  private isRunning: boolean = false;
  private cache: Map<string, { data: any, timestamp: number }> = new Map();
  
  // Cache TTL in ms (default: 1 hour)
  private cacheTTL: number = 60 * 60 * 1000;
  
  constructor(agent: Agent) {
    super(agent);
    
    // Check if TTL is specified in agent parameters
    if (agent.parameters.cacheTTL) {
      this.cacheTTL = agent.parameters.cacheTTL * 1000;
    }
  }
  
  /**
   * Start the CACHECOW agent
   */
  async start(): Promise<void> {
    if (!this.isActive()) {
      throw new Error("Cannot start inactive agent");
    }
    
    this.isRunning = true;
    
    // Log agent start
    await this.logActivity(
      "Agent started",
      ActivityLogType.INFO
    );
  }
  
  /**
   * Stop the CACHECOW agent
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    
    // Log agent stop
    await this.logActivity(
      "Agent stopped",
      ActivityLogType.INFO
    );
  }
  
  /**
   * Execute a specific task by ID
   */
  async executeTask(taskId: number): Promise<any> {
    if (!this.isActive()) {
      throw new Error("Cannot execute task with inactive agent");
    }
    
    try {
      // Log task start
      await this.logActivity(
        `Executing task #${taskId}`,
        ActivityLogType.INFO
      );
      
      // In a real implementation, this would fetch the task details
      // and execute it based on the task type
      
      // Return task results
      return {
        taskId,
        status: "completed",
        results: {
          summary: "Task completed successfully by CACHECOW agent"
        }
      };
    } catch (error) {
      // Log error
      await this.logActivity(
        `Error executing task #${taskId}: ${error instanceof Error ? error.message : String(error)}`,
        ActivityLogType.ERROR
      );
      
      throw error;
    }
  }
  
  /**
   * Execute a custom instruction directly
   */
  async executeCustomInstruction(instruction: string): Promise<any> {
    if (!this.isActive()) {
      throw new Error("Cannot execute instruction with inactive agent");
    }
    
    try {
      // Generate a cache key from the instruction
      const cacheKey = `instruction:${Buffer.from(instruction).toString('base64')}`;
      
      // Check cache first
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        await this.logActivity(
          "Retrieved result from cache",
          ActivityLogType.INFO
        );
        return cachedResult;
      }
      
      // Log instruction start
      await this.logActivity(
        "Executing custom instruction",
        ActivityLogType.INFO
      );
      
      // Process the instruction using OpenAI
      const completion = await openai.chat.completions.create({
        model: this.agent.model,
        messages: [
          {
            role: "system",
            content: "You are a data collection and caching specialist that can efficiently process and organize information."
          },
          {
            role: "user",
            content: instruction
          }
        ],
        temperature: this.agent.parameters.temperature,
        max_tokens: this.agent.parameters.maxTokens,
      });
      
      const response = completion.choices[0].message.content;
      
      // Cache the result
      const result = {
        instruction,
        response
      };
      this.addToCache(cacheKey, result);
      
      // Log completion
      await this.logActivity(
        "Custom instruction execution completed and cached",
        ActivityLogType.SUCCESS
      );
      
      return result;
    } catch (error) {
      // Log error
      await this.logActivity(
        `Error executing custom instruction: ${error instanceof Error ? error.message : String(error)}`,
        ActivityLogType.ERROR
      );
      
      throw error;
    }
  }
  
  /**
   * Execute web data collection and caching
   */
  async executeDataCollection(url: string, selectors: string[]): Promise<any> {
    if (!this.isActive()) {
      throw new Error("Cannot execute data collection with inactive agent");
    }
    
    try {
      // Generate a cache key from the URL and selectors
      const cacheKey = `url:${url}:${selectors.join(',')}`;
      
      // Check cache first
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        await this.logActivity(
          `Retrieved data for ${url} from cache`,
          ActivityLogType.INFO
        );
        return {
          ...cachedData,
          fromCache: true
        };
      }
      
      // Log collection start
      await this.logActivity(
        `Starting data collection for URL: ${url}`,
        ActivityLogType.INFO
      );
      
      // Execute web automation for data collection
      const result = await webAutomation.run(url, {
        selectors,
        agentType: AgentType.CACHECOW
      });
      
      // Process and structure the data
      const structuredData = await this.structureData(result.extractedData);
      
      // Cache the result
      const collectionResult = {
        url,
        collectedData: structuredData,
        timestamp: new Date()
      };
      this.addToCache(cacheKey, collectionResult);
      
      // Log completion
      await this.logActivity(
        `Data collection completed for URL: ${url}`,
        ActivityLogType.SUCCESS
      );
      
      return {
        ...collectionResult,
        fromCache: false
      };
    } catch (error) {
      // Log error
      await this.logActivity(
        `Error in data collection: ${error instanceof Error ? error.message : String(error)}`,
        ActivityLogType.ERROR
      );
      
      throw error;
    }
  }
  
  /**
   * Structure and clean collected data
   */
  private async structureData(rawData: any): Promise<any> {
    try {
      // Use OpenAI to help structure the data
      const structuring = await openai.chat.completions.create({
        model: this.agent.model,
        messages: [
          {
            role: "system",
            content: "You are a data structuring assistant. Clean and organize the raw data into a well-structured JSON format."
          },
          {
            role: "user",
            content: `Structure the following raw data into a clean JSON format: ${JSON.stringify(rawData)}`
          }
        ],
        temperature: 0.2, // Lower temperature for more deterministic results
        max_tokens: this.agent.parameters.maxTokens,
        response_format: { type: "json_object" }
      });
      
      return JSON.parse(structuring.choices[0].message.content);
    } catch (error) {
      console.error("Error structuring data:", error);
      // Return the raw data if structuring fails
      return rawData;
    }
  }
  
  /**
   * Add data to cache
   */
  private addToCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  /**
   * Get data from cache if it exists and is not expired
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  /**
   * Clear entire cache or specific key
   */
  public clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
  
  /**
   * Log agent activity
   */
  private async logActivity(message: string, type: ActivityLogType): Promise<void> {
    try {
      // In a real implementation, this would call the API to create an activity log
      console.log(`[${this.agent.type}] ${message} (${type})`);
      
      // Call to API to log activity would go here
      await fetch('/api/activity-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agentType: this.agent.type,
          projectName: "CACHECOW",
          message,
          type
        })
      });
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  }
}
