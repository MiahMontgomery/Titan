import { useQuery } from "@tanstack/react-query";
import { Project } from "@shared/schema";
import { useProjectContext } from "@/context/ProjectContext";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocation, Link } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function HomePage() {
  const { projects } = useProjectContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Make sure projects is valid before using it
  useEffect(() => {
    try {
      // Ensure projects is an array before using it
      if (Array.isArray(projects)) {
        setProjectList(projects);
        setError(null);
      } else if (projects) {
        console.warn("Projects is not an array:", projects);
        setError("Invalid projects data format");
        setProjectList([]); // Use empty array as fallback
      }
    } catch (err) {
      console.error("Error processing projects data:", err);
      setError("Error loading projects");
      setProjectList([]); // Use empty array as fallback
    }
  }, [projects]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header with add button */}
      <header className="bg-background py-6 px-8 border-b border-gray-800 flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <h1 className="text-2xl font-semibold text-white">Titan Projects</h1>
          <Link href="/byte-ui" className="text-blue-400 hover:text-blue-300 transition-colors">
            ByteUI Examples
          </Link>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <Button 
            onClick={() => setIsFormOpen(true)}
            className="bg-accent hover:bg-accent/90 text-black"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            {/* Project form would go here */}
            <p className="text-sm text-gray-400 mt-4">Project creation form will be added here.</p>
          </DialogContent>
        </Dialog>
      </header>
      
      {/* Error Alert */}
      {error && (
        <div className="px-8 pt-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
      
      {/* Projects grid */}
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* FINDOM Project Tile (grey box with glowing hover effect) */}
          <div 
            className="bg-gray-800 h-48 rounded-lg border border-gray-700 flex items-center justify-center cursor-pointer group transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,255,0,0.3)] hover:border-green-400"
            onClick={() => setLocation(`/projects/1`)}
          >
            <h2 className="text-2xl font-bold text-white">FINDOM</h2>
          </div>
          
          {/* Other projects would be shown here */}
          {projectList
            .filter(project => project?.name?.toUpperCase() !== 'FINDOM')
            .map(project => (
              <div 
                key={project.id}
                className="bg-gray-800 h-48 rounded-lg border border-gray-700 p-4 flex flex-col cursor-pointer transition-all duration-300 hover:border-blue-400 hover:shadow-md"
                onClick={() => setLocation(`/projects/${project.id}`)}
              >
                <h2 className="text-xl font-semibold text-white">{project.name}</h2>
                <p className="text-gray-400 mt-2 text-sm flex-1">{project.description}</p>
                
                <div className="mt-auto">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${project.progress || 0}%` }}></div>
                  </div>
                </div>
              </div>
            ))
          }
          
          {/* Add new project tile */}
          <div 
            className="border-2 border-dashed border-gray-700 h-48 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-300 hover:border-accent"
            onClick={() => setIsFormOpen(true)}
          >
            <div className="flex flex-col items-center">
              <Plus className="w-8 h-8 text-gray-400" />
              <span className="mt-2 text-gray-400">Add New Project</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}