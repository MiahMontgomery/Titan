import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function Settings() {
  const [generalSettings, setGeneralSettings] = useState({
    darkMode: true,
    realTimeUpdates: true,
    notifications: false,
  });

  const handleToggle = (setting: keyof typeof generalSettings) => {
    setGeneralSettings({
      ...generalSettings,
      [setting]: !generalSettings[setting],
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Global Settings</CardTitle>
            <CardDescription>
              Configure general application settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <p className="text-sm text-gray-400">
                  Enable dark color scheme
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={generalSettings.darkMode}
                onCheckedChange={() => handleToggle('darkMode')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="real-time">Real-time Updates</Label>
                <p className="text-sm text-gray-400">
                  Receive updates in real-time
                </p>
              </div>
              <Switch
                id="real-time"
                checked={generalSettings.realTimeUpdates}
                onCheckedChange={() => handleToggle('realTimeUpdates')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications">Notifications</Label>
                <p className="text-sm text-gray-400">
                  Enable browser notifications
                </p>
              </div>
              <Switch
                id="notifications"
                checked={generalSettings.notifications}
                onCheckedChange={() => handleToggle('notifications')}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>About Fyndham</CardTitle>
            <CardDescription>
              System information and resources
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Version</h3>
              <p className="text-sm text-gray-400">1.0.0</p>
            </div>
            
            <div>
              <h3 className="font-medium">Environment</h3>
              <p className="text-sm text-gray-400">Development</p>
            </div>
            
            <div>
              <h3 className="font-medium">License</h3>
              <p className="text-sm text-gray-400">Personal Use Only</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}