import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import ProjectView from "@/pages/ProjectView";
import PersonaView from "@/pages/PersonaView";
import { ProjectProvider } from "./context/ProjectContext";
import { WebSocketProvider } from "./lib/websocket";
import { Navigation } from "@/components/Navigation";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/projects/:id" component={ProjectView} />
      <Route path="/personas/:id" component={PersonaView} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <ProjectProvider>
          <div className="flex flex-col min-h-screen bg-gray-950">
            <main className="flex-1 overflow-auto">
              <Router />
            </main>
          </div>
          <Toaster />
        </ProjectProvider>
      </WebSocketProvider>
    </QueryClientProvider>
  );
}

export default App;
