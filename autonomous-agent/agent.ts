import { Agent } from "@shared/schema";
import { AgentType } from "@shared/types";

/**
 * Base class for AI agents
 */
export abstract class AIAgent {
  protected agent: Agent;
  
  constructor(agent: Agent) {
    this.agent = agent;
  }
  
  /**
   * Get the agent configuration
   */
  getConfig(): Agent {
    return this.agent;
  }
  
  /**
   * Update the agent configuration
   */
  updateConfig(updatedAgent: Agent): void {
    this.agent = updatedAgent;
  }
  
  /**
   * Check if agent is active
   */
  isActive(): boolean {
    return this.agent.active;
  }
  
  /**
   * Set agent active status
   */
  setActive(active: boolean): void {
    this.agent.active = active;
  }
  
  /**
   * Get agent type
   */
  getType(): AgentType {
    return this.agent.type as AgentType;
  }
  
  /**
   * Abstract methods that specific agent types must implement
   */
  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
  abstract executeTask(taskId: number): Promise<any>;
  abstract executeCustomInstruction(instruction: string): Promise<any>;
}

/**
 * Factory for creating agent instances
 */
export class AgentFactory {
  static async createAgent(agent: Agent): Promise<AIAgent | null> {
    // Dynamic import to avoid circular dependencies
    const { FindomAgent } = await import('./findomAgent');
    const { CachecowAgent } = await import('./cachecowAgent');
    
    switch (agent.type) {
      case AgentType.FINDOM:
        return new FindomAgent(agent);
      case AgentType.CACHECOW:
        return new CachecowAgent(agent);
      default:
        console.error(`Unknown agent type: ${agent.type}`);
        return null;
    }
  }
}
