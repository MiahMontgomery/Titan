import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, GoogleAuthProvider } from "firebase/auth";
import { apiRequest } from "./queryClient";
import { Project, Feature, Milestone, Goal, ActivityLog } from "@shared/schema";

// Firebase config interface
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId?: string;
  appId: string;
}

// Get Firebase configuration from environment variables or saved config
const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.FIREBASE_API_KEY || "",
  authDomain: import.meta.env.FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.FIREBASE_APP_ID || "",
};

// Initialize Firebase app if secrets are provided
let app = null;
let auth = null;
let provider = null;
let initialized = false;

try {
  // Only initialize if we have required config
  if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId) {
    // Auto-fill auth domain and storage bucket if not provided
    if (!firebaseConfig.authDomain) {
      firebaseConfig.authDomain = `${firebaseConfig.projectId}.firebaseapp.com`;
    }
    if (!firebaseConfig.storageBucket) {
      firebaseConfig.storageBucket = `${firebaseConfig.projectId}.appspot.com`;
    }

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    provider = new GoogleAuthProvider();
    initialized = true;
    console.log("Firebase initialized automatically with environment variables");
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
  initialized = false;
}

// Initialize or update Firebase with configuration
export function initializeFirebase(config: Record<string, string>) {
  try {
    const newConfig = {
      apiKey: config.apiKey || firebaseConfig.apiKey,
      authDomain: config.authDomain || `${config.projectId}.firebaseapp.com`,
      projectId: config.projectId || firebaseConfig.projectId,
      storageBucket: config.storageBucket || `${config.projectId}.appspot.com`,
      messagingSenderId: config.messagingSenderId || firebaseConfig.messagingSenderId,
      appId: config.appId || firebaseConfig.appId,
    };
    
    // Only reinitialize if Firebase hasn't been initialized yet or if config changed
    if (!initialized || 
        newConfig.apiKey !== firebaseConfig.apiKey ||
        newConfig.projectId !== firebaseConfig.projectId ||
        newConfig.appId !== firebaseConfig.appId) {
      
      if (app) {
        // If we're here, we need to clean up the existing app (in real Firebase, you'd need to use a different name)
        console.log("Updating Firebase configuration");
      }
      
      Object.assign(firebaseConfig, newConfig);
      app = initializeApp(firebaseConfig, "titan-app");
      auth = getAuth(app);
      provider = new GoogleAuthProvider();
      initialized = true;
      
      console.log("Firebase initialized successfully with provided config");
    }
    
    return true;
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    initialized = false;
    return false;
  }
}

// Authentication functions
export function signIn() {
  if (!initialized || !auth || !provider) {
    return Promise.reject("Firebase not initialized");
  }
  return signInWithRedirect(auth, provider);
}

// Data access functions that use REST API
export async function getProjects(): Promise<Project[]> {
  return apiRequest({ url: "/api/projects", method: "GET" });
}

export async function getProject(id: number): Promise<Project | null> {
  try {
    return await apiRequest({ url: `/api/projects/${id}`, method: "GET" });
  } catch (error) {
    console.error(`Error fetching project ${id}:`, error);
    return null;
  }
}

export async function createProject(project: Omit<Project, "id">): Promise<Project> {
  return apiRequest({ 
    url: "/api/projects", 
    method: "POST", 
    data: project 
  });
}

export async function updateProject(id: number, data: Partial<Project>): Promise<Project | null> {
  try {
    return await apiRequest({ 
      url: `/api/projects/${id}`, 
      method: "PATCH", 
      data 
    });
  } catch (error) {
    console.error(`Error updating project ${id}:`, error);
    return null;
  }
}

export async function deleteProject(id: number): Promise<boolean> {
  try {
    await apiRequest({ url: `/api/projects/${id}`, method: "DELETE" });
    return true;
  } catch (error) {
    console.error(`Error deleting project ${id}:`, error);
    return false;
  }
}

export async function getFeaturesByProject(projectId: number): Promise<Feature[]> {
  return apiRequest({ url: `/api/projects/${projectId}/features`, method: "GET" });
}

