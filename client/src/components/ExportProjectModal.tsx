import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from '@/hooks/use-toast';

interface ExportProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
}

export function ExportProjectModal({ isOpen, onClose, projectId }: ExportProjectModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [includeData, setIncludeData] = useState(true);
  const [includeFirebaseConfig, setIncludeFirebaseConfig] = useState(true);
  const [includeOpenAIKey, setIncludeOpenAIKey] = useState(true);
  const { toast } = useToast();
  
  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Make API call to export project
      const response = await fetch(`/api/projects/${projectId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          includeData,
          includeFirebaseConfig,
          includeOpenAIKey,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `titan-project-${projectId}.zip`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Complete",
        description: "Project has been exported successfully. Check your downloads folder.",
      });
      
      onClose();
      
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export project.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Project for Google VM Deployment</DialogTitle>
          <DialogDescription>
            Download your project as a zip file that can be deployed to a Google VM or any other server.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="text-sm">
            <p className="mb-2">
              The exported package will include:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>All project source code</li>
              <li>Deployment instructions</li>
              <li>README file</li>
              <li>Setup scripts for Google VM</li>
            </ul>
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Export Options</h3>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeData" 
                checked={includeData} 
                onCheckedChange={(checked) => setIncludeData(!!checked)} 
              />
              <label htmlFor="includeData" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Include project data (features, milestones, goals, logs)
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeFirebaseConfig" 
                checked={includeFirebaseConfig} 
                onCheckedChange={(checked) => setIncludeFirebaseConfig(!!checked)} 
              />
              <label htmlFor="includeFirebaseConfig" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Include Firebase configuration
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeOpenAIKey" 
                checked={includeOpenAIKey} 
                onCheckedChange={(checked) => setIncludeOpenAIKey(!!checked)} 
              />
              <label htmlFor="includeOpenAIKey" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Include OpenAI API key (securely)
              </label>
            </div>
          </div>
          
          <div className="text-sm text-amber-500 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md mt-4">
            <strong>Note:</strong> If you're planning to share this export, consider disabling the inclusion of API keys and secrets.
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <span className="mr-2">Exporting...</span>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              </>
            ) : (
              "Export Project"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}