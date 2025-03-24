import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Feature, Milestone, Goal } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface ProgressTabProps {
  projectId: number;
}

export function ProgressTab({ projectId }: ProgressTabProps) {
  const { toast } = useToast();
  const [expandedFeatures, setExpandedFeatures] = useState<number[]>([]);
  const [expandedMilestones, setExpandedMilestones] = useState<string[]>([]);
  
  // Fetch features for this project
  const { data: features = [], isLoading: featuresLoading } = useQuery<Feature[]>({
    queryKey: [`/api/projects/${projectId}/features`],
    retry: 1,
  });
  
  const toggleFeature = (featureId: number) => {
    setExpandedFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(id => id !== featureId) 
        : [...prev, featureId]
    );
  };
  
  const toggleMilestone = (milestoneId: string) => {
    setExpandedMilestones(prev => 
      prev.includes(milestoneId) 
        ? prev.filter(id => id !== milestoneId) 
        : [...prev, milestoneId]
    );
  };
  
  // Set first feature as expanded by default
  useEffect(() => {
    if (features.length > 0 && expandedFeatures.length === 0) {
      setExpandedFeatures([features[0].id]);
    }
  }, [features, expandedFeatures]);
  
  const calculateTotalEstimatedHours = (features: Feature[]) => {
    let total = 0;
    features.forEach(feature => {
      const milestones = milestonesData[feature.id] || [];
      milestones.forEach(milestone => {
        total += milestone.estimatedHours || 0;
      });
    });
    return total;
  };
  
  // Keep track of milestones by feature
  const milestonesData: Record<number, Milestone[]> = {};
  
  // Keep track of goals by milestone
  const goalsData: Record<number, Goal[]> = {};
  
  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium">Project Features</h3>
          <div className="text-sm text-gray-400">
            <span>Total Estimated Time:</span>
            <span className="text-gray-300 ml-1">
              {featuresLoading ? "Calculating..." : `${calculateTotalEstimatedHours(features)} hours`}
            </span>
          </div>
        </div>
        
        {featuresLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-800 rounded-lg border border-gray-700 h-16 animate-pulse"></div>
            ))}
          </div>
        ) : features.length === 0 ? (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
            <p className="text-gray-400">No features have been added to this project yet.</p>
            <p className="text-gray-500 mt-2">Features will appear here once they are created by AI agents.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {features.map(feature => (
              <FeatureItem 
                key={feature.id}
                feature={feature}
                isExpanded={expandedFeatures.includes(feature.id)}
                onToggle={() => toggleFeature(feature.id)}
                expandedMilestones={expandedMilestones}
                onToggleMilestone={toggleMilestone}
                milestonesData={milestonesData}
                goalsData={goalsData}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface FeatureItemProps {
  feature: Feature;
  isExpanded: boolean;
  onToggle: () => void;
  expandedMilestones: string[];
  onToggleMilestone: (id: string) => void;
  milestonesData: Record<number, Milestone[]>;
  goalsData: Record<number, Goal[]>;
}

function FeatureItem({ 
  feature, 
  isExpanded, 
  onToggle,
  expandedMilestones,
  onToggleMilestone,
  milestonesData,
  goalsData
}: FeatureItemProps) {
  const { data: milestones = [], isLoading: milestonesLoading } = useQuery<Milestone[]>({
    queryKey: [`/api/features/${feature.id}/milestones`],
    retry: 1,
    enabled: isExpanded,
  });
  
  // Store milestones in the parent's data structure for calculation
  milestonesData[feature.id] = milestones;
  
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer" 
        onClick={onToggle}
      >
        <div className="flex items-center">
          <svg 
            className={`w-5 h-5 ${isExpanded ? 'text-accent' : 'text-gray-500'} mr-2 transform ${isExpanded ? 'rotate-90' : ''} transition-transform duration-200`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
          <h4 className="font-medium text-white">{feature.name}</h4>
        </div>
        <div className="flex items-center text-sm">
          <span className={`${feature.isComplete ? 'text-accent' : 'text-gray-400'} mr-3`}>
            {feature.isComplete ? 'Complete' : 'In Progress'}
          </span>
          <div className="w-32">
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-accent h-1.5 rounded-full" 
                style={{ width: feature.isComplete ? '100%' : '0%' }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-700">
          <div className="pl-7 space-y-4">
            {milestonesLoading ? (
              <div className="py-4 flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-accent"></div>
              </div>
            ) : milestones.length === 0 ? (
              <div className="py-4 text-center text-gray-400">
                No milestones have been created for this feature yet.
              </div>
            ) : (
              milestones.map(milestone => (
                <MilestoneItem 
                  key={milestone.id}
                  milestone={milestone}
                  isExpanded={expandedMilestones.includes(`${feature.id}-${milestone.id}`)}
                  onToggle={() => onToggleMilestone(`${feature.id}-${milestone.id}`)}
                  goalsData={goalsData}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface MilestoneItemProps {
  milestone: Milestone;
  isExpanded: boolean;
  onToggle: () => void;
  goalsData: Record<number, Goal[]>;
}

function MilestoneItem({ milestone, isExpanded, onToggle, goalsData }: MilestoneItemProps) {
  const { data: goals = [], isLoading: goalsLoading } = useQuery<Goal[]>({
    queryKey: [`/api/milestones/${milestone.id}/goals`],
    retry: 1,
    enabled: isExpanded,
  });
  
  // Store goals in the parent's data structure
  goalsData[milestone.id] = goals;
  
  // Calculate milestone completion based on goals
  const calculateMilestoneStatus = () => {
    if (!goals || goals.length === 0) return { isCompleted: false, percent: 0 };
    
    const completedGoals = goals.filter(g => g.isCompleted).length;
    const totalGoals = goals.length;
    const percent = Math.round((completedGoals / totalGoals) * 100);
    const isCompleted = completedGoals === totalGoals;
    
    return { isCompleted, percent };
  };
  
  const milestoneStatus = calculateMilestoneStatus();
  
  return (
    <div>
      <div 
        className="flex items-center justify-between py-2 cursor-pointer" 
        onClick={onToggle}
      >
        <div className="flex items-center">
          <svg 
            className={`w-4 h-4 text-gray-400 mr-2 transform ${isExpanded ? 'rotate-90' : ''} transition-transform duration-200`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
          <h5 className="text-sm font-medium">{milestone.name}</h5>
        </div>
        <div className="flex items-center text-xs">
          <div className="flex items-center">
            <span className={`${milestoneStatus.isCompleted ? 'text-accent' : 'text-gray-400'} mr-2`}>
              {milestoneStatus.percent}%
            </span>
            <div className="w-20 mr-2">
              <div className="w-full bg-gray-700 rounded-full h-1">
                <div 
                  className="bg-accent h-1 rounded-full" 
                  style={{ width: `${milestoneStatus.percent}%` }}
                ></div>
              </div>
            </div>
          </div>
          <span className="ml-1 text-gray-400">{milestone.estimatedHours} hours</span>
        </div>
      </div>
      
      {isExpanded && (
        <div className="pl-6">
          {goalsLoading ? (
            <div className="py-2 flex justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : goals.length === 0 ? (
            <div className="py-2 text-center text-xs text-gray-500">
              No goals have been defined for this milestone.
            </div>
          ) : (
            <ul className="space-y-2 text-xs text-gray-400 border-l border-gray-700 pl-4 py-2">
              {goals.map(goal => (
                <li key={goal.id} className="flex items-start">
                  <span className={`inline-block w-3 h-3 ${goal.isCompleted ? 'bg-accent' : 'bg-gray-600'} rounded-full mt-1 -ml-5.5 mr-2`}></span>
                  <span>{goal.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
