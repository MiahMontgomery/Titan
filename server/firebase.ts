import { initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
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

// Firebase Admin initialization state
let firebaseInitialized = false;
let firestoreDb: Firestore | null = null;
let firebaseApp: App | null = null;

// Firestore collection names
const COLLECTIONS = {
  USERS: 'users',
  PROJECTS: 'projects',
  FEATURES: 'features',
  MILESTONES: 'milestones',
  GOALS: 'goals',
  ACTIVITY_LOGS: 'activityLogs',
  EXTERNAL_APIS: 'externalApis',
  AGENT_TASKS: 'agentTasks',
  WEB_ACCOUNTS: 'webAccounts'
};

/**
 * Attempt to initialize Firebase Admin with environment variables
 * @returns True if initialization was successful
 */
export function initializeFirebaseFromEnv(): boolean {
  // Check for required environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  
  if (!projectId) {
    log('Firebase initialization from environment skipped, missing FIREBASE_PROJECT_ID', 'firebase');
    return false;
  }
  
  try {
    // Initialize with Google Application Default Credentials if available
    // This will work in Google Cloud environments
    firebaseApp = initializeApp({
      projectId
    });
    
    firestoreDb = getFirestore(firebaseApp);
    firebaseInitialized = true;
    log('Firebase Admin SDK initialized successfully with environment variables', 'firebase');
    return true;
  } catch (error) {
    log(`Error initializing Firebase Admin SDK from environment: ${error}`, 'firebase');
    return false;
  }
}

/**
 * Initialize Firebase Admin with service account
 * @param config Firebase configuration
 * @returns True if initialization was successful
 */
export function initializeFirebase(config: {
  projectId: string;
  privateKey?: string;
  clientEmail?: string;
}): boolean {
  try {
    if (firebaseInitialized) {
      log('Firebase Admin SDK already initialized', 'firebase');
      return true;
    }

    // If we have complete service account details
    if (config.privateKey && config.clientEmail) {
      firebaseApp = initializeApp({
        credential: cert({
          projectId: config.projectId,
          privateKey: config.privateKey.replace(/\\n/g, '\n'),
          clientEmail: config.clientEmail
        }),
      });
    } 
    // Otherwise initialize with just project ID (for Google Cloud environments)
    else {
      firebaseApp = initializeApp({
        projectId: config.projectId
      });
    }

    firestoreDb = getFirestore(firebaseApp);
    firebaseInitialized = true;
    log('Firebase Admin SDK initialized successfully with provided config', 'firebase');
    return true;
  } catch (error) {
    log(`Error initializing Firebase Admin SDK: ${error}`, 'firebase');
    return false;
  }
}

/**
 * Convert Firestore document data to model object
 * @param doc Firestore document
 * @returns Model object with ID
 */
function convertDoc<T>(doc: any): T {
  return {
    id: Number(doc.id),
    ...doc.data()
  } as unknown as T;
}

/**
 * Get Firestore instance (throw error if not initialized)
 */
function getFirestoreDb(): Firestore {
  if (!firebaseInitialized || !firestoreDb) {
    throw new Error('Firebase Admin SDK not initialized');
  }
  return firestoreDb;
}

/**
 * Firebase implementation of storage interface
 */
export class FirebaseStorage implements IStorage {
  
  // User Management
  async getUser(id: number): Promise<User | undefined> {
    try {
      const doc = await getFirestoreDb().collection(COLLECTIONS.USERS).doc(id.toString()).get();
      if (!doc.exists) return undefined;
      return convertDoc<User>(doc);
    } catch (error) {
      log(`Error getting user ${id}: ${error}`, 'firebase');
      return undefined;
    }
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const snapshot = await getFirestoreDb()
        .collection(COLLECTIONS.USERS)
        .where('username', '==', username)
        .limit(1)
        .get();
      
      if (snapshot.empty) return undefined;
      return convertDoc<User>(snapshot.docs[0]);
    } catch (error) {
      log(`Error getting user by username ${username}: ${error}`, 'firebase');
      return undefined;
    }
  }
  
  async createUser(user: InsertUser): Promise<User> {
    try {
      // Get next available ID
      const snapshot = await getFirestoreDb()
        .collection(COLLECTIONS.USERS)
        .orderBy('id', 'desc')
        .limit(1)
        .get();
      
      const id = snapshot.empty ? 1 : Number(snapshot.docs[0].data().id) + 1;
      const userWithId = { ...user, id };
      
      await getFirestoreDb()
        .collection(COLLECTIONS.USERS)
        .doc(id.toString())
        .set(userWithId);
      
      return userWithId as User;
    } catch (error) {
      log(`Error creating user: ${error}`, 'firebase');
      throw error;
    }
  }
  
  // Project Management
  async getAllProjects(): Promise<Project[]> {
    try {
      const snapshot = await getFirestoreDb()
        .collection(COLLECTIONS.PROJECTS)
        .orderBy('id')
        .get();
      
      return snapshot.docs.map(doc => convertDoc<Project>(doc));
    } catch (error) {
      log(`Error getting all projects: ${error}`, 'firebase');
      return [];
    }
  }
  
  async getProject(id: number): Promise<Project | undefined> {
    try {
      const doc = await getFirestoreDb()
        .collection(COLLECTIONS.PROJECTS)
        .doc(id.toString())
        .get();
      
      if (!doc.exists) return undefined;
      return convertDoc<Project>(doc);
    } catch (error) {
      log(`Error getting project ${id}: ${error}`, 'firebase');
      return undefined;
    }
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    try {
      // Get next available ID
      const snapshot = await getFirestoreDb()
        .collection(COLLECTIONS.PROJECTS)
        .orderBy('id', 'desc')
        .limit(1)
        .get();
      
      const id = snapshot.empty ? 1 : Number(snapshot.docs[0].data().id) + 1;
      const timestamp = new Date();
      
      const projectWithId: Project = {
        ...project,
        id,
        isWorking: project.isWorking ?? false,
        progress: project.progress ?? 0,
        lastUpdated: project.lastUpdated || timestamp,
        projectType: project.projectType || 'generic',
        agentConfig: project.agentConfig || {},
        autoMode: project.autoMode ?? false,
        checkpoints: project.checkpoints || {},
        priority: project.priority ?? 0,
        lastCheckIn: project.lastCheckIn || null,
        nextCheckIn: project.nextCheckIn || null
      };
      
      await getFirestoreDb()
        .collection(COLLECTIONS.PROJECTS)
        .doc(id.toString())
        .set(projectWithId);
      
      return projectWithId;
    } catch (error) {
      log(`Error creating project: ${error}`, 'firebase');
      throw error;
    }
  }
  
  async updateProject(id: number, updateData: Partial<InsertProject>): Promise<Project | undefined> {
    try {
      const docRef = getFirestoreDb().collection(COLLECTIONS.PROJECTS).doc(id.toString());
      const doc = await docRef.get();
      
      if (!doc.exists) return undefined;
      
      const updatedProject = {
        ...doc.data(),
        ...updateData,
        lastUpdated: new Date()
      };
      
      await docRef.update(updatedProject);
      return { ...updatedProject, id } as Project;
    } catch (error) {
      log(`Error updating project ${id}: ${error}`, 'firebase');
      return undefined;
    }
  }
  
  async deleteProject(id: number): Promise<boolean> {
    try {
      await getFirestoreDb()
        .collection(COLLECTIONS.PROJECTS)
        .doc(id.toString())
        .delete();
      
      return true;
    } catch (error) {
      log(`Error deleting project ${id}: ${error}`, 'firebase');
      return false;
    }
  }
  
  // Feature Management
  async getFeaturesByProject(projectId: number): Promise<Feature[]> {
    try {
      const snapshot = await getFirestoreDb()
        .collection(COLLECTIONS.FEATURES)
        .where('projectId', '==', projectId)
        .orderBy('id')
        .get();
      
      return snapshot.docs.map(doc => convertDoc<Feature>(doc));
    } catch (error) {
      log(`Error getting features for project ${projectId}: ${error}`, 'firebase');
      return [];
    }
  }
  
  async getFeature(id: number): Promise<Feature | undefined> {
    try {
      const doc = await getFirestoreDb()
        .collection(COLLECTIONS.FEATURES)
        .doc(id.toString())
        .get();
      
      if (!doc.exists) return undefined;
      return convertDoc<Feature>(doc);
    } catch (error) {
      log(`Error getting feature ${id}: ${error}`, 'firebase');
      return undefined;
    }
  }
  
  async createFeature(feature: InsertFeature): Promise<Feature> {
    try {
      // Get next available ID
      const snapshot = await getFirestoreDb()
        .collection(COLLECTIONS.FEATURES)
        .orderBy('id', 'desc')
        .limit(1)
        .get();
      
      const id = snapshot.empty ? 1 : Number(snapshot.docs[0].data().id) + 1;
      const timestamp = new Date();
      
      const featureWithId: Feature = {
        ...feature,
        id,
        description: feature.description ?? null,
        progress: feature.progress ?? 0,
        status: feature.status || 'planned',
        isWorking: feature.isWorking ?? false,
        priority: feature.priority ?? 0,
        estimatedDays: feature.estimatedDays ?? null,
        createdAt: feature.createdAt || timestamp,
        startDate: feature.startDate || null,
        completionDate: feature.completionDate || null,
        dependencies: feature.dependencies || [],
        blockReason: feature.blockReason || null,
        implementationDetails: feature.implementationDetails || {},
        optimizationRound: feature.optimizationRound ?? 0
      };
      
      await getFirestoreDb()
        .collection(COLLECTIONS.FEATURES)
        .doc(id.toString())
        .set(featureWithId);
      
      // Update project's last updated timestamp
      if (feature.projectId) {
        await this.updateProject(feature.projectId, { lastUpdated: timestamp });
      }
      
      return featureWithId;
    } catch (error) {
      log(`Error creating feature: ${error}`, 'firebase');
      throw error;
    }
  }
  
  async updateFeature(id: number, updateData: Partial<InsertFeature>): Promise<Feature | undefined> {
    try {
      const docRef = getFirestoreDb().collection(COLLECTIONS.FEATURES).doc(id.toString());
      const doc = await docRef.get();
      
      if (!doc.exists) return undefined;
      
      const existingData = doc.data() as Feature;
      const updatedFeature = {
        ...existingData,
        ...updateData
      };
      
      await docRef.update(updatedFeature);
      
      // Update project's last updated timestamp
      if (existingData.projectId) {
        await this.updateProject(existingData.projectId, { lastUpdated: new Date() });
      }
      
      return { ...updatedFeature, id } as Feature;
    } catch (error) {
      log(`Error updating feature ${id}: ${error}`, 'firebase');
      return undefined;
    }
  }
  
  async deleteFeature(id: number): Promise<boolean> {
    try {
      const docRef = getFirestoreDb().collection(COLLECTIONS.FEATURES).doc(id.toString());
      const doc = await docRef.get();
      
      if (!doc.exists) return false;
      
      // Update project timestamp before deleting
      const feature = doc.data() as Feature;
      if (feature.projectId) {
        await this.updateProject(feature.projectId, { lastUpdated: new Date() });
      }
      
      await docRef.delete();
      return true;
    } catch (error) {
      log(`Error deleting feature ${id}: ${error}`, 'firebase');
      return false;
    }
  }
  
  // Milestone Management
  async getMilestonesByFeature(featureId: number): Promise<Milestone[]> {
    try {
      const snapshot = await getFirestoreDb()
        .collection(COLLECTIONS.MILESTONES)
        .where('featureId', '==', featureId)
        .orderBy('id')
        .get();
      
      return snapshot.docs.map(doc => convertDoc<Milestone>(doc));
    } catch (error) {
      log(`Error getting milestones for feature ${featureId}: ${error}`, 'firebase');
      return [];
    }
  }
  
  async getMilestone(id: number): Promise<Milestone | undefined> {
    try {
      const doc = await getFirestoreDb()
        .collection(COLLECTIONS.MILESTONES)
        .doc(id.toString())
        .get();
      
      if (!doc.exists) return undefined;
      return convertDoc<Milestone>(doc);
    } catch (error) {
      log(`Error getting milestone ${id}: ${error}`, 'firebase');
      return undefined;
    }
  }
  
  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    try {
      // Get next available ID
      const snapshot = await getFirestoreDb()
        .collection(COLLECTIONS.MILESTONES)
        .orderBy('id', 'desc')
        .limit(1)
        .get();
      
      const id = snapshot.empty ? 1 : Number(snapshot.docs[0].data().id) + 1;
      const timestamp = new Date();
      
      const milestoneWithId: Milestone = {
        ...milestone,
        id,
        description: milestone.description ?? null,
        progress: milestone.progress ?? 0,
        createdAt: timestamp,
        estimatedHours: milestone.estimatedHours ?? null,
        percentOfFeature: milestone.percentOfFeature ?? 0
      };
      
      await getFirestoreDb()
        .collection(COLLECTIONS.MILESTONES)
        .doc(id.toString())
        .set(milestoneWithId);
      
      return milestoneWithId;
    } catch (error) {
      log(`Error creating milestone: ${error}`, 'firebase');
      throw error;
    }
  }
  
  async updateMilestone(id: number, updateData: Partial<InsertMilestone>): Promise<Milestone | undefined> {
    try {
      const docRef = getFirestoreDb().collection(COLLECTIONS.MILESTONES).doc(id.toString());
      const doc = await docRef.get();
      
      if (!doc.exists) return undefined;
      
      const updatedMilestone = {
        ...doc.data(),
        ...updateData
      };
      
      await docRef.update(updatedMilestone);
      return { ...updatedMilestone, id } as Milestone;
    } catch (error) {
      log(`Error updating milestone ${id}: ${error}`, 'firebase');
      return undefined;
    }
  }
  
  async deleteMilestone(id: number): Promise<boolean> {
    try {
      await getFirestoreDb()
        .collection(COLLECTIONS.MILESTONES)
        .doc(id.toString())
        .delete();
      
      return true;
    } catch (error) {
      log(`Error deleting milestone ${id}: ${error}`, 'firebase');
      return false;
    }
  }
  
  // Goal Management
  async getGoalsByMilestone(milestoneId: number): Promise<Goal[]> {
    try {
      const snapshot = await getFirestoreDb()
        .collection(COLLECTIONS.GOALS)
        .where('milestoneId', '==', milestoneId)
        .orderBy('id')
        .get();
      
      return snapshot.docs.map(doc => convertDoc<Goal>(doc));
    } catch (error) {
      log(`Error getting goals for milestone ${milestoneId}: ${error}`, 'firebase');
      return [];
    }
  }
  
  async getGoal(id: number): Promise<Goal | undefined> {
    try {
      const doc = await getFirestoreDb()
        .collection(COLLECTIONS.GOALS)
        .doc(id.toString())
        .get();
      
      if (!doc.exists) return undefined;
      return convertDoc<Goal>(doc);
    } catch (error) {
      log(`Error getting goal ${id}: ${error}`, 'firebase');
      return undefined;
    }
  }
  
  async createGoal(goal: InsertGoal): Promise<Goal> {
    try {
      // Get next available ID
      const snapshot = await getFirestoreDb()
        .collection(COLLECTIONS.GOALS)
        .orderBy('id', 'desc')
        .limit(1)
        .get();
      
      const id = snapshot.empty ? 1 : Number(snapshot.docs[0].data().id) + 1;
      const timestamp = new Date();
      
      const goalWithId: Goal = {
        ...goal,
        id,
        description: goal.description ?? null,
        progress: goal.progress ?? 0,
        createdAt: timestamp,
        completed: goal.completed ?? false,
        percentOfMilestone: goal.percentOfMilestone ?? 0
      };
      
      await getFirestoreDb()
        .collection(COLLECTIONS.GOALS)
        .doc(id.toString())
        .set(goalWithId);
      
      return goalWithId;
    } catch (error) {
      log(`Error creating goal: ${error}`, 'firebase');
      throw error;
    }
  }
  
  async updateGoal(id: number, updateData: Partial<InsertGoal>): Promise<Goal | undefined> {
    try {
      const docRef = getFirestoreDb().collection(COLLECTIONS.GOALS).doc(id.toString());
      const doc = await docRef.get();
      
      if (!doc.exists) return undefined;
      
      const existingGoal = doc.data() as Goal;
      const updatedGoal = {
        ...existingGoal,
        ...updateData
      };
      
      await docRef.update(updatedGoal);
      
      // If progress changed, cascade updates up the hierarchy
      if (updateData.progress !== undefined && existingGoal.milestoneId) {
        await this.updateMilestoneProgress(existingGoal.milestoneId);
      }
      
      return { ...updatedGoal, id } as Goal;
    } catch (error) {
      log(`Error updating goal ${id}: ${error}`, 'firebase');
      return undefined;
    }
  }
  
  async deleteGoal(id: number): Promise<boolean> {
    try {
      // Get milestone ID before deletion for progress recalculation
      const doc = await getFirestoreDb()
        .collection(COLLECTIONS.GOALS)
        .doc(id.toString())
        .get();
      
      if (!doc.exists) return false;
      const goal = doc.data() as Goal;
      const milestoneId = goal.milestoneId;
      
      // Delete the goal
      await getFirestoreDb()
        .collection(COLLECTIONS.GOALS)
        .doc(id.toString())
        .delete();
      
      // Update milestone progress if needed
      if (milestoneId) {
        await this.updateMilestoneProgress(milestoneId);
      }
      
      return true;
    } catch (error) {
      log(`Error deleting goal ${id}: ${error}`, 'firebase');
      return false;
    }
  }
  
  // Activity Logs
  async getActivityLogsByProject(projectId: number): Promise<ActivityLog[]> {
    try {
      const snapshot = await getFirestoreDb()
        .collection(COLLECTIONS.ACTIVITY_LOGS)
        .where('projectId', '==', projectId)
        .orderBy('timestamp', 'desc')
        .get();
      
      return snapshot.docs.map(doc => convertDoc<ActivityLog>(doc));
    } catch (error) {
      log(`Error getting activity logs for project ${projectId}: ${error}`, 'firebase');
      return [];
    }
  }
  
  async getActivityLogsByFeature(featureId: number): Promise<ActivityLog[]> {
    try {
      const snapshot = await getFirestoreDb()
        .collection(COLLECTIONS.ACTIVITY_LOGS)
        .where('featureId', '==', featureId)
        .orderBy('timestamp', 'desc')
        .get();
      
      return snapshot.docs.map(doc => convertDoc<ActivityLog>(doc));
    } catch (error) {
      log(`Error getting activity logs for feature ${featureId}: ${error}`, 'firebase');
      return [];
    }
  }
  
  async getActivityLogCheckpoints(projectId: number): Promise<ActivityLog[]> {
    try {
      const snapshot = await getFirestoreDb()
        .collection(COLLECTIONS.ACTIVITY_LOGS)
        .where('projectId', '==', projectId)
        .where('activityType', '==', 'checkpoint')
        .orderBy('timestamp', 'desc')
        .get();
      
      return snapshot.docs.map(doc => convertDoc<ActivityLog>(doc));
    } catch (error) {
      log(`Error getting checkpoints for project ${projectId}: ${error}`, 'firebase');
      return [];
    }
  }
  
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    try {
      // Get next available ID
      const snapshot = await getFirestoreDb()
        .collection(COLLECTIONS.ACTIVITY_LOGS)
        .orderBy('id', 'desc')
        .limit(1)
        .get();
      
      const id = snapshot.empty ? 1 : Number(snapshot.docs[0].data().id) + 1;
      const timestamp = log.timestamp || new Date();
      
      const logWithId: ActivityLog = {
        ...log,
        id,
        timestamp,
        featureId: log.featureId ?? null,
        milestoneId: log.milestoneId ?? null,
        agentId: log.agentId ?? null,
        codeSnippet: log.codeSnippet ?? null,
        activityType: log.activityType || 'general',
        isCheckpoint: log.isCheckpoint ?? false,
        previousState: log.previousState ?? null,
        currentState: log.currentState ?? null,
        thinkingProcess: log.thinkingProcess ?? null
      };
      
      await getFirestoreDb()
        .collection(COLLECTIONS.ACTIVITY_LOGS)
        .doc(id.toString())
        .set(logWithId);
      
      // Update project's last updated timestamp
      if (log.projectId) {
        await this.updateProject(log.projectId, { lastUpdated: timestamp });
      }
      
      return logWithId;
    } catch (error) {
      log(`Error creating activity log: ${error}`, 'firebase');
      throw error;
    }
  }
  
  async createCheckpoint(log: InsertActivityLog): Promise<ActivityLog> {
    return this.createActivityLog({
      ...log,
      activityType: 'checkpoint',
      isCheckpoint: true
    });
  }
  
  // External APIs
  async getExternalApisByProject(projectId: number): Promise<ExternalApi[]> {
    try {
      const snapshot = await getFirestoreDb()
        .collection(COLLECTIONS.EXTERNAL_APIS)
        .where('projectId', '==', projectId)
        .orderBy('id')
        .get();
      
      return snapshot.docs.map(doc => convertDoc<ExternalApi>(doc));
    } catch (error) {
      log(`Error getting external APIs for project ${projectId}: ${error}`, 'firebase');
      return [];
    }
  }
  
  async getExternalApi(id: number): Promise<ExternalApi | undefined> {
    try {
      const doc = await getFirestoreDb()
        .collection(COLLECTIONS.EXTERNAL_APIS)
        .doc(id.toString())
        .get();
      
      if (!doc.exists) return undefined;
      return convertDoc<ExternalApi>(doc);
    } catch (error) {
      log(`Error getting external API ${id}: ${error}`, 'firebase');
      return undefined;
    }
  }
  
  async createExternalApi(api: InsertExternalApi): Promise<ExternalApi> {
    try {
      // Get next available ID
      const snapshot = await getFirestoreDb()
        .collection(COLLECTIONS.EXTERNAL_APIS)
        .orderBy('id', 'desc')
        .limit(1)
        .get();
      
      const id = snapshot.empty ? 1 : Number(snapshot.docs[0].data().id) + 1;
      
      const apiWithId: ExternalApi = {
        ...api,
        id,
        credentials: api.credentials ?? null,
        metadata: api.metadata ?? null,
        active: api.active ?? true
      };
      
      await getFirestoreDb()
        .collection(COLLECTIONS.EXTERNAL_APIS)
        .doc(id.toString())
        .set(apiWithId);
      
      return apiWithId;
    } catch (error) {
      log(`Error creating external API: ${error}`, 'firebase');
      throw error;
    }
  }
  
  async updateExternalApi(id: number, api: Partial<InsertExternalApi>): Promise<ExternalApi | undefined> {
    try {
      const docRef = getFirestoreDb().collection(COLLECTIONS.EXTERNAL_APIS).doc(id.toString());
      const doc = await docRef.get();
      
      if (!doc.exists) return undefined;
      
      const updatedApi = {
        ...doc.data(),
        ...api
      };
      
      await docRef.update(updatedApi);
      return { ...updatedApi, id } as ExternalApi;
    } catch (error) {
      log(`Error updating external API ${id}: ${error}`, 'firebase');
      return undefined;
    }
  }
  
  async deleteExternalApi(id: number): Promise<boolean> {
    try {
      await getFirestoreDb()
        .collection(COLLECTIONS.EXTERNAL_APIS)
        .doc(id.toString())
        .delete();
      
      return true;
    } catch (error) {
      log(`Error deleting external API ${id}: ${error}`, 'firebase');
      return false;
    }
  }
  
  // Agent Tasks
  async getTasksByProject(projectId: number): Promise<AgentTask[]> {
    try {
      const snapshot = await getFirestoreDb()
        .collection(COLLECTIONS.AGENT_TASKS)
        .where('projectId', '==', projectId)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => convertDoc<AgentTask>(doc));
    } catch (error) {
      log(`Error getting tasks for project ${projectId}: ${error}`, 'firebase');
      return [];
    }
  }
  
  async getPendingTasks(projectId: number): Promise<AgentTask[]> {
    try {
      const snapshot = await getFirestoreDb()
        .collection(COLLECTIONS.AGENT_TASKS)
        .where('projectId', '==', projectId)
        .where('status', '==', 'pending')
        .orderBy('priority', 'desc')
        .orderBy('createdAt', 'asc')
        .get();
      
      return snapshot.docs.map(doc => convertDoc<AgentTask>(doc));
    } catch (error) {
      log(`Error getting pending tasks for project ${projectId}: ${error}`, 'firebase');
      return [];
    }
  }
  
  async getTask(id: number): Promise<AgentTask | undefined> {
    try {
      const doc = await getFirestoreDb()
        .collection(COLLECTIONS.AGENT_TASKS)
        .doc(id.toString())
        .get();
      
      if (!doc.exists) return undefined;
      return convertDoc<AgentTask>(doc);
    } catch (error) {
      log(`Error getting task ${id}: ${error}`, 'firebase');
      return undefined;
    }
  }
  
  async createTask(task: InsertAgentTask): Promise<AgentTask> {
    try {
      // Get next available ID
      const snapshot = await getFirestoreDb()
        .collection(COLLECTIONS.AGENT_TASKS)
        .orderBy('id', 'desc')
        .limit(1)
        .get();
      
      const id = snapshot.empty ? 1 : Number(snapshot.docs[0].data().id) + 1;
      const timestamp = new Date();
      
      const taskWithId: AgentTask = {
        ...task,
        id,
        status: task.status || 'pending',
        priority: task.priority ?? 1,
        createdAt: task.createdAt || timestamp,
        startedAt: task.startedAt || null,
        completedAt: task.completedAt || null,
        result: task.result ?? null,
        errorDetails: task.errorDetails ?? null,
        assignedAgent: task.assignedAgent ?? null
      };
      
      await getFirestoreDb()
        .collection(COLLECTIONS.AGENT_TASKS)
        .doc(id.toString())
        .set(taskWithId);
      
      return taskWithId;
    } catch (error) {
      log(`Error creating task: ${error}`, 'firebase');
      throw error;
    }
  }
  
  async updateTask(id: number, task: Partial<InsertAgentTask>): Promise<AgentTask | undefined> {
    try {
      const docRef = getFirestoreDb().collection(COLLECTIONS.AGENT_TASKS).doc(id.toString());
      const doc = await docRef.get();
      
      if (!doc.exists) return undefined;
      
      const updatedTask = {
        ...doc.data(),
        ...task
      };
      
      await docRef.update(updatedTask);
      return { ...updatedTask, id } as AgentTask;
    } catch (error) {
      log(`Error updating task ${id}: ${error}`, 'firebase');
      return undefined;
    }
  }
  
  async completeTask(id: number, result: any): Promise<AgentTask | undefined> {
    const now = new Date();
    return this.updateTask(id, {
      status: 'completed',
      completedAt: now,
      result
    });
  }
  
  async failTask(id: number, errorDetails: string): Promise<AgentTask | undefined> {
    const now = new Date();
    return this.updateTask(id, {
      status: 'failed',
      completedAt: now,
      errorDetails
    });
  }
  
  // Web Accounts
  async getWebAccountsByProject(projectId: number): Promise<WebAccount[]> {
    try {
      const snapshot = await getFirestoreDb()
        .collection(COLLECTIONS.WEB_ACCOUNTS)
        .where('projectId', '==', projectId)
        .orderBy('id')
        .get();
      
      return snapshot.docs.map(doc => convertDoc<WebAccount>(doc));
    } catch (error) {
      log(`Error getting web accounts for project ${projectId}: ${error}`, 'firebase');
      return [];
    }
  }
  
  async getWebAccount(id: number): Promise<WebAccount | undefined> {
    try {
      const doc = await getFirestoreDb()
        .collection(COLLECTIONS.WEB_ACCOUNTS)
        .doc(id.toString())
        .get();
      
      if (!doc.exists) return undefined;
      return convertDoc<WebAccount>(doc);
    } catch (error) {
      log(`Error getting web account ${id}: ${error}`, 'firebase');
      return undefined;
    }
  }
  
  async createWebAccount(account: InsertWebAccount): Promise<WebAccount> {
    try {
      // Get next available ID
      const snapshot = await getFirestoreDb()
        .collection(COLLECTIONS.WEB_ACCOUNTS)
        .orderBy('id', 'desc')
        .limit(1)
        .get();
      
      const id = snapshot.empty ? 1 : Number(snapshot.docs[0].data().id) + 1;
      
      const accountWithId: WebAccount = {
        ...account,
        id,
        credentials: account.credentials ?? null,
        metadata: account.metadata ?? null
      };
      
      await getFirestoreDb()
        .collection(COLLECTIONS.WEB_ACCOUNTS)
        .doc(id.toString())
        .set(accountWithId);
      
      return accountWithId;
    } catch (error) {
      log(`Error creating web account: ${error}`, 'firebase');
      throw error;
    }
  }
  
  async updateWebAccount(id: number, account: Partial<InsertWebAccount>): Promise<WebAccount | undefined> {
    try {
      const docRef = getFirestoreDb().collection(COLLECTIONS.WEB_ACCOUNTS).doc(id.toString());
      const doc = await docRef.get();
      
      if (!doc.exists) return undefined;
      
      const updatedAccount = {
        ...doc.data(),
        ...account
      };
      
      await docRef.update(updatedAccount);
      return { ...updatedAccount, id } as WebAccount;
    } catch (error) {
      log(`Error updating web account ${id}: ${error}`, 'firebase');
      return undefined;
    }
  }
  
  async deleteWebAccount(id: number): Promise<boolean> {
    try {
      await getFirestoreDb()
        .collection(COLLECTIONS.WEB_ACCOUNTS)
        .doc(id.toString())
        .delete();
      
      return true;
    } catch (error) {
      log(`Error deleting web account ${id}: ${error}`, 'firebase');
      return false;
    }
  }
  
  // Helper methods for cascade updates
  private async updateMilestoneProgress(milestoneId: number): Promise<void> {
    try {
      const goals = await this.getGoalsByMilestone(milestoneId);
      
      if (goals.length === 0) return;
      
      // Calculate average progress
      const totalProgress = goals.reduce((sum, goal) => sum + goal.progress, 0);
      const avgProgress = Math.round(totalProgress / goals.length);
      
      // Update milestone progress
      const milestone = await this.getMilestone(milestoneId);
      if (!milestone) return;
      
      const updatedMilestone = await this.updateMilestone(milestoneId, { progress: avgProgress });
      
      // Continue up the chain to update feature progress
      if (updatedMilestone && updatedMilestone.featureId) {
        await this.updateFeatureProgress(updatedMilestone.featureId);
      }
    } catch (error) {
      log(`Error updating milestone progress: ${error}`, 'firebase');
    }
  }
  
  private async updateFeatureProgress(featureId: number): Promise<void> {
    try {
      const milestones = await this.getMilestonesByFeature(featureId);
      
      if (milestones.length === 0) return;
      
      // Calculate weighted average progress based on percentOfFeature
      let totalProgress = 0;
      let totalWeight = 0;
      
      for (const milestone of milestones) {
        const weight = milestone.percentOfFeature || 1;
        totalProgress += milestone.progress * weight;
        totalWeight += weight;
      }
      
      const avgProgress = Math.round(totalWeight > 0 ? totalProgress / totalWeight : 0);
      
      // Update feature progress
      const feature = await this.getFeature(featureId);
      if (!feature) return;
      
      const updatedFeature = await this.updateFeature(featureId, { progress: avgProgress });
      
      // Continue up the chain to update project progress
      if (updatedFeature && updatedFeature.projectId) {
        await this.updateProjectProgress(updatedFeature.projectId);
      }
    } catch (error) {
      log(`Error updating feature progress: ${error}`, 'firebase');
    }
  }
  
  private async updateProjectProgress(projectId: number): Promise<void> {
    try {
      const features = await this.getFeaturesByProject(projectId);
      
      if (features.length === 0) return;
      
      // Calculate weighted average progress based on priority
      let totalProgress = 0;
      let totalWeight = 0;
      
      for (const feature of features) {
        const weight = feature.priority || 1;
        totalProgress += feature.progress * weight;
        totalWeight += weight;
      }
      
      const avgProgress = Math.round(totalWeight > 0 ? totalProgress / totalWeight : 0);
      
      // Update project progress
      await this.updateProject(projectId, { 
        progress: avgProgress,
        lastUpdated: new Date()
      });
    } catch (error) {
      log(`Error updating project progress: ${error}`, 'firebase');
    }
  }
}

// Create firebase storage instance singleton 
let firebaseStorage: FirebaseStorage | null = null;

/**
 * Get Firebase storage instance (create if doesn't exist)
 */
export function getFirebaseStorage(): FirebaseStorage {
  if (!firebaseStorage) {
    firebaseStorage = new FirebaseStorage();
  }
  return firebaseStorage;
}