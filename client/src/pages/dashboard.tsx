import React, { useState } from "react";
import { Plus } from "lucide-react";
import { TitanLogoWithText } from "@/components/ui/titan-logo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ProjectBox, Project } from "@/components/project/project-box";

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [expandedProject, setExpandedProject] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const { toast } = useToast();

  const toggleProjectExpansion = (projectId: number) => {
    if (expandedProject === projectId) {
      setExpandedProject(null);
    } else {
      setExpandedProject(projectId);
    }
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive",
      });
      return;
    }

    // Create a new project
    const newProject: Project = {
      id: Date.now(),
      name: newProjectName,
      description: newProjectDescription,
      status: "idle",
      progress: 0,
      createdAt: new Date(),
    };

    setProjects([...projects, newProject]);
    setNewProjectName("");
    setNewProjectDescription("");
    setIsCreateDialogOpen(false);
    
    // Automatically expand the newly created project
    setExpandedProject(newProject.id);

    toast({
      title: "Success",
      description: "Project created successfully",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="py-4 px-6 flex items-center justify-between border-b border-border">
        <TitanLogoWithText size={32} />
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-background text-primary border border-primary hover:bg-primary hover:text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-4 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center">
              <div className="titan-glow-hover p-8 rounded-lg bg-card border border-border mb-6">
                <TitanLogoWithText size={60} />
                <h2 className="mt-6 text-xl font-medium">Welcome to Titan</h2>
                <p className="mt-2 text-muted-foreground max-w-md">
                  Your AI-powered autonomous coding assistant. Create a new project to get started.
                </p>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="mt-6 bg-primary text-primary-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Project
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <ProjectBox
                  key={project.id}
                  project={project}
                  isExpanded={expandedProject === project.id}
                  onToggleExpand={() => toggleProjectExpansion(project.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Name</label>
              <Input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Enter project name"
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                placeholder="Enter a detailed project description to help Titan understand what to build..."
                className="bg-secondary border-border min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              className="text-foreground border-border"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateProject}
              className="bg-primary text-primary-foreground"
            >
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}