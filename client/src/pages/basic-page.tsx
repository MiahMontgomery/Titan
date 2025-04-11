import React from "react";
import { TitanLogoWithText } from "@/components/ui/titan-logo";

export default function BasicPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-card border border-border rounded-lg p-8 shadow-lg">
        <div className="flex justify-center mb-8">
          <TitanLogoWithText size={60} />
        </div>
        
        <h1 className="text-2xl font-bold mb-6 text-center">Welcome to Titan</h1>
        
        <p className="text-muted-foreground text-center mb-6">
          Your AI-powered autonomous coding assistant and project management system.
        </p>
        
        <div className="titan-card p-6 mb-6">
          <h2 className="text-lg font-medium mb-2 text-primary">Project Management</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage projects with AI-powered assistance. Track progress, view logs, and manage code all in one place.
          </p>
        </div>
        
        <div className="titan-card p-6 mb-6">
          <h2 className="text-lg font-medium mb-2 text-primary">Web Automation</h2>
          <p className="text-sm text-muted-foreground">
            Automate web tasks with Puppeteer integration. Create scripts to extract data, fill forms, and more.
          </p>
        </div>
        
        <div className="flex justify-center">
          <button className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium">
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}