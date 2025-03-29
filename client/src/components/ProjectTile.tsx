import { useCallback, useState } from "react";
import { useLocation } from "wouter";
import { Project } from "@shared/schema";
import { StatusIndicator } from "./StatusIndicator";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Trash2, ExternalLink } from "lucide-react";

interface ProjectTileProps {
  project: Project;
}

export function ProjectTile({ project }: ProjectTileProps) {
  const [, setLocation] = useLocation();
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  
  const handleCardClick = useCallback(() => {
    setLocation(`/projects/${project.id}`);
  }, [project.id, setLocation]);
  
  const handleDeleteClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    if (window.confirm(`Are you sure you want to delete project "${project.name}"?`)) {
      try {
        setIsDeleting(true);
        await apiRequest(`/api/projects/${project.id}`, "DELETE");
        
        // Invalidate projects query to refresh the list
        queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
        
        toast({
          title: "Project deleted",
          description: `"${project.name}" has been removed successfully.`,
          variant: "default",
          duration: 3000
        });
      } catch (error) {
        console.error("Error deleting project:", error);
        toast({
          title: "Error",
          description: "Failed to delete project. Please try again.",
          variant: "destructive",
          duration: 5000
        });
      } finally {
        setIsDeleting(false);
      }
    }
  }, [project.id, project.name, toast]);
  
  return (
    <div 
      className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-accent transition-all duration-200 cursor-pointer shadow-md relative group"
      onClick={handleCardClick}
    >
      {/* Delete Button - Only visible on hover */}
      <button
        onClick={handleDeleteClick}
        disabled={isDeleting}
        className="absolute top-2 right-2 bg-gray-900 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 text-red-500 hover:text-red-400 hover:bg-gray-800"
        title="Delete project"
      >
        <Trash2 size={16} />
      </button>
      
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white truncate pr-8">{project.name}</h3>
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
          <span className="flex items-center">
            <ExternalLink size={12} className="mr-1" /> View
          </span>
        </div>
      </div>
    </div>
  );
}
