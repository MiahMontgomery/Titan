import React, { useState } from "react";
import { Maximize2, Minimize2, RefreshCw } from "lucide-react";
import { TitanLogo } from "@/components/ui/titan-logo";
import { Button } from "@/components/ui/button";

interface OutputTabProps {
  projectId: number;
  hasOutput: boolean;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function OutputTab({ projectId, hasOutput, isLoading = false, onRefresh }: OutputTabProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-background p-4' : 'relative'}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Project Output</h3>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div 
        className={`
          titan-card border border-border overflow-hidden
          ${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[400px]'}
        `}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <TitanLogo size={40} spinning />
            <p className="mt-4 text-muted-foreground">Loading output preview...</p>
          </div>
        ) : !hasOutput ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="mb-4 p-3 rounded-full bg-secondary">
              <RefreshCw className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Output Available</h3>
            <p className="text-muted-foreground max-w-md">
              This project hasn't generated any viewable output yet. 
              Continue working with the chat in the Input tab to build your project.
            </p>
          </div>
        ) : (
          <div className="h-full">
            <iframe 
              src={`/api/projects/${projectId}/preview`}
              className="w-full h-full border-none"
              title="Project Output"
            />
          </div>
        )}
      </div>
    </div>
  );
}