import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import ProjectView from "@/pages/ProjectView";
import Settings from "@/pages/Settings";
import ReplitView from "@/pages/ReplitView";
import { ProjectProvider } from "./context/ProjectContext";
import { WebSocketProvider } from "./lib/websocket";
import { Navigation } from "@/components/Navigation";

// Import the new pages
import WebAccounts from "@/pages/WebAccounts";
import AutomationDashboard from "@/pages/AutomationDashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/projects/:id" component={ProjectView} />
      <Route path="/settings" component={Settings} />
      <Route path="/replit-view" component={ReplitView} />
      <Route path="/web-accounts" component={WebAccounts} />
      <Route path="/automation" component={AutomationDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <ProjectProvider>
          <div className="flex flex-col md:flex-row min-h-screen bg-gray-950">
            <Navigation />
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
