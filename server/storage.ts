import {
  Project, InsertProject,
  Feature, InsertFeature,
  Milestone, InsertMilestone,
  Goal, InsertGoal,
  ActivityLog, InsertActivityLog,
  User, InsertUser,
  ExternalApi, InsertExternalApi,
  AgentTask, InsertAgentTask,
  WebAccount, InsertWebAccount
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
  createWebAccount(account: InsertWebAccount): Promise<WebAccount>;
  updateWebAccount(id: number, account: Partial<InsertWebAccount>): Promise<WebAccount | undefined>;
  deleteWebAccount(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private features: Map<number, Feature>;
  private milestones: Map<number, Milestone>;
  private goals: Map<number, Goal>;
  private activityLogs: Map<number, ActivityLog>;
  private externalApis: Map<number, ExternalApi>;
  private agentTasks: Map<number, AgentTask>;
  private webAccounts: Map<number, WebAccount>;
  
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
    
    this.userId = 0;
    this.projectId = 0;
    this.featureId = 0;
    this.milestoneId = 0;
    this.goalId = 0;
    this.logId = 0;
    
    // Initialize with sample data only if no existing data (async, but we don't need to await here)
    this.initSampleDataIfEmpty().catch(err => console.error("Error initializing sample data:", err));
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
      lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    });
    
    const project2 = await this.createProject({
      name: "Mobile App",
      description: "Develop a cross-platform mobile application",
      isWorking: false,
      progress: 70,
      lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    });
    
    const project3 = await this.createProject({
      name: "Content Management System",
      description: "Create a CMS for managing digital content",
      isWorking: true,
      progress: 20,
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
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Project management
  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.projectId++;
    const project: Project = { 
      ...insertProject, 
      id,
      isWorking: insertProject.isWorking ?? false,
      progress: insertProject.progress ?? 0,
      lastUpdated: insertProject.lastUpdated || new Date()
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
    const feature: Feature = { 
      ...insertFeature, 
      id,
      description: insertFeature.description ?? null,
      progress: insertFeature.progress ?? 0
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

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = this.logId++;
    const log: ActivityLog = { 
      ...insertLog, 
      id,
      timestamp: insertLog.timestamp || new Date(),
      agentId: insertLog.agentId ?? null,
      codeSnippet: insertLog.codeSnippet ?? null
    };
    this.activityLogs.set(id, log);
    
    // Update project's last updated timestamp
    const project = this.projects.get(insertLog.projectId);
    if (project) {
      this.updateProject(project.id, { lastUpdated: log.timestamp });
    }
    
    return log;
  }
}

// Storage factory to get the appropriate storage implementation
let storageImplementation: IStorage = new MemStorage();

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
