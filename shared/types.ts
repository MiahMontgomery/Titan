// Shared types for the application

// Define agent types
export enum AgentType {
  FINDOM = "FINDOM",
  CACHECOW = "CACHECOW"
}

// Define project status types
export enum ProjectStatus {
  ACTIVE = "active",
  PAUSED = "paused",
  COMPLETED = "completed",
  FAILED = "failed"
}

// Define task status types
export enum TaskStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed"
}

// Define activity log types
export enum ActivityLogType {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  SUCCESS = "success"
}

// Define OpenAI model types
export enum OpenAIModel {
  GPT_4O = "gpt-4o",
  GPT_4_TURBO = "gpt-4-turbo",
  GPT_4 = "gpt-4",
  GPT_3_5_TURBO = "gpt-3.5-turbo"
}

// Define API key types
export enum ApiKeyType {
  SHARED = "shared",
  TURBO = "turbo" // Project-specific "turbo" API key
}

// Define stats interface
export interface Stats {
  activeProjects: number;
  activeAgents: number;
  apiUsage: number;
  tasksCompleted: number;
}

// Define agent parameters interface
export interface AgentParameters {
  temperature: number;
  maxTokens: number;
  [key: string]: any;
}

// Define websocket message types
export interface WebSocketMessage {
  type: WebSocketMessageType;
  data: any;
}

export enum WebSocketMessageType {
  ACTIVITY_LOG = "activityLog",
  AGENT_STATUS = "agentStatus",
  STATS_UPDATE = "statsUpdate",
  TASK_UPDATE = "taskUpdate",
  PROJECT_UPDATE = "projectUpdate",
  ERROR = "error"
}
