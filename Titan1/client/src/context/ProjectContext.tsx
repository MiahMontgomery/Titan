import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { useWebSocketContext } from '@/lib/websocket';

interface ProjectContextType {
  projects: Project[];
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  removeProject: (id: number) => void;
}

const ProjectContext = createContext<ProjectContextType>({
  projects: [],
  addProject: () => {},
  updateProject: () => {},
  removeProject: () => {},
});

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const { subscribe } = useWebSocketContext();
  
  // Fetch projects on initial load
  const { data: initialProjects, isError, error } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    retry: 3,
    retryDelay: 1000,
    // Validate and handle the response properly
    select: (data) => {
      // Make sure we're working with an array
      if (Array.isArray(data)) {
        return data;
      } else if (data && typeof data === 'object' && 'projects' in data) {
        // Handle case where API returns { projects: [] } format
        const projectsData = (data as any).projects;
        if (Array.isArray(projectsData)) {
          return projectsData;
        }
      }
      // Fallback to empty array if data format is unexpected
      console.warn('Projects data format is unexpected:', data);
      return [] as Project[];
    },
  });
  
  // Set initial projects
  useEffect(() => {
    if (initialProjects) {
      console.log('Setting projects from API:', initialProjects);
      setProjects(initialProjects);
    } else if (isError) {
      console.error('Error fetching projects:', error);
      // If no projects and there's an error, use a default project
      if (projects.length === 0) {
        // Create a default project with all required fields
        const defaultProject: Project = {
          id: 1,
          name: 'FINDOM',
          description: 'Financial Domination Autonomous Agent',
          isWorking: true,
          progress: 15,
          lastUpdated: new Date(),
          projectType: 'findom',
          autoMode: false,
          priority: 10,
          agentConfig: {},
          checkpoints: [],
          lastCheckIn: null,
          nextCheckIn: null,
          lastAutomationRun: null
        };
        setProjects([defaultProject]);
      }
    }
  }, [initialProjects, isError, error, projects.length]);
  
  // Listen for project updates from WebSocket
  useEffect(() => {
    const handleProjectUpdate = (data: any) => {
      if (data.type === 'new-project') {
        setProjects(prev => [...prev, data.data]);
      } else if (data.type === 'update-project') {
        setProjects(prev => prev.map(p => p.id === data.data.id ? data.data : p));
      }
    };
    
    // Subscribe to WebSocket updates
    const unsubscribe = subscribe(handleProjectUpdate);
    
    return () => {
      unsubscribe();
    };
  }, [subscribe]);
  
  const addProject = (project: Project) => {
    setProjects(prev => [...prev, project]);
  };
  
  const updateProject = (project: Project) => {
    setProjects(prev => prev.map(p => p.id === project.id ? project : p));
  };
  
  const removeProject = (id: number) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };
  
  return (
    <ProjectContext.Provider value={{ projects, addProject, updateProject, removeProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  return useContext(ProjectContext);
}
