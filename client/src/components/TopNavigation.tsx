import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Persona } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Logo } from "@/components/ui/Logo";
import { 
  Home, 
  Menu, 
  Monitor, 
  Power, 
  PowerOff, 
  Settings, 
  User, 
  BarChart2,
  Loader2,
  X
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface TopNavigationProps {
  persona?: Persona;
}

export function TopNavigation({ persona }: TopNavigationProps) {
  const [location] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Mutation for toggling persona active state
  const toggleActive = useMutation({
    mutationFn: async () => {
      if (!persona) return null;
      
      return apiRequest({
        url: `/api/personas/${persona.id}/toggle-active`,
        method: "POST",
        data: { isActive: !persona.isActive }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/personas/${persona?.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/personas'] });
      
      toast({
        title: persona?.isActive ? "Persona Deactivated" : "Persona Activated",
        description: persona?.isActive 
          ? "The persona has been put into an inactive state."
          : "The persona is now active and can interact with platforms.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to toggle persona state. Please try again.",
      });
    }
  });
  
  const handleToggleActive = () => {
    toggleActive.mutate();
  };
  
  return (
    <header className="border-b border-gray-800 bg-gray-950">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          {/* Mobile menu button */}
          <Button 
            variant="ghost" 
            size="icon"
            className="mr-2 md:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          {/* Logo/Home link */}
          <Link href="/">
            <a className="flex items-center">
              <Logo size="md" />
            </a>
          </Link>
          
          {/* Desktop navigation */}
          <nav className="ml-8 hidden md:flex space-x-1">
            <Link href="/">
              <a className={`px-3 py-2 rounded-md text-sm flex items-center ${
                location === "/" ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-800"
              }`}>
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </a>
            </Link>
            <Link href="/web-accounts">
              <a className={`px-3 py-2 rounded-md text-sm flex items-center ${
                location === "/web-accounts" ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-800"
              }`}>
                <Monitor className="h-4 w-4 mr-2" />
                Web Accounts
              </a>
            </Link>
            <Link href="/automation">
              <a className={`px-3 py-2 rounded-md text-sm flex items-center ${
                location === "/automation" ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-800"
              }`}>
                <BarChart2 className="h-4 w-4 mr-2" />
                Automation
              </a>
            </Link>
            <Link href="/settings">
              <a className={`px-3 py-2 rounded-md text-sm flex items-center ${
                location === "/settings" ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-800"
              }`}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </a>
            </Link>
          </nav>
        </div>
        
        {/* Right section with persona status toggle */}
        {persona && (
          <div>
            <Button
              onClick={handleToggleActive}
              disabled={toggleActive.isPending}
              variant={persona.isActive ? "destructive" : "outline"}
              size="sm"
              className={`flex items-center ${
                !persona.isActive && "border-green-800 text-green-500 hover:bg-green-950"
              }`}
            >
              {toggleActive.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : persona.isActive ? (
                <PowerOff className="h-4 w-4 mr-2" />
              ) : (
                <Power className="h-4 w-4 mr-2" />
              )}
              {persona.isActive ? "Deactivate" : "Activate"} Persona
            </Button>
          </div>
        )}
      </div>
      
      {/* Mobile menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] sm:w-[350px]">
          <SheetHeader>
            <div className="flex items-center">
              <div className="w-8 h-8 mr-3 bg-gradient-to-br from-accent to-blue-600 rounded-md flex items-center justify-center">
                <span className="text-black font-bold text-sm">T</span>
              </div>
              <SheetTitle className="bg-gradient-to-r from-accent to-blue-500 bg-clip-text text-transparent">TITAN</SheetTitle>
            </div>
          </SheetHeader>
          <div className="py-4 flex flex-col gap-2">
            <Link href="/">
              <a 
                className={`px-4 py-3 rounded-md flex items-center ${
                  location === "/" ? "bg-gray-800 text-white" : "text-gray-300"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Home className="h-5 w-5 mr-3" />
                Dashboard
              </a>
            </Link>
            <Link href="/web-accounts">
              <a 
                className={`px-4 py-3 rounded-md flex items-center ${
                  location === "/web-accounts" ? "bg-gray-800 text-white" : "text-gray-300"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Monitor className="h-5 w-5 mr-3" />
                Web Accounts
              </a>
            </Link>
            <Link href="/automation">
              <a 
                className={`px-4 py-3 rounded-md flex items-center ${
                  location === "/automation" ? "bg-gray-800 text-white" : "text-gray-300"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <BarChart2 className="h-5 w-5 mr-3" />
                Automation
              </a>
            </Link>
            <Link href="/settings">
              <a 
                className={`px-4 py-3 rounded-md flex items-center ${
                  location === "/settings" ? "bg-gray-800 text-white" : "text-gray-300"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Settings className="h-5 w-5 mr-3" />
                Settings
              </a>
            </Link>
            
            {persona && (
              <div className="mt-4 border-t border-gray-800 pt-4">
                <div className="px-4 py-2">
                  <h3 className="text-lg font-medium">{persona.name}</h3>
                  <p className="text-sm text-gray-400">{persona.description || "No description"}</p>
                </div>
                
                <Button
                  onClick={() => {
                    handleToggleActive();
                    setMobileMenuOpen(false);
                  }}
                  disabled={toggleActive.isPending}
                  variant={persona.isActive ? "destructive" : "outline"}
                  className={`mt-2 w-full ${
                    !persona.isActive && "border-green-800 text-green-500 hover:bg-green-950"
                  }`}
                >
                  {toggleActive.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : persona.isActive ? (
                    <PowerOff className="h-4 w-4 mr-2" />
                  ) : (
                    <Power className="h-4 w-4 mr-2" />
                  )}
                  {persona.isActive ? "Deactivate" : "Activate"} Persona
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}