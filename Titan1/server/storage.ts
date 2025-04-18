<<<<<<< HEAD
import {
  Project, InsertProject,
  Feature, InsertFeature,
  Milestone, InsertMilestone,
  Goal, InsertGoal,
  ActivityLog, InsertActivityLog,
  User, InsertUser,
  ExternalApi, InsertExternalApi,
  AgentTask, InsertAgentTask,
  WebAccount, InsertWebAccount,
  DBPersona, InsertDBPersona, 
  DBChatMessage, InsertDBChatMessage,
  DBContentItem, InsertDBContentItem,
  DBBehaviorUpdate, InsertDBBehaviorUpdate,
  Persona, ChatMessage, ContentItem, BehaviorUpdate
} from "@shared/schema";

export interface IStorage {
  // User management (keeping this for compatibility)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project management
  getAllProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Feature management
  getFeaturesByProject(projectId: number): Promise<Feature[]>;
  getFeature(id: number): Promise<Feature | undefined>;
  createFeature(feature: InsertFeature): Promise<Feature>;
  updateFeature(id: number, feature: Partial<InsertFeature>): Promise<Feature | undefined>;
  deleteFeature(id: number): Promise<boolean>;
  
  // Milestone management
  getMilestonesByFeature(featureId: number): Promise<Milestone[]>;
  getMilestone(id: number): Promise<Milestone | undefined>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  updateMilestone(id: number, milestone: Partial<InsertMilestone>): Promise<Milestone | undefined>;
  deleteMilestone(id: number): Promise<boolean>;
  
