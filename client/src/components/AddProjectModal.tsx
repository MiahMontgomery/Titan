import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { InsertProject } from "@shared/schema";
import { useProjectContext } from "@/context/ProjectContext";

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddProjectModal({ isOpen, onClose }: AddProjectModalProps) {
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const { toast } = useToast();
  const { addProject } = useProjectContext();
  
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: InsertProject) => {
      const res = await apiRequest("POST", "/api/projects", projectData);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      addProject(data);
      toast({
        title: "Project created",
        description: "The project has been created successfully.",
      });
      setProjectName("");
      setProjectDescription("");
      onClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create project",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  });
  
  const handleSubmit = () => {
    if (!projectName.trim()) {
      toast({
        variant: "destructive",
        title: "Project name required",
        description: "Please enter a name for your project.",
      });
      return;
    }
    
    createProjectMutation.mutate({
      name: projectName,
      description: projectDescription || "No description provided",
      isActive: true,
      progress: 0
      // lastUpdated is handled by the database defaultNow()
    });
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-20" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-700">
          <h3 className="text-lg font-medium text-white">Add New Project</h3>
        </div>
        
        <div className="p-5">
          <div className="mb-4">
            <label htmlFor="project-name" className="block text-sm font-medium text-gray-400 mb-1">Project Name</label>
            <input 
              type="text" 
              id="project-name" 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="project-description" className="block text-sm font-medium text-gray-400 mb-1">Project Description</label>
            <textarea 
              id="project-description" 
              rows={4} 
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent" 
              placeholder="Describe your project in detail..."
            ></textarea>
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-700 flex justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors duration-150"
            disabled={createProjectMutation.isPending}
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            className="px-4 py-2 bg-accent hover:bg-accentDark text-black font-medium rounded-md transition-colors duration-150 flex items-center"
            disabled={createProjectMutation.isPending}
          >
            {createProjectMutation.isPending ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              "Create Project"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
