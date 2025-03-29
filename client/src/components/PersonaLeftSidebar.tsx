import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Persona } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  PlusCircle, 
  User, 
  Users, 
  Database, 
  MessageSquare, 
  Settings 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

interface PersonaLeftSidebarProps {
  activePage: string;
  personaId?: string;
}

export function PersonaLeftSidebar({ activePage, personaId }: PersonaLeftSidebarProps) {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [newPersonaDialogOpen, setNewPersonaDialogOpen] = useState(false);
  
  // Fetch all personas
  const { data: personas, isLoading } = useQuery<Persona[]>({
    queryKey: ['/api/personas'],
    retry: 1,
  });
  
  // Get the current project ID (assuming this would be available in a real context)
  // For now we'll just use 1 as a placeholder
  const currentProjectId = 1;
  
  return (
    <div className="w-64 border-r border-gray-800 bg-gray-950 flex flex-col h-screen">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center mb-4">
          <div className="w-7 h-7 mr-2 bg-gradient-to-br from-accent to-blue-600 rounded-md flex items-center justify-center">
            <span className="text-black font-bold text-sm">T</span>
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-accent to-blue-500 bg-clip-text text-transparent">
            TITAN
          </span>
        </div>
        
        <Button 
          onClick={() => setNewPersonaDialogOpen(true)}
          className="w-full justify-start"
          variant="outline"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Persona
        </Button>
      </div>
      
      <div className="flex-1 overflow-auto">
        <ScrollArea className="h-full">
          <div className="py-2">
            <div className="px-3 py-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Navigation
              </h3>
            </div>
            
            <Link href="/">
              <a className={`flex items-center px-3 py-2 text-sm rounded-md mx-2 ${
                location === "/" ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-800"
              }`}>
                <Database className="h-4 w-4 mr-2" />
                Dashboard
              </a>
            </Link>
            
            <Link href="/web-accounts">
              <a className={`flex items-center px-3 py-2 text-sm rounded-md mx-2 ${
                location === "/web-accounts" ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-800"
              }`}>
                <Users className="h-4 w-4 mr-2" />
                Web Accounts
              </a>
            </Link>
            
            <Link href="/chat">
              <a className={`flex items-center px-3 py-2 text-sm rounded-md mx-2 ${
                location === "/chat" ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-800"
              }`}>
                <MessageSquare className="h-4 w-4 mr-2" />
                AI Chat
              </a>
            </Link>
            
            <Link href="/settings">
              <a className={`flex items-center px-3 py-2 text-sm rounded-md mx-2 ${
                location === "/settings" ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-800"
              }`}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </a>
            </Link>
          </div>
          
          <Separator className="my-2" />
          
          <div>
            <div className="px-3 py-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Personas
              </h3>
            </div>
            
            {isLoading ? (
              <div className="px-3 py-2 text-sm text-gray-400">Loading...</div>
            ) : (
              <>
                {personas && personas.length > 0 ? (
                  personas.map((persona) => (
                    <Link key={persona.id} href={`/personas/${persona.id}`}>
                      <a className={`flex items-center justify-between px-3 py-2 text-sm rounded-md mx-2 ${
                        personaId === String(persona.id) ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-800"
                      }`}>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          <span className="truncate">{persona.name}</span>
                        </div>
                        {persona.isActive && (
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        )}
                      </a>
                    </Link>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-400">
                    No personas created yet
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* Create Persona Dialog */}
      <PersonaFormDialog
        open={newPersonaDialogOpen}
        onOpenChange={setNewPersonaDialogOpen}
        onSubmit={() => {
          toast({
            title: "Persona Created",
            description: "The new persona has been created successfully.",
          });
        }}
        projectId={currentProjectId}
      />
    </div>
  );
}

// Persona Form Dialog Component
interface PersonaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  projectId: number;
  editingPersona?: Persona;
}

function PersonaFormDialog({ open, onOpenChange, onSubmit, projectId, editingPersona }: PersonaFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: editingPersona?.name || "",
    description: editingPersona?.description || "",
    platform: "onlyfans", // Default platform
    avatarUrl: editingPersona?.imageUrl || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // This would be a real API call in a complete implementation
      // const response = await apiRequest('/api/personas', {
      //   method: 'POST',
      //   data: {
      //     ...formData,
      //     projectId,
      //   }
      // });
      
      // For now we'll just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: editingPersona ? "Persona Updated" : "Persona Created",
        description: editingPersona
          ? "The persona has been updated successfully."
          : "The new persona has been created successfully.",
      });
      
      onSubmit();
      onOpenChange(false);
      setFormData({
        name: "",
        description: "",
        platform: "onlyfans",
        avatarUrl: "",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create persona. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingPersona ? "Edit Persona" : "Create New Persona"}</DialogTitle>
          <DialogDescription>
            {editingPersona
              ? "Update this persona's details and settings."
              : "Personas can interact on different platforms with customized behavior."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter persona name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this persona's purpose or role"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="platform">Primary Platform</Label>
              <select
                id="platform"
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="flex h-10 w-full rounded-md border border-gray-800 bg-gray-950 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-foreground file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="onlyfans">OnlyFans</option>
                <option value="patreon">Patreon</option>
                <option value="twitter">Twitter</option>
                <option value="instagram">Instagram</option>
                <option value="fansly">Fansly</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="avatarUrl">Avatar URL (optional)</Label>
              <Input
                id="avatarUrl"
                value={formData.avatarUrl}
                onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
              {isSubmitting ? "Saving..." : (editingPersona ? "Save Changes" : "Create Persona")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}