import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, Timestamp, serverTimestamp } from "firebase/firestore";
import { Project, Feature, Milestone, Goal, ActivityLog } from "@shared/schema";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBXM0ExkuweCZCAJ_e4XRzIk9K0O2581FA",
  authDomain: "titan-project-952f8.firebaseapp.com",
  projectId: "titan-project-952f8",
  storageBucket: "titan-project-952f8.firebasestorage.app",
  messagingSenderId: "152381765530",
  appId: "1:152381765530:web:1b26bb7225aedb3c99ac23"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collection references
const projectsCollection = collection(db, "projects");
const featuresCollection = collection(db, "features");
const milestonesCollection = collection(db, "milestones");
const goalsCollection = collection(db, "goals");
const activityLogsCollection = collection(db, "activity_logs");

// Helper functions for projects
export async function getProjects(): Promise<Project[]> {
  const snapshot = await getDocs(projectsCollection);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: parseInt(doc.id),
      lastUpdated: data.lastUpdated?.toDate() || new Date(),
    } as Project;
  });
}

export async function getProject(id: number): Promise<Project | null> {
  const docRef = doc(projectsCollection, id.toString());
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      ...data,
      id: parseInt(docSnap.id),
      lastUpdated: data.lastUpdated?.toDate() || new Date(),
    } as Project;
  }
  return null;
}

export async function createProject(project: Omit<Project, "id">): Promise<Project> {
  // Get the next ID (in a real-world scenario, we'd use auto-increment or UUID)
  const snapshot = await getDocs(projectsCollection);
  const nextId = snapshot.size > 0 
    ? Math.max(...snapshot.docs.map(doc => parseInt(doc.id))) + 1 
    : 0;
  
  const newProject = {
    ...project,
    lastUpdated: serverTimestamp(),
  };
  
  await setDoc(doc(projectsCollection, nextId.toString()), newProject);
  
  return {
    ...newProject,
    id: nextId,
    lastUpdated: new Date(),
  } as Project;
}

export async function updateProject(id: number, data: Partial<Project>): Promise<Project | null> {
  const docRef = doc(projectsCollection, id.toString());
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  const updateData = {
    ...data,
    lastUpdated: serverTimestamp(),
  };
  
  await updateDoc(docRef, updateData);
  
  const updatedDocSnap = await getDoc(docRef);
  const updatedData = updatedDocSnap.data() || {};
  
  return {
    ...updatedData,
    id,
    lastUpdated: updatedData.lastUpdated?.toDate() || new Date(),
  } as Project;
}

export async function deleteProject(id: number): Promise<boolean> {
  try {
    await deleteDoc(doc(projectsCollection, id.toString()));
    return true;
  } catch {
    return false;
  }
}

// Helper functions for features
export async function getFeaturesByProject(projectId: number): Promise<Feature[]> {
  const q = query(featuresCollection, where("projectId", "==", projectId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: parseInt(doc.id),
  } as Feature));
}

export async function createFeature(feature: Omit<Feature, "id">): Promise<Feature> {
  const snapshot = await getDocs(featuresCollection);
  const nextId = snapshot.size > 0 
    ? Math.max(...snapshot.docs.map(doc => parseInt(doc.id))) + 1 
    : 0;
  
  const newFeature = {
    ...feature,
    createdAt: serverTimestamp(),
  };
  
  await setDoc(doc(featuresCollection, nextId.toString()), newFeature);
  
  return {
    ...newFeature,
    id: nextId,
    createdAt: new Date(),
  } as Feature;
}

// Helper functions for milestones
export async function getMilestonesByFeature(featureId: number): Promise<Milestone[]> {
  const q = query(milestonesCollection, where("featureId", "==", featureId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: parseInt(doc.id),
  } as Milestone));
}

export async function createMilestone(milestone: Omit<Milestone, "id">): Promise<Milestone> {
  const snapshot = await getDocs(milestonesCollection);
  const nextId = snapshot.size > 0 
    ? Math.max(...snapshot.docs.map(doc => parseInt(doc.id))) + 1 
    : 0;
  
  const newMilestone = {
    ...milestone,
    createdAt: serverTimestamp(),
  };
  
  await setDoc(doc(milestonesCollection, nextId.toString()), newMilestone);
  
  return {
    ...newMilestone,
    id: nextId,
    createdAt: new Date(),
  } as Milestone;
}

// Helper functions for goals
export async function getGoalsByMilestone(milestoneId: number): Promise<Goal[]> {
  const q = query(goalsCollection, where("milestoneId", "==", milestoneId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: parseInt(doc.id),
  } as Goal));
}

export async function createGoal(goal: Omit<Goal, "id">): Promise<Goal> {
  const snapshot = await getDocs(goalsCollection);
  const nextId = snapshot.size > 0 
    ? Math.max(...snapshot.docs.map(doc => parseInt(doc.id))) + 1 
    : 0;
  
  const newGoal = {
    ...goal,
    createdAt: serverTimestamp(),
  };
  
  await setDoc(doc(goalsCollection, nextId.toString()), newGoal);
  
  return {
    ...newGoal,
    id: nextId,
    createdAt: new Date(),
  } as Goal;
}

// Helper functions for activity logs
export async function getActivityLogsByProject(projectId: number): Promise<ActivityLog[]> {
  const q = query(activityLogsCollection, where("projectId", "==", projectId), orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: parseInt(doc.id),
    timestamp: doc.data().timestamp?.toDate() || new Date(),
  } as ActivityLog));
}

export async function createActivityLog(log: Omit<ActivityLog, "id">): Promise<ActivityLog> {
  const snapshot = await getDocs(activityLogsCollection);
  const nextId = snapshot.size > 0 
    ? Math.max(...snapshot.docs.map(doc => parseInt(doc.id))) + 1 
    : 0;
  
  const newLog = {
    ...log,
    timestamp: log.timestamp instanceof Date ? Timestamp.fromDate(log.timestamp) : serverTimestamp(),
  };
  
  await setDoc(doc(activityLogsCollection, nextId.toString()), newLog);
  
  return {
    ...newLog,
    id: nextId,
    timestamp: log.timestamp instanceof Date ? log.timestamp : new Date(),
  } as ActivityLog;
}

// Real-time listeners
export function subscribeToProjects(callback: (projects: Project[]) => void): () => void {
  return onSnapshot(projectsCollection, (snapshot) => {
    const projects = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: parseInt(doc.id),
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
      } as Project;
    });
    callback(projects);
  });
}

export function subscribeToFeaturesByProject(projectId: number, callback: (features: Feature[]) => void): () => void {
  const q = query(featuresCollection, where("projectId", "==", projectId), orderBy("createdAt", "desc"));
  
  return onSnapshot(q, (snapshot) => {
    const features = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: parseInt(doc.id),
    } as Feature));
    callback(features);
  });
}

export function subscribeToActivityLogs(projectId: number, callback: (logs: ActivityLog[]) => void): () => void {
  const q = query(activityLogsCollection, where("projectId", "==", projectId), orderBy("timestamp", "desc"));
  
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: parseInt(doc.id),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    } as ActivityLog));
    callback(logs);
  });
}

export { app, db };