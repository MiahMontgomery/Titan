import { Agent, AgentType } from "@shared/schema";
import { FindomAgent } from "./findom-agent";
import { CachecowAgent } from "./cachecow-agent";

export interface IAutonomousAgent {
  id: number;
  name: string;
  type: AgentType;
  start(): Promise<void>;
  stop(): Promise<void>;
  execute(task: string, params?: any): Promise<any>;
  getStatus(): Promise<string>;
}

export function createAgent(agentData: Agent): IAutonomousAgent {
  switch (agentData.type) {
    case AgentType.FINDOM:
      return new FindomAgent(agentData);
    case AgentType.CACHECOW:
      return new CachecowAgent(agentData);
    default:
      throw new Error(`Unsupported agent type: ${agentData.type}`);
  }
}

// Agent manager to keep track of running agents
class AgentManager {
  private agents: Map<number, IAutonomousAgent>;

  constructor() {
    this.agents = new Map();
  }

  public registerAgent(agent: IAutonomousAgent): void {
    this.agents.set(agent.id, agent);
  }

  public async startAgent(agentId: number): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }
    await agent.start();
  }

  public async stopAgent(agentId: number): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }
    await agent.stop();
  }

  public async executeTask(agentId: number, task: string, params?: any): Promise<any> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }
    return await agent.execute(task, params);
  }

  public async getAgentStatus(agentId: number): Promise<string> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }
    return await agent.getStatus();
  }

  public removeAgent(agentId: number): boolean {
    return this.agents.delete(agentId);
  }

  public getAgent(agentId: number): IAutonomousAgent | undefined {
    return this.agents.get(agentId);
  }

  public getAllAgents(): IAutonomousAgent[] {
    return Array.from(this.agents.values());
  }
}

// Export singleton instance
export const agentManager = new AgentManager();
