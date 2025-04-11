<<<<<<< HEAD
import { pgTable, text, serial, integer, boolean, json, timestamp, jsonb, varchar, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
// Import Persona from personaSchema if needed for other purposes
// Using a renamed import to avoid conflict with our own Persona type
import { Persona as PersonaFromSchema } from "./persona/personaSchema";

// Project Table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  isWorking: boolean("is_working").default(false).notNull(),
  progress: integer("progress").default(0).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  projectType: text("project_type").default("general").notNull(), // Type of project (e.g., "findom", "cachecow", "labor")
  agentConfig: jsonb("agent_config"), // Configuration for the AI agent associated with this project
  autoMode: boolean("auto_mode").default(false).notNull(), // Whether the project is in autonomous mode
  checkpoints: jsonb("checkpoints"), // Array of checkpoint timestamps and descriptions
  priority: integer("priority").default(5).notNull(), // Priority level (1-10)
  lastCheckIn: timestamp("last_check_in"), // Last time the project agent checked in
  nextCheckIn: timestamp("next_check_in"), // Scheduled time for next check-in
  lastAutomationRun: timestamp("last_automation_run"), // Last time the automation was run for this project
});

// Feature Table
export const features = pgTable("features", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  progress: integer("progress").default(0).notNull(),
  isWorking: boolean("is_working").default(false).notNull(),
  estimatedDays: integer("estimated_days").default(5), // Estimated time to complete in days
  createdAt: timestamp("created_at").defaultNow().notNull(),
  priority: integer("priority").default(5).notNull(), // Priority level (1-10)
  status: text("status").default("planned").notNull(), // Status: planned, in-progress, completed, blocked
  blockReason: text("block_reason"), // Reason if feature is blocked
  dependencies: jsonb("dependencies"), // Array of feature IDs this feature depends on
  aiGenerated: boolean("ai_generated").default(true).notNull(), // Whether this feature was AI generated
  startDate: timestamp("start_date"), // When work on this feature started
  completionDate: timestamp("completion_date"), // When feature was completed
  implementationDetails: jsonb("implementation_details"), // Technical details for implementation
  optimizationRound: integer("optimization_round").default(0).notNull(), // Which optimization round we're on
});

// Milestone Table
export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  featureId: integer("feature_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  estimatedHours: integer("estimated_hours").default(0),
  progress: integer("progress").default(0).notNull(),
  percentOfFeature: integer("percent_of_feature").default(25).notNull(), // What percentage of the feature this milestone represents
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Goal Table
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  milestoneId: integer("milestone_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  completed: boolean("completed").default(false).notNull(),
  percentOfMilestone: integer("percent_of_milestone").default(25).notNull(), // What percentage of the milestone this goal represents
  progress: integer("progress").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Project Activity Log
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  featureId: integer("feature_id"),
  milestoneId: integer("milestone_id"),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  agentId: text("agent_id"),
  codeSnippet: text("code_snippet"),
  activityType: text("activity_type").default("general").notNull(), // Type: code, debug, research, test, optimize, deploy, etc.
  isCheckpoint: boolean("is_checkpoint").default(false).notNull(), // Whether this activity is a checkpoint (rollback point)
  details: jsonb("details"), // Additional structured data about the activity
  urls: text("urls").array(), // Array of URLs related to the activity (APIs, resources, references)
  changes: jsonb("changes"), // Technical changes made in this activity
  thinkingProcess: text("thinking_process"), // Record of the AI's reasoning/planning process
});

// Insert Schemas
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true });
export const insertFeatureSchema = createInsertSchema(features).omit({ id: true });
export const insertMilestoneSchema = createInsertSchema(milestones).omit({ id: true });
export const insertGoalSchema = createInsertSchema(goals).omit({ id: true });
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true });

// Types
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Feature = typeof features.$inferSelect;
export type InsertFeature = z.infer<typeof insertFeatureSchema>;

export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

// For user authentication (keeping this for compatibility with existing code)
=======
import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

