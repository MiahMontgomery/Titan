import { useState } from "react";
import { Persona } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PersonaCard } from "./PersonaCard";
import { PersonaForm } from "./PersonaForm";

interface PersonasDashboardProps {
  personas: Persona[];
  isLoading: boolean;
  projectId: number;
}

export function PersonasDashboard({ personas, isLoading, projectId }: PersonasDashboardProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleOpenForm = (persona?: Persona) => {
    setEditingPersona(persona || null);
    setIsFormOpen(true);
  };

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest(`/api/personas/${id}/toggle-active`, {
        method: "POST",
        data: { isActive }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/personas'] });
      toast({
        title: "Status updated",
        description: "Persona status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update status",
        description: "Please try again later."
      });
      console.error("Error toggling persona active status:", error);
    }
  });

  const deletePersona = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/personas/${id}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/personas'] });
      toast({
        title: "Persona deleted",
        description: "The persona has been removed successfully."
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete persona",
        description: "Please try again later."
      });
      console.error("Error deleting persona:", error);
    }
  });

  const handleStatusToggle = (id: string, isActive: boolean) => {
    toggleActive.mutate({ id, isActive });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this persona? This action cannot be undone.")) {
      deletePersona.mutate(id);
    }
  };

  const handleFormSubmit = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/personas'] });
    setIsFormOpen(false);
    setEditingPersona(null);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">AI Personas</h2>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => handleOpenForm()}
              className="bg-accent hover:bg-accent/90 text-black"
            >
              Add Persona
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingPersona ? "Edit Persona" : "Create New Persona"}
              </DialogTitle>
            </DialogHeader>
            <PersonaForm 
              open={isFormOpen}
              onOpenChange={setIsFormOpen}
              onSubmit={handleFormSubmit}
              editingPersona={editingPersona}
              projectId={projectId}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 h-48 animate-pulse"></div>
          ))}
        </div>
      ) : (
        <>
          {personas.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <h3 className="text-xl font-medium mb-2">No personas yet</h3>
              <p className="mb-4 text-gray-400">Create your first persona to get started with AI-powered automation</p>
              <Button 
                onClick={() => handleOpenForm()} 
                className="bg-accent hover:bg-accent/90 text-black"
              >
                Create Persona
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {personas.map((persona) => (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  onEdit={() => handleOpenForm(persona)}
                  onDelete={() => handleDelete(persona.id)}
                  onToggleActive={(isActive) => handleStatusToggle(persona.id, isActive)}
                  isToggling={toggleActive.isPending}
                  isDeleting={deletePersona.isPending}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}