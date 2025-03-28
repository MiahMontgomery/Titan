import { log } from './vite';
import { IStorage } from './storage';
import {
  Project, InsertProject,
  Feature, InsertFeature,
  Milestone, InsertMilestone,
  Goal, InsertGoal,
  ActivityLog, InsertActivityLog,
  ExternalApi, InsertExternalApi,
  AgentTask, InsertAgentTask,
  WebAccount, InsertWebAccount,
  User, InsertUser
} from "@shared/schema";
import { join } from 'path';
import { JSONFileSync } from 'lowdb/node';
import { LowSync } from 'lowdb';

// Import the persona-related types
import {
  Persona,
  ChatMessage,
  ContentItem,
  BehaviorUpdate
} from "@shared/schema";

// The structure of our database
interface DatabaseSchema {
  users: User[];
  projects: Project[];
  features: Feature[];
  milestones: Milestone[];
  goals: Goal[];
  activityLogs: ActivityLog[];
  externalApis: ExternalApi[];
  agentTasks: AgentTask[];
  webAccounts: WebAccount[];
  personas: Persona[];
  chatMessages: ChatMessage[];
  contentItems: ContentItem[];
  behaviorUpdates: BehaviorUpdate[];
  
  // Counters for IDs
  nextUserId: number;
  nextProjectId: number;
  nextFeatureId: number;
  nextMilestoneId: number;
  nextGoalId: number;
  nextLogId: number;
  nextApiId: number;
  nextTaskId: number;
  nextAccountId: number;
}

// Create default database schema
const defaultData: DatabaseSchema = {
  users: [],
  projects: [],
  features: [],
  milestones: [],
  goals: [],
  activityLogs: [],
  externalApis: [],
  agentTasks: [],
  webAccounts: [],
  personas: [],
  chatMessages: [],
  contentItems: [],
  behaviorUpdates: [],
  
  nextUserId: 1,
  nextProjectId: 1,
  nextFeatureId: 1,
  nextMilestoneId: 1,
  nextGoalId: 1,
  nextLogId: 1,
  nextApiId: 1,
  nextTaskId: 1,
  nextAccountId: 1
};

// Singleton instance of our database
let db: LowSync<DatabaseSchema> | null = null;

// Initialize the database
function getDatabase(): LowSync<DatabaseSchema> {
  if (!db) {
    try {
      // Create data directory if it doesn't exist
      const dataDir = join(process.cwd(), 'data');
      const adapter = new JSONFileSync<DatabaseSchema>(join(dataDir, 'db.json'));
      db = new LowSync(adapter, defaultData);
      
      // Initialize and read data
      try {
        db.read();
        // If the db.data is null, this means the file was just created
        if (!db.data) {
          db.data = defaultData;
          db.write();
          log('LowDB database initialized with default schema', 'lowdb');
        }
      } catch (error) {
        log(`Error reading database, initializing with empty data: ${error}`, 'lowdb');
        db.data = defaultData;
        db.write();
      }
    } catch (error) {
      log(`Failed to initialize LowDB: ${error}`, 'lowdb');
      throw error;
    }
  }
  return db;
}

/**
 * LowDB Storage implementation
 */
export class LowDBStorage implements IStorage {
  private db: LowSync<DatabaseSchema>;
  
  constructor() {
    this.db = getDatabase();
    this.initSampleDataIfEmpty();
  }
  
  private initSampleDataIfEmpty() {
    if (this.db.data.projects.length === 0) {
      log('No projects found, initializing sample data...', 'lowdb');
      this.initSampleData();
    }
  }
  
