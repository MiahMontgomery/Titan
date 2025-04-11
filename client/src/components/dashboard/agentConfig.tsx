import { useState } from "react";
import { BotIcon, DatabaseIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { Agent } from "@shared/schema";
import { AgentType, OpenAIModel } from "@shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AgentConfigCardProps {
  agent: Agent;
  onUpdate: (updatedAgent: Agent) => void;
}

const AgentConfigCard = ({ agent, onUpdate }: AgentConfigCardProps) => {
  const { toast } = useToast();
  const [showApiKey, setShowApiKey] = useState(false);
  const [localAgent, setLocalAgent] = useState<Agent>({...agent});
  
  const handleToggleActive = (active: boolean) => {
    setLocalAgent(prev => ({...prev, active}));
  };
  
  const handleModelChange = (model: string) => {
    setLocalAgent(prev => ({...prev, model}));
  };
  
  const handleParameterChange = (key: string, value: number) => {
    setLocalAgent(prev => ({
      ...prev, 
      parameters: {
        ...prev.parameters,
        [key]: value
      }
    }));
  };
  
  const handleApiKeyChange = (apiKey: string) => {
    setLocalAgent(prev => ({...prev, apiKey}));
  };
  
  const handleSave = async () => {
    try {
      await apiRequest('PATCH', `/api/agents/${agent.id}`, localAgent);
      onUpdate(localAgent);
      toast({
        title: "Success",
        description: `${agent.name} configuration saved successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save agent configuration.",
        variant: "destructive",
      });
    }
  };
  
  const cardAccentColors = agent.type === AgentType.FINDOM 
    ? {bg: "bg-primary/10", text: "text-primary"} 
    : {bg: "bg-blue-500/10", text: "text-blue-500"};
  
  const isUsingTurboKey = agent.apiKey !== undefined && agent.apiKey.length > 0;
  
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="border-b border-border p-3 flex items-center gap-2 bg-background/50">
        <div className={`w-8 h-8 rounded-md ${cardAccentColors.bg} flex items-center justify-center ${cardAccentColors.text}`}>
          {agent.type === AgentType.FINDOM ? (
            <BotIcon className="h-4 w-4" />
          ) : (
            <DatabaseIcon className="h-4 w-4" />
          )}
        </div>
        <div>
          <h3 className="text-sm font-medium text-white">{agent.name}</h3>
          <p className="text-xs text-muted">
            {agent.type === AgentType.FINDOM ? "Financial domain specialist" : "Data collection and caching"}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Switch 
            checked={localAgent.active} 
            onCheckedChange={handleToggleActive} 
            className="data-[state=checked]:bg-primary"
          />
        </div>
      </div>
      
      <div className="p-4">
        <div className="mb-4">
          <Label className="block text-sm font-medium text-white mb-1">Model</Label>
          <Select value={localAgent.model} onValueChange={handleModelChange}>
            <SelectTrigger className="w-full h-10 bg-background rounded-md border border-border">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={OpenAIModel.GPT_4O}>gpt-4o</SelectItem>
              <SelectItem value={OpenAIModel.GPT_4_TURBO}>gpt-4-turbo</SelectItem>
              <SelectItem value={OpenAIModel.GPT_4}>gpt-4</SelectItem>
              <SelectItem value={OpenAIModel.GPT_3_5_TURBO}>gpt-3.5-turbo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="mb-4">
          <Label className="block text-sm font-medium text-white mb-1">API Key</Label>
          <div className="flex">
            <Input 
              type={showApiKey ? "text" : "password"} 
              value={localAgent.apiKey || ""} 
              onChange={(e) => handleApiKeyChange(e.target.value)}
              className="flex-1 h-10 bg-background rounded-l-md border border-r-0 border-border"
              placeholder="Enter API key" 
            />
            <Button 
              variant="outline" 
              size="icon" 
              className="h-10 w-10 bg-background border border-l-0 border-border rounded-r-md text-muted hover:text-white"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted">
            {isUsingTurboKey ? "Using project-specific \"turbo\" API key" : "Using shared API key"}
          </p>
        </div>
        
        <div className="mb-4">
          <Label className="block text-sm font-medium text-white mb-1">Parameters</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="block text-xs text-muted mb-1">Temperature</Label>
              <Input 
                type="number" 
                value={localAgent.parameters.temperature} 
                onChange={(e) => handleParameterChange('temperature', parseFloat(e.target.value))}
                min="0" 
                max="2" 
                step="0.1" 
                className="w-full h-8 bg-background rounded-md px-2 text-xs border border-border"
              />
            </div>
            <div>
              <Label className="block text-xs text-muted mb-1">Max Tokens</Label>
              <Input 
                type="number" 
                value={localAgent.parameters.maxTokens} 
                onChange={(e) => handleParameterChange('maxTokens', parseInt(e.target.value))}
                min="1" 
                max="8000" 
                className="w-full h-8 bg-background rounded-md px-2 text-xs border border-border"
              />
            </div>
          </div>
        </div>
        
        <div>
          <Button 
            className={`w-full h-9 ${localAgent.active ? 'bg-primary text-background hover:bg-primary/90' : 'bg-background text-white border border-border hover:bg-card'} rounded-md text-sm font-medium transition`}
            onClick={handleSave}
          >
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );
};

interface AgentConfigurationProps {
  agents: Agent[];
  onUpdateAgent: (updatedAgent: Agent) => void;
}

const AgentConfiguration = ({ agents, onUpdateAgent }: AgentConfigurationProps) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Agent Configuration</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {agents.map(agent => (
          <AgentConfigCard 
            key={agent.id} 
            agent={agent} 
            onUpdate={onUpdateAgent} 
          />
        ))}
      </div>
    </div>
  );
};

export default AgentConfiguration;
