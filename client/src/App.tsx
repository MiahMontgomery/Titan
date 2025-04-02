import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import NotFound from "./pages/not-found";
import HomePage from "./pages/HomePage";
import ProjectView from "./pages/ProjectView";
import PersonaView from "./pages/PersonaView";
import Settings from "./pages/Settings";
import { ProjectProvider } from "./context/ProjectContext";
// WebSocketProvider is imported in main.tsx
import { Navigation } from "./components/Navigation";
import { ApiKeyAlert } from "./components/ApiKeyAlert";
// Import ByteUI ThemeProvider
import { ThemeProvider } from "./components/ByteUI";

// Import ByteUI example
import ByteUIExample from './components/ByteUIExample';

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/projects/:id" component={ProjectView} />
      <Route path="/personas/:id" component={PersonaView} />
      <Route path="/settings" component={Settings} />
      <Route path="/byte-ui" component={ByteUIExample} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ProjectProvider>
          <div className="flex flex-col min-h-screen bg-gray-950">
            <main className="flex-1 overflow-auto">
              <Router />
            </main>
          </div>
          <ApiKeyAlert />
          <Toaster />
        </ProjectProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
