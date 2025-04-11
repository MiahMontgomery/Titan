import React from "react";

type Feature = {
  id: number;
  name: string;
  description: string;
  completed: boolean;
  inProgress?: boolean;
};

type Milestone = {
  id: number;
  name: string;
  features: Feature[];
  completed: boolean;
};

interface ProgressTabProps {
  progress: number;
  milestones: Milestone[];
  systemStatus: "active" | "idle" | "error";
}

export function ProgressTab({ progress, milestones, systemStatus }: ProgressTabProps) {
  // Calculate stats
  const totalFeatures = milestones.reduce((acc, m) => acc + m.features.length, 0);
  const completedFeatures = milestones.reduce(
    (acc, m) => acc + m.features.filter(f => f.completed).length, 
    0
  );
  const inProgressFeatures = milestones.reduce(
    (acc, m) => acc + m.features.filter(f => f.inProgress).length, 
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="font-medium mr-2">System Status:</span>
          <div className={`titan-status-light ${systemStatus === 'active' ? 'active' : ''}`} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium">Project Progress</div>
          <div className="text-sm text-muted-foreground">{progress}%</div>
        </div>
        <div className="titan-progress-bar">
          <div className="titan-progress-bar-value" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{completedFeatures} of {totalFeatures} features completed</span>
          <span>{inProgressFeatures} features in progress</span>
        </div>
      </div>

      {milestones.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No features have been created yet.</p>
          <p className="mt-2">Start interacting through the Input tab to add features.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {milestones.map((milestone) => (
            <div key={milestone.id} className="border border-border rounded-md overflow-hidden">
              <div className="bg-secondary p-3 border-b border-border">
                <h3 className="font-medium flex items-center">
                  {milestone.completed ? (
                    <svg className="w-4 h-4 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <div className="w-4 h-4 mr-2 border border-muted-foreground rounded-full"></div>
                  )}
                  {milestone.name}
                </h3>
              </div>
              <div className="divide-y divide-border">
                {milestone.features.map((feature) => (
                  <div key={feature.id} className="p-3 pl-6">
                    <div className="flex items-start">
                      {feature.completed ? (
                        <svg className="w-4 h-4 mr-2 text-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : feature.inProgress ? (
                        <div className="w-4 h-4 mr-2 border border-primary rounded-full flex-shrink-0 mt-0.5 animate-pulse"></div>
                      ) : (
                        <div className="w-4 h-4 mr-2 border border-muted-foreground rounded-full flex-shrink-0 mt-0.5"></div>
                      )}
                      <div>
                        <div className="font-medium">{feature.name}</div>
                        {feature.description && (
                          <div className="text-sm text-muted-foreground mt-1">{feature.description}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}