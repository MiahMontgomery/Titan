import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { TitanLogo } from "./titan-logo";

type TabType = "progress" | "input" | "logs" | "output" | "code";

interface ProjectTabsProps {
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
  isLoading?: boolean;
}

export function ProjectTabs({ 
  activeTab = "progress",
  onTabChange,
  isLoading = false
}: ProjectTabsProps) {
  const [currentTab, setCurrentTab] = useState<TabType>(activeTab);

  const handleTabChange = (tab: TabType) => {
    setCurrentTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: "progress", label: "Progress" },
    { id: "input", label: "Input" },
    { id: "logs", label: "Logs" },
    { id: "output", label: "Output" },
    { id: "code", label: "Code" },
  ];

  return (
    <div className="titan-tab-container flex">
      {isLoading ? (
        <div className="flex items-center justify-center w-full py-2">
          <TitanLogo size={24} spinning={true} />
          <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
        </div>
      ) : (
        tabs.map((tab) => (
          <button
            key={tab.id}
            className={cn(
              "titan-tab",
              currentTab === tab.id && "active"
            )}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))
      )}
    </div>
  );
}

interface TabContentProps {
  currentTab: TabType;
  children: React.ReactNode;
  tab: TabType;
}

export function TabContent({ currentTab, tab, children }: TabContentProps) {
  if (currentTab !== tab) return null;
  return <div className="p-4">{children}</div>;
}