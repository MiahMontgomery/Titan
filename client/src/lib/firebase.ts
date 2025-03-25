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

// Initialize with empty config - will be updated when user configures Firebase
let firebaseConfig: FirebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  appId: "",
};

let app: ReturnType<typeof initializeApp> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let provider: GoogleAuthProvider | null = null;
let initialized = false;

// Initialize Firebase with configuration
export function initializeFirebase(config: Record<string, string>) {
  try {
    firebaseConfig = {
      apiKey: config.apiKey,
      authDomain: config.authDomain || `${config.projectId}.firebaseapp.com`,
      projectId: config.projectId,
      storageBucket: config.storageBucket || `${config.projectId}.appspot.com`,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
    };
    
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    provider = new GoogleAuthProvider();
    initialized = true;
    
    console.log("Firebase initialized successfully");
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

// Data subscription functions (mocked for now - would be implemented with Firebase Firestore in a real app)
export function subscribeToProjects(callback: (projects: Project[]) => void): () => void {
  // Currently using the REST API, but would be replaced with Firebase Firestore subscriptions
  getProjects().then(callback).catch(console.error);
  
  // Return unsubscribe function
  return () => {
    console.log("Unsubscribed from projects");
  };
}

export function subscribeToFeaturesByProject(projectId: number, callback: (features: Feature[]) => void): () => void {
  // Currently using the REST API, but would be replaced with Firebase Firestore subscriptions
  getFeaturesByProject(projectId).then(callback).catch(console.error);
  
  // Return unsubscribe function
  return () => {
    console.log(`Unsubscribed from features for project ${projectId}`);
  };
}

export function subscribeToActivityLogs(projectId: number, callback: (logs: ActivityLog[]) => void): () => void {
  // Currently using the REST API, but would be replaced with Firebase Firestore subscriptions
  getActivityLogsByProject(projectId).then(callback).catch(console.error);
  
  // Return unsubscribe function
  return () => {
    console.log(`Unsubscribed from activity logs for project ${projectId}`);
  };
}