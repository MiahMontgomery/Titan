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
      const res = await apiRequest("/api/ai/generate-project", "POST", data);
      return res;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      if (data.project) {
        addProject(data.project);
      }
      toast({
        title: "Project generated",
        description: "AI has created your project successfully.",
      });
      setAiPrompt("");
      setProjectName("");
      onClose();
    },
    onError: (error) => {
      console.error("AI generation error:", error);
      toast({
        variant: "destructive",
        title: "Failed to generate project",
        description: error instanceof Error 
          ? error.message 
          : "Error connecting to AI service. Make sure your OpenAI API key is configured in Settings.",
      });
    }
  });
  
  const handleAiGeneration = () => {
    if (!aiPrompt.trim()) {
      toast({
        variant: "destructive",
        title: "Description required",
        description: "Please enter a description of the project you want to create.",
      });
      return;
    }
    
    generateProjectMutation.mutate({
      prompt: aiPrompt,
      name: projectName.trim() || undefined // Send name only if provided
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
            <label htmlFor="project-name" className="block text-sm font-medium text-gray-400 mb-1">Project Name (Optional)</label>
            <input 
              type="text" 
              id="project-name" 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Enter project name or leave blank for AI to generate"
            />
          </div>
          
          <div className="mt-5 mb-1">
            <h4 className="text-md font-medium text-white">Project Details</h4>
          </div>
          
          <div className="mb-4">
            <label htmlFor="ai-prompt" className="block text-sm font-medium text-gray-400 mb-1">
              Describe Your Project
            </label>
            <textarea 
              id="ai-prompt" 
              rows={6} 
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent" 
              placeholder="Describe the project you want AI to create (e.g. 'A project management tool with task tracking, user assignments, and reporting features')"
            ></textarea>
            <p className="text-xs text-gray-400 mt-1">
              AI will automatically generate at least 30 features, milestones, and goals based on your description and continuously improve the project.
            </p>
          </div>
          
          <div className="flex justify-end space-x-3 mt-4">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors duration-150"
              disabled={generateProjectMutation.isPending}
            >
              Cancel
            </button>
            <button 
              onClick={handleAiGeneration}
              className="px-4 py-2 bg-accent hover:bg-accent/90 text-black font-medium rounded-md transition-colors duration-150 flex items-center"
              disabled={generateProjectMutation.isPending}
            >
              {generateProjectMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                "Generate with AI"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
