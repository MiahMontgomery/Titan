import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Project } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { StatusIndicator } from "@/components/StatusIndicator";
import { ProgressTab } from "@/components/ProgressTab";
import { PerformanceTab } from "@/components/PerformanceTab";
import { SalesTab } from "@/components/SalesTab";
import { useProjectContext } from "@/context/ProjectContext";
import { formatDistanceToNow } from "date-fns";

type TabType = "progress" | "performance" | "sales";

export default function ProjectView() {
  const [activeTab, setActiveTab] = useState<TabType>("progress");
  const [, params] = useRoute<{ id: string }>("/projects/:id");
  const { toast } = useToast();
  const { projects } = useProjectContext();
  
  const projectId = parseInt(params?.id || "0");
  
  // Find the project in the context first (for instant loading)
  const contextProject = projects.find(p => p.id === projectId);
  
  // Still make the API request to ensure we have the latest data
  const { data: projectData, isLoading, error } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    retry: 1,
    enabled: !!projectId && projectId > 0,
  });
  
  const project = projectData || contextProject;
  
  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load project details.",
      });
    }
  }, [error, toast]);
  
  if (!project && !isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Project Not Found</h2>
          <p className="mb-6">The project you are looking for does not exist or has been removed.</p>
          <Link href="/" className="bg-accent hover:bg-accentDark text-black font-medium py-2 px-4 rounded-md transition-colors duration-150">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Project Header */}
      <div className="bg-gray-900 border-b border-gray-800 py-3 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/" className="text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
          </Link>
          <h2 className="text-xl font-semibold text-white">
            {isLoading ? "Loading..." : project?.name}
          </h2>
          
          {/* Status Indicator */}
          {project && (
            <div className="flex items-center ml-3">
              <StatusIndicator isActive={project.isActive} showLabel size="sm" />
            </div>
          )}
        </div>
        
        {project && (
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="text-gray-400">Last updated:</span>
              <span className="text-gray-300 ml-1">
                {formatDistanceToNow(new Date(project.lastUpdated), { addSuffix: true })}
              </span>
            </div>
            <div className="w-32">
              <div className="flex justify-between text-xs mb-1">
                <span>Progress</span>
                <span>{project.progress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div 
                  className="bg-accent h-1.5 rounded-full" 
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Project Tabs */}
      <div className="bg-gray-800 px-6 border-b border-gray-700">
        <div className="flex">
          <button 
            className={`px-4 py-3 font-medium text-sm transition-colors duration-150 ${
              activeTab === "progress" 
                ? "text-accent border-b-2 border-accent" 
                : "text-gray-400 hover:text-gray-200"
            }`}
            onClick={() => setActiveTab("progress")}
          >
            Progress
          </button>
          <button 
            className={`px-4 py-3 font-medium text-sm transition-colors duration-150 ${
              activeTab === "performance" 
                ? "text-accent border-b-2 border-accent" 
                : "text-gray-400 hover:text-gray-200"
            }`}
            onClick={() => setActiveTab("performance")}
          >
            Performance
          </button>
          <button 
            className={`px-4 py-3 font-medium text-sm transition-colors duration-150 ${
              activeTab === "sales" 
                ? "text-accent border-b-2 border-accent" 
                : "text-gray-400 hover:text-gray-200"
            }`}
            onClick={() => setActiveTab("sales")}
          >
            Sales
          </button>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="h-full overflow-auto">
        {isLoading ? (
          <div className="p-6 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent"></div>
          </div>
        ) : (
          <>
            {project && (
              <>
                {activeTab === "progress" && <ProgressTab projectId={project.id} />}
                {activeTab === "performance" && <PerformanceTab projectId={project.id} />}
                {activeTab === "sales" && <SalesTab />}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
