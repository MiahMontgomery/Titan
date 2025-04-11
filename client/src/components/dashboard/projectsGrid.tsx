import { useState } from "react";
import { Project } from "@shared/schema";
import { AgentType, ProjectStatus } from "@shared/types";
import { MoreHorizontalIcon, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectCardProps {
  project: Project;
  onViewProject: (id: number) => void;
}

const ProjectCard = ({ project, onViewProject }: ProjectCardProps) => {
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case ProjectStatus.ACTIVE:
        return "bg-green-500/10 text-green-500";
      case ProjectStatus.PAUSED:
        return "bg-yellow-500/10 text-yellow-500";
      case ProjectStatus.COMPLETED:
        return "bg-blue-500/10 text-blue-500";
      case ProjectStatus.FAILED:
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const getAgentProgressColor = (agentType: string) => {
    return agentType === AgentType.FINDOM ? "bg-primary" : "bg-blue-500";
  };

  const formatUpdatedTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Updated just now";
    if (diffInHours < 24) return `Updated ${diffInHours}h ago`;
    return `Updated ${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-semibold text-white">{project.name}</span>
            <span className={`px-1.5 py-0.5 ${getStatusBadgeClass(project.status)} text-xs rounded-md`}>
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </span>
          </div>
          <p className="text-sm text-muted">{project.description}</p>
        </div>
        <div className="flex gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-7 h-7 rounded text-muted hover:text-white hover:bg-background">
                <MoreHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewProject(project.id)}>View Project</DropdownMenuItem>
              <DropdownMenuItem>Edit Project</DropdownMenuItem>
              <DropdownMenuItem>Delete Project</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted">Agent Type</span>
              <span className="text-xs font-medium text-white">{project.agentType}</span>
            </div>
            <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
              <div 
                className={`h-full ${getAgentProgressColor(project.agentType)} rounded-full`} 
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-xs font-medium text-white">
            <UserIcon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-white font-medium">{formatUpdatedTime(new Date(project.updatedAt))}</p>
            <p className="text-xs text-muted">3 open tasks</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto h-8 px-3 rounded-md bg-background border border-border text-xs text-white hover:bg-card transition"
            onClick={() => onViewProject(project.id)}
          >
            View
          </Button>
        </div>
      </div>
    </div>
  );
};

interface ProjectsGridProps {
  projects: Project[];
  onAddProject: () => void;
}

const ProjectsGrid = ({ projects, onAddProject }: ProjectsGridProps) => {
  const handleViewProject = (id: number) => {
    // Navigate to project details
    window.location.href = `/projects/${id}`;
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Projects</h2>
        <Button 
          className="flex items-center gap-1 h-9 px-3 bg-primary text-background rounded-md text-sm font-medium hover:bg-primary/90 transition"
          onClick={onAddProject}
        >
          <span className="text-lg">+</span>
          <span>New Project</span>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <ProjectCard 
            key={project.id} 
            project={project} 
            onViewProject={handleViewProject} 
          />
        ))}
      </div>
    </div>
  );
};

export default ProjectsGrid;
