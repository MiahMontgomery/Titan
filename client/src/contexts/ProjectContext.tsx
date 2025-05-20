import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getProjects, createProject, deleteProject } from "@/lib/api";
import { onProjectCreated } from "@/lib/websocket";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@shared/schema";

interface ProjectContextProps {
  projects: Project[];
  isLoading: boolean;
  activeProjectId: number | null;
  setActiveProjectId: (id: number | null) => void;
  createNewProject: (name: string, prompt: string) => Promise<Project>;
  deleteProject: (id: number) => Promise<void>;
  isCreatingProject: boolean;
  isDeletingProject: boolean;
}

const ProjectContext = createContext<ProjectContextProps | undefined>(undefined);

export function useProjectContext() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProjectContext must be used within a ProjectProvider");
  }
  return context;
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all projects
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: getProjects,
    select: (data) => data as Project[],
  });

  // Create project mutation
  const { mutateAsync: createProjectMutation, isPending: isCreatingProject } = useMutation({
    mutationFn: (data: { name: string; prompt: string }) => createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "Project created",
        description: "Your project has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create project",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Delete project mutation
  const { mutateAsync: deleteProjectMutation, isPending: isDeletingProject } = useMutation({
    mutationFn: (id: number) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      if (activeProjectId === null) {
        setActiveProjectId(null);
      }
      toast({
        title: "Project deleted",
        description: "The project has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete project",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Listen for new projects via WebSocket
  useEffect(() => {
    const unsubscribe = onProjectCreated(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    });

    return () => unsubscribe();
  }, [queryClient]);

  // Create a new project
  const createNewProject = async (name: string, prompt: string) => {
    return await createProjectMutation({ name, prompt });
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        isLoading,
        activeProjectId,
        setActiveProjectId,
        createNewProject,
        deleteProject: deleteProjectMutation,
        isCreatingProject,
        isDeletingProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}
