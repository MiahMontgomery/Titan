import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import ProjectView from "@/pages/ProjectView";
import Settings from "@/pages/Settings";
import { ProjectProvider } from "./context/ProjectContext";
import { WebSocketProvider } from "./lib/websocket";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/projects/:id" component={ProjectView} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <ProjectProvider>
          <Router />
          <Toaster />
        </ProjectProvider>
      </WebSocketProvider>
    </QueryClientProvider>
  );
}

export default App;