export async function createFeature(feature: Omit<Feature, "id">): Promise<Feature> {
  return apiRequest({ 
    url: "/api/features", 
    method: "POST", 
    data: feature 
  });
}

export async function getMilestonesByFeature(featureId: number): Promise<Milestone[]> {
  return apiRequest({ url: `/api/features/${featureId}/milestones`, method: "GET" });
}

export async function createMilestone(milestone: Omit<Milestone, "id">): Promise<Milestone> {
  return apiRequest({ 
    url: "/api/milestones", 
    method: "POST", 
    data: milestone 
  });
}

export async function getGoalsByMilestone(milestoneId: number): Promise<Goal[]> {
  return apiRequest({ url: `/api/milestones/${milestoneId}/goals`, method: "GET" });
}

export async function createGoal(goal: Omit<Goal, "id">): Promise<Goal> {
  return apiRequest({ 
    url: "/api/goals", 
    method: "POST", 
    data: goal 
  });
}

export async function getActivityLogsByProject(projectId: number): Promise<ActivityLog[]> {
  return apiRequest({ url: `/api/projects/${projectId}/activity`, method: "GET" });
}

export async function createActivityLog(log: Omit<ActivityLog, "id">): Promise<ActivityLog> {
  return apiRequest({ 
    url: "/api/activity", 
    method: "POST", 
    data: log 
  });
}

import { getFirestore, collection, query, where, orderBy, onSnapshot, doc } from "firebase/firestore";

// Data subscription functions with real-time Firestore updates
export function subscribeToProjects(callback: (projects: Project[]) => void): () => void {
  if (!initialized || !app) {
    console.warn("Firebase not initialized, using REST fallback");
    getProjects().then(callback).catch(console.error);
    return () => console.log("Unsubscribed from projects (REST fallback)");
  }
  
  try {
    const db = getFirestore(app);
    const projectsRef = collection(db, 'projects');
    const q = query(projectsRef, orderBy('id'));
    
    return onSnapshot(q, (snapshot) => {
      const projects: Project[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        projects.push({
          id: Number(doc.id),
          ...data,
          lastUpdated: data.lastUpdated?.toDate() || new Date(), // Convert Firestore Timestamp to JS Date
          lastCheckIn: data.lastCheckIn?.toDate() || null,
          nextCheckIn: data.nextCheckIn?.toDate() || null
        } as Project);
      });
      callback(projects);
    }, (error) => {
      console.error("Error subscribing to projects:", error);
      // Fall back to REST API on error
      getProjects().then(callback).catch(console.error);
    });
  } catch (error) {
    console.error("Error setting up projects subscription:", error);
    // Fall back to REST API
    getProjects().then(callback).catch(console.error);
    return () => console.log("Unsubscribed from projects (REST fallback)");
  }
}

export function subscribeToFeaturesByProject(projectId: number, callback: (features: Feature[]) => void): () => void {
  if (!initialized || !app) {
    console.warn("Firebase not initialized, using REST fallback");
    getFeaturesByProject(projectId).then(callback).catch(console.error);
    return () => console.log(`Unsubscribed from features for project ${projectId} (REST fallback)`);
  }
  
  try {
    const db = getFirestore(app);
    const featuresRef = collection(db, 'features');
    const q = query(
      featuresRef,
      where('projectId', '==', projectId),
      orderBy('priority', 'desc'),
      orderBy('id')
    );
    
    return onSnapshot(q, (snapshot) => {
      const features: Feature[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        features.push({
          id: Number(doc.id),
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          startDate: data.startDate?.toDate() || null,
          endDate: data.endDate?.toDate() || null,
          startedAt: data.startedAt?.toDate() || null,
          completedAt: data.completedAt?.toDate() || null
        } as Feature);
      });
      callback(features);
    }, (error) => {
      console.error(`Error subscribing to features for project ${projectId}:`, error);
      // Fall back to REST API on error
      getFeaturesByProject(projectId).then(callback).catch(console.error);
    });
  } catch (error) {
    console.error(`Error setting up features subscription for project ${projectId}:`, error);
    // Fall back to REST API
    getFeaturesByProject(projectId).then(callback).catch(console.error);
    return () => console.log(`Unsubscribed from features for project ${projectId} (REST fallback)`);
  }
}

