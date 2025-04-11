import { Agent, AgentStatus } from "@shared/schema";
import { IAutonomousAgent } from "./index";
import { extractData, runPuppeteerTask, takeScreenshot } from "../server/puppeteer";
import { analyzeData, getProjectApiKey } from "../server/openai";

export class CachecowAgent implements IAutonomousAgent {
  id: number;
  name: string;
  type: "CACHECOW";
  private status: AgentStatus;
  private config: any;
  private apiKeyId: number | null;
  private projectId: number | null;
  private isTurbo: boolean;
  private dataCache: Map<string, { data: any; timestamp: number }>;
  private cacheTTL: number; // Cache time-to-live in milliseconds

  constructor(agentData: Agent) {
    this.id = agentData.id;
    this.name = agentData.name;
    this.type = "CACHECOW";
    this.status = agentData.status as AgentStatus;
    this.config = agentData.config || {};
    this.apiKeyId = agentData.apiKeyId;
    this.projectId = agentData.projectId;
    this.isTurbo = this.config.isTurbo || false;
    this.dataCache = new Map();
    this.cacheTTL = this.config.cacheTTL || 3600000; // Default to 1 hour
  }

  async start(): Promise<void> {
    this.status = AgentStatus.ACTIVE;
    console.log(`CACHECOW Agent ${this.name} (ID: ${this.id}) started`);
  }

  async stop(): Promise<void> {
    this.status = AgentStatus.IDLE;
    console.log(`CACHECOW Agent ${this.name} (ID: ${this.id}) stopped`);
  }

  async execute(task: string, params?: any): Promise<any> {
    try {
      console.log(`CACHECOW Agent ${this.name} executing task: ${task}`);
      
      switch (task) {
        case "fetch-data":
          return await this.fetchData(params.url, params.selectors, params.forceRefresh);
        
        case "monitor-website":
          return await this.monitorWebsite(params.url, params.frequency, params.callback);
        
        case "compare-data":
          return await this.compareData(params.url1, params.url2, params.selectors);
        
        case "screenshot":
          return await this.captureScreenshot(params.url);
        
        case "analyze-cached-data":
          return await this.analyzeCachedData(params.cacheKey, params.question);
        
        default:
          throw new Error(`Unknown task: ${task}`);
      }
    } catch (error) {
      this.status = AgentStatus.ERROR;
      console.error(`CACHECOW Agent error: ${error.message}`);
      throw error;
    }
  }

  async getStatus(): Promise<string> {
    return this.status;
  }

  private async fetchData(
    url: string,
    selectors: Record<string, string>,
    forceRefresh: boolean = false
  ): Promise<Record<string, any>> {
    const cacheKey = `${url}-${JSON.stringify(selectors)}`;
    
    // Check cache first if not forcing refresh
    if (!forceRefresh) {
      const cachedData = this.dataCache.get(cacheKey);
      if (cachedData && Date.now() - cachedData.timestamp < this.cacheTTL) {
        console.log(`CACHECOW Agent ${this.name} using cached data for ${url}`);
        return cachedData.data;
      }
    }
    
    // Fetch fresh data
    console.log(`CACHECOW Agent ${this.name} fetching fresh data from ${url}`);
    const data = await extractData(url, selectors);
    
    // Cache the results
    this.dataCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  }

  private async monitorWebsite(
    url: string,
    frequency: number, // in milliseconds
    callback: (data: any) => void
  ): Promise<{ message: string }> {
    // For monitoring, we'll just set up a simple data fetch
    // In a real implementation, this would set up a recurring job
    
    // Initial fetch
    const selectors = { html: "html" }; // Just get the entire HTML to check for changes
    const initialData = await this.fetchData(url, selectors, true);
    
    // Return immediately with a message
    // In a real implementation, this would create a monitoring job
    return {
      message: `Started monitoring ${url} every ${frequency}ms`
    };
  }

  private async compareData(
    url1: string,
    url2: string,
    selectors: Record<string, string>
  ): Promise<{ differences: Record<string, any> }> {
    // Fetch data from both URLs
    const data1 = await this.fetchData(url1, selectors, true);
    const data2 = await this.fetchData(url2, selectors, true);
    
    // Compare the results
    const differences: Record<string, any> = {};
    
    for (const key of Object.keys(selectors)) {
      if (data1[key] !== data2[key]) {
        differences[key] = {
          url1: data1[key],
          url2: data2[key]
        };
      }
    }
    
    return { differences };
  }

  private async captureScreenshot(url: string): Promise<{ message: string }> {
    await takeScreenshot(url);
    return { message: `Screenshot captured for ${url}` };
  }

  private async analyzeCachedData(cacheKey: string, question: string): Promise<{ analysis: any }> {
    const cachedData = this.dataCache.get(cacheKey);
    
    if (!cachedData) {
      throw new Error(`No cached data found for key: ${cacheKey}`);
    }
    
    // Get API key with turbo support
    const apiKey = getProjectApiKey(this.projectId, this.isTurbo);
    
    // Analyze the cached data
    const analysis = await analyzeData(
      question,
      cachedData.data,
      "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      apiKey
    );
    
    return { analysis };
  }
}