  private async initSampleData() {
    try {
      // Create a sample user
      const user = await this.createUser({
        username: 'demo',
        email: 'demo@example.com',
        name: 'Demo User',
        password: 'password123'
      });
      
      // Create a sample project
      const project = await this.createProject({
        name: 'Sample Project',
        description: 'A sample project to demonstrate the system',
        lastUpdated: new Date(),
        isWorking: true,
        progress: 25,
        nextCheckIn: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        lastCheckIn: new Date(),
        priority: 1,
        projectType: 'web',
        agentConfig: {
          model: 'gpt-4o',
          maxTokens: 2000,
          temperature: 0.7,
        },
        autoMode: true,
        checkpoints: {}
      });
      
      // Create a sample feature
      const feature = await this.createFeature({
        projectId: project.id,
        name: 'User Authentication',
        description: 'Implement user authentication with JWT',
        status: 'in_progress',
        isWorking: true,
        progress: 35,
        priority: 1,
        estimatedDays: 3,
        startDate: new Date(),
        completionDate: null,
        dependencies: [],
        blockReason: null,
        implementationDetails: {
          framework: 'Express',
          library: 'jsonwebtoken'
        },
        optimizationRound: 0
      });
      
      // Create a sample milestone
      const milestone = await this.createMilestone({
        featureId: feature.id,
        name: 'Basic Authentication Flow',
        description: 'Implement login and registration endpoints',
        progress: 50,
        estimatedHours: 8,
        percentOfFeature: 40
      });
      
      // Create sample goals
      await this.createGoal({
        milestoneId: milestone.id,
        name: 'User Registration Endpoint',
        description: 'Create API endpoint for user registration',
        progress: 100,
        completed: true,
        percentOfMilestone: 50
      });
      
      await this.createGoal({
        milestoneId: milestone.id,
        name: 'User Login Endpoint',
        description: 'Create API endpoint for user login',
        progress: 0,
        completed: false,
        percentOfMilestone: 50
      });
      
      // Create activity logs
      await this.createActivityLog({
        projectId: project.id,
        message: 'Project created',
        activityType: 'creation',
        timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        isCheckpoint: true,
        codeSnippet: null,
        agentId: 'system',
        featureId: null,
        milestoneId: null,
        thinkingProcess: null
      });
      
      await this.createActivityLog({
        projectId: project.id,
        featureId: feature.id,
        message: 'Feature added: User Authentication',
        activityType: 'feature_added',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
        isCheckpoint: false,
        codeSnippet: null,
        agentId: 'system',
        milestoneId: null,
        thinkingProcess: null
      });
      
      log('Sample data initialized successfully', 'lowdb');
    } catch (error) {
      log(`Error initializing sample data: ${error}`, 'lowdb');
    }
  }
  
  // User Management
  async getUser(id: number): Promise<User | undefined> {
    return this.db.data.users.find(user => user.id === id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.db.data.users.find(user => user.username === username);
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.db.data.nextUserId++;
    const user: User = { ...insertUser, id };
    
    this.db.data.users.push(user);
    this.db.write();
    
    return user;
  }
  
  // Project Management
  async getAllProjects(): Promise<Project[]> {
    return this.db.data.projects;
  }
  
  async getProject(id: number): Promise<Project | undefined> {
    return this.db.data.projects.find(project => project.id === id);
  }
  
  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.db.data.nextProjectId++;
    const timestamp = new Date();
    
    const project: Project = {
      ...insertProject,
      id,
      isWorking: insertProject.isWorking ?? false,
      progress: insertProject.progress ?? 0,
      lastUpdated: insertProject.lastUpdated || timestamp,
      projectType: insertProject.projectType || 'generic',
      agentConfig: insertProject.agentConfig || {},
      autoMode: insertProject.autoMode ?? true, // Default to auto mode
      checkpoints: insertProject.checkpoints || {},
      priority: insertProject.priority ?? 0,
      lastCheckIn: insertProject.lastCheckIn || null,
      nextCheckIn: insertProject.nextCheckIn || null
    };
    
    this.db.data.projects.push(project);
    this.db.write();
    
    return project;
  }
  
  async updateProject(id: number, updateData: Partial<InsertProject>): Promise<Project | undefined> {
    const index = this.db.data.projects.findIndex(project => project.id === id);
    if (index === -1) return undefined;
    
    const updatedProject = {
      ...this.db.data.projects[index],
      ...updateData,
      lastUpdated: new Date()
    };
    
    this.db.data.projects[index] = updatedProject;
    this.db.write();
    
    return updatedProject;
  }
  
  async deleteProject(id: number): Promise<boolean> {
    const index = this.db.data.projects.findIndex(project => project.id === id);
    if (index === -1) return false;
    
    // Remove the project
    this.db.data.projects.splice(index, 1);
    
    // Remove related entities
    this.db.data.features = this.db.data.features.filter(f => f.projectId !== id);
    this.db.data.activityLogs = this.db.data.activityLogs.filter(log => log.projectId !== id);
    this.db.data.externalApis = this.db.data.externalApis.filter(api => api.projectId !== id);
    this.db.data.agentTasks = this.db.data.agentTasks.filter(task => task.projectId !== id);
    this.db.data.webAccounts = this.db.data.webAccounts.filter(acc => acc.projectId !== id);
    
    // Also remove milestones and goals related to this project
    const featureIds = this.db.data.features.filter(f => f.projectId === id).map(f => f.id);
    this.db.data.milestones = this.db.data.milestones.filter(m => !featureIds.includes(m.featureId));
    
    const milestoneIds = this.db.data.milestones.filter(m => featureIds.includes(m.featureId)).map(m => m.id);
    this.db.data.goals = this.db.data.goals.filter(g => !milestoneIds.includes(g.milestoneId));
    
    this.db.write();
    return true;
  }
  
