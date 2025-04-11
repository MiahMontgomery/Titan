import React from "react";
import { Activity, MessageSquare, FileText, List, Code } from "lucide-react";

type TabType = "progress" | "input" | "logs" | "output" | "code";

interface ProjectTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

interface TabContentProps {
  currentTab: TabType;
  tab: TabType;
  children: React.ReactNode;
}

export function ProjectTabs({ activeTab, onTabChange }: ProjectTabsProps) {
  return (
    <div className="titan-tab-container flex">
      <button 
        className={`titan-tab ${activeTab === "progress" ? "active" : ""}`}
        onClick={() => onTabChange("progress")}
      >
        <Activity className="h-4 w-4 mr-2" />
        Progress
      </button>
      <button 
        className={`titan-tab ${activeTab === "input" ? "active" : ""}`}
        onClick={() => onTabChange("input")}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Input
      </button>
      <button 
        className={`titan-tab ${activeTab === "logs" ? "active" : ""}`}
        onClick={() => onTabChange("logs")}
      >
        <List className="h-4 w-4 mr-2" />
        Logs
      </button>
      <button 
        className={`titan-tab ${activeTab === "output" ? "active" : ""}`}
        onClick={() => onTabChange("output")}
      >
        <FileText className="h-4 w-4 mr-2" />
        Output
      </button>
      <button 
        className={`titan-tab ${activeTab === "code" ? "active" : ""}`}
        onClick={() => onTabChange("code")}
      >
        <Code className="h-4 w-4 mr-2" />
        Code
      </button>
    </div>
  );
}

export function TabContent({ currentTab, tab, children }: TabContentProps) {
  if (currentTab !== tab) return null;
  
  return (
    <div className="p-4">
      {children}
    </div>
  );
}