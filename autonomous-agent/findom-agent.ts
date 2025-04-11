import { Agent, AgentStatus } from "@shared/schema";
import { IAutonomousAgent } from "./index";
import { generateCompletion, getProjectApiKey } from "../server/openai";
import { extractData, runPuppeteerTask } from "../server/puppeteer";

export class FindomAgent implements IAutonomousAgent {
  id: number;
  name: string;
  type: "FINDOM";
  private status: AgentStatus;
  private config: any;
  private apiKeyId: number | null;
  private projectId: number | null;
  private isTurbo: boolean;

  constructor(agentData: Agent) {
    this.id = agentData.id;
    this.name = agentData.name;
    this.type = "FINDOM";
    this.status = agentData.status as AgentStatus;
    this.config = agentData.config || {};
    this.apiKeyId = agentData.apiKeyId;
    this.projectId = agentData.projectId;
    this.isTurbo = this.config.isTurbo || false;
  }

  async start(): Promise<void> {
    this.status = AgentStatus.ACTIVE;
    console.log(`FINDOM Agent ${this.name} (ID: ${this.id}) started`);
  }

  async stop(): Promise<void> {
    this.status = AgentStatus.IDLE;
    console.log(`FINDOM Agent ${this.name} (ID: ${this.id}) stopped`);
  }

  async execute(task: string, params?: any): Promise<any> {
    try {
      console.log(`FINDOM Agent ${this.name} executing task: ${task}`);
      
      // Get the appropriate API key
      const apiKey = getProjectApiKey(this.projectId, this.isTurbo);
      
      switch (task) {
        case "generate-content":
          return await this.generateContent(params.prompt, params.options);
        
        case "web-scrape":
          return await this.scrapeWebsite(params.url, params.selectors);
        
        case "analyze-data":
          return await this.analyzeData(params.data, params.question);
        
        case "automate-task":
          return await this.automateTask(params.url, params.script);
        
        default:
          throw new Error(`Unknown task: ${task}`);
      }
    } catch (error) {
      this.status = AgentStatus.ERROR;
      console.error(`FINDOM Agent error: ${error.message}`);
      throw error;
    }
  }

  async getStatus(): Promise<string> {
    return this.status;
  }

  private async generateContent(
    prompt: string,
    options: { model?: string; maxTokens?: number; temperature?: number } = {}
  ): Promise<string> {
    const { model = "gpt-4o", maxTokens = 1000, temperature = 0.7 } = options;
    
    // Get API key with turbo support
    const apiKey = getProjectApiKey(this.projectId, this.isTurbo);
    
    // Generate content using OpenAI
    return await generateCompletion(
      prompt,
      model,
      maxTokens,
      temperature,
      apiKey
    );
  }

  private async scrapeWebsite(url: string, selectors: Record<string, string>): Promise<Record<string, any>> {
    return await extractData(url, selectors);
  }

  private async analyzeData(data: any, question: string): Promise<any> {
    // Form a prompt for OpenAI to analyze the data
    const prompt = `Please analyze the following data and answer this question: ${question}`;
    
    // Get API key with turbo support
    const apiKey = getProjectApiKey(this.projectId, this.isTurbo);
    
    // Use OpenAI to analyze the data
    const analysis = await generateCompletion(
      `${prompt}\n\nData: ${JSON.stringify(data)}`,
      "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      1500,
      0.7,
      apiKey
    );
    
    return { analysis };
  }

  private async automateTask(url: string, script: string): Promise<any> {
    return await runPuppeteerTask(url, script);
  }
}
