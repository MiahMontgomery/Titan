import React, { useState } from "react";
import { Header } from "@/components/ui/header";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, Lightbulb, Copy, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AITesting() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState("gpt-4o");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [useProjectKey, setUseProjectKey] = useState(false);
  const [projectId, setProjectId] = useState<string>("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a prompt to generate a response.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResponse("");

    try {
      const response = await fetch("/api/openai/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          model,
          temperature,
          maxTokens,
          ...(useProjectKey && projectId ? { projectId: parseInt(projectId) } : {}),
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResponse(data.content);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to generate completion",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(response);
    toast({
      description: "Copied to clipboard",
    });
  };

  const handleClear = () => {
    setPrompt("");
    setResponse("");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="AI Testing" />

      <main className="flex-1 overflow-y-auto scrollbar-thin p-6 bg-background">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">AI Testing Console</h1>
          <p className="mt-1 text-muted-foreground">Test your OpenAI integration and experiment with different models and parameters</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-medium text-foreground">Input</h2>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="prompt">Prompt</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Enter your prompt here..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[150px]"
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o">GPT-4o (Latest)</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="temperature">Temperature: {temperature}</Label>
                    </div>
                    <Slider
                      id="temperature"
                      min={0}
                      max={1}
                      step={0.1}
                      value={[temperature]}
                      onValueChange={(value) => setTemperature(value[0])}
                    />
                    <p className="text-xs text-muted-foreground">Lower values are more focused, higher values are more creative</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxTokens">Max Tokens</Label>
                    <Input
                      id="maxTokens"
                      type="number"
                      min={1}
                      max={4000}
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="useProjectKey"
                      checked={useProjectKey}
                      onCheckedChange={setUseProjectKey}
                    />
                    <Label htmlFor="useProjectKey">Use Project API Key (Turbo)</Label>
                  </div>

                  {useProjectKey && (
                    <div className="space-y-2">
                      <Label htmlFor="projectId">Project ID</Label>
                      <Input
                        id="projectId"
                        type="number"
                        min={1}
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                        placeholder="Enter project ID"
                      />
                    </div>
                  )}
                </div>
              </form>
            </CardContent>
            <CardFooter className="px-6 py-4 bg-card border-t border-border flex justify-between">
              <Button variant="outline" onClick={handleClear} disabled={isLoading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="px-6 py-4 border-b border-border">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-foreground">Response</h2>
                {response && (
                  <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-[300px]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Generating response...</p>
                </div>
              ) : response ? (
                <div className="prose prose-stone dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap bg-secondary p-4 rounded-md overflow-auto max-h-[400px]">
                    {response}
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                  <Lightbulb className="h-8 w-8 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">Enter a prompt and click "Generate" to see the AI response</p>
                  <p className="text-xs text-muted-foreground">The response will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}