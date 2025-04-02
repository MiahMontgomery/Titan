import { initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { log } from './vite';
import { IStorage, MemStorage, setStorage } from './storage';
import {
  Project, InsertProject,
  Feature, InsertFeature,
  Milestone, InsertMilestone,
  Goal, InsertGoal,
  ActivityLog, InsertActivityLog,
  ExternalApi, InsertExternalApi,
  AgentTask, InsertAgentTask,
  WebAccount, InsertWebAccount,
  User, InsertUser,
  DBPersona, InsertDBPersona, 
  DBChatMessage, InsertDBChatMessage,
  DBContentItem, InsertDBContentItem,
  DBBehaviorUpdate, InsertDBBehaviorUpdate,
  Persona, ChatMessage, ContentItem, BehaviorUpdate
} from "@shared/schema";

// Firebase Admin initialization state
let firebaseInitialized = false;
let firestoreDb: Firestore | null = null;
let firebaseApp: App | null = null;

// Create a fallback memory storage
const fallbackStorage = new MemStorage();

// Create firebase storage instance singleton
let firebaseStorage: IStorage | null = null;

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
  WEB_ACCOUNTS: 'webAccounts',
  PERSONAS: 'personas',
  CHAT_MESSAGES: 'chatMessages',
  CONTENT_ITEMS: 'contentItems',
  BEHAVIOR_UPDATES: 'behaviorUpdates'
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
 * Convert Firestore document data to model object with numeric ID
 * @param doc Firestore document
 * @returns Model object with numeric ID
 */
function convertDoc<T>(doc: any): T {
  return {
    id: Number(doc.id),
    ...doc.data()
  } as unknown as T;
}

/**
 * Convert Firestore document data to model object with string ID
 * @param doc Firestore document
 * @returns Model object with string ID
 */
function convertStringIdDoc<T>(doc: any): T {
  return {
    id: doc.id,
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
      
      // If we encounter an authentication error, try to use in-memory fallback
      if (String(error).includes("Could not refresh access token") || 
          String(error).includes("Cannot read properties of undefined") ||
          String(error).includes("auth/project-not-found")) {
        // Create a fresh memory storage instance
        const memStorage = new MemStorage();
        
        // Replace the current Firebase storage with memory storage
        firebaseStorage = memStorage;
        log('Falling back to in-memory storage due to Firebase authentication error', 'firebase');
        
        // Return projects from the memory storage (this will be empty initially)
        return await memStorage.getAllProjects();
      }
      
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

/**
 * Get Firebase storage instance (create if doesn't exist)
 * Falls back to memory storage if Firebase initialization fails
 */
  // Persona Management
  async getPersonasByProject(projectId: number): Promise<Persona[]> {
    try {
      const snapshot = await getFirestoreDb()
        .collection(COLLECTIONS.PERSONAS)
        .where('projectId', '==', projectId)
        .get();
      
      return snapshot.docs.map(doc => convertStringIdDoc<Persona>(doc));
    } catch (error) {
      log(`Error getting personas for project ${projectId}: ${error}`, 'firebase');
      return [];
    }
  }
  
  async getPersona(id: string): Promise<Persona | undefined> {
    try {
      const doc = await getFirestoreDb()
        .collection(COLLECTIONS.PERSONAS)
        .doc(id)
        .get();
      
      if (!doc.exists) return undefined;
      return convertStringIdDoc<Persona>(doc);
    } catch (error) {
      log(`Error getting persona ${id}: ${error}`, 'firebase');
      return undefined;
    }
  }
  
  async createPersona(persona: Omit<Persona, "id" | "createdAt" | "updatedAt">): Promise<Persona> {
    try {
      const timestamp = new Date();
      const id = `persona_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      const personaWithId: Persona = {
        ...persona,
        id,
        createdAt: timestamp,
        updatedAt: timestamp,
        isActive: persona.isActive ?? false,
        conversationHistory: persona.conversationHistory || [],
        systemPrompt: persona.systemPrompt || "",
        stats: persona.stats || {
          messagesReceived: 0,
          messagesSent: 0,
          contentCreated: 0,
          engagementRate: 0,
          conversionRate: 0,
          averageResponseTime: 0
        },
        behaviorSettings: persona.behaviorSettings || {
          responseDelay: 0,
          initiateConversations: false,
          followUpFrequency: "low",
          conversationStyle: "formal",
          topicPreferences: []
        }
      };
      
      await getFirestoreDb()
        .collection(COLLECTIONS.PERSONAS)
        .doc(id)
        .set(personaWithId);
      
      return personaWithId;
    } catch (error) {
      log(`Error creating persona: ${error}`, 'firebase');
      throw error;
    }
  }
  
  async updatePersona(id: string, data: Partial<Persona>): Promise<Persona | undefined> {
    try {
      const docRef = getFirestoreDb().collection(COLLECTIONS.PERSONAS).doc(id);
      const doc = await docRef.get();
      
      if (!doc.exists) return undefined;
      
      const updatedPersona = {
        ...doc.data(),
        ...data,
        updatedAt: new Date()
      };
      
      await docRef.update(updatedPersona);
      return { ...updatedPersona, id } as Persona;
    } catch (error) {
      log(`Error updating persona ${id}: ${error}`, 'firebase');
      return undefined;
    }
  }
  
  async deletePersona(id: string): Promise<boolean> {
    try {
      await getFirestoreDb()
        .collection(COLLECTIONS.PERSONAS)
        .doc(id)
        .delete();
      
      return true;
    } catch (error) {
      log(`Error deleting persona ${id}: ${error}`, 'firebase');
      return false;
    }
  }
  
  async togglePersonaActive(id: string, isActive: boolean): Promise<Persona | undefined> {
    return this.updatePersona(id, { isActive });
  }
  
  // Chat Messages
  async getChatMessagesByPersona(personaId: string): Promise<ChatMessage[]> {
    try {
      const snapshot = await getFirestoreDb()
        .collection(COLLECTIONS.CHAT_MESSAGES)
        .where('personaId', '==', personaId)
        .orderBy('timestamp')
        .get();
      
      return snapshot.docs.map(doc => convertStringIdDoc<ChatMessage>(doc));
    } catch (error) {
      log(`Error getting chat messages for persona ${personaId}: ${error}`, 'firebase');
      return [];
    }
  }
  
  async getChatMessage(id: string): Promise<ChatMessage | undefined> {
    try {
      const doc = await getFirestoreDb()
        .collection(COLLECTIONS.CHAT_MESSAGES)
        .doc(id)
        .get();
      
      if (!doc.exists) return undefined;
      return convertStringIdDoc<ChatMessage>(doc);
    } catch (error) {
      log(`Error getting chat message ${id}: ${error}`, 'firebase');
      return undefined;
    }
  }
  
  async createChatMessage(message: Omit<ChatMessage, "id" | "timestamp">): Promise<ChatMessage> {
    try {
      const timestamp = new Date();
      const id = `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      const messageWithId: ChatMessage = {
        ...message,
        id,
        timestamp
      };
      
      await getFirestoreDb()
        .collection(COLLECTIONS.CHAT_MESSAGES)
        .doc(id)
        .set(messageWithId);
      
      return messageWithId;
    } catch (error) {
      log(`Error creating chat message: ${error}`, 'firebase');
      throw error;
    }
  }
  
  async deleteChatMessage(id: string): Promise<boolean> {
    try {
      await getFirestoreDb()
        .collection(COLLECTIONS.CHAT_MESSAGES)
        .doc(id)
        .delete();
      
      return true;
    } catch (error) {
      log(`Error deleting chat message ${id}: ${error}`, 'firebase');
      return false;
    }
  }
  
  // Content Items
  async getContentItemsByPersona(personaId: string): Promise<ContentItem[]> {
    try {
      const snapshot = await getFirestoreDb()
        .collection(COLLECTIONS.CONTENT_ITEMS)
        .where('personaId', '==', personaId)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => convertStringIdDoc<ContentItem>(doc));
    } catch (error) {
      log(`Error getting content items for persona ${personaId}: ${error}`, 'firebase');
      return [];
    }
  }
  
  async getContentItem(id: string): Promise<ContentItem | undefined> {
    try {
      const doc = await getFirestoreDb()
        .collection(COLLECTIONS.CONTENT_ITEMS)
        .doc(id)
        .get();
      
      if (!doc.exists) return undefined;
      return convertStringIdDoc<ContentItem>(doc);
    } catch (error) {
      log(`Error getting content item ${id}: ${error}`, 'firebase');
      return undefined;
    }
  }
  
  async createContentItem(item: Omit<ContentItem, "id" | "createdAt">): Promise<ContentItem> {
    try {
      const createdAt = new Date();
      const id = `content_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      const itemWithId: ContentItem = {
        ...item,
        id,
        createdAt
      };
      
      await getFirestoreDb()
        .collection(COLLECTIONS.CONTENT_ITEMS)
        .doc(id)
        .set(itemWithId);
      
      return itemWithId;
    } catch (error) {
      log(`Error creating content item: ${error}`, 'firebase');
      throw error;
    }
  }
  
  async updateContentItem(id: string, data: Partial<ContentItem>): Promise<ContentItem | undefined> {
    try {
      const docRef = getFirestoreDb().collection(COLLECTIONS.CONTENT_ITEMS).doc(id);
      const doc = await docRef.get();
      
      if (!doc.exists) return undefined;
      
      const updatedItem = {
        ...doc.data(),
        ...data
      };
      
      await docRef.update(updatedItem);
      return { ...updatedItem, id } as ContentItem;
    } catch (error) {
      log(`Error updating content item ${id}: ${error}`, 'firebase');
      return undefined;
    }
  }
  
  async deleteContentItem(id: string): Promise<boolean> {
    try {
      await getFirestoreDb()
        .collection(COLLECTIONS.CONTENT_ITEMS)
        .doc(id)
        .delete();
      
      return true;
    } catch (error) {
      log(`Error deleting content item ${id}: ${error}`, 'firebase');
      return false;
    }
  }
  
  // Behavior Updates
  async getBehaviorUpdatesByPersona(personaId: string): Promise<BehaviorUpdate[]> {
    try {
      const snapshot = await getFirestoreDb()
        .collection(COLLECTIONS.BEHAVIOR_UPDATES)
        .where('personaId', '==', personaId)
        .orderBy('timestamp', 'desc')
        .get();
      
      return snapshot.docs.map(doc => convertStringIdDoc<BehaviorUpdate>(doc));
    } catch (error) {
      log(`Error getting behavior updates for persona ${personaId}: ${error}`, 'firebase');
      return [];
    }
  }
  
  async getBehaviorUpdate(id: string): Promise<BehaviorUpdate | undefined> {
    try {
      const doc = await getFirestoreDb()
        .collection(COLLECTIONS.BEHAVIOR_UPDATES)
        .doc(id)
        .get();
      
      if (!doc.exists) return undefined;
      return convertStringIdDoc<BehaviorUpdate>(doc);
    } catch (error) {
      log(`Error getting behavior update ${id}: ${error}`, 'firebase');
      return undefined;
    }
  }
  
  async createBehaviorUpdate(update: Omit<BehaviorUpdate, "id" | "timestamp">): Promise<BehaviorUpdate> {
    try {
      const timestamp = new Date();
      const id = `behavior_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      const updateWithId: BehaviorUpdate = {
        ...update,
        id,
        timestamp,
        applied: update.applied ?? false
      };
      
      await getFirestoreDb()
        .collection(COLLECTIONS.BEHAVIOR_UPDATES)
        .doc(id)
        .set(updateWithId);
      
      return updateWithId;
    } catch (error) {
      log(`Error creating behavior update: ${error}`, 'firebase');
      throw error;
    }
  }
  
  async applyBehaviorUpdate(id: string): Promise<BehaviorUpdate | undefined> {
    try {
      const docRef = getFirestoreDb().collection(COLLECTIONS.BEHAVIOR_UPDATES).doc(id);
      const doc = await docRef.get();
      
      if (!doc.exists) return undefined;
      
      const update = convertStringIdDoc<BehaviorUpdate>(doc);
      
      // Get the persona
      const persona = await this.getPersona(update.personaId);
      if (!persona) return undefined;
      
      // Apply the behavior updates to the persona
      const updatedSettings = {
        ...persona.behaviorSettings,
        ...update.behaviorChanges
      };
      
      // Update persona
      await this.updatePersona(update.personaId, { 
        behaviorSettings: updatedSettings 
      });
      
      // Mark update as applied
      await docRef.update({ applied: true });
      
      return { ...update, applied: true };
    } catch (error) {
      log(`Error applying behavior update ${id}: ${error}`, 'firebase');
      return undefined;
    }
  }
  
  // WebAccounts alias
  async getWebAccounts(projectId: number): Promise<WebAccount[]> {
    return this.getWebAccountsByProject(projectId);
  }
}

export function getFirebaseStorage(): IStorage {
  if (!firebaseStorage) {
    try {
      // Check if Firebase is initialized properly
      if (!firebaseInitialized || !firestoreDb) {
        log('Firebase is not properly initialized, falling back to memory storage', 'firebase');
        firebaseStorage = new MemStorage();
      } else {
        firebaseStorage = new FirebaseStorage();
      }
    } catch (error) {
      log(`Error creating Firebase storage, falling back to memory storage: ${error}`, 'firebase');
      firebaseStorage = new MemStorage();
    }
  }
  return firebaseStorage;
}