import { pgTable, text, serial, integer, boolean, json, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

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
  profileUrl: text("profile_url"), // URL to the profile
  status: text("status").default("active").notNull(), // Status: setup, active, suspended, etc.
  accountType: text("account_type").default("service").notNull(), // Type: service, social, marketplace, etc.
  lastActivity: timestamp("last_activity"), // When the account was last used
  cookies: jsonb("cookies"), // Browser session data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWebAccountSchema = createInsertSchema(webAccounts).omit({ id: true });
export type WebAccount = typeof webAccounts.$inferSelect;
export type InsertWebAccount = z.infer<typeof insertWebAccountSchema>;
