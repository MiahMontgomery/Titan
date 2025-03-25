import { useCallback } from "react";
import { useLocation } from "wouter";
import { Project } from "@shared/schema";
import { StatusIndicator } from "./StatusIndicator";
import { formatDistanceToNow } from "date-fns";

interface ProjectTileProps {
  project: Project;
}

export function ProjectTile({ project }: ProjectTileProps) {
  const [, setLocation] = useLocation();
  
  const handleClick = useCallback(() => {
    setLocation(`/projects/${project.id}`);
  }, [project.id, setLocation]);
  
  return (
    <div 
      className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-accent transition-all duration-200 cursor-pointer shadow-md"
      onClick={handleClick}
    >
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white truncate">{project.name}</h3>
          <StatusIndicator isWorking={project.isWorking} />
        </div>
      </div>
      <div className="p-4">
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span>{project.progress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-accent h-2 rounded-full" style={{ width: `${project.progress}%` }}></div>
          </div>
        </div>
        <div className="text-xs text-gray-400 flex justify-between">
          <span>Last updated: {formatDistanceToNow(new Date(project.lastUpdated), { addSuffix: true })}</span>
        </div>
      </div>
    </div>
  );
}