>>>>>>> 1d84bc7 (Set up Node.js project for Titan AI assistant.)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
<<<<<<< HEAD
  email: text("email").notNull(),
  name: text("name").notNull(),
=======
>>>>>>> 1d84bc7 (Set up Node.js project for Titan AI assistant.)
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
<<<<<<< HEAD
  email: true,
  name: true,
=======
>>>>>>> 1d84bc7 (Set up Node.js project for Titan AI assistant.)
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
<<<<<<< HEAD

// External API Integration
export const externalApis = pgTable("external_apis", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: text("name").notNull(), // Name of API (e.g., "OpenAI", "Firebase", "Telegram")
  apiType: text("api_type").notNull(), // The type/category of API
  status: text("status").default("inactive").notNull(), // Status: inactive, active, error
  endpoint: text("endpoint"), // Base URL for the API
  configData: jsonb("config_data"), // Configuration data (excluding sensitive credentials)
  lastUsed: timestamp("last_used"), // When the API was last used
  errorCount: integer("error_count").default(0).notNull(), // Number of errors encountered
  lastError: text("last_error"), // Last error message
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertExternalApiSchema = createInsertSchema(externalApis).omit({ id: true });
export type ExternalApi = typeof externalApis.$inferSelect;
export type InsertExternalApi = z.infer<typeof insertExternalApiSchema>;

// AI Agent Tasks
export const agentTasks = pgTable("agent_tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  featureId: integer("feature_id"),
  name: text("name").notNull(),
  description: text("description"),
  taskType: text("task_type").notNull(), // Type: code, research, debug, deploy, etc.
  status: text("status").default("pending").notNull(), // Status: pending, in-progress, completed, failed
  priority: integer("priority").default(5).notNull(),
  deadline: timestamp("deadline"),
  assignedAgent: text("assigned_agent"),
  progress: integer("progress").default(0).notNull(),
  result: jsonb("result"), // Task result data
  errorDetails: text("error_details"), // Details if task failed
  startTime: timestamp("start_time"),
  completionTime: timestamp("completion_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  parentTaskId: integer("parent_task_id"), // For subtasks
});

export const insertAgentTaskSchema = createInsertSchema(agentTasks).omit({ id: true });
export type AgentTask = typeof agentTasks.$inferSelect;
export type InsertAgentTask = z.infer<typeof insertAgentTaskSchema>;

// External Web Accounts (For tasks requiring web browsing, account registrations)
export const webAccounts = pgTable("web_accounts", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  service: text("service").notNull(), // Service name (e.g., "GitHub", "Upwork", "LinkedIn")
  accountName: text("account_name").notNull(), // Username or account identifier
  username: text("username").notNull(), // Login username for the service
  password: text("password").notNull(), // Login password for the service
  profileUrl: text("profile_url"), // URL to the profile
  status: text("status").default("active").notNull(), // Status: setup, active, suspended, etc.
  accountType: text("account_type").default("service").notNull(), // Type: service, social, marketplace, etc.
  lastActivity: timestamp("last_activity"), // When the account was last used
  cookies: jsonb("cookies"), // Browser session data
  lastBrowserSession: timestamp("last_browser_session"), // When the account was last used in a browser session
  sessionNotes: text("session_notes"), // Notes about the browser session
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWebAccountSchema = createInsertSchema(webAccounts).omit({ id: true });
export type WebAccount = typeof webAccounts.$inferSelect;
export type InsertWebAccount = z.infer<typeof insertWebAccountSchema>;

// Persona System
export const personas = pgTable("personas", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: varchar("name", { length: 50 }).notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  emoji: text("emoji"),  // Emoji representation for the persona
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  
  // Behavior settings stored as JSON
  behavior: jsonb("behavior").notNull(),
  
  // Performance stats stored as JSON
  stats: jsonb("stats").notNull(),
  
  // Autonomy settings stored as JSON
  autonomy: jsonb("autonomy").notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  personaId: integer("persona_id").notNull(),
  sender: varchar("sender", { length: 100 }).notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  isFromPersona: boolean("is_from_persona").notNull(),
  platform: varchar("platform", { length: 50 }).notNull(),
  clientId: varchar("client_id", { length: 100 }),
  metrics: jsonb("metrics"),
});

export const contentItems = pgTable("content_items", {
  id: serial("id").primaryKey(),
  personaId: integer("persona_id").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  contentType: varchar("content_type", { length: 50 }).notNull(),
  platform: varchar("platform", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"),
  metrics: jsonb("metrics").notNull(),
});

export const behaviorUpdates = pgTable("behavior_updates", {
  id: serial("id").primaryKey(),
  personaId: integer("persona_id").notNull(),
  previousInstructions: text("previous_instructions").notNull(),
  newInstructions: text("new_instructions").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  appliedBy: varchar("applied_by", { length: 100 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
});

// Persona-related insert schemas
export const insertPersonaSchema = createInsertSchema(personas).omit({ id: true, createdAt: true, updatedAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, timestamp: true });
export const insertContentItemSchema = createInsertSchema(contentItems).omit({ id: true, createdAt: true });
export const insertBehaviorUpdateSchema = createInsertSchema(behaviorUpdates).omit({ id: true, timestamp: true });

// Persona-related types
export type DBPersona = typeof personas.$inferSelect;
export type InsertDBPersona = z.infer<typeof insertPersonaSchema>;

export type DBChatMessage = typeof chatMessages.$inferSelect;
export type InsertDBChatMessage = z.infer<typeof insertChatMessageSchema>;

export type DBContentItem = typeof contentItems.$inferSelect;
export type InsertDBContentItem = z.infer<typeof insertContentItemSchema>;

export type DBBehaviorUpdate = typeof behaviorUpdates.$inferSelect;
export type InsertDBBehaviorUpdate = z.infer<typeof insertBehaviorUpdateSchema>;

// Define Persona type for compatibility
export type Persona = {
  id: string;
  name: string;
  displayName: string;
  description: string;
  projectId: number;  // Associated project ID
  imageUrl?: string | null;
  emoji?: string;     // Emoji representation for the persona
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  behavior: {
    tone: string;
    style: string;
    vocabulary: string;
    responsiveness: number;
    instructions: string;
    lastUpdated: Date;
  };
  stats: {
    totalIncome: number;
    messageCount: number;
    responseRate: number;
    averageResponseTime: number;
    contentCreated: number;
    contentPublished: number;
    conversionRate: number;
    lastActivity?: Date;
  };
  autonomy: {
    level: number;
    lastDecision?: string;
    decisionHistory: string[];
    canInitiateConversation: boolean;
    canCreateContent: boolean;
  };
};

// ChatMessage type for backward compatibility
export type ChatMessage = {
  id: string;
  personaId: number;  // Associated persona ID
  sender: string;
  content: string;
  timestamp: Date;
  isFromPersona: boolean;
  platform: string;
  clientId?: string | null;
  metrics?: {
    sentiment?: number;
    engagementScore?: number;
    conversionIntent?: number;
  };
};

// ContentItem type for backward compatibility
export type ContentItem = {
  id: string;
  personaId: number;  // Associated persona ID
  title: string;
  content: string;
  contentType: "post" | "story" | "message" | "promotion";
  platform: string;
  status: "draft" | "pending" | "published" | "rejected";
  createdAt: Date;
  publishedAt?: Date;
  metrics: {
    views: number;
    likes: number;
    comments: number;
    conversions: number;
    revenue: number;
  };
};

// BehaviorUpdate type for backward compatibility
export type BehaviorUpdate = {
  id: string;
  personaId: number;  // Associated persona ID
  previousInstructions: string;
  newInstructions: string;
  timestamp: Date;
  appliedBy: string;
  status: "pending" | "applied" | "rejected";
};
=======
>>>>>>> 1d84bc7 (Set up Node.js project for Titan AI assistant.)
