import { Agent as SchemaAgent, AgentType, AgentStatus, Project, ApiKey, ActivityLog, AutomationTask } from "@shared/schema";

// Extend types with UI-specific properties if needed
export interface Agent extends SchemaAgent {
  isActive?: boolean;
}

export type WebSocketMessage = 
  | { type: "connection", message: string }
  | { type: "agent-added", agent: Partial<Agent> }
  | { type: "agent-status-changed", agentId: number, status: AgentStatus }
  | { type: "project-added", project: Partial<Project> }
  | { type: "api-key-added", apiKey: Partial<ApiKey> }
  | { type: "automation-task-added", task: Partial<AutomationTask> }
  | { type: "automation-task-started", taskId: number }
  | { type: "automation-task-completed", taskId: number, success: boolean, error?: string }
  | { type: "activity-logged", log: ActivityLog }
  | { type: "error", message: string }
  | { type: "ping" }
  | { type: "pong", timestamp: string };

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface StatusCardData {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

export interface SidebarItem {
  title: string;
  path: string;
  icon: React.ReactNode;
}

export interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

export type SocketStatus = 'connecting' | 'connected' | 'disconnected';

export interface AutomationStep {
  id: string;
  type: 'navigate' | 'click' | 'type' | 'extract' | 'wait' | 'screenshot' | 'custom';
  params: Record<string, any>;
}

export interface AutomationWorkflow {
  id: number;
  name: string;
  description?: string;
  steps: AutomationStep[];
  startUrl: string;
  createdAt: Date;
  lastRun?: Date;
}

export interface ApiKeyFormData {
  name: string;
  key: string;
  provider: string;
  isTurbo: boolean;
  isDefault: boolean;
  projectId?: number | null;
}

export interface AgentFormData {
  name: string;
  description?: string;
  type: AgentType;
  apiKeyId?: number | null;
  projectId?: number | null;
  config: {
    isTurbo?: boolean;
    [key: string]: any;
  };
}

export interface ProjectFormData {
  name: string;
  description?: string;
}
