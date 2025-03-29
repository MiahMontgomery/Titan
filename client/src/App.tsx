import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import ProjectView from "@/pages/ProjectView";
import { PersonaView } from "@/pages/PersonaView";
import Settings from "@/pages/Settings";
import { ProjectProvider } from "./context/ProjectContext";
import { WebSocketProvider } from "./lib/websocket";
import { TopNavigation } from "@/components/TopNavigation";
import { PersonaProvider } from "./context/PersonaContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/projects/:id" component={ProjectView} />
      <Route path="/personas/:id" component={PersonaView} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isPersonaView = location.startsWith('/personas/');
  
  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <ProjectProvider>
          <PersonaProvider>
            <div className="flex flex-col min-h-screen bg-gray-950">
              {!isPersonaView && <TopNavigation />}
              <div className="flex flex-1 overflow-hidden">
                <main className="flex-1 overflow-auto">
                  <Router />
                </main>
              </div>
              <Toaster />
            </div>
          </PersonaProvider>
        </ProjectProvider>
      </WebSocketProvider>
    </QueryClientProvider>
  );
}

export default App;
