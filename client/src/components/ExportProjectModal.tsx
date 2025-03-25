import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface ExportProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
}

export function ExportProjectModal({ isOpen, onClose, projectId }: ExportProjectModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  
  const [options, setOptions] = useState({
    includeData: true,
    includeConfig: true,
    includeHistory: true,
    optimizeForVm: true,
  });
  
  const toggleOption = (option: keyof typeof options) => {
    setOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };
  
  const handleExport = () => {
    setIsExporting(true);
    
    // Simulate export process
    setTimeout(() => {
      setIsExporting(false);
      
      toast({
        title: "Project Exported",
        description: "Your project has been exported successfully. Check your downloads folder.",
      });
      
      onClose();
      
      // Simulate download
      const link = document.createElement('a');
      link.href = '#';
      link.download = `titan-project-${projectId}.zip`;
      link.click();
    }, 2000);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[475px]">
        <DialogHeader>
          <DialogTitle>Export Project</DialogTitle>
          <DialogDescription>
            Prepare your project for deployment to Google VM or other environments.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <h3 className="text-sm font-medium">Export Options</h3>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeData" 
                checked={options.includeData}
                onCheckedChange={() => toggleOption('includeData')}
              />
              <Label htmlFor="includeData" className="cursor-pointer">Include project data</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeConfig" 
                checked={options.includeConfig}
                onCheckedChange={() => toggleOption('includeConfig')}
              />
              <Label htmlFor="includeConfig" className="cursor-pointer">Include configuration</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeHistory" 
                checked={options.includeHistory}
                onCheckedChange={() => toggleOption('includeHistory')}
              />
              <Label htmlFor="includeHistory" className="cursor-pointer">Include activity history</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="optimizeForVm" 
                checked={options.optimizeForVm}
                onCheckedChange={() => toggleOption('optimizeForVm')}
              />
              <Label htmlFor="optimizeForVm" className="cursor-pointer">Optimize for Google VM</Label>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-sm font-medium mb-2">Deployment Instructions</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>After downloading the export file:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Upload the .zip file to your Google VM instance</li>
                <li>Extract the contents with <code>unzip titan-project-*.zip</code></li>
                <li>Navigate to the extracted directory</li>
                <li>Run the setup script with <code>./setup.sh</code></li>
                <li>Access the application at <code>http://YOUR_VM_IP:5000</code></li>
              </ol>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? "Exporting..." : "Export Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}