export function subscribeToMilestonesByFeature(featureId: number, callback: (milestones: Milestone[]) => void): () => void {
  if (!initialized || !app) {
    console.warn("Firebase not initialized, using REST fallback");
    getMilestonesByFeature(featureId).then(callback).catch(console.error);
    return () => console.log(`Unsubscribed from milestones for feature ${featureId} (REST fallback)`);
  }
  
  try {
    const db = getFirestore(app);
    const milestonesRef = collection(db, 'milestones');
    const q = query(
      milestonesRef,
      where('featureId', '==', featureId),
      orderBy('id')
    );
    
    return onSnapshot(q, (snapshot) => {
      const milestones: Milestone[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        milestones.push({
          id: Number(doc.id),
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as Milestone);
      });
      callback(milestones);
    }, (error) => {
      console.error(`Error subscribing to milestones for feature ${featureId}:`, error);
      // Fall back to REST API on error
      getMilestonesByFeature(featureId).then(callback).catch(console.error);
    });
  } catch (error) {
    console.error(`Error setting up milestones subscription for feature ${featureId}:`, error);
    // Fall back to REST API
    getMilestonesByFeature(featureId).then(callback).catch(console.error);
    return () => console.log(`Unsubscribed from milestones for feature ${featureId} (REST fallback)`);
  }
}

export function subscribeToGoalsByMilestone(milestoneId: number, callback: (goals: Goal[]) => void): () => void {
  if (!initialized || !app) {
    console.warn("Firebase not initialized, using REST fallback");
    getGoalsByMilestone(milestoneId).then(callback).catch(console.error);
    return () => console.log(`Unsubscribed from goals for milestone ${milestoneId} (REST fallback)`);
  }
  
  try {
    const db = getFirestore(app);
    const goalsRef = collection(db, 'goals');
    const q = query(
      goalsRef,
      where('milestoneId', '==', milestoneId),
      orderBy('id')
    );
    
    return onSnapshot(q, (snapshot) => {
      const goals: Goal[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        goals.push({
          id: Number(doc.id),
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as Goal);
      });
      callback(goals);
    }, (error) => {
      console.error(`Error subscribing to goals for milestone ${milestoneId}:`, error);
      // Fall back to REST API on error
      getGoalsByMilestone(milestoneId).then(callback).catch(console.error);
    });
  } catch (error) {
    console.error(`Error setting up goals subscription for milestone ${milestoneId}:`, error);
    // Fall back to REST API
    getGoalsByMilestone(milestoneId).then(callback).catch(console.error);
    return () => console.log(`Unsubscribed from goals for milestone ${milestoneId} (REST fallback)`);
  }
}

export function subscribeToActivityLogs(projectId: number, callback: (logs: ActivityLog[]) => void): () => void {
  if (!initialized || !app) {
    console.warn("Firebase not initialized, using REST fallback");
    getActivityLogsByProject(projectId).then(callback).catch(console.error);
    return () => console.log(`Unsubscribed from activity logs for project ${projectId} (REST fallback)`);
  }
  
  try {
    const db = getFirestore(app);
    const logsRef = collection(db, 'activityLogs');
    const q = query(
      logsRef,
      where('projectId', '==', projectId),
      orderBy('timestamp', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const logs: ActivityLog[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        logs.push({
          id: Number(doc.id),
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        } as ActivityLog);
      });
      callback(logs);
    }, (error) => {
      console.error(`Error subscribing to activity logs for project ${projectId}:`, error);
      // Fall back to REST API on error
      getActivityLogsByProject(projectId).then(callback).catch(console.error);
    });
  } catch (error) {
    console.error(`Error setting up activity logs subscription for project ${projectId}:`, error);
    // Fall back to REST API
    getActivityLogsByProject(projectId).then(callback).catch(console.error);
    return () => console.log(`Unsubscribed from activity logs for project ${projectId} (REST fallback)`);
  }
}