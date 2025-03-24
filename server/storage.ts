import {
  Project, InsertProject,
  Feature, InsertFeature,
  Milestone, InsertMilestone,
  Goal, InsertGoal,
  ActivityLog, InsertActivityLog,
  User, InsertUser
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
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private features: Map<number, Feature>;
  private milestones: Map<number, Milestone>;
  private goals: Map<number, Goal>;
  private activityLogs: Map<number, ActivityLog>;
  
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
    
    this.userId = 0;
    this.projectId = 0;
    this.featureId = 0;
    this.milestoneId = 0;
    this.goalId = 0;
    this.logId = 0;
    
    // Initialize with sample data (async, but we don't need to await here)
    this.initSampleData().catch(err => console.error("Error initializing sample data:", err));
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
      isActive: true,
      progress: 45,
      lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    });
    
    const project2 = await this.createProject({
      name: "Mobile App",
      description: "Develop a cross-platform mobile application",
      isActive: false,
      progress: 70,
      lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    });
    
    const project3 = await this.createProject({
      name: "Content Management System",
      description: "Create a CMS for managing digital content",
      isActive: true,
      progress: 20,
      lastUpdated: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
    });
    
    console.log("Created projects:", project1.id, project2.id, project3.id);

    // Sample features for first project
    const feature1 = await this.createFeature({
      projectId: project1.id,
      name: "User Authentication System",
      description: "Implement secure login and registration",
      isComplete: false
    });
    
    const feature2 = await this.createFeature({
      projectId: project1.id,
      name: "Product Catalog",
      description: "Product listings with search and filter",
      isComplete: true
    });
    
    const feature3 = await this.createFeature({
      projectId: project1.id,
      name: "Shopping Cart",
      description: "Add/remove items and checkout process",
      isComplete: false
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
      isCompleted: true
    });
    
    const goal2 = await this.createGoal({
      milestoneId: milestone1.id,
      name: "Setup password hashing and security",
      isCompleted: true
    });
    
    const goal3 = await this.createGoal({
      milestoneId: milestone1.id,
      name: "Create database migrations",
      isCompleted: true
    });

    // Sample goals for second milestone
    const goal4 = await this.createGoal({
      milestoneId: milestone2.id,
      name: "Design responsive login form",
      isCompleted: true
    });
    
    const goal5 = await this.createGoal({
      milestoneId: milestone2.id,
      name: "Implement form validation",
      isCompleted: false
    });
    
    const goal6 = await this.createGoal({
      milestoneId: milestone2.id,
      name: "Connect to authentication API",
      isCompleted: false
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
      isActive: insertProject.isActive ?? false,
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
      isComplete: insertFeature.isComplete ?? false
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
      estimatedHours: insertMilestone.estimatedHours ?? null
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
      isCompleted: insertGoal.isCompleted ?? false 
    };
    this.goals.set(id, goal);
    return goal;
  }

  async updateGoal(id: number, updateData: Partial<InsertGoal>): Promise<Goal | undefined> {
    const goal = this.goals.get(id);
    if (!goal) return undefined;

    const updatedGoal: Goal = { ...goal, ...updateData };
    this.goals.set(id, updatedGoal);
    
    // Update feature completion status if goal completion status changes
    if (updateData.isCompleted !== undefined && goal.milestoneId) {
      const milestone = this.milestones.get(goal.milestoneId);
      
      if (milestone && milestone.featureId) {
        const feature = this.features.get(milestone.featureId);
        
        if (feature) {
          // Get all milestones for this feature
          const milestones = await this.getMilestonesByFeature(feature.id);
          
          // Get all goals for all milestones
          let totalGoals = 0;
          let completedGoals = 0;
          
          for (const m of milestones) {
            const goals = await this.getGoalsByMilestone(m.id);
            totalGoals += goals.length;
            completedGoals += goals.filter(g => g.isCompleted).length;
          }
          
          // If all goals are completed, mark the feature as complete
          if (totalGoals > 0 && completedGoals === totalGoals) {
            await this.updateFeature(feature.id, { isComplete: true });
          } else {
            await this.updateFeature(feature.id, { isComplete: false });
          }
          
          // Update project progress based on completed features
          if (feature.projectId) {
            const project = this.projects.get(feature.projectId);
            if (project) {
              const features = await this.getFeaturesByProject(project.id);
              const totalFeatures = features.length;
              const completedFeatures = features.filter(f => f.isComplete).length;
              
              // Calculate progress as a percentage
              const progress = totalFeatures > 0 ? Math.round((completedFeatures / totalFeatures) * 100) : 0;
              
              await this.updateProject(project.id, { 
                progress,
                lastUpdated: new Date()
              });
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

export const storage = new MemStorage();