  // Feature Management
  async getFeaturesByProject(projectId: number): Promise<Feature[]> {
    return this.db.data.features.filter(feature => feature.projectId === projectId);
  }
  
  async getFeature(id: number): Promise<Feature | undefined> {
    return this.db.data.features.find(feature => feature.id === id);
  }
  
  async createFeature(insertFeature: InsertFeature): Promise<Feature> {
    const id = this.db.data.nextFeatureId++;
    const timestamp = new Date();
    
    const feature: Feature = {
      ...insertFeature,
      id,
      description: insertFeature.description ?? null,
      progress: insertFeature.progress ?? 0,
      status: insertFeature.status || 'planned',
      isWorking: insertFeature.isWorking ?? false,
      priority: insertFeature.priority ?? 0,
      estimatedDays: insertFeature.estimatedDays ?? null,
      createdAt: insertFeature.createdAt || timestamp,
      startDate: insertFeature.startDate || null,
      completionDate: insertFeature.completionDate || null,
      dependencies: insertFeature.dependencies || [],
      blockReason: insertFeature.blockReason || null,
      implementationDetails: insertFeature.implementationDetails || {},
      optimizationRound: insertFeature.optimizationRound ?? 0,
      aiGenerated: insertFeature.aiGenerated ?? true
    };
    
    this.db.data.features.push(feature);
    
    // Update the project's lastUpdated field
    if (insertFeature.projectId) {
      const projectIndex = this.db.data.projects.findIndex(p => p.id === insertFeature.projectId);
      if (projectIndex !== -1) {
        this.db.data.projects[projectIndex].lastUpdated = timestamp;
      }
    }
    
    this.db.write();
    return feature;
  }
  
  async updateFeature(id: number, updateData: Partial<InsertFeature>): Promise<Feature | undefined> {
    const index = this.db.data.features.findIndex(feature => feature.id === id);
    if (index === -1) return undefined;
    
    const feature = this.db.data.features[index];
    const updatedFeature = { ...feature, ...updateData };
    
    this.db.data.features[index] = updatedFeature;
    
    // Update the project's lastUpdated field
    if (feature.projectId) {
      const projectIndex = this.db.data.projects.findIndex(p => p.id === feature.projectId);
      if (projectIndex !== -1) {
        this.db.data.projects[projectIndex].lastUpdated = new Date();
      }
    }
    
    this.db.write();
    return updatedFeature;
  }
  
  async deleteFeature(id: number): Promise<boolean> {
    const index = this.db.data.features.findIndex(feature => feature.id === id);
    if (index === -1) return false;
    
    const feature = this.db.data.features[index];
    
    // Remove the feature
    this.db.data.features.splice(index, 1);
    
    // Remove related milestones and goals
    this.db.data.milestones = this.db.data.milestones.filter(m => m.featureId !== id);
    
    const milestoneIds = this.db.data.milestones.filter(m => m.featureId === id).map(m => m.id);
    this.db.data.goals = this.db.data.goals.filter(g => !milestoneIds.includes(g.milestoneId));
    
    // Update the project's lastUpdated field
    if (feature.projectId) {
      const projectIndex = this.db.data.projects.findIndex(p => p.id === feature.projectId);
      if (projectIndex !== -1) {
        this.db.data.projects[projectIndex].lastUpdated = new Date();
      }
    }
    
    this.db.write();
    return true;
  }
  
  // Milestone Management
  async getMilestonesByFeature(featureId: number): Promise<Milestone[]> {
    return this.db.data.milestones.filter(milestone => milestone.featureId === featureId);
  }
  
  async getMilestone(id: number): Promise<Milestone | undefined> {
    return this.db.data.milestones.find(milestone => milestone.id === id);
  }
  
  async createMilestone(insertMilestone: InsertMilestone): Promise<Milestone> {
    const id = this.db.data.nextMilestoneId++;
    const timestamp = new Date();
    
    const milestone: Milestone = {
      ...insertMilestone,
      id,
      description: insertMilestone.description ?? null,
      progress: insertMilestone.progress ?? 0,
      createdAt: timestamp,
      estimatedHours: insertMilestone.estimatedHours ?? null,
      percentOfFeature: insertMilestone.percentOfFeature ?? 0
    };
    
    this.db.data.milestones.push(milestone);
    this.db.write();
    
    return milestone;
  }
  
