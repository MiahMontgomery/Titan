import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
<<<<<<< HEAD
import { Toaster } from "./components/ui/toaster";
import NotFound from "./pages/not-found";
import HomePage from "./pages/HomePage";
import ProjectView from "./pages/ProjectView";
import ChatView from "./pages/ChatView";
import { ProjectProvider } from "./context/ProjectContext";
// WebSocketProvider is imported in main.tsx
import { ApiKeyAlert } from "./components/ApiKeyAlert";
// Import ByteUI ThemeProvider
import { ThemeProvider } from "./components/ByteUI";
=======
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
>>>>>>> 1d84bc7 (Set up Node.js project for Titan AI assistant.)

function Router() {
  return (
    <Switch>
<<<<<<< HEAD
      <Route path="/" component={HomePage} />
      <Route path="/projects/:id" component={ProjectView} />
      <Route path="/chat" component={ChatView} />
=======
      {/* Add pages below */}
      {/* <Route path="/" component={Home}/> */}
      {/* Fallback to 404 */}
>>>>>>> 1d84bc7 (Set up Node.js project for Titan AI assistant.)
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
<<<<<<< HEAD
      <ThemeProvider>
        <ProjectProvider>
          <div className="flex flex-col min-h-screen bg-[#050A0F]">
            <header className="px-6 py-5">
              <div className="findom-logo">
                <div className="findom-logo-image">
                  <div className="w-10 h-10 rounded-full bg-[#050A0F] flex items-center justify-center border border-[rgba(1,249,198,0.2)]">
                    <div className="status-indicator active"></div>
                  </div>
                </div>
                <h1 className="findom-logo-text">
                  <span className="findom-green-glow">Findom</span>
                </h1>
              </div>
            </header>
            <main className="flex-1 overflow-auto px-6 pb-6">
              <Router />
            </main>
          </div>
          <ApiKeyAlert />
          <Toaster />
        </ProjectProvider>
      </ThemeProvider>
=======
      <Router />
      <Toaster />
>>>>>>> 1d84bc7 (Set up Node.js project for Titan AI assistant.)
    </QueryClientProvider>
  );
}

export default App;
