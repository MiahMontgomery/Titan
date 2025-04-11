import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ProjectTabs, TabContent } from "@/components/ui/project-tabs";
import { ProgressTab } from "./progress-tab";
import { InputTab } from "./input-tab";
import { LogsTab } from "./logs-tab";
import { OutputTab } from "./output-tab";
import { CodeTab } from "./code-tab";

// Project type definition
export type Project = {
  id: number;
  name: string;
  description: string;
  status: "active" | "idle" | "error";
  progress: number;
  createdAt: Date;
};

// Placeholder data types
export type ChatMessage = {
  id: string;
  type: "user" | "system" | "agent" | "action" | "error";
  content: string;
  timestamp: Date;
  allowRollback?: boolean;
};

export type ChatAction = {
  id: string;
  description: string;
  timestamp: Date;
  inProgress: boolean;
};

export type LogEntry = {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  changes: {
    file: string;
    additions: number;
    deletions: number;
  }[];
};

export type FileNode = {
  id: string;
  name: string;
  type: "file" | "directory";
  path: string;
  children?: FileNode[];
};

interface ProjectBoxProps {
  project: Project;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function ProjectBox({ project, isExpanded, onToggleExpand }: ProjectBoxProps) {
  const [activeTab, setActiveTab] = useState<"progress" | "input" | "logs" | "output" | "code">("progress");
  
  // Placeholder empty data
  const [messages] = useState<ChatMessage[]>([]);
  const [logs] = useState<LogEntry[]>([]);
  const [currentAction] = useState<ChatAction | null>(null);
  const [fileTree] = useState<FileNode>({
    id: "root",
    name: "root",
    type: "directory",
    path: "/",
    children: []
  });
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  
  // Empty milestones for progress tab
  const emptyMilestones: any[] = [];

  return (
    <div 
      className={`titan-project-box ${project.status === 'active' ? 'pulse-glow' : ''}`}
    >
      <div 
        className="titan-project-box-header cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex items-center">
          <div className={`titan-status-light mr-3 ${project.status === 'active' ? 'active' : ''}`} />
          <h3 className="font-medium text-foreground">{project.name}</h3>
        </div>
        <div className="flex items-center">
          <div className="mr-4 text-sm text-muted-foreground">
            Progress: {project.progress}%
          </div>
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-0">
          <ProjectTabs 
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab)}
          />
          
          <TabContent currentTab={activeTab} tab="progress">
            <ProgressTab 
              progress={project.progress}
              systemStatus={project.status}
              milestones={emptyMilestones}
            />
          </TabContent>
          
          <TabContent currentTab={activeTab} tab="input">
            <InputTab 
              projectId={project.id}
              messages={messages}
              currentAction={currentAction}
            />
          </TabContent>
          
          <TabContent currentTab={activeTab} tab="logs">
            <LogsTab 
              projectId={project.id}
              logs={logs}
            />
          </TabContent>
          
          <TabContent currentTab={activeTab} tab="output">
            <OutputTab 
              projectId={project.id}
              hasOutput={false}
            />
          </TabContent>
          
          <TabContent currentTab={activeTab} tab="code">
            <CodeTab 
              projectId={project.id}
              fileTree={fileTree}
              selectedFile={selectedFilePath}
              onFileSelect={setSelectedFilePath}
            />
          </TabContent>
        </div>
      )}
    </div>
  );
}