  async updateMilestone(id: number, updateData: Partial<InsertMilestone>): Promise<Milestone | undefined> {
    const index = this.db.data.milestones.findIndex(milestone => milestone.id === id);
    if (index === -1) return undefined;
    
    const milestone = this.db.data.milestones[index];
    const updatedMilestone = { ...milestone, ...updateData };
    
    this.db.data.milestones[index] = updatedMilestone;
    
    // Update related entities
    await this.updateMilestoneProgress(id);
    
    this.db.write();
    return updatedMilestone;
  }
  
  async deleteMilestone(id: number): Promise<boolean> {
    const index = this.db.data.milestones.findIndex(milestone => milestone.id === id);
    if (index === -1) return false;
    
    const milestone = this.db.data.milestones[index];
    
    // Remove the milestone
    this.db.data.milestones.splice(index, 1);
    
    // Remove related goals
    this.db.data.goals = this.db.data.goals.filter(g => g.milestoneId !== id);
    
    // Update feature progress
    const featureId = milestone.featureId;
    await this.updateFeatureProgress(featureId);
    
    this.db.write();
    return true;
  }
  
  // Goal Management
  async getGoalsByMilestone(milestoneId: number): Promise<Goal[]> {
    return this.db.data.goals.filter(goal => goal.milestoneId === milestoneId);
  }
  
  async getGoal(id: number): Promise<Goal | undefined> {
    return this.db.data.goals.find(goal => goal.id === id);
  }
  
  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const id = this.db.data.nextGoalId++;
    
    const goal: Goal = {
      ...insertGoal,
      id,
      description: insertGoal.description ?? null,
      progress: insertGoal.progress ?? 0,
      createdAt: new Date(),
      completed: insertGoal.completed ?? false,
      percentOfMilestone: insertGoal.percentOfMilestone ?? 0
    };
    
    this.db.data.goals.push(goal);
    
    // Update milestone progress
    await this.updateMilestoneProgress(insertGoal.milestoneId);
    
