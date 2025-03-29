import { useQuery } from "@tanstack/react-query";
import { Persona } from "@shared/schema";
import { BubblingPersonaHome } from "@/components/BubblingPersonaHome";
import { useProjectContext } from "@/context/ProjectContext";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PersonaForm } from "@/components/PersonaForm";
import { useQueryClient } from "@tanstack/react-query";

export default function HomePage() {
  const { projects } = useProjectContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const currentProject = projects.length > 0 ? projects[0] : null;
  
  // Load personas
  const { data: personas, isLoading } = useQuery<Persona[]>({
    queryKey: ['/api/personas'],
    retry: 1,
  });
  
  const handleFormSubmit = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/personas'] });
    setIsFormOpen(false);
  };
  
  return (
    <div className="w-full h-full flex flex-col">
      {/* Header with add button */}
      <header className="bg-background py-3 px-6 border-b border-gray-800 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-white">FINDOM Personas</h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <Button 
            onClick={() => setIsFormOpen(true)}
            className="bg-accent hover:bg-accent/90 text-black"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Persona
          </Button>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Persona</DialogTitle>
            </DialogHeader>
            <PersonaForm 
              open={isFormOpen}
              onOpenChange={setIsFormOpen}
              onSubmit={handleFormSubmit}
              projectId={currentProject?.id || 1}
              editingPersona={null}
            />
          </DialogContent>
        </Dialog>
      </header>
      
      {/* Bubbling animation */}
      <div className="flex-1">
        <BubblingPersonaHome 
          personas={personas || []} 
          isLoading={isLoading} 
        />
      </div>
    </div>
  );
}