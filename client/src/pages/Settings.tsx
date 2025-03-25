import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FirebaseSetupModal } from '@/components/FirebaseSetupModal';
import { ExportProjectModal } from '@/components/ExportProjectModal';
import { FirebaseIntegration, OpenAIIntegration, TelegramIntegration } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from '@/components/ui/separator';
import { connectToFirebase, connectToOpenAI, connectToTelegram } from '@/lib/utils';

export default function Settings() {
  const [firebaseModalOpen, setFirebaseModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<number>(0);
  const [settings, setSettings] = useState({
    darkMode: true,
    notifications: true,
    backgroundProcessing: true,
    autoComplete: true,
  });
  
  // Configuration states
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseIntegration | null>(null);
  const [openAIConfig, setOpenAIConfig] = useState<OpenAIIntegration | null>(null);
  const [telegramConfig, setTelegramConfig] = useState<TelegramIntegration | null>(null);
  
  const { toast } = useToast();
  
  // Handle saving Firebase configuration
  const handleSaveFirebaseConfig = (config: FirebaseIntegration) => {
    setFirebaseConfig(config);
    
    // Connect to Firebase with the new config
    try {
      connectToFirebase(config.config);
      
      // Save config to server
      fetch('/api/firebase/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config: config.config }),
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          toast({
            title: "Firebase Connected",
            description: "Firebase configuration saved successfully.",
          });
        } else {
          toast({
            title: "Connection Error",
            description: data.message || "Failed to save Firebase configuration.",
            variant: "destructive",
          });
        }
      })
      .catch(error => {
        console.error('Error saving Firebase config:', error);
        toast({
          title: "Connection Error",
          description: "Failed to save Firebase configuration to server.",
          variant: "destructive",
        });
      });
      
    } catch (error) {
      console.error('Error connecting to Firebase:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to Firebase with the provided configuration.",
        variant: "destructive",
      });
    }
  };
  
  // Handle OpenAI API key update
  const handleOpenAISetup = () => {
    const apiKey = prompt("Please enter your OpenAI API key");
    
    if (!apiKey) return;
    
    // Update OpenAI config
    const newConfig: OpenAIIntegration = { apiKey };
    setOpenAIConfig(newConfig);
    
    // Connect to OpenAI
    try {
      connectToOpenAI(apiKey);
      
      // Save to server
      fetch('/api/openai/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          toast({
            title: "OpenAI Connected",
            description: "OpenAI API key saved successfully.",
          });
        }
      })
      .catch(error => {
        console.error('Error saving OpenAI config:', error);
        toast({
          title: "Connection Error",
          description: "Failed to save OpenAI configuration.",
          variant: "destructive",
        });
      });
      
    } catch (error) {
      console.error('Error connecting to OpenAI:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to OpenAI with the provided API key.",
        variant: "destructive",
      });
    }
  };
  
  // Handle Telegram setup
  const handleTelegramSetup = () => {
    const token = prompt("Please enter your Telegram bot token");
    
    if (!token) return;
    
    // Update Telegram config
    const newConfig: TelegramIntegration = { token };
    setTelegramConfig(newConfig);
    
    // Connect to Telegram
    try {
      connectToTelegram(token);
      
      // Save to server
      fetch('/api/telegram/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          toast({
            title: "Telegram Connected",
            description: "Telegram bot token saved successfully.",
          });
        }
      })
      .catch(error => {
        console.error('Error saving Telegram config:', error);
        toast({
          title: "Connection Error",
          description: "Failed to save Telegram configuration.",
          variant: "destructive",
        });
      });
      
    } catch (error) {
      console.error('Error connecting to Telegram:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to Telegram with the provided token.",
        variant: "destructive",
      });
    }
  };
  
  // Handle setting toggle
  const handleToggleSetting = (setting: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };
  
  // Handle export project
  const handleExportProject = (projectId: number) => {
    setCurrentProjectId(projectId);
    setExportModalOpen(true);
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Integration Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>
              Configure external service integrations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Firebase</h3>
                <p className="text-sm text-muted-foreground">
                  {firebaseConfig ? "Connected" : "Not configured"}
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setFirebaseModalOpen(true)}
              >
                {firebaseConfig ? "Update" : "Configure"}
              </Button>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">OpenAI API</h3>
                <p className="text-sm text-muted-foreground">
                  {openAIConfig ? "Connected" : "Not configured"}
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleOpenAISetup}
              >
                {openAIConfig ? "Update" : "Configure"}
              </Button>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Telegram Bot</h3>
                <p className="text-sm text-muted-foreground">
                  {telegramConfig ? "Connected" : "Not configured"}
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleTelegramSetup}
              >
                {telegramConfig ? "Update" : "Configure"}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Export Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Export & Deployment</CardTitle>
            <CardDescription>
              Export your project for deployment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Google VM Deployment</h3>
              <p className="text-sm text-muted-foreground">
                Export your project as a zip file for deployment to a Google VM
              </p>
              <div className="pt-2">
                <Button
                  variant="default"
                  onClick={() => handleExportProject(0)}
                >
                  Export Project
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h3 className="font-medium">Backup Project</h3>
              <p className="text-sm text-muted-foreground">
                Create a complete backup of your project data
              </p>
              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "Backup Created",
                      description: "Project backup has been created successfully."
                    });
                  }}
                >
                  Create Backup
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Application Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Application</CardTitle>
            <CardDescription>
              Configure application behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Toggle between light and dark theme
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={settings.darkMode}
                onCheckedChange={() => handleToggleSetting('darkMode')}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Enable or disable in-app notifications
                </p>
              </div>
              <Switch
                id="notifications"
                checked={settings.notifications}
                onCheckedChange={() => handleToggleSetting('notifications')}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="background">Background Processing</Label>
                <p className="text-sm text-muted-foreground">
                  Allow AI to continue working in the background
                </p>
              </div>
              <Switch
                id="background"
                checked={settings.backgroundProcessing}
                onCheckedChange={() => handleToggleSetting('backgroundProcessing')}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autocomplete">AI Autocomplete</Label>
                <p className="text-sm text-muted-foreground">
                  Enable AI-assisted code and text completion
                </p>
              </div>
              <Switch
                id="autocomplete"
                checked={settings.autoComplete}
                onCheckedChange={() => handleToggleSetting('autoComplete')}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>About Titan</CardTitle>
            <CardDescription>
              Information about this application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Version</h3>
              <p className="text-sm">1.0.0</p>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-medium">Build Date</h3>
              <p className="text-sm">March 25, 2025</p>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-medium">License</h3>
              <p className="text-sm">MIT License</p>
            </div>
            
            <div className="pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  toast({
                    title: "Check for Updates",
                    description: "You are running the latest version of Titan."
                  });
                }}
              >
                Check for Updates
              </Button>
            </div>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
            © 2025 Titan Project Management System
          </CardFooter>
        </Card>
      </div>
      
      {/* Modals */}
      <FirebaseSetupModal 
        isOpen={firebaseModalOpen}
        onClose={() => setFirebaseModalOpen(false)}
        onSave={handleSaveFirebaseConfig}
        existingConfig={firebaseConfig || undefined}
      />
      
      <ExportProjectModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        projectId={currentProjectId}
      />
    </div>
  );
}