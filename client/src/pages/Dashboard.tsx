import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Project, Persona } from "@shared/schema";
import { AddProjectModal } from "@/components/AddProjectModal";
import { ProjectTile } from "@/components/ProjectTile";
import { Logo } from "@/components/ui/Logo";
import { useToast } from "@/hooks/use-toast";
import { useProjectContext } from "@/context/ProjectContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonasDashboard } from "../components/PersonasDashboard";

export default function Dashboard() {
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const { toast } = useToast();
  const { projects } = useProjectContext();

  const { isLoading, error } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    retry: 1,
  });

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load projects. Please try again.",
      });
    }
  }, [error, toast]);

  const [activeTab, setActiveTab] = useState("projects");

  // Load personas
  const { data: personas, isLoading: isLoadingPersonas } = useQuery<Persona[]>({
    queryKey: ['/api/personas'],
    retry: 1,
  });

  return (
    <div className="w-full">
      {/* Header */}
      <header className="bg-background py-3 px-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">Dashboard</h1>

          <div className="flex gap-2">
            {activeTab === "projects" && (
              <button 
                onClick={() => setIsAddProjectModalOpen(true)}
                className="bg-accent hover:bg-accent/90 text-black font-medium py-2 px-4 rounded-md transition-colors duration-150 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Add Project
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <Tabs defaultValue="projects" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full max-w-md mx-auto grid grid-cols-2">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="personas">Personas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="projects" className="mt-4">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 h-48 animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {projects.map((project) => (
                  <ProjectTile key={project.id} project={project} />
                ))}
                {projects.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                    <svg className="w-16 h-16 mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                    <h3 className="text-xl font-medium mb-2">No projects yet</h3>
                    <p className="mb-4">Create your first project to get started</p>
                    <button 
                      onClick={() => setIsAddProjectModalOpen(true)}
                      className="bg-accent hover:bg-accent/90 text-black font-medium py-2 px-4 rounded-md transition-colors duration-150"
                    >
                      Add Project
                    </button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="personas" className="mt-4">
            <PersonasDashboard 
              personas={personas || []} 
              isLoading={isLoadingPersonas} 
              projectId={projects.length > 0 ? projects[0].id : 1} 
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Project Modal */}
      <AddProjectModal 
        isOpen={isAddProjectModalOpen} 
        onClose={() => setIsAddProjectModalOpen(false)} 
      />
    </div>
  );
}
