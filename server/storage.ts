import { 
  User, InsertUser, 
  ApiKey, InsertApiKey, 
  Project, InsertProject, 
  Agent, InsertAgent, 
  ActivityLog, InsertActivityLog, 
  AutomationTask, InsertAutomationTask,
  AgentType, AgentStatus
} from "@shared/schema";

// Interface for all CRUD storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // API Key operations
  getApiKey(id: number): Promise<ApiKey | undefined>;
  getApiKeysByProject(projectId: number): Promise<ApiKey[]>;
  getDefaultApiKey(): Promise<ApiKey | undefined>;
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  updateApiKey(id: number, apiKey: Partial<ApiKey>): Promise<ApiKey>;
  deleteApiKey(id: number): Promise<boolean>;

  // Project operations
  getProject(id: number): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<Project>): Promise<Project>;
  deleteProject(id: number): Promise<boolean>;

  // Agent operations
  getAgent(id: number): Promise<Agent | undefined>;
  getAgentsByProject(projectId: number): Promise<Agent[]>;
  getAgentsByType(type: AgentType): Promise<Agent[]>;
  getAllAgents(): Promise<Agent[]>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: number, agent: Partial<Agent>): Promise<Agent>;
  updateAgentStatus(id: number, status: AgentStatus): Promise<Agent>;
  deleteAgent(id: number): Promise<boolean>;

  // Activity Log operations
  getActivityLog(id: number): Promise<ActivityLog | undefined>;
  getActivityLogsByAgent(agentId: number): Promise<ActivityLog[]>;
  getRecentActivityLogs(limit: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;

  // Automation Task operations
  getAutomationTask(id: number): Promise<AutomationTask | undefined>;
  getAutomationTasksByAgent(agentId: number): Promise<AutomationTask[]>;
  getAllAutomationTasks(): Promise<AutomationTask[]>;
  createAutomationTask(task: InsertAutomationTask): Promise<AutomationTask>;
  updateAutomationTask(id: number, task: Partial<AutomationTask>): Promise<AutomationTask>;
  deleteAutomationTask(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private apiKeys: Map<number, ApiKey>;
  private projects: Map<number, Project>;
  private agents: Map<number, Agent>;
  private activityLogs: Map<number, ActivityLog>;
  private automationTasks: Map<number, AutomationTask>;
  
  private currentUserId: number;
  private currentApiKeyId: number;
  private currentProjectId: number;
  private currentAgentId: number;
  private currentActivityLogId: number;
  private currentAutomationTaskId: number;

  constructor() {
    this.users = new Map();
    this.apiKeys = new Map();
    this.projects = new Map();
    this.agents = new Map();
    this.activityLogs = new Map();
    this.automationTasks = new Map();

    this.currentUserId = 1;
    this.currentApiKeyId = 1;
    this.currentProjectId = 1;
    this.currentAgentId = 1;
    this.currentActivityLogId = 1;
    this.currentAutomationTaskId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  // API Key operations
  async getApiKey(id: number): Promise<ApiKey | undefined> {
    return this.apiKeys.get(id);
  }

  async getApiKeysByProject(projectId: number): Promise<ApiKey[]> {
    return Array.from(this.apiKeys.values()).filter(
      (key) => key.projectId === projectId,
    );
  }

  async getDefaultApiKey(): Promise<ApiKey | undefined> {
    return Array.from(this.apiKeys.values()).find(
      (key) => key.isDefault === true,
    );
  }

  async createApiKey(insertApiKey: InsertApiKey): Promise<ApiKey> {
    const id = this.currentApiKeyId++;
    const apiKey: ApiKey = { ...insertApiKey, id, createdAt: new Date() };
    this.apiKeys.set(id, apiKey);
    return apiKey;
  }

  async updateApiKey(id: number, apiKey: Partial<ApiKey>): Promise<ApiKey> {
    const existingApiKey = this.apiKeys.get(id);
    if (!existingApiKey) {
      throw new Error(`API Key with id ${id} not found`);
    }
    const updatedApiKey = { ...existingApiKey, ...apiKey };
    this.apiKeys.set(id, updatedApiKey);
    return updatedApiKey;
  }

  async deleteApiKey(id: number): Promise<boolean> {
    return this.apiKeys.delete(id);
  }

  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.currentProjectId++;
    const project: Project = { ...insertProject, id, createdAt: new Date() };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: number, project: Partial<Project>): Promise<Project> {
    const existingProject = this.projects.get(id);
    if (!existingProject) {
      throw new Error(`Project with id ${id} not found`);
    }
    const updatedProject = { ...existingProject, ...project };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Agent operations
  async getAgent(id: number): Promise<Agent | undefined> {
    return this.agents.get(id);
  }

  async getAgentsByProject(projectId: number): Promise<Agent[]> {
    return Array.from(this.agents.values()).filter(
      (agent) => agent.projectId === projectId,
    );
  }

  async getAgentsByType(type: AgentType): Promise<Agent[]> {
    return Array.from(this.agents.values()).filter(
      (agent) => agent.type === type,
    );
  }

  async getAllAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const id = this.currentAgentId++;
    const agent: Agent = { 
      ...insertAgent, 
      id, 
      createdAt: new Date(),
      lastActivity: null
    };
    this.agents.set(id, agent);
    return agent;
  }

  async updateAgent(id: number, agent: Partial<Agent>): Promise<Agent> {
    const existingAgent = this.agents.get(id);
    if (!existingAgent) {
      throw new Error(`Agent with id ${id} not found`);
    }
    const updatedAgent = { ...existingAgent, ...agent };
    this.agents.set(id, updatedAgent);
    return updatedAgent;
  }

  async updateAgentStatus(id: number, status: AgentStatus): Promise<Agent> {
    const existingAgent = this.agents.get(id);
    if (!existingAgent) {
      throw new Error(`Agent with id ${id} not found`);
    }
    const updatedAgent = { 
      ...existingAgent, 
      status,
      lastActivity: new Date() 
    };
    this.agents.set(id, updatedAgent);
    return updatedAgent;
  }

  async deleteAgent(id: number): Promise<boolean> {
    return this.agents.delete(id);
  }

  // Activity Log operations
  async getActivityLog(id: number): Promise<ActivityLog | undefined> {
    return this.activityLogs.get(id);
  }

  async getActivityLogsByAgent(agentId: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .filter((log) => log.agentId === agentId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getRecentActivityLogs(limit: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async createActivityLog(insertActivityLog: InsertActivityLog): Promise<ActivityLog> {
    const id = this.currentActivityLogId++;
    const activityLog: ActivityLog = { 
      ...insertActivityLog, 
      id, 
      timestamp: new Date() 
    };
    this.activityLogs.set(id, activityLog);
    return activityLog;
  }

  // Automation Task operations
  async getAutomationTask(id: number): Promise<AutomationTask | undefined> {
    return this.automationTasks.get(id);
  }

  async getAutomationTasksByAgent(agentId: number): Promise<AutomationTask[]> {
    return Array.from(this.automationTasks.values()).filter(
      (task) => task.agentId === agentId,
    );
  }

  async getAllAutomationTasks(): Promise<AutomationTask[]> {
    return Array.from(this.automationTasks.values());
  }

  async createAutomationTask(insertAutomationTask: InsertAutomationTask): Promise<AutomationTask> {
    const id = this.currentAutomationTaskId++;
    const automationTask: AutomationTask = { 
      ...insertAutomationTask, 
      id, 
      createdAt: new Date(),
      lastRun: null,
      nextRun: null 
    };
    this.automationTasks.set(id, automationTask);
    return automationTask;
  }

  async updateAutomationTask(id: number, task: Partial<AutomationTask>): Promise<AutomationTask> {
    const existingTask = this.automationTasks.get(id);
    if (!existingTask) {
      throw new Error(`Automation Task with id ${id} not found`);
    }
    const updatedTask = { ...existingTask, ...task };
    this.automationTasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteAutomationTask(id: number): Promise<boolean> {
    return this.automationTasks.delete(id);
  }
}

export const storage = new MemStorage();
