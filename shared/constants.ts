/**
 * Shared constants for client and server
 */

// WebSocket message types
export const WS_MESSAGE_TYPES = {
  // Connection events
  CONNECTION: 'connection',
  PING: 'ping',
  PONG: 'pong',
  ERROR: 'error',
  
  // Project messages
  PROJECT_UPDATE: 'project_update',
  FEATURE_UPDATE: 'feature_update',
  MILESTONE_UPDATE: 'milestone_update',
  GOAL_UPDATE: 'goal_update',
  
  // Activity messages
  ACTIVITY_LOG: 'activity_log',
  CHECKPOINT: 'checkpoint',
  
  // Agent messages
  AGENT_THINKING: 'agent_thinking',
  AGENT_ACTION: 'agent_action',
  AGENT_TASK_UPDATE: 'agent_task_update',
  
  // Chat messages
  CHAT_MESSAGE: 'chat_message',
  CHAT_RESPONSE: 'chat_response',
  
  // Web automation
  BROWSER_ACTION: 'browser_action',
  BROWSER_UPDATE: 'browser_update',
  
  // FINDOM specific
  FINDOM_UPDATE: 'findom_update',
  FINDOM_CONTENT: 'findom_content',
  FINDOM_CLIENT: 'findom_client',
};

// Project status values
export const PROJECT_STATUS = {
  PLANNING: 'planning',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold',
  CANCELLED: 'cancelled',
};

// Feature status values
export const FEATURE_STATUS = {
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  BLOCKED: 'blocked',
  CANCELLED: 'cancelled',
};

// Milestone status values
export const MILESTONE_STATUS = {
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  BLOCKED: 'blocked',
  CANCELLED: 'cancelled',
};

// Goal status values
export const GOAL_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  BLOCKED: 'blocked',
  CANCELLED: 'cancelled',
};

// Task status values
export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

// Persona types
export const PERSONA_TYPES = {
  DEVELOPER: 'developer',
  DESIGNER: 'designer',
  PRODUCT_MANAGER: 'product_manager',
  MARKETER: 'marketer',
  FINDOM: 'findom',
  CUSTOM: 'custom',
};

// Action types for activity logs
export const ACTIVITY_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  COMPLETE: 'complete',
  CHECKPOINT: 'checkpoint',
  CHAT: 'chat',
  CODE: 'code',
  DEBUG: 'debug',
  DEPLOY: 'deploy',
  AUTOMATION: 'automation',
};