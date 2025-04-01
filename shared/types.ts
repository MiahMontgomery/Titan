/**
 * Shared types for both client and server
 */

import { 
  PROJECT_STATUS, 
  FEATURE_STATUS, 
  MILESTONE_STATUS,
  GOAL_STATUS,
  TASK_STATUS,
  PERSONA_TYPES,
  ACTIVITY_TYPES
} from './constants';

// User
export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  created: Date;
  lastActive: Date;
}

export type InsertUser = Omit<User, 'id'>;

// Project
export interface Project {
  id: number;
  name: string;
  description: string;
  status: keyof typeof PROJECT_STATUS;
  progress: number;
  userId: number;
  created: Date;
  updated: Date;
  settings: ProjectSettings;
}

export type InsertProject = Omit<Project, 'id'>;

export interface ProjectSettings {
  aiModel: string;
  useLocalStorage: boolean;
  enableWebAutomation: boolean;
  enableFindom: boolean;
  theme: string;
  [key: string]: any;
}

// Feature
export interface Feature {
  id: number;
  name: string;
  description: string;
  status: keyof typeof FEATURE_STATUS;
  progress: number;
  projectId: number;
  created: Date;
  updated: Date;
}

export type InsertFeature = Omit<Feature, 'id'>;

// Milestone
export interface Milestone {
  id: number;
  name: string;
  description: string;
  status: keyof typeof MILESTONE_STATUS;
  progress: number;
  featureId: number;
  created: Date;
  updated: Date;
}

export type InsertMilestone = Omit<Milestone, 'id'>;

// Goal
export interface Goal {
  id: number;
  name: string;
  description: string;
  status: keyof typeof GOAL_STATUS;
  milestoneId: number;
  created: Date;
  updated: Date;
}

export type InsertGoal = Omit<Goal, 'id'>;

// Activity Log
export interface ActivityLog {
  id: number;
  type: keyof typeof ACTIVITY_TYPES;
  projectId: number;
  featureId?: number;
  message: string;
  details?: any;
  timestamp: Date;
  isCheckpoint: boolean;
}

export type InsertActivityLog = Omit<ActivityLog, 'id'>;

// Agent Task
export interface AgentTask {
  id: number;
  projectId: number;
  featureId?: number;
  description: string;
  status: keyof typeof TASK_STATUS;
  priority: 'low' | 'medium' | 'high';
  created: Date;
  updated: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

export type InsertAgentTask = Omit<AgentTask, 'id'>;

// External API
export interface ExternalApi {
  id: number;
  projectId: number;
  name: string;
  apiType: string;
  baseUrl: string;
  authType: 'none' | 'basic' | 'bearer' | 'apiKey' | 'oauth2';
  headers?: Record<string, string>;
  authData?: any;
  created: Date;
  updated: Date;
}

export type InsertExternalApi = Omit<ExternalApi, 'id'>;

// Web Account
export interface WebAccount {
  id: number;
  projectId: number;
  platform: string;
  username: string;
  email?: string;
  lastLogin?: Date;
  sessionData?: any;
  settings?: any;
  created: Date;
  updated: Date;
}

export type InsertWebAccount = Omit<WebAccount, 'id'>;

// Persona
export interface Persona {
  id: number;
  projectId: number;
  name: string;
  type: keyof typeof PERSONA_TYPES;
  description: string;
  systemPrompt: string;
  emoji: string;
  aiModel: string;
  settings: any;
  stats: {
    usage: number;
    success: number;
    error: number;
    lastRun?: Date;
    responseTime?: number;
  };
  created: Date;
  updated: Date;
}

export type InsertPersona = Omit<Persona, 'id'>;

// Storage interface
export interface IStorage {
  // User
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project
  getAllProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, updateData: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Feature
  getFeaturesByProject(projectId: number): Promise<Feature[]>;
  getFeature(id: number): Promise<Feature | undefined>;
  createFeature(feature: InsertFeature): Promise<Feature>;
  updateFeature(id: number, updateData: Partial<InsertFeature>): Promise<Feature | undefined>;
  deleteFeature(id: number): Promise<boolean>;
  
  // Milestone
  getMilestonesByFeature(featureId: number): Promise<Milestone[]>;
  getMilestone(id: number): Promise<Milestone | undefined>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  updateMilestone(id: number, updateData: Partial<InsertMilestone>): Promise<Milestone | undefined>;
  deleteMilestone(id: number): Promise<boolean>;
  
  // Goal
  getGoalsByMilestone(milestoneId: number): Promise<Goal[]>;
  getGoal(id: number): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, updateData: Partial<InsertGoal>): Promise<Goal | undefined>;
  deleteGoal(id: number): Promise<boolean>;
  
  // Activity Log
  getActivityLogsByProject(projectId: number): Promise<ActivityLog[]>;
  getActivityLogsByFeature(featureId: number): Promise<ActivityLog[]>;
  getActivityLogCheckpoints(projectId: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  createCheckpoint(log: InsertActivityLog): Promise<ActivityLog>;
  
  // External API
  getExternalApisByProject(projectId: number): Promise<ExternalApi[]>;
  getExternalApi(id: number): Promise<ExternalApi | undefined>;
  createExternalApi(api: InsertExternalApi): Promise<ExternalApi>;
  updateExternalApi(id: number, api: Partial<InsertExternalApi>): Promise<ExternalApi | undefined>;
  deleteExternalApi(id: number): Promise<boolean>;
  
  // Task
  getTasksByProject(projectId: number): Promise<AgentTask[]>;
  getPendingTasks(projectId: number): Promise<AgentTask[]>;
  getTask(id: number): Promise<AgentTask | undefined>;
  createTask(task: InsertAgentTask): Promise<AgentTask>;
  updateTask(id: number, task: Partial<InsertAgentTask>): Promise<AgentTask | undefined>;
  completeTask(id: number, result: any): Promise<AgentTask | undefined>;
  failTask(id: number, errorDetails: string): Promise<AgentTask | undefined>;
  
  // Web Account
  getWebAccountsByProject(projectId: number): Promise<WebAccount[]>;
  getWebAccount(id: number): Promise<WebAccount | undefined>;
  createWebAccount(account: InsertWebAccount): Promise<WebAccount>;
  updateWebAccount(id: number, account: Partial<InsertWebAccount>): Promise<WebAccount | undefined>;
  deleteWebAccount(id: number): Promise<boolean>;
}