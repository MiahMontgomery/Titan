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
  const { data: initialProjects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    retry: 1,
  });
  
  // Set initial projects
  useEffect(() => {
    if (initialProjects) {
      setProjects(initialProjects);
    }
  }, [initialProjects]);
  
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