    this.db.write();
    return goal;
  }
  
  async updateGoal(id: number, updateData: Partial<InsertGoal>): Promise<Goal | undefined> {
    const index = this.db.data.goals.findIndex(goal => goal.id === id);
    if (index === -1) return undefined;
    
    const goal = this.db.data.goals[index];
    const updatedGoal = { ...goal, ...updateData };
    
    this.db.data.goals[index] = updatedGoal;
    
    // Update milestone progress
    await this.updateMilestoneProgress(goal.milestoneId);
    
    this.db.write();
    return updatedGoal;
  }
  
  async deleteGoal(id: number): Promise<boolean> {
    const index = this.db.data.goals.findIndex(goal => goal.id === id);
    if (index === -1) return false;
    
    const goal = this.db.data.goals[index];
    
    // Remove the goal
    this.db.data.goals.splice(index, 1);
    
    // Update milestone progress
    await this.updateMilestoneProgress(goal.milestoneId);
    
    this.db.write();
    return true;
  }
  
  // Activity Logs
  async getActivityLogsByProject(projectId: number): Promise<ActivityLog[]> {
    return this.db.data.activityLogs.filter(log => log.projectId === projectId);
  }
  
  async getActivityLogsByFeature(featureId: number): Promise<ActivityLog[]> {
    return this.db.data.activityLogs.filter(log => log.featureId === featureId);
  }
  
  async getActivityLogCheckpoints(projectId: number): Promise<ActivityLog[]> {
    return this.db.data.activityLogs.filter(log => log.projectId === projectId && log.isCheckpoint === true);
  }
  
  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = this.db.data.nextLogId++;
    const timestamp = new Date();
    
    const log: ActivityLog = {
      ...insertLog,
      id,
      timestamp: insertLog.timestamp || timestamp,
      isCheckpoint: insertLog.isCheckpoint ?? false,
      featureId: insertLog.featureId ?? null,
      milestoneId: insertLog.milestoneId ?? null,
      codeSnippet: insertLog.codeSnippet ?? null,
      agentId: insertLog.agentId ?? null,
      activityType: insertLog.activityType ?? 'general',
      details: insertLog.details ?? null,
      urls: insertLog.urls ?? [],
      changes: insertLog.changes ?? null,
      thinkingProcess: insertLog.thinkingProcess ?? null
    };
    
    this.db.data.activityLogs.push(log);
    this.db.write();
    
    return log;
  }
  
  async createCheckpoint(insertLog: InsertActivityLog): Promise<ActivityLog> {
    return this.createActivityLog({
      ...insertLog,
      isCheckpoint: true,
      activityType: 'checkpoint'
    });
  }
  
  // External APIs
  async getExternalApisByProject(projectId: number): Promise<ExternalApi[]> {
    return this.db.data.externalApis.filter(api => api.projectId === projectId);
  }
  
  async getExternalApi(id: number): Promise<ExternalApi | undefined> {
    return this.db.data.externalApis.find(api => api.id === id);
  }
  
  async createExternalApi(api: InsertExternalApi): Promise<ExternalApi> {
    const id = this.db.data.nextApiId++;
    
    const externalApi: ExternalApi = {
      ...api,
      id,
      status: api.status || 'active',
      createdAt: new Date(),
      endpoint: api.endpoint ?? null,
      configData: api.configData ?? {},
      lastUsed: api.lastUsed ?? null,
      errorCount: api.errorCount ?? 0,
      lastError: api.lastError ?? null
    };
    
    this.db.data.externalApis.push(externalApi);
    this.db.write();
    
    return externalApi;
  }
  
  async updateExternalApi(id: number, updateData: Partial<InsertExternalApi>): Promise<ExternalApi | undefined> {
    const index = this.db.data.externalApis.findIndex(api => api.id === id);
    if (index === -1) return undefined;
    
    const api = this.db.data.externalApis[index];
    const updatedApi = { ...api, ...updateData };
    
    this.db.data.externalApis[index] = updatedApi;
    this.db.write();
    
    return updatedApi;
  }
  
  async deleteExternalApi(id: number): Promise<boolean> {
    const index = this.db.data.externalApis.findIndex(api => api.id === id);
    if (index === -1) return false;
    
    this.db.data.externalApis.splice(index, 1);
    this.db.write();
    
    return true;
  }
  
  // Agent Tasks
  async getTasksByProject(projectId: number): Promise<AgentTask[]> {
    return this.db.data.agentTasks.filter(task => task.projectId === projectId);
  }
  
  async getPendingTasks(projectId: number): Promise<AgentTask[]> {
    return this.db.data.agentTasks.filter(
      task => task.projectId === projectId && 
              (task.status === 'pending' || task.status === 'in_progress')
    );
  }
  
  async getTask(id: number): Promise<AgentTask | undefined> {
    return this.db.data.agentTasks.find(task => task.id === id);
  }
  
  async createTask(task: InsertAgentTask): Promise<AgentTask> {
    const id = this.db.data.nextTaskId++;
    const now = new Date();
    
    const agentTask: AgentTask = {
      ...task,
      id,
      status: task.status || 'pending',
      description: task.description ?? null,
      progress: task.progress ?? 0,
      priority: task.priority ?? 1,
      createdAt: now,
      featureId: task.featureId ?? null,
      assignedAgent: task.assignedAgent ?? 'system',
      result: task.result ?? null,
      errorDetails: task.errorDetails ?? null,
      deadline: task.deadline ?? null,
      startTime: task.startTime ?? null,
      completionTime: task.completionTime ?? null,
      parentTaskId: task.parentTaskId ?? null
    };
    
    this.db.data.agentTasks.push(agentTask);
    this.db.write();
    
    return agentTask;
  }
  
  async updateTask(id: number, updateData: Partial<InsertAgentTask>): Promise<AgentTask | undefined> {
    const index = this.db.data.agentTasks.findIndex(task => task.id === id);
    if (index === -1) return undefined;
    
    const task = this.db.data.agentTasks[index];
    const updatedTask = { ...task, ...updateData };
    
    this.db.data.agentTasks[index] = updatedTask;
    this.db.write();
    
    return updatedTask;
  }
  
  async completeTask(id: number, result: any): Promise<AgentTask | undefined> {
    const index = this.db.data.agentTasks.findIndex(task => task.id === id);
    if (index === -1) return undefined;
    
    const task = this.db.data.agentTasks[index];
    const updatedTask = { 
      ...task, 
      status: 'completed', 
      progress: 100,
      completionDetails: result
    };
    
    this.db.data.agentTasks[index] = updatedTask;
    this.db.write();
    
    return updatedTask;
  }
  
  async failTask(id: number, errorDetails: string): Promise<AgentTask | undefined> {
    const index = this.db.data.agentTasks.findIndex(task => task.id === id);
    if (index === -1) return undefined;
    
    const task = this.db.data.agentTasks[index];
    const updatedTask = { 
      ...task, 
      status: 'failed',
      errorDetails
    };
    
    this.db.data.agentTasks[index] = updatedTask;
    this.db.write();
    
    return updatedTask;
  }
  
  // Web Accounts
  async getWebAccountsByProject(projectId: number): Promise<WebAccount[]> {
    return this.db.data.webAccounts.filter(account => account.projectId === projectId);
  }
  
  async getWebAccounts(projectId: number): Promise<WebAccount[]> {
    // Alias for getWebAccountsByProject for consistency with the IStorage interface
    return this.getWebAccountsByProject(projectId);
  }
  
  async getWebAccount(id: number): Promise<WebAccount | undefined> {
    return this.db.data.webAccounts.find(account => account.id === id);
  }
  
  async createWebAccount(account: InsertWebAccount): Promise<WebAccount> {
    const id = this.db.data.nextAccountId++;
    
    const webAccount: WebAccount = {
      ...account,
      id,
      status: account.status || 'active',
      createdAt: new Date(),
      profileUrl: account.profileUrl ?? null,
      accountType: account.accountType || 'standard', // Ensure accountType is always set
      lastActivity: account.lastActivity ?? null,
      cookies: account.cookies ?? {}
    };
    
    this.db.data.webAccounts.push(webAccount);
    this.db.write();
    
    return webAccount;
  }
  
  async updateWebAccount(id: number, updateData: Partial<InsertWebAccount>): Promise<WebAccount | undefined> {
    const index = this.db.data.webAccounts.findIndex(account => account.id === id);
    if (index === -1) return undefined;
    
    const account = this.db.data.webAccounts[index];
    const updatedAccount = { ...account, ...updateData };
    
    this.db.data.webAccounts[index] = updatedAccount;
    this.db.write();
    
    return updatedAccount;
  }
  
  async deleteWebAccount(id: number): Promise<boolean> {
    const index = this.db.data.webAccounts.findIndex(account => account.id === id);
    if (index === -1) return false;
    
    this.db.data.webAccounts.splice(index, 1);
    this.db.write();
    
    return true;
  }
  
  // Persona Management
  async getPersonasByProject(projectId: number): Promise<Persona[]> {
    return this.db.data.personas.filter(persona => persona.projectId === projectId);
  }
  
  async getPersona(id: string): Promise<Persona | undefined> {
    return this.db.data.personas.find(persona => persona.id === id);
  }
  
  async createPersona(persona: Omit<Persona, "id" | "createdAt" | "updatedAt">): Promise<Persona> {
    const timestamp = new Date();
    
    // Set default values for required fields if not provided
    const personaWithDefaults = {
      ...persona,
      isActive: persona.isActive !== undefined ? persona.isActive : true,
    };
    
    const newPersona: Persona = {
      id: crypto.randomUUID ? crypto.randomUUID() : `persona-${Date.now()}`,
      createdAt: timestamp,
      updatedAt: timestamp,
      ...personaWithDefaults,
    };
    
    this.db.data.personas.push(newPersona);
    this.db.write();
    
    return newPersona;
  }
  
  async updatePersona(id: string, updateData: Partial<Persona>): Promise<Persona | undefined> {
    const index = this.db.data.personas.findIndex(persona => persona.id === id);
    if (index === -1) return undefined;
    
    const persona = this.db.data.personas[index];
    const updatedPersona = { 
      ...persona, 
      ...updateData,
      updatedAt: new Date()
    };
    
    this.db.data.personas[index] = updatedPersona;
    this.db.write();
    
    return updatedPersona;
  }
  
  async togglePersonaActive(id: string, isActive: boolean): Promise<Persona | undefined> {
    const index = this.db.data.personas.findIndex(persona => persona.id === id);
    if (index === -1) return undefined;
    
    const persona = this.db.data.personas[index];
    const updatedPersona = { 
      ...persona, 
      isActive,
      updatedAt: new Date()
    };
    
    this.db.data.personas[index] = updatedPersona;
    this.db.write();
    
    return updatedPersona;
  }
  
  async deletePersona(id: string): Promise<boolean> {
    const index = this.db.data.personas.findIndex(persona => persona.id === id);
    if (index === -1) return false;
    
    // Remove the persona
    this.db.data.personas.splice(index, 1);
    
    // Convert id to number for comparison with personaId in related collections
    const idNum = parseInt(id, 10);
    
    // Also remove related chat messages, content items, and behavior updates
    // Handle both string and number ID types
    this.db.data.chatMessages = this.db.data.chatMessages.filter(msg => {
      if (typeof msg.personaId === 'number') {
        return msg.personaId !== idNum;
      }
      return msg.personaId !== id;
    });
    
    this.db.data.contentItems = this.db.data.contentItems.filter(item => {
      if (typeof item.personaId === 'number') {
        return item.personaId !== idNum;
      }
      return item.personaId !== id;
    });
    
    this.db.data.behaviorUpdates = this.db.data.behaviorUpdates.filter(update => {
      if (typeof update.personaId === 'number') {
        return update.personaId !== idNum;
      }
      return update.personaId !== id;
    });
    
    this.db.write();
    return true;
  }
  
  // Chat Message Management
  async getChatMessagesByPersona(personaId: string): Promise<ChatMessage[]> {
    // Convert string ID to number for comparison
    const personaIdNum = parseInt(personaId, 10);
    return this.db.data.chatMessages.filter(msg => msg.personaId === personaIdNum);
  }
  
  async getChatMessage(id: string): Promise<ChatMessage | undefined> {
    return this.db.data.chatMessages.find(msg => msg.id === id);
  }
  
  async createChatMessage(message: Omit<ChatMessage, "id" | "timestamp">): Promise<ChatMessage> {
    const newMessage: ChatMessage = {
      id: crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`,
      timestamp: new Date(),
      ...message,
    };
    
    this.db.data.chatMessages.push(newMessage);
    this.db.write();
    
    return newMessage;
  }
  
  async deleteChatMessage(id: string): Promise<boolean> {
    const index = this.db.data.chatMessages.findIndex(msg => msg.id === id);
    if (index === -1) return false;
    
    this.db.data.chatMessages.splice(index, 1);
    this.db.write();
    
    return true;
  }
  
  // Content Item Management
  async getContentItemsByPersona(personaId: string): Promise<ContentItem[]> {
    // Convert string ID to number for comparison
    const personaIdNum = parseInt(personaId, 10);
    return this.db.data.contentItems.filter(item => item.personaId === personaIdNum);
  }
  
  async getContentItem(id: string): Promise<ContentItem | undefined> {
    return this.db.data.contentItems.find(item => item.id === id);
  }
  
  async createContentItem(content: Omit<ContentItem, "id" | "createdAt">): Promise<ContentItem> {
    const timestamp = new Date();
    const newContent: ContentItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : `content-${Date.now()}`,
      createdAt: timestamp,
      ...content,
    };
    
    this.db.data.contentItems.push(newContent);
    this.db.write();
    
    return newContent;
  }
  
  async updateContentItem(id: string, updateData: Partial<ContentItem>): Promise<ContentItem | undefined> {
    const index = this.db.data.contentItems.findIndex(item => item.id === id);
    if (index === -1) return undefined;
    
    const content = this.db.data.contentItems[index];
    const updatedContent = { ...content, ...updateData };
    
    this.db.data.contentItems[index] = updatedContent;
    this.db.write();
    
    return updatedContent;
  }
  
  async deleteContentItem(id: string): Promise<boolean> {
    const index = this.db.data.contentItems.findIndex(item => item.id === id);
    if (index === -1) return false;
    
    this.db.data.contentItems.splice(index, 1);
    this.db.write();
    
    return true;
  }
  
  // Behavior Update Management
  async getBehaviorUpdatesByPersona(personaId: string): Promise<BehaviorUpdate[]> {
    // Convert string ID to number for comparison
    const personaIdNum = parseInt(personaId, 10);
    return this.db.data.behaviorUpdates.filter(update => update.personaId === personaIdNum);
  }
  
  async getBehaviorUpdate(id: string): Promise<BehaviorUpdate | undefined> {
    return this.db.data.behaviorUpdates.find(update => update.id === id);
  }
  
  async createBehaviorUpdate(update: Omit<BehaviorUpdate, "id" | "timestamp">): Promise<BehaviorUpdate> {
    const newUpdate: BehaviorUpdate = {
      id: crypto.randomUUID ? crypto.randomUUID() : `update-${Date.now()}`,
      timestamp: new Date(),
      ...update,
    };
    
    this.db.data.behaviorUpdates.push(newUpdate);
    this.db.write();
    
    return newUpdate;
  }
  
  async updateBehaviorUpdateStatus(id: string, status: "pending" | "applied" | "rejected"): Promise<BehaviorUpdate | undefined> {
    const index = this.db.data.behaviorUpdates.findIndex(update => update.id === id);
    if (index === -1) return undefined;
    
    const update = this.db.data.behaviorUpdates[index];
    const updatedUpdate = { ...update, status };
    
    this.db.data.behaviorUpdates[index] = updatedUpdate;
    this.db.write();
    
    return updatedUpdate;
  }
  
  async applyBehaviorUpdate(id: string): Promise<BehaviorUpdate | undefined> {
    const updateIndex = this.db.data.behaviorUpdates.findIndex(update => update.id === id);
    if (updateIndex === -1) return undefined;
    
    const update = this.db.data.behaviorUpdates[updateIndex];
    
    // Find the persona this update belongs to - convert personaId to string if needed
    const personaIndex = this.db.data.personas.findIndex(persona => {
      if (typeof persona.id === 'string' && typeof update.personaId === 'number') {
        return persona.id === update.personaId.toString();
      } else if (typeof persona.id === 'number' && typeof update.personaId === 'string') {
        return persona.id.toString() === update.personaId;
      }
      return persona.id === update.personaId;
    });
    
    if (personaIndex === -1) return undefined;
    
    const persona = this.db.data.personas[personaIndex];
    
    // Apply the new instructions to the persona's behavior
    const updatedPersona = {
      ...persona,
      behavior: {
        ...persona.behavior,
        instructions: update.newInstructions,
        lastUpdated: new Date()
      },
      updatedAt: new Date()
    };
    
    // Mark the update as applied
    const appliedUpdate = {
      ...update,
      status: "applied" as const
    };
    
    // Save changes
    this.db.data.personas[personaIndex] = updatedPersona;
    this.db.data.behaviorUpdates[updateIndex] = appliedUpdate;
    this.db.write();
    
    return appliedUpdate;
  }
  
  async deleteBehaviorUpdate(id: string): Promise<boolean> {
    const index = this.db.data.behaviorUpdates.findIndex(update => update.id === id);
    if (index === -1) return false;
    
    this.db.data.behaviorUpdates.splice(index, 1);
    this.db.write();
    
    return true;
  }
  
  // Helper methods to update progress
  private async updateMilestoneProgress(milestoneId: number): Promise<void> {
    const milestone = this.db.data.milestones.find(m => m.id === milestoneId);
    if (!milestone) return;
    
    const goals = this.db.data.goals.filter(g => g.milestoneId === milestoneId);
    
    if (goals.length === 0) {
      // No goals, set progress to 0
      milestone.progress = 0;
    } else {
      // Calculate weighted progress based on percentOfMilestone
      let totalWeight = 0;
      let weightedProgress = 0;
      
      for (const goal of goals) {
        const weight = goal.percentOfMilestone || 1;
        totalWeight += weight;
        weightedProgress += (goal.progress * weight);
      }
      
      milestone.progress = totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0;
    }
    
    // Update the feature progress
    await this.updateFeatureProgress(milestone.featureId);
  }
  
  private async updateFeatureProgress(featureId: number): Promise<void> {
    const feature = this.db.data.features.find(f => f.id === featureId);
    if (!feature) return;
    
    const milestones = this.db.data.milestones.filter(m => m.featureId === featureId);
    
    if (milestones.length === 0) {
      // No milestones, set progress to 0
      feature.progress = 0;
    } else {
      // Calculate weighted progress based on percentOfFeature
      let totalWeight = 0;
      let weightedProgress = 0;
      
      for (const milestone of milestones) {
        const weight = milestone.percentOfFeature || 1;
        totalWeight += weight;
        weightedProgress += (milestone.progress * weight);
      }
      
      feature.progress = totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0;
    }
    
    // Update the project progress
    if (feature.projectId) {
      await this.updateProjectProgress(feature.projectId);
    }
  }
  
  private async updateProjectProgress(projectId: number): Promise<void> {
    const project = this.db.data.projects.find(p => p.id === projectId);
    if (!project) return;
    
    const features = this.db.data.features.filter(f => f.projectId === projectId);
    
    if (features.length === 0) {
      // No features, set progress to 0
      project.progress = 0;
    } else {
      // Calculate simple average for project progress
      const totalProgress = features.reduce((sum, f) => sum + f.progress, 0);
      project.progress = Math.round(totalProgress / features.length);
    }
    
    // Update last updated timestamp
    project.lastUpdated = new Date();
    this.db.write();
  }
}

// Create and export a singleton instance
export const lowdbStorage = new LowDBStorage();