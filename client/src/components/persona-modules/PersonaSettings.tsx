import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Persona } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Slider 
} from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Save } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PersonaSettingsProps {
  persona: Persona;
}

export function PersonaSettings({ persona }: PersonaSettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for behavior settings
  const [behaviorSettings, setBehaviorSettings] = useState({
    instructions: persona.behavior.instructions || "",
  });
  
  // State for delay settings
  const [responseTime, setResponseTime] = useState<number[]>([
    persona.behavior.responsiveness || 5,
  ]);
  
  // State for content focus
  const [contentFocus, setContentFocus] = useState("mixed");
  
  // State for autonomy toggles
  const [autonomySettings, setAutonomySettings] = useState({
    chatAutonomy: persona.autonomy.canInitiateConversation || false,
    contentAutonomy: persona.autonomy.canCreateContent || false,
  });
  
  // Mutation for saving settings
  const saveSettings = useMutation({
    mutationFn: async () => {
      return apiRequest({
        url: `/api/personas/${persona.id}/settings`,
        method: "PATCH",
        data: {
          behavior: {
            ...persona.behavior,
            instructions: behaviorSettings.instructions,
            responsiveness: responseTime[0],
            lastUpdated: new Date(),
          },
          autonomy: {
            ...persona.autonomy,
            canInitiateConversation: autonomySettings.chatAutonomy,
            canCreateContent: autonomySettings.contentAutonomy,
            contentFocus,
          },
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/personas/${persona.id}`] });
      toast({
        title: "Settings Saved",
        description: "Persona settings have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings. Please try again.",
      });
    }
  });
  
  const handleSaveSettings = () => {
    saveSettings.mutate();
  };
  
  const handleToggleChange = (setting: keyof typeof autonomySettings) => {
    setAutonomySettings({
      ...autonomySettings,
      [setting]: !autonomySettings[setting],
    });
  };
  
  return (
    <div className="space-y-6">
      {/* AI Behavior Settings */}
      <Card>
        <CardHeader>
          <CardTitle>AI Behavior</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="behavior-instructions">Instructions</Label>
            <Textarea
              id="behavior-instructions"
              placeholder="Write instructions to shape this persona's behavior..."
              value={behaviorSettings.instructions}
              onChange={(e) => setBehaviorSettings({
                ...behaviorSettings,
                instructions: e.target.value,
              })}
              className="min-h-[120px]"
            />
            <p className="text-xs text-gray-400">
              Use natural language to describe how the persona should act. 
              For example: "Act more bratty but stay playful, not rude."
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Delay Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Response Timing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label>Response Delay</Label>
              <Slider
                value={responseTime}
                onValueChange={setResponseTime}
                max={15}
                min={1}
                step={1}
                className="mt-2"
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-400">Immediate</span>
                <span className="text-xs text-gray-400">
                  {responseTime[0]} minutes
                </span>
                <span className="text-xs text-gray-400">15 min</span>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Set how quickly the persona should respond to messages.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Content Focus */}
      <Card>
        <CardHeader>
          <CardTitle>Content Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="content-focus">Content Focus</Label>
            <Select
              value={contentFocus}
              onValueChange={setContentFocus}
            >
              <SelectTrigger id="content-focus" className="mt-2">
                <SelectValue placeholder="Select content focus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400 mt-1">
              Choose what type of content this persona should prioritize creating.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Autonomy Toggles */}
      <Card>
        <CardHeader>
          <CardTitle>Autonomy Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="chat-autonomy">Chat Autonomy</Label>
              <p className="text-xs text-gray-400">
                Allow persona to send messages without approval
              </p>
            </div>
            <Switch
              id="chat-autonomy"
              checked={autonomySettings.chatAutonomy}
              onCheckedChange={() => handleToggleChange('chatAutonomy')}
            />
          </div>
          
          <div className="border-t border-gray-800 pt-4"></div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="content-autonomy">Content Autonomy</Label>
              <p className="text-xs text-gray-400">
                Allow persona to publish content without approval
              </p>
            </div>
            <Switch
              id="content-autonomy"
              checked={autonomySettings.contentAutonomy}
              onCheckedChange={() => handleToggleChange('contentAutonomy')}
            />
          </div>
          
          <div className="border-t border-gray-800 pt-4"></div>
          
          <div className="flex justify-end mt-4">
            <Button
              onClick={handleSaveSettings}
              disabled={saveSettings.isPending}
              className="bg-accent hover:bg-accent/90 text-black"
            >
              {saveSettings.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}