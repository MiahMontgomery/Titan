import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { 
  Plus, Search, Filter, SlidersHorizontal,
  AlertCircle, RefreshCw, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Persona } from "@/lib/types";
import PersonaCard from "./PersonaCard";
import PersonaForm from "./PersonaForm";

export default function PersonasDashboard() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [filterActive, setFilterActive] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [personaToDelete, setPersonaToDelete] = useState<string | null>(null);

  // Fetch personas
  const { 
    data: personas, 
    isLoading, 
    isError,
    refetch 
  } = useQuery({
    queryKey: ["/api/personas"],
    select: (data: Persona[]) => {
      // Apply filtering
      let filtered = data;
      
      if (filterActive !== "all") {
        filtered = filtered.filter(p => 
          filterActive === "active" ? p.isActive : !p.isActive
        );
      }
      
      // Apply search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(query) || 
          p.displayName.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
        );
      }
      
      // Apply sorting
      return [...filtered].sort((a, b) => {
        switch (sortBy) {
          case "name":
            return a.displayName.localeCompare(b.displayName);
          case "income":
            return (b.stats.totalIncome ?? 0) - (a.stats.totalIncome ?? 0);
          case "messages":
            return b.stats.messageCount - a.stats.messageCount;
          case "newest":
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          default:
            return 0;
        }
      });
    }
  });

  // Create persona mutation
  const createPersonaMutation = useMutation({
    mutationFn: async (newPersona: Omit<Persona, "id" | "createdAt" | "updatedAt">) => {
      const response = await fetch("/api/personas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPersona),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create persona");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personas"] });
      toast({
        title: "Persona created",
        description: "The new persona has been added successfully.",
      });
      setFormOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error creating persona",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update persona mutation
  const updatePersonaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<Persona> }) => {
      const response = await fetch(`/api/personas/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update persona");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personas"] });
      toast({
        title: "Persona updated",
        description: "The changes have been saved successfully.",
      });
      setFormOpen(false);
      setEditingPersona(null);
    },
    onError: (error) => {
      toast({
        title: "Error updating persona",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete persona mutation
  const deletePersonaMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/personas/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete persona");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personas"] });
      toast({
        title: "Persona deleted",
        description: "The persona has been removed successfully.",
      });
      setDeleteDialogOpen(false);
      setPersonaToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error deleting persona",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Toggle active state mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string, isActive: boolean }) => {
      const response = await fetch(`/api/personas/${id}/toggle-active`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update status");
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/personas"] });
      toast({
        title: variables.isActive ? "Persona activated" : "Persona deactivated",
        description: variables.isActive 
          ? "The persona is now active and will operate autonomously" 
          : "The persona has been paused and won't perform any actions",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Form submission handler
  const handleFormSubmit = (formData: any) => {
    if (editingPersona) {
      updatePersonaMutation.mutate({ 
        id: typeof editingPersona.id === 'number' ? editingPersona.id.toString() : editingPersona.id, 
        data: formData 
      });
    } else {
      createPersonaMutation.mutate(formData);
    }
  };

  // Handle edit button click
  const handleEdit = (persona: Persona) => {
    setEditingPersona(persona);
    setFormOpen(true);
  };

  // Handle delete button click
  const handleDelete = (personaId: string) => {
    setPersonaToDelete(personaId);
    setDeleteDialogOpen(true);
  };

  // Handle toggle active state
  const handleToggleActive = (personaId: string, isActive: boolean) => {
    toggleActiveMutation.mutate({ id: personaId, isActive });
  };

  // Handle view stats
  const handleViewStats = (personaId: string) => {
    toast({
      title: "Stats view",
      description: "Stats view for persona " + personaId + " is not implemented yet.",
    });
  };

  // Handle view messages
  const handleViewMessages = (personaId: string) => {
    toast({
      title: "Messages view",
      description: "Message history for persona " + personaId + " is not implemented yet.",
    });
  };

  // Handle view content
  const handleViewContent = (personaId: string) => {
    toast({
      title: "Content view",
      description: "Content library for persona " + personaId + " is not implemented yet.",
    });
  };

  // Create new persona button click
  const handleAddNew = () => {
    setEditingPersona(null);
    setFormOpen(true);
  };

  // Confirm delete dialog
  const confirmDelete = () => {
    if (personaToDelete) {
      deletePersonaMutation.mutate(personaToDelete);
    }
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Failed to load personas</h2>
        <p className="text-muted-foreground mb-4">There was an error loading the personas data.</p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Personas</h1>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" /> New Persona
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search personas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={filterActive} onValueChange={setFilterActive}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Personas</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="messages">Messages</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline"
            onClick={() => refetch()}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className="border rounded-lg h-[350px] animate-pulse bg-muted"
            />
          ))}
        </div>
      ) : personas && personas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {personas.map((persona) => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
              onViewStats={handleViewStats}
              onViewMessages={handleViewMessages}
              onViewContent={handleViewContent}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center border rounded-xl py-12">
          <div className="bg-primary/10 p-3 rounded-full mb-4">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-medium mb-2">No personas found</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            {searchQuery || filterActive !== "all"
              ? "No personas match your current filters. Try adjusting your search or filter criteria."
              : "You haven't created any personas yet. Create your first persona to get started with autonomous FINDOM operations."}
          </p>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" /> Create Your First Persona
          </Button>
        </div>
      )}

      {/* Persona Form Dialog */}
      <PersonaForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        editingPersona={editingPersona}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={deleteDialogOpen} 
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this persona along with all associated chat history,
              content, and performance data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}