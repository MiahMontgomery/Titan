import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSocket } from "./socket-provider";

interface TechnicalInfoProps {
  className?: string;
}

export function TechnicalInfo({ className }: TechnicalInfoProps) {
  const { status } = useSocket();

  return (
    <Card className={cn("", className)}>
      <CardHeader className="px-6 py-4 border-b border-border">
        <h2 className="text-lg font-medium text-foreground">Technical Configuration</h2>
      </CardHeader>

      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Server Info */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">Server Configuration</h3>
            <div className="bg-secondary rounded-md p-3 font-mono text-xs text-muted-foreground">
              <p>Server Port: <span className="text-foreground">3000</span></p>
              <p>Environment: <span className="text-foreground">{process.env.NODE_ENV || "development"}</span></p>
              <p>Node.js: <span className="text-foreground">v18+</span></p>
              <p>Socket.io: <span className="text-foreground">Enabled</span></p>
            </div>
          </div>
          
          {/* Client Info */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">Client Configuration</h3>
            <div className="bg-secondary rounded-md p-3 font-mono text-xs text-muted-foreground">
              <p>Client Port: <span className="text-foreground">5000</span></p>
              <p>Framework: <span className="text-foreground">React + Vite</span></p>
              <p>UI Library: <span className="text-foreground">Tailwind + shadcn</span></p>
              <p>WebSocket: <span className={cn(
                status === 'connected' ? "text-green-400" : 
                status === 'connecting' ? "text-yellow-400" : 
                "text-destructive"
              )}>
                {status === 'connected' ? "Connected" : 
                 status === 'connecting' ? "Connecting..." : 
                 "Disconnected"}
              </span></p>
            </div>
          </div>
          
          {/* API Info */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">API Configuration</h3>
            <div className="bg-secondary rounded-md p-3 font-mono text-xs text-muted-foreground">
              <p>OpenAI: <span className="text-green-400">Configured</span></p>
              <p>Puppeteer: <span className="text-green-400">Configured</span></p>
              <p>Turbo Keys: <span className="text-foreground">Available</span></p>
              <p>API Rate Limit: <span className="text-foreground">60 req/min</span></p>
            </div>
          </div>
        </div>

        {/* Project Structure */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-foreground mb-2">Project Structure</h3>
          <div className="code-block">
<pre>
├── client/               # React/Vite frontend
│   ├── src/              # Source code
│   │   ├── components/   # UI components
│   │   ├── lib/          # Utilities and hooks
│   │   ├── pages/        # Page components
│   │   ├── App.tsx       # Main app component
│   │   └── main.tsx      # Entry point
├── server/               # Express backend
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Data storage
│   ├── openai.ts         # OpenAI integration
│   ├── puppeteer.ts      # Web automation
│   └── index.ts          # Entry point
├── shared/               # Shared code
│   └── schema.ts         # Data models and types
├── autonomous-agent/     # AI agent code
│   ├── index.ts          # Agent management
│   ├── findom-agent.ts   # FINDOM agent
│   └── cachecow-agent.ts # CACHECOW agent
└── data/                 # Data storage
</pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
