import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Persona } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2, MessageCircle, FileText, Activity, BarChart2, Settings2 } from "lucide-react";
import { TopNavigation } from "@/components/TopNavigation";
import { PersonaLeftSidebar } from "@/components/PersonaLeftSidebar";
import { PersonaChats } from "../components/persona-modules/PersonaChats";
import { PersonaContent } from "../components/persona-modules/PersonaContent";
import { PersonaLogs } from "../components/persona-modules/PersonaLogs";
import { PersonaPerformance } from "../components/persona-modules/PersonaPerformance";
import { PersonaSettings } from "../components/persona-modules/PersonaSettings";

export function PersonaView() {
  const [, params] = useRoute<{ id: string }>("/personas/:id");
  const personaId = params?.id || "";
  const [activeTab, setActiveTab] = useState("chats");
  
  // Fetch persona details
  const { data: persona, isLoading } = useQuery<Persona>({
    queryKey: [`/api/personas/${personaId}`],
    enabled: !!personaId,
    retry: 1,
  });
  
  useEffect(() => {
    // Update page title
    if (persona) {
      document.title = `${persona.name} - Titan`;
    }
  }, [persona]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }
  
  if (!persona) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">Persona Not Found</h1>
        <p className="text-gray-400 mb-6">The persona you're looking for doesn't exist or was deleted.</p>
        <Button
          onClick={() => window.history.back()}
        >
          Go Back
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Sidebar */}
      <PersonaLeftSidebar 
        activePage="persona" 
        personaId={personaId}
      />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavigation 
          persona={persona}
        />
        
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold flex items-center">
                  {persona.name}
                  {persona.isActive ? (
                    <span className="ml-2 bg-green-900/30 text-green-400 text-xs px-2 py-1 rounded-full font-normal">
                      Active
                    </span>
                  ) : (
                    <span className="ml-2 bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded-full font-normal">
                      Inactive
                    </span>
                  )}
                </h1>
                <p className="text-gray-400 mt-1">
                  {persona.description || "No description provided"}
                </p>
              </div>
            </div>
            <Separator className="my-6" />
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8 w-full justify-start">
              <TabsTrigger value="chats" className="flex items-center">
                <MessageCircle className="h-4 w-4 mr-2" />
                Chats
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Content
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center">
                <Activity className="h-4 w-4 mr-2" />
                Logs
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center">
                <BarChart2 className="h-4 w-4 mr-2" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center">
                <Settings2 className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chats">
              <PersonaChats personaId={personaId} />
            </TabsContent>
            
            <TabsContent value="content">
              <PersonaContent personaId={personaId} />
            </TabsContent>
            
            <TabsContent value="logs">
              <PersonaLogs personaId={personaId} />
            </TabsContent>
            
            <TabsContent value="performance">
              <PersonaPerformance personaId={personaId} />
            </TabsContent>
            
            <TabsContent value="settings">
              {persona && <PersonaSettings persona={persona} />}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}