import React from "react";
import { Bell, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSocket } from "./socket-provider";
import { Button } from "./button";

interface HeaderProps {
  title: string;
  className?: string;
}

export function Header({ title, className }: HeaderProps) {
  const { status } = useSocket();

  return (
    <div className={cn("sticky top-0 z-10 flex h-16 bg-card shadow-sm border-b border-border", className)}>
      <div className="flex items-center justify-between w-full px-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          
          {/* Connection status indicator */}
          <div className="hidden md:flex items-center">
            <div className={cn(
              "w-2 h-2 rounded-full mr-2",
              status === 'connected' ? "bg-green-500 animate-pulse" : 
              status === 'connecting' ? "bg-amber-500 animate-pulse" : 
              "bg-destructive"
            )} />
            <span className="text-xs text-muted-foreground">
              {status === 'connected' ? "Connected" : 
               status === 'connecting' ? "Connecting..." : 
               "Disconnected"}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </Button>
          
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
}
