import { useCallback, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Project, Persona } from "@shared/schema";
import { StatusIndicator } from "./StatusIndicator";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Trash2, ExternalLink, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { BubblePersona } from "./BubblePersona";

interface ProjectTileProps {
  project: Project;
}

export function ProjectTile({ project }: ProjectTileProps) {
  const [, setLocation] = useLocation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [tileHeight, setTileHeight] = useState(0);
  const [tileWidth, setTileWidth] = useState(0);
  const [tileRef, setTileRef] = useState<HTMLDivElement | null>(null);
  const { toast } = useToast();
  const isFindom = project.name.toUpperCase() === 'FINDOM';
  
  // Fetch personas if this is the FINDOM project
  const { data: personas } = useQuery<Persona[]>({
    queryKey: ['/api/personas'],
    enabled: isFindom,
  });
  
  // Update tile dimensions when it's rendered
  useEffect(() => {
    if (tileRef) {
      setTileHeight(tileRef.clientHeight);
      setTileWidth(tileRef.clientWidth);
      
      const resizeObserver = new ResizeObserver(entries => {
        const { width, height } = entries[0].contentRect;
        setTileWidth(width);
        setTileHeight(height);
      });
      
      resizeObserver.observe(tileRef);
      
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [tileRef]);
  
  const handleCardClick = useCallback(() => {
    setLocation(`/projects/${project.id}`);
  }, [project.id, setLocation]);
  
  const handlePersonaClick = useCallback((e: React.MouseEvent, personaId: string) => {
    e.stopPropagation(); // Prevent card click
    setLocation(`/personas/${personaId}`);
  }, [setLocation]);
  
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
      className={`bg-gray-800 overflow-hidden border transition-all duration-200 cursor-pointer shadow-md relative group 
        ${isFindom 
          ? 'rounded-md border-green-400 shadow-[0_0_15px_rgba(0,255,0,0.3)] aspect-square' 
          : 'rounded-lg border-gray-700 hover:border-accent'}`}
      onClick={handleCardClick}
      ref={setTileRef}
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
        
        {/* FINDOM Personas */}
        {isFindom && personas && personas.length > 0 && (
          <div className="mt-4 border-t border-gray-700 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Users size={14} className="text-gray-400" />
              <h4 className="text-sm font-medium">Personas</h4>
            </div>
            <div className="relative h-[120px] w-full bg-gray-900 rounded-lg overflow-hidden">
              {/* Central bubble */}
              <div 
                className="absolute rounded-full bg-gray-800 border-2 border-green-400 shadow-lg"
                style={{
                  width: '50px', 
                  height: '50px',
                  left: tileWidth / 2, 
                  top: tileHeight / 4,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span className="text-lg">⚡</span>
              </div>
                
              {/* Persona bubbles */}
              {personas.map((persona, index) => (
                <div 
                  key={persona.id}
                  onClick={(e) => handlePersonaClick(e, persona.id)}
                  style={{ position: 'absolute' }}
                >
                  <BubblePersona
                    persona={persona}
                    size={45}
                    x={(tileWidth / 2) + Math.cos(index * (2 * Math.PI / personas.length)) * 80}
                    y={(tileHeight / 4) + Math.sin(index * (2 * Math.PI / personas.length)) * 40}
                    mainBubbleRadius={tileWidth / 2}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
