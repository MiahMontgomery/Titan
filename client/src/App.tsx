import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import ProjectView from "@/pages/ProjectView";
import { ProjectProvider } from "./context/ProjectContext";
import { useWebSocket } from "./lib/websocket";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/projects/:id" component={ProjectView} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize WebSocket connection
  useWebSocket();
  
  return (
    <QueryClientProvider client={queryClient}>
      <ProjectProvider>
        <Router />
        <Toaster />
      </ProjectProvider>
    </QueryClientProvider>
  );
}

export default App;
