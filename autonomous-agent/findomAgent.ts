import { Agent } from "@shared/schema";
import { AIAgent } from "./agent";
import { openai } from "./openai";
import { webAutomation } from "./webAutomation";
import { AgentType, ActivityLogType } from "@shared/types";

/**
 * Financial Domain AI Agent
 * Specialized in financial analysis, market research, and data extraction
 */
export class FindomAgent extends AIAgent {
  private isRunning: boolean = false;
  
  constructor(agent: Agent) {
    super(agent);
  }
  
  /**
   * Start the FINDOM agent
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
   * Stop the FINDOM agent
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
          summary: "Task completed successfully by FINDOM agent"
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
            content: "You are a financial domain specialist AI assistant that can analyze financial data, extract insights, and provide recommendations."
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
      
      // Log completion
      await this.logActivity(
        "Custom instruction execution completed",
        ActivityLogType.SUCCESS
      );
      
      return {
        instruction,
        response
      };
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
   * Execute web automation with financial data extraction
   */
  async executeWebAutomation(url: string, extractionOptions: any): Promise<any> {
    if (!this.isActive()) {
      throw new Error("Cannot execute web automation with inactive agent");
    }
    
    try {
      // Log automation start
      await this.logActivity(
        `Starting web automation for URL: ${url}`,
        ActivityLogType.INFO
      );
      
      // Execute web automation
      const result = await webAutomation.run(url, {
        ...extractionOptions,
        agentType: AgentType.FINDOM
      });
      
      // Process extracted data with OpenAI
      const analysis = await openai.chat.completions.create({
        model: this.agent.model,
        messages: [
          {
            role: "system",
            content: "You are a financial domain specialist. Analyze the extracted data and provide insights."
          },
          {
            role: "user",
            content: `Analyze the following financial data extracted from ${url}: ${JSON.stringify(result.extractedData)}`
          }
        ],
        temperature: this.agent.parameters.temperature,
        max_tokens: this.agent.parameters.maxTokens,
        response_format: { type: "json_object" }
      });
      
      // Log completion
      await this.logActivity(
        `Web automation completed for URL: ${url}`,
        ActivityLogType.SUCCESS
      );
      
      return {
        url,
        extractedData: result.extractedData,
        analysis: analysis.choices[0].message.content
      };
    } catch (error) {
      // Log error
      await this.logActivity(
        `Error in web automation: ${error instanceof Error ? error.message : String(error)}`,
        ActivityLogType.ERROR
      );
      
      throw error;
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
          projectName: "FINDOM",
          message,
          type
        })
      });
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  }
}
