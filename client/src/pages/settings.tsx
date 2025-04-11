import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsIcon, UserIcon, BellIcon, ShieldIcon, Loader2Icon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [settings, setSettings] = useState({
    username: "User Name",
    email: "user@example.com",
    notifications: {
      email: true,
      system: true,
      alerts: true,
    },
    security: {
      twoFactor: false,
      sessionTimeout: "30"
    }
  });
  
  const handleChange = (section: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };
  
  const handleSave = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Settings Saved",
        description: "Your settings have been updated successfully."
      });
    }, 1000);
  };
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white mb-2">Settings</h1>
        <p className="text-muted">Configure your account and application preferences</p>
      </div>
      
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="w-full bg-background border-border mb-6 grid grid-cols-3">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <BellIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <ShieldIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="account" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-primary" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  value={settings.username}
                  onChange={(e) => setSettings(prev => ({...prev, username: e.target.value}))}
                  className="bg-background border-border"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings(prev => ({...prev, email: e.target.value}))}
                  className="bg-background border-border"
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password"
                  placeholder="••••••••"
                  className="bg-background border-border"
                />
                <p className="text-xs text-muted mt-1">Leave blank to keep current password</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="bg-primary text-background hover:bg-primary/90"
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellIcon className="h-5 w-5 text-primary" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Control how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Email Notifications</p>
                  <p className="text-sm text-muted">Receive activity updates via email</p>
                </div>
                <Switch 
                  checked={settings.notifications.email} 
                  onCheckedChange={(checked) => handleChange('notifications', 'email', checked)}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">System Notifications</p>
                  <p className="text-sm text-muted">Show desktop notifications for important events</p>
                </div>
                <Switch 
                  checked={settings.notifications.system} 
                  onCheckedChange={(checked) => handleChange('notifications', 'system', checked)}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Alert Notifications</p>
                  <p className="text-sm text-muted">Receive alerts for agent errors or failures</p>
                </div>
                <Switch 
                  checked={settings.notifications.alerts} 
                  onCheckedChange={(checked) => handleChange('notifications', 'alerts', checked)}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="bg-primary text-background hover:bg-primary/90"
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldIcon className="h-5 w-5 text-primary" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Two-Factor Authentication</p>
                  <p className="text-sm text-muted">Enable additional security for your account</p>
                </div>
                <Switch 
                  checked={settings.security.twoFactor} 
                  onCheckedChange={(checked) => handleChange('security', 'twoFactor', checked)}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
              
              <div>
                <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                <Input 
                  id="session-timeout" 
                  type="number"
                  min="5"
                  max="240"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => handleChange('security', 'sessionTimeout', e.target.value)}
                  className="bg-background border-border"
                />
                <p className="text-xs text-muted mt-1">How long until you're automatically logged out due to inactivity</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="bg-primary text-background hover:bg-primary/90"
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                Update Security Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
