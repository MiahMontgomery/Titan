// Generic response type for API calls
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// For stubbed external integrations
export interface TelegramIntegration {
  token: string;
}

export interface OpenAIIntegration {
  apiKey: string;
}

export interface FirebaseIntegration {
  config: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
}

// WebSocket message types
export type WebSocketMessageType = 
  | 'ping'
  | 'pong'
  | 'projects'
  | 'new-project'
  | 'update-project'
  | 'new-feature'
  | 'update-feature'
  | 'new-milestone'
  | 'update-milestone'
  | 'new-goal'
  | 'update-goal'
  | 'activity'
  | 'new-activity'
  | 'chat-message'
  | 'chat-response'
  | 'thinking';

export interface WebSocketMessage<T = any> {
  type: WebSocketMessageType;
  data?: T;
  projectId?: number;
  featureId?: number;
  milestoneId?: number;
  id?: number;
  message?: string;
  codeSnippet?: string | null;
}