  // Goal management
  getGoalsByMilestone(milestoneId: number): Promise<Goal[]>;
  getGoal(id: number): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goal: Partial<InsertGoal>): Promise<Goal | undefined>;
  deleteGoal(id: number): Promise<boolean>;
  
  // Activity logs
  getActivityLogsByProject(projectId: number): Promise<ActivityLog[]>;
  getActivityLogsByFeature(featureId: number): Promise<ActivityLog[]>;
  getActivityLogCheckpoints(projectId: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  createCheckpoint(log: InsertActivityLog): Promise<ActivityLog>;
  
  // External APIs
  getExternalApisByProject(projectId: number): Promise<ExternalApi[]>;
  getExternalApi(id: number): Promise<ExternalApi | undefined>;
  createExternalApi(api: InsertExternalApi): Promise<ExternalApi>;
  updateExternalApi(id: number, api: Partial<InsertExternalApi>): Promise<ExternalApi | undefined>;
  deleteExternalApi(id: number): Promise<boolean>;
  
  // Agent Tasks
  getTasksByProject(projectId: number): Promise<AgentTask[]>;
  getPendingTasks(projectId: number): Promise<AgentTask[]>;
  getTask(id: number): Promise<AgentTask | undefined>;
  createTask(task: InsertAgentTask): Promise<AgentTask>;
  updateTask(id: number, task: Partial<InsertAgentTask>): Promise<AgentTask | undefined>;
  completeTask(id: number, result: any): Promise<AgentTask | undefined>;
  failTask(id: number, errorDetails: string): Promise<AgentTask | undefined>;
  
  // Web Accounts
  getWebAccountsByProject(projectId: number): Promise<WebAccount[]>;
  getWebAccount(id: number): Promise<WebAccount | undefined>;
  getWebAccounts(projectId: number): Promise<WebAccount[]>; // Alias for getWebAccountsByProject
  createWebAccount(account: InsertWebAccount): Promise<WebAccount>;
  updateWebAccount(id: number, account: Partial<InsertWebAccount>): Promise<WebAccount | undefined>;
  deleteWebAccount(id: number): Promise<boolean>;
  
  // Personas
  getPersonasByProject(projectId: number): Promise<Persona[]>;
  getPersona(id: string): Promise<Persona | undefined>;
  createPersona(persona: Omit<Persona, "id" | "createdAt" | "updatedAt">): Promise<Persona>;
  updatePersona(id: string, data: Partial<Persona>): Promise<Persona | undefined>;
  deletePersona(id: string): Promise<boolean>;
  togglePersonaActive(id: string, isActive: boolean): Promise<Persona | undefined>;
  
  // Chat Messages
  getChatMessagesByPersona(personaId: string): Promise<ChatMessage[]>;
  getChatMessage(id: string): Promise<ChatMessage | undefined>;
  createChatMessage(message: Omit<ChatMessage, "id" | "timestamp">): Promise<ChatMessage>;
  deleteChatMessage(id: string): Promise<boolean>;
  
  // Content Items
  getContentItemsByPersona(personaId: string): Promise<ContentItem[]>;
  getContentItem(id: string): Promise<ContentItem | undefined>;
  createContentItem(item: Omit<ContentItem, "id" | "createdAt">): Promise<ContentItem>;
  updateContentItem(id: string, data: Partial<ContentItem>): Promise<ContentItem | undefined>;
  deleteContentItem(id: string): Promise<boolean>;
  
  // Behavior Updates
  getBehaviorUpdatesByPersona(personaId: string): Promise<BehaviorUpdate[]>;
  getBehaviorUpdate(id: string): Promise<BehaviorUpdate | undefined>;
  createBehaviorUpdate(update: Omit<BehaviorUpdate, "id" | "timestamp">): Promise<BehaviorUpdate>;
  applyBehaviorUpdate(id: string): Promise<BehaviorUpdate | undefined>;
=======
import { users, type User, type InsertUser } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
>>>>>>> 1d84bc7 (Set up Node.js project for Titan AI assistant.)
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
<<<<<<< HEAD
  private projects: Map<number, Project>;
  private features: Map<number, Feature>;
  private milestones: Map<number, Milestone>;
  private goals: Map<number, Goal>;
  private activityLogs: Map<number, ActivityLog>;
  private externalApis: Map<number, ExternalApi>;
  private agentTasks: Map<number, AgentTask>;
  private webAccounts: Map<number, WebAccount>;
  
  // Persona system storage
  private personas: Map<string, Persona>;
  private chatMessages: Map<string, ChatMessage>;
  private contentItems: Map<string, ContentItem>;
  private behaviorUpdates: Map<string, BehaviorUpdate>;
  
  private userId: number;
  private projectId: number;
  private featureId: number;
  private milestoneId: number;
  private goalId: number;
  private logId: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.features = new Map();
    this.milestones = new Map();
    this.goals = new Map();
    this.activityLogs = new Map();
    this.externalApis = new Map();
    this.agentTasks = new Map();
    this.webAccounts = new Map();
    
    // Initialize persona system storage
    this.personas = new Map();
    this.chatMessages = new Map();
    this.contentItems = new Map();
    this.behaviorUpdates = new Map();
    
    this.userId = 0;
    this.projectId = 0;
    this.featureId = 0;
    this.milestoneId = 0;
    this.goalId = 0;
    this.logId = 0;
    
    // We no longer initialize sample data in the constructor
    // Sample data is now handled in routes.ts when needed
  }
  
  private async initSampleDataIfEmpty() {
    // First check if any projects already exist
    const existingProjects = await this.getAllProjects();
    if (existingProjects.length > 0) {
      console.log(`Found ${existingProjects.length} existing projects, skipping sample data initialization.`);
      return;
    }
    
    // If no projects exist, initialize sample data
    await this.initSampleData();
  }

  private async initSampleData() {
    // Create test users
    await this.createUser({
      username: "admin",
      password: "password",
      email: "admin@example.com",
      name: "Admin User"
    });
    
    // Sample projects with async/await to ensure we get the actual IDs
    const project1 = await this.createProject({
      name: "E-Commerce Website",
      description: "Build a full-featured e-commerce website with product catalog, cart, and checkout",
      isWorking: true,
      progress: 45,
      autoMode: true, // Enable autonomous mode
      lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    });
    
    const project2 = await this.createProject({
      name: "Mobile App",
      description: "Develop a cross-platform mobile application",
      isWorking: false,
      progress: 70,
      autoMode: false,
      lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    });
    
    const project3 = await this.createProject({
      name: "Content Management System",
      description: "Create a CMS for managing digital content",
      isWorking: true,
      progress: 20,
      autoMode: true, // Enable autonomous mode
      lastUpdated: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
    });
    
    console.log("Created projects:", project1.id, project2.id, project3.id);

    // Sample features for first project
    const feature1 = await this.createFeature({
      projectId: project1.id,
      name: "User Authentication System",
      description: "Implement secure login and registration",
      progress: 25
    });
    
    const feature2 = await this.createFeature({
      projectId: project1.id,
      name: "Product Catalog",
      description: "Product listings with search and filter",
      progress: 90
    });
    
    const feature3 = await this.createFeature({
      projectId: project1.id,
      name: "Shopping Cart",
      description: "Add/remove items and checkout process",
      progress: 15
    });
    
    console.log("Created features for project", project1.id, ":", feature1.id, feature2.id, feature3.id);

    // Sample milestones for first feature
    const milestone1 = await this.createMilestone({
      featureId: feature1.id,
      name: "Setup user database schema",
      description: "Define user model with required fields",
      estimatedHours: 8
    });
    
    const milestone2 = await this.createMilestone({
      featureId: feature1.id,
      name: "Implement login/signup forms",
      description: "Create responsive forms with validation",
      estimatedHours: 12
    });
    
    const milestone3 = await this.createMilestone({
      featureId: feature1.id,
      name: "Setup authentication middleware",
      description: "Implement JWT token-based auth",
      estimatedHours: 10
    });
    
    console.log("Created milestones for feature", feature1.id, ":", milestone1.id, milestone2.id, milestone3.id);

    // Sample goals for first milestone
    const goal1 = await this.createGoal({
      milestoneId: milestone1.id,
      name: "Define user model with required fields",
      progress: 100
    });
    
    const goal2 = await this.createGoal({
      milestoneId: milestone1.id,
      name: "Setup password hashing and security",
      progress: 95
    });
    
    const goal3 = await this.createGoal({
      milestoneId: milestone1.id,
      name: "Create database migrations",
      progress: 90
    });

    // Sample goals for second milestone
    const goal4 = await this.createGoal({
      milestoneId: milestone2.id,
      name: "Design responsive login form",
      progress: 85
    });
    
    const goal5 = await this.createGoal({
      milestoneId: milestone2.id,
      name: "Implement form validation",
      progress: 20
    });
    
    const goal6 = await this.createGoal({
      milestoneId: milestone2.id,
      name: "Connect to authentication API",
      progress: 30
    });
    
    console.log("Created goals for milestones");

    // Sample activity logs
    const log1 = await this.createActivityLog({
      projectId: project1.id,
      message: "Started working on login form validation",
      timestamp: new Date(Date.now() - 40 * 60 * 1000), // 40 minutes ago
      agentId: "agent-1",
      codeSnippet: `function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}`
    });
    
    const log2 = await this.createActivityLog({
      projectId: project1.id,
      message: "Completed database schema design",
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      agentId: "agent-2",
      codeSnippet: null
    });
    
    console.log("Created activity logs");
    console.log("Sample data initialization complete!");
  }

  // User management
=======
  currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
  }

>>>>>>> 1d84bc7 (Set up Node.js project for Titan AI assistant.)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
<<<<<<< HEAD
    const id = this.userId++;
=======
    const id = this.currentId++;
>>>>>>> 1d84bc7 (Set up Node.js project for Titan AI assistant.)
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
<<<<<<< HEAD

  // Project management
  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.projectId++;
    const timestamp = new Date();
    
    const project: Project = { 
      ...insertProject, 
      id,
      isWorking: insertProject.isWorking ?? false,
      progress: insertProject.progress ?? 0,
      lastUpdated: insertProject.lastUpdated || timestamp,
      projectType: insertProject.projectType || 'generic',
      agentConfig: insertProject.agentConfig || {},
      autoMode: insertProject.autoMode ?? false,
      checkpoints: insertProject.checkpoints || {},
      priority: insertProject.priority ?? 0,
      lastCheckIn: insertProject.lastCheckIn || null,
      nextCheckIn: insertProject.nextCheckIn || null
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: number, updateData: Partial<InsertProject>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;

    const updatedProject: Project = { 
      ...project, 
      ...updateData,
      lastUpdated: new Date()
    };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Feature management
  async getFeaturesByProject(projectId: number): Promise<Feature[]> {
    return Array.from(this.features.values()).filter(feature => feature.projectId === projectId);
  }

  async getFeature(id: number): Promise<Feature | undefined> {
    return this.features.get(id);
  }

  async createFeature(insertFeature: InsertFeature): Promise<Feature> {
    const id = this.featureId++;
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
      blockReason: insertFeature.blockReason ?? null,
      implementationDetails: insertFeature.implementationDetails || {},
      optimizationRound: insertFeature.optimizationRound ?? 0
    };
    this.features.set(id, feature);
    return feature;
  }

  async updateFeature(id: number, updateData: Partial<InsertFeature>): Promise<Feature | undefined> {
    const feature = this.features.get(id);
    if (!feature) return undefined;

    const updatedFeature: Feature = { ...feature, ...updateData };
    this.features.set(id, updatedFeature);
    
    // Update project's last updated timestamp
    if (feature.projectId) {
      const project = this.projects.get(feature.projectId);
      if (project) {
        this.projects.set(feature.projectId, {
          ...project,
          lastUpdated: new Date()
        });
      }
    }
    
    return updatedFeature;
  }

  async deleteFeature(id: number): Promise<boolean> {
    return this.features.delete(id);
  }

  // Milestone management
  async getMilestonesByFeature(featureId: number): Promise<Milestone[]> {
    return Array.from(this.milestones.values()).filter(milestone => milestone.featureId === featureId);
  }

  async getMilestone(id: number): Promise<Milestone | undefined> {
    return this.milestones.get(id);
  }

  async createMilestone(insertMilestone: InsertMilestone): Promise<Milestone> {
    const id = this.milestoneId++;
    const milestone: Milestone = { 
      ...insertMilestone, 
      id,
      description: insertMilestone.description ?? null,
      estimatedHours: insertMilestone.estimatedHours ?? null,
      progress: insertMilestone.progress ?? 0
    };
    this.milestones.set(id, milestone);
    return milestone;
  }

  async updateMilestone(id: number, updateData: Partial<InsertMilestone>): Promise<Milestone | undefined> {
    const milestone = this.milestones.get(id);
    if (!milestone) return undefined;

    const updatedMilestone: Milestone = { ...milestone, ...updateData };
    this.milestones.set(id, updatedMilestone);
    
    return updatedMilestone;
  }

  async deleteMilestone(id: number): Promise<boolean> {
    return this.milestones.delete(id);
  }

  // Goal management
  async getGoalsByMilestone(milestoneId: number): Promise<Goal[]> {
    return Array.from(this.goals.values()).filter(goal => goal.milestoneId === milestoneId);
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    return this.goals.get(id);
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const id = this.goalId++;
    const goal: Goal = { 
      ...insertGoal, 
      id,
      progress: insertGoal.progress ?? 0
    };
    this.goals.set(id, goal);
    return goal;
  }

  async updateGoal(id: number, updateData: Partial<InsertGoal>): Promise<Goal | undefined> {
    const goal = this.goals.get(id);
    if (!goal) return undefined;

    const updatedGoal: Goal = { ...goal, ...updateData };
    this.goals.set(id, updatedGoal);
    
    // Update milestone progress when goal progress changes
    if (updateData.progress !== undefined && goal.milestoneId) {
      const milestone = this.milestones.get(goal.milestoneId);
      
      if (milestone && milestone.featureId) {
        // Calculate milestone progress based on the average progress of all related goals
        const goals = await this.getGoalsByMilestone(milestone.id);
        if (goals.length > 0) {
          let totalProgress = 0;
          goals.forEach(g => totalProgress += g.progress);
          const milestoneProgress = Math.round(totalProgress / goals.length);
          
          // Update the milestone's progress
          await this.updateMilestone(milestone.id, { progress: milestoneProgress });
          
          // Get the feature and update its progress
          const feature = this.features.get(milestone.featureId);
          if (feature) {
            // Calculate feature progress based on the average progress of all related milestones
            const milestones = await this.getMilestonesByFeature(feature.id);
            if (milestones.length > 0) {
              let totalMilestoneProgress = 0;
              milestones.forEach(m => totalMilestoneProgress += m.progress);
              const featureProgress = Math.round(totalMilestoneProgress / milestones.length);
              
              // Update the feature's progress
              await this.updateFeature(feature.id, { progress: featureProgress });
              
              // Update project progress based on feature progress
              if (feature.projectId) {
                const project = this.projects.get(feature.projectId);
                if (project) {
                  const features = await this.getFeaturesByProject(project.id);
                  if (features.length > 0) {
                    let totalFeatureProgress = 0;
                    features.forEach(f => totalFeatureProgress += f.progress);
                    const projectProgress = Math.round(totalFeatureProgress / features.length);
                    
                    // Update the project's progress
                    await this.updateProject(project.id, { 
                      progress: projectProgress,
                      lastUpdated: new Date()
                    });
                  }
                }
              }
            }
          }
        }
      }
    }
    
    return updatedGoal;
  }

  async deleteGoal(id: number): Promise<boolean> {
    return this.goals.delete(id);
  }

  // Activity logs
  async getActivityLogsByProject(projectId: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .filter(log => log.projectId === projectId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  async getActivityLogsByFeature(featureId: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .filter(log => log.featureId === featureId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  async getActivityLogCheckpoints(projectId: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .filter(log => log.projectId === projectId && log.activityType === 'checkpoint')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = this.logId++;
    const log: ActivityLog = { 
      ...insertLog, 
      id,
      timestamp: insertLog.timestamp || new Date(),
      agentId: insertLog.agentId ?? null,
      codeSnippet: insertLog.codeSnippet ?? null,
      featureId: insertLog.featureId ?? null,
      milestoneId: insertLog.milestoneId ?? null,
      activityType: insertLog.activityType || 'general',
      importance: insertLog.importance ?? 'normal',
      details: insertLog.details || {},
      reasoning: insertLog.reasoning ?? null,
      thinkingProcess: insertLog.thinkingProcess ?? null
    };
    this.activityLogs.set(id, log);
    
    // Update project's last updated timestamp
    const project = this.projects.get(insertLog.projectId);
    if (project) {
      this.updateProject(project.id, { lastUpdated: log.timestamp });
    }
    
    return log;
  }
  
  async createCheckpoint(insertLog: InsertActivityLog): Promise<ActivityLog> {
    return this.createActivityLog({
      ...insertLog,
      activityType: 'checkpoint',
      importance: 'high'
    });
  }
  
  // External APIs
  async getExternalApisByProject(projectId: number): Promise<ExternalApi[]> {
    return Array.from(this.externalApis.values())
      .filter(api => api.projectId === projectId);
  }
  
  async getExternalApi(id: number): Promise<ExternalApi | undefined> {
    return this.externalApis.get(id);
  }
  
  async createExternalApi(api: InsertExternalApi): Promise<ExternalApi> {
    const id = this.externalApis.size + 1;
    const timestamp = new Date();
    
    const externalApi: ExternalApi = {
      ...api,
      id,
      status: api.status || 'active',
      createdAt: api.createdAt || timestamp,
      endpoint: api.endpoint ?? null,
      configData: api.configData || {},
      lastUsed: api.lastUsed || null,
      errorCount: api.errorCount ?? 0,
      lastError: api.lastError ?? null
    };
    
    this.externalApis.set(id, externalApi);
    return externalApi;
  }
  
  async updateExternalApi(id: number, updateData: Partial<InsertExternalApi>): Promise<ExternalApi | undefined> {
    const api = this.externalApis.get(id);
    if (!api) return undefined;
    
    const updatedApi = { ...api, ...updateData };
    this.externalApis.set(id, updatedApi);
    return updatedApi;
  }
  
  async deleteExternalApi(id: number): Promise<boolean> {
    return this.externalApis.delete(id);
  }
  
  // Agent Tasks
  async getTasksByProject(projectId: number): Promise<AgentTask[]> {
    return Array.from(this.agentTasks.values())
      .filter(task => task.projectId === projectId);
  }
  
  async getPendingTasks(projectId: number): Promise<AgentTask[]> {
    return Array.from(this.agentTasks.values())
      .filter(task => task.projectId === projectId && task.status === 'pending');
  }
  
  async getTask(id: number): Promise<AgentTask | undefined> {
    return this.agentTasks.get(id);
  }
  
  async createTask(task: InsertAgentTask): Promise<AgentTask> {
    const id = this.agentTasks.size + 1;
    const timestamp = new Date();
    
    const agentTask: AgentTask = {
      ...task,
      id,
      status: task.status || 'pending',
      description: task.description ?? null,
      progress: task.progress ?? 0,
      priority: task.priority ?? 1,
      createdAt: timestamp,
      featureId: task.featureId ?? null,
      assignedAgentId: task.assignedAgentId ?? null,
      executionPath: task.executionPath || [],
      executionState: task.executionState || {},
      errorDetails: task.errorDetails ?? null,
      taskResult: task.taskResult ?? null,
      parentTaskId: task.parentTaskId ?? null
    };
    
    this.agentTasks.set(id, agentTask);
    return agentTask;
  }
  
  async updateTask(id: number, updateData: Partial<InsertAgentTask>): Promise<AgentTask | undefined> {
    const task = this.agentTasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...updateData };
    this.agentTasks.set(id, updatedTask);
    return updatedTask;
  }
  
  async completeTask(id: number, result: any): Promise<AgentTask | undefined> {
    const task = this.agentTasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { 
      ...task, 
      status: 'completed',
      progress: 100,
      taskResult: result
    };
    
    this.agentTasks.set(id, updatedTask);
    return updatedTask;
  }
  
  async failTask(id: number, errorDetails: string): Promise<AgentTask | undefined> {
    const task = this.agentTasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { 
      ...task, 
      status: 'failed',
      errorDetails
    };
    
    this.agentTasks.set(id, updatedTask);
    return updatedTask;
  }
  
  // Web Accounts
  async getWebAccountsByProject(projectId: number): Promise<WebAccount[]> {
    return Array.from(this.webAccounts.values())
      .filter(account => account.projectId === projectId);
  }
  
  async getWebAccount(id: number): Promise<WebAccount | undefined> {
    return this.webAccounts.get(id);
  }
  
  async getWebAccounts(projectId: number): Promise<WebAccount[]> {
    // This is an alias for getWebAccountsByProject for API compatibility
    return this.getWebAccountsByProject(projectId);
  }
  
  async createWebAccount(account: InsertWebAccount): Promise<WebAccount> {
    const id = this.webAccounts.size + 1;
    const timestamp = new Date();
    
    const webAccount: WebAccount = {
      ...account,
      id,
      status: account.status || 'active',
      createdAt: account.createdAt || timestamp,
      profileUrl: account.profileUrl ?? null,
      lastActivity: account.lastActivity ?? null,
      cookies: account.cookies || {}
    };
    
    this.webAccounts.set(id, webAccount);
    return webAccount;
  }
  
  async updateWebAccount(id: number, updateData: Partial<InsertWebAccount>): Promise<WebAccount | undefined> {
    const account = this.webAccounts.get(id);
    if (!account) return undefined;
    
    const updatedAccount = { ...account, ...updateData };
    this.webAccounts.set(id, updatedAccount);
    return updatedAccount;
  }
  
  async deleteWebAccount(id: number): Promise<boolean> {
    return this.webAccounts.delete(id);
  }
  
  // Persona management
  async getPersonasByProject(projectId: number): Promise<Persona[]> {
    return Array.from(this.personas.values())
      .filter(persona => persona.projectId === projectId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  
  async getPersona(id: string): Promise<Persona | undefined> {
    return this.personas.get(id);
  }
  
  async createPersona(personaData: Omit<Persona, "id" | "createdAt" | "updatedAt">): Promise<Persona> {
    const id = `persona-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const timestamp = new Date();
    
    const persona: Persona = {
      ...personaData,
      id,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    this.personas.set(id, persona);
    return persona;
  }
  
  async updatePersona(id: string, updateData: Partial<Persona>): Promise<Persona | undefined> {
    const persona = this.personas.get(id);
    if (!persona) return undefined;
    
    const updatedPersona: Persona = {
      ...persona,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.personas.set(id, updatedPersona);
    return updatedPersona;
  }
  
  async deletePersona(id: string): Promise<boolean> {
    // When deleting a persona, we also delete related messages, content, and behavior updates
    if (this.personas.has(id)) {
      // Delete chat messages
      Array.from(this.chatMessages.keys())
        .filter(messageId => this.chatMessages.get(messageId)?.personaId === id)
        .forEach(messageId => this.chatMessages.delete(messageId));
      
      // Delete content items
      Array.from(this.contentItems.keys())
        .filter(itemId => this.contentItems.get(itemId)?.personaId === id)
        .forEach(itemId => this.contentItems.delete(itemId));
      
      // Delete behavior updates
      Array.from(this.behaviorUpdates.keys())
        .filter(updateId => this.behaviorUpdates.get(updateId)?.personaId === id)
        .forEach(updateId => this.behaviorUpdates.delete(updateId));
      
      // Delete the persona
      return this.personas.delete(id);
    }
    
    return false;
  }
  
  async togglePersonaActive(id: string, isActive: boolean): Promise<Persona | undefined> {
    const persona = this.personas.get(id);
    if (!persona) return undefined;
    
    const updatedPersona: Persona = {
      ...persona,
      isActive,
      updatedAt: new Date()
    };
    
    this.personas.set(id, updatedPersona);
    return updatedPersona;
  }
  
  // Chat messages management
  async getChatMessagesByPersona(personaId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.personaId === personaId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()); // Sort chronologically
  }
  
  async getChatMessage(id: string): Promise<ChatMessage | undefined> {
    return this.chatMessages.get(id);
  }
  
  async createChatMessage(messageData: Omit<ChatMessage, "id" | "timestamp">): Promise<ChatMessage> {
    const id = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const message: ChatMessage = {
      ...messageData,
      id,
      timestamp: new Date()
    };
    
    this.chatMessages.set(id, message);
    
    // Update the persona's stats
    const persona = this.personas.get(messageData.personaId);
    if (persona) {
      const updatedStats = { ...persona.stats };
      updatedStats.messageCount++;
      
      // If the message is from the persona, calculate response time
      if (messageData.isFromPersona) {
        // Find the most recent client message to calculate response time
        const recentClientMessages = Array.from(this.chatMessages.values())
          .filter(msg => 
            msg.personaId === messageData.personaId && 
            !msg.isFromPersona && 
            msg.timestamp < new Date() // Message is older than current
          )
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        if (recentClientMessages.length > 0) {
          const latestClientMessage = recentClientMessages[0];
          const responseTimeMs = new Date().getTime() - latestClientMessage.timestamp.getTime();
          const responseTimeMinutes = responseTimeMs / (1000 * 60);
          
          // Update average response time
          if (updatedStats.averageResponseTime === 0) {
            updatedStats.averageResponseTime = responseTimeMinutes;
          } else {
            updatedStats.averageResponseTime = 
              (updatedStats.averageResponseTime * (updatedStats.messageCount - 1) + responseTimeMinutes) / 
              updatedStats.messageCount;
          }
        }
      }
      
      // Update persona stats
      this.updatePersona(messageData.personaId, {
        stats: updatedStats,
        lastActivity: new Date()
      });
    }
    
    return message;
  }
  
  async deleteChatMessage(id: string): Promise<boolean> {
    return this.chatMessages.delete(id);
  }
  
  // Content items management
  async getContentItemsByPersona(personaId: string): Promise<ContentItem[]> {
    return Array.from(this.contentItems.values())
      .filter(item => item.personaId === personaId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getContentItem(id: string): Promise<ContentItem | undefined> {
    return this.contentItems.get(id);
  }
  
  async createContentItem(itemData: Omit<ContentItem, "id" | "createdAt">): Promise<ContentItem> {
    const id = `content-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const contentItem: ContentItem = {
      ...itemData,
      id,
      createdAt: new Date()
    };
    
    this.contentItems.set(id, contentItem);
    
    // Update the persona's stats
    const persona = this.personas.get(itemData.personaId);
    if (persona) {
      const updatedStats = { ...persona.stats };
      updatedStats.contentCreated++;
      
      // If the content is published, update that stat too
      if (itemData.status === 'published') {
        updatedStats.contentPublished++;
      }
      
      // Update persona stats
      this.updatePersona(itemData.personaId, {
        stats: updatedStats,
        lastActivity: new Date()
      });
    }
    
    return contentItem;
  }
  
  async updateContentItem(id: string, updateData: Partial<ContentItem>): Promise<ContentItem | undefined> {
    const contentItem = this.contentItems.get(id);
    if (!contentItem) return undefined;
    
    // If the status is changing to published, update persona stats
    if (updateData.status === 'published' && contentItem.status !== 'published') {
      const persona = this.personas.get(contentItem.personaId);
      if (persona) {
        const updatedStats = { ...persona.stats };
        updatedStats.contentPublished++;
        
        // Update persona stats
        this.updatePersona(contentItem.personaId, {
          stats: updatedStats,
          lastActivity: new Date()
        });
      }
    }
    
    const updatedContentItem: ContentItem = {
      ...contentItem,
      ...updateData
    };
    
    this.contentItems.set(id, updatedContentItem);
    return updatedContentItem;
  }
  
  async deleteContentItem(id: string): Promise<boolean> {
    return this.contentItems.delete(id);
  }
  
  // Behavior updates management
  async getBehaviorUpdatesByPersona(personaId: string): Promise<BehaviorUpdate[]> {
    return Array.from(this.behaviorUpdates.values())
      .filter(update => update.personaId === personaId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  async getBehaviorUpdate(id: string): Promise<BehaviorUpdate | undefined> {
    return this.behaviorUpdates.get(id);
  }
  
  async createBehaviorUpdate(updateData: Omit<BehaviorUpdate, "id" | "timestamp">): Promise<BehaviorUpdate> {
    const id = `behavior-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const behaviorUpdate: BehaviorUpdate = {
      ...updateData,
      id,
      timestamp: new Date()
    };
    
    this.behaviorUpdates.set(id, behaviorUpdate);
    return behaviorUpdate;
  }
  
  async applyBehaviorUpdate(id: string): Promise<BehaviorUpdate | undefined> {
    const behaviorUpdate = this.behaviorUpdates.get(id);
    if (!behaviorUpdate || behaviorUpdate.status !== 'pending') return undefined;
    
    // Apply the behavior update to the persona
    const persona = this.personas.get(behaviorUpdate.personaId);
    if (!persona) return undefined;
    
    // Update the persona's behavior instructions
    const updatedPersona = await this.updatePersona(behaviorUpdate.personaId, {
      behavior: {
        ...persona.behavior,
        instructions: behaviorUpdate.newInstructions,
        lastUpdated: new Date()
      }
    });
    
    if (!updatedPersona) return undefined;
    
    // Update the behavior update status
    const updatedBehaviorUpdate: BehaviorUpdate = {
      ...behaviorUpdate,
      status: 'applied'
    };
    
    this.behaviorUpdates.set(id, updatedBehaviorUpdate);
    return updatedBehaviorUpdate;
  }
}

// Import LowDB storage implementation
import { lowdbStorage } from './lowdb';

// Storage factory to get the appropriate storage implementation with LowDB as default
let storageImplementation: IStorage = lowdbStorage;

/**
 * Get the current storage implementation
 */
export function getStorage(): IStorage {
  return storageImplementation;
}

/**
 * Set the storage implementation
 * @param storage Storage implementation to use
 */
export function setStorage(storage: IStorage): void {
  storageImplementation = storage;
}

// Export a singleton instance for compatibility with existing code
export const storage = storageImplementation;
=======
}

export const storage = new MemStorage();
>>>>>>> 1d84bc7 (Set up Node.js project for Titan AI assistant.)
