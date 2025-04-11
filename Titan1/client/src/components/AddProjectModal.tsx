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
  const [aiPrompt, setAiPrompt] = useState("");
  const { toast } = useToast();
  const { addProject } = useProjectContext();
  
  // AI-powered project generation
  const generateProjectMutation = useMutation({
    mutationFn: async (data: { prompt: string, name?: string }) => {
      const res = await apiRequest("/api/ai/generate-project", { 
        method: "POST", 
        body: data 
      });
      return res;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      if (data.project) {
        addProject(data.project);
      }
      toast({
        title: "Project created",
        description: "Your new project has been created successfully.",
      });
      setAiPrompt("");
      setProjectName("");
      onClose();
    },
    onError: (error) => {
      console.error("Project creation error:", error);
      toast({
        variant: "destructive",
        title: "Failed to create project",
        description: error instanceof Error 
          ? error.message 
          : "Error connecting to server. Please try again.",
      });
    }
  });
  
  const handleCreateProject = () => {
    if (!projectName.trim()) {
      toast({
        variant: "destructive",
        title: "Project name required",
        description: "Please enter a name for your project.",
      });
      return;
    }
    
    if (!aiPrompt.trim()) {
      toast({
        variant: "destructive",
        title: "Project description required",
        description: "Please enter a description for your project.",
      });
      return;
    }
    
    generateProjectMutation.mutate({
      prompt: aiPrompt,
      name: projectName.trim()
    });
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-20" onClick={onClose}>
      <div className="bg-[#0a0e15] border border-[#01F9C6]/20 rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-[#01F9C6]/20 flex justify-between items-center">
          <h3 className="text-lg font-medium text-white">Create New Findom Project</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="p-5">
          <div className="mb-5">
            <label htmlFor="project-name" className="block text-sm font-medium text-[#01F9C6] mb-2">Project Name</label>
            <input 
              type="text" 
              id="project-name" 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-gray-900 border border-[#01F9C6]/30 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#01F9C6]/50"
              placeholder="Enter project name"
            />
          </div>
          
          <div className="mb-5">
            <label htmlFor="ai-prompt" className="block text-sm font-medium text-[#01F9C6] mb-2">
              Project Description
            </label>
            <textarea 
              id="ai-prompt" 
              rows={5} 
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full bg-gray-900 border border-[#01F9C6]/30 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#01F9C6]/50" 
              placeholder="Describe your project in detail..."
            ></textarea>
          </div>
          
          <button 
            onClick={handleCreateProject}
            className="w-full py-3 bg-[#01F9C6] hover:bg-[#01F9C6]/90 text-black font-medium rounded-md transition-all duration-150 flex items-center justify-center shadow-[0_0_10px_rgba(1,249,198,0.5)]"
            disabled={generateProjectMutation.isPending}
          >
            {generateProjectMutation.isPending ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Project...
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
