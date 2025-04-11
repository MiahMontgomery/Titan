import { useQuery } from "@tanstack/react-query";
import { Project } from "@shared/schema";
import { useProjectContext } from "@/context/ProjectContext";
import { Plus, AlertCircle, ChevronRight, Activity, MessageSquare, List, DollarSign, BarChart } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function HomePage() {
  const { projects } = useProjectContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedProject, setExpandedProject] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("progress");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedFeatures, setExpandedFeatures] = useState<number[]>([]);
  const [expandedMilestones, setExpandedMilestones] = useState<number[]>([]);
  
  // Make sure projects is valid before using it
  useEffect(() => {
    try {
      setIsLoading(true);
      
      // Ensure projects is an array before using it
      if (Array.isArray(projects)) {
        // If we have no projects but the API request completed, fall back to the default FINDOM project
        if (projects.length === 0) {
          setProjectList([{
            id: 1,
            name: 'FINDOM',
            description: 'Financial Domination Autonomous Agent',
            isWorking: true,
            progress: 15,
            lastUpdated: new Date(),
            projectType: 'findom',
            autoMode: false,
            priority: 10,
            agentConfig: {},
            checkpoints: [],
            lastCheckIn: null,
            nextCheckIn: null,
            lastAutomationRun: null
          }]);
        } else {
          setProjectList(projects);
        }
        setError(null);
      } else if (projects) {
        console.warn("Projects is not an array:", projects);
        setError("Invalid projects data format");
        
        // Fall back to the default FINDOM project
        setProjectList([{
          id: 1,
          name: 'FINDOM',
          description: 'Financial Domination Autonomous Agent',
          isWorking: true,
          progress: 15,
          lastUpdated: new Date(),
          projectType: 'findom',
          autoMode: false,
          priority: 10,
          agentConfig: {},
          checkpoints: [],
          lastCheckIn: null,
          nextCheckIn: null,
          lastAutomationRun: null
        }]);
      }
    } catch (err) {
      console.error("Error processing projects data:", err);
      setError("Error loading projects");
      
      // Fall back to the default FINDOM project
      setProjectList([{
        id: 1,
        name: 'FINDOM',
        description: 'Financial Domination Autonomous Agent',
        isWorking: true,
        progress: 15,
        lastUpdated: new Date(),
        projectType: 'findom',
        autoMode: false,
        priority: 10,
        agentConfig: {},
        checkpoints: [],
        lastCheckIn: null,
        nextCheckIn: null,
        lastAutomationRun: null
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [projects]);

  const toggleProject = (id: number) => {
    if (expandedProject === id) {
      setExpandedProject(null);
    } else {
      setExpandedProject(id);
      setActiveTab("progress"); // Reset to progress tab when expanding
    }
  };
  
  // Toggle feature expansion
  const toggleFeature = (featureId: number) => {
    setExpandedFeatures(prev => {
      if (prev.includes(featureId)) {
        return prev.filter(id => id !== featureId);
      } else {
        return [...prev, featureId];
      }
    });
  };
  
  // Toggle milestone expansion
  const toggleMilestone = (milestoneId: number) => {
    setExpandedMilestones(prev => {
      if (prev.includes(milestoneId)) {
        return prev.filter(id => id !== milestoneId);
      } else {
        return [...prev, milestoneId];
      }
    });
  };

  // Sample feature data for demonstration with hierarchical structure
  const findomFeatures = [
    { 
      id: 1,
      name: "Webhook Integration", 
      status: "completed", 
      expandable: true, 
      subFeatures: [
        { 
          id: 101,
          name: "GitHub Webhook Handler", 
          status: "completed",
          goals: [
            { id: 10101, name: "Parse webhook payload", status: "completed" },
            { id: 10102, name: "Validate webhook signature", status: "completed" },
            { id: 10103, name: "Trigger repository updates", status: "completed" }
          ]
        },
        { 
          id: 102,
          name: "PM2 Process Management", 
          status: "completed",
          goals: [
            { id: 10201, name: "Auto-restart on code changes", status: "completed" },
            { id: 10202, name: "Logging integration", status: "completed" }
          ]
        }
      ]
    },
    { id: 2, name: "Project Management", status: "completed", expandable: false },
    { id: 3, name: "Dashboard UI", status: "completed", expandable: false },
    { 
      id: 4,
      name: "Agent Integration", 
      status: "in-progress", 
      expandable: true, 
      subFeatures: [
        { 
          id: 401,
          name: "Agent Core Implementation", 
          status: "completed",
          goals: [
            { id: 40101, name: "Agent context handling", status: "completed" },
            { id: 40102, name: "Memory system", status: "in-progress" },
            { id: 40103, name: "Action framework", status: "in-progress" }
          ]
        },
        { 
          id: 402,
          name: "Autonomous Behavior", 
          status: "in-progress",
          goals: [
            { id: 40201, name: "Decision-making framework", status: "in-progress" },
            { id: 40202, name: "Self-review capability", status: "pending" }
          ]
        }
      ]
    },
    { id: 5, name: "Real-time Chat System", status: "completed", expandable: false },
    { id: 6, name: "Progress Tracking", status: "completed", expandable: false },
    { id: 7, name: "Horizontal Project Boxes", status: "completed", expandable: false },
    { id: 8, name: "5-Tab Interface", status: "completed", expandable: false },
    { id: 9, name: "Sales Monitoring Tab", status: "completed", expandable: false },
    { id: 10, name: "Output Tab", status: "completed", expandable: false },
    { id: 11, name: "Pulsing Green Status Indicators", status: "completed", expandable: false },
    { id: 12, name: "Dark Theme with Green Accents", status: "completed", expandable: false },
  ];

  // Sample chat messages for demonstration
  const chatMessages = [
    { sender: "user", message: "Can you update the project UI to match the design specs?", timestamp: new Date(Date.now() - 120000) },
    { sender: "findom", message: "I'll implement a dark theme with green glowing accent colors and horizontal project boxes as requested.", timestamp: new Date(Date.now() - 90000) },
    { sender: "user", message: "Also add the 5-tab interface for each project.", timestamp: new Date(Date.now() - 60000) },
    { sender: "findom", message: "Added the 5-tab interface with Progress, Input, Log, Sales, and Output tabs. All projects now use this interface when expanded.", timestamp: new Date(Date.now() - 30000) },
  ];

  // Sample log entries for demonstration
  const logEntries = [
    { message: "Updated UI with dark theme and green accents", timestamp: new Date(Date.now() - 180000) },
    { message: "Added horizontal project boxes with pulsing status indicators", timestamp: new Date(Date.now() - 120000) },
    { message: "Implemented 5-tab interface with Progress, Input, Log, Sales, and Output tabs", timestamp: new Date(Date.now() - 60000) },
    { message: "System running in optimal condition", timestamp: new Date() },
  ];

  return (
    <div className="w-full h-full flex flex-col">
      {/* Error Alert */}
      {error && (
        <div className="mb-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
      
      {/* Add new project button */}
      <button onClick={() => setIsFormOpen(true)} className="add-project-button mb-6">
        <Plus className="w-5 h-5 mr-2" />
        <span>Add New Project</span>
      </button>
      
      {/* Projects list */}
      <div className="flex flex-col space-y-4">
        {/* Findom Project */}
        <div 
          className={`project-list-item ${expandedProject === 1 ? 'expanded' : ''}`}
        >
          {expandedProject === 1 ? (
            <div className="w-full">
              <div className="project-header" onClick={() => toggleProject(1)}>
                <div className="project-title-area">
                  <div className="status-indicator active"></div>
                  <span className="font-semibold titan-green">Findom</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-[rgba(1,249,198,0.1)] px-2 py-1 rounded text-xs">
                    <span className="text-primary">100%</span>
                  </div>
                  <ChevronRight 
                    className="h-5 w-5 text-gray-400 transition-transform rotate-90" 
                  />
                </div>
              </div>
              
              <div className="project-content mt-5">
                <div className="flex border-b border-[#01F9C6]/20">
                  <button 
                    className={`px-4 py-2 ${activeTab === 'progress' ? 'text-[#01F9C6] border-b-2 border-[#01F9C6]' : 'text-gray-400'}`}
                    onClick={() => setActiveTab('progress')}
                  >
                    Progress
                  </button>
                  <button 
                    className={`px-4 py-2 ${activeTab === 'input' ? 'text-[#01F9C6] border-b-2 border-[#01F9C6]' : 'text-gray-400'}`}
                    onClick={() => setActiveTab('input')}
                  >
                    Input
                  </button>
                  <button 
                    className={`px-4 py-2 ${activeTab === 'log' ? 'text-[#01F9C6] border-b-2 border-[#01F9C6]' : 'text-gray-400'}`}
                    onClick={() => setActiveTab('log')}
                  >
                    Log
                  </button>
                  <button 
                    className={`px-4 py-2 ${activeTab === 'sales' ? 'text-[#01F9C6] border-b-2 border-[#01F9C6]' : 'text-gray-400'}`}
                    onClick={() => setActiveTab('sales')}
                  >
                    Sales
                  </button>
                  <button 
                    className={`px-4 py-2 ${activeTab === 'output' ? 'text-[#01F9C6] border-b-2 border-[#01F9C6]' : 'text-gray-400'}`}
                    onClick={() => setActiveTab('output')}
                  >
                    Output
                  </button>
                </div>
                
                {/* Progress Tab Content */}
                <div className={`tab-content ${activeTab === 'progress' ? 'active' : ''}`}>
                  <div className="system-status-area">
                    <div className="flex items-center">
                      <div className="status-indicator active mr-2"></div>
                      <span className="text-xs text-gray-300">System Status: Operational</span>
                    </div>
                    <div className="project-progress-bar">
                      <div className="project-progress-fill" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                  
                  <div className="feature-list mt-4 space-y-4">
                    {findomFeatures.map((feature, index) => {
                      return (
                        <div key={index} className="space-y-2">
                          <div 
                            className={`feature-item ${feature.expandable ? 'cursor-pointer' : ''}`}
                            onClick={feature.expandable ? () => toggleFeature(feature.id) : undefined}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <div className="feature-status mr-2">
                                  {feature.status === 'completed' ? (
                                    <span className="text-[#01F9C6]">✓</span>
                                  ) : (
                                    <span className="text-[#01F9C6]">→</span>
                                  )}
                                </div>
                                <div className="feature-description text-white">
                                  {feature.name}
                                </div>
                              </div>
                              
                              {feature.expandable && (
                                <ChevronRight 
                                  className={`h-4 w-4 text-[#01F9C6] transition-transform duration-200 ${expandedFeatures.includes(feature.id) ? 'rotate-90' : ''}`}
                                />
                              )}
                            </div>
                          </div>
                          
                          {/* Sub-features shown in a vertical list below the parent feature */}
                          {feature.expandable && feature.subFeatures && expandedFeatures.includes(feature.id) && (
                            <div className="subfeature-list">
                              {feature.subFeatures.map((subFeature, i) => (
                                <div key={i} className="space-y-1">
                                  <div 
                                    className="subfeature-item cursor-pointer"
                                    onClick={() => toggleMilestone(subFeature.id)}
                                  >
                                    <div className="flex justify-between items-center w-full">
                                      <div className="flex items-center">
                                        <span className="mr-2">
                                          {subFeature.status === 'completed' ? (
                                            <span className="text-[#01F9C6]">✓</span>
                                          ) : (
                                            <span className="text-[#01F9C6]">→</span>
                                          )}
                                        </span>
                                        <span className="subfeature-description">{subFeature.name}</span>
                                      </div>
                                      {subFeature.goals && subFeature.goals.length > 0 && (
                                        <ChevronRight 
                                          className={`h-3 w-3 text-[#01F9C6] transition-transform duration-200 ${expandedMilestones.includes(subFeature.id) ? 'rotate-90' : ''}`}
                                        />
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Goal items under milestone */}
                                  {subFeature.goals && expandedMilestones.includes(subFeature.id) && (
                                    <div className="goals-list">
                                      {subFeature.goals.map((goal, j) => (
                                        <div key={j} className="goal-item">
                                          <div className="flex items-center">
                                            <span className="goal-bullet ml-6 mr-2">•</span>
                                            <span className="goal-description text-sm">
                                              {goal.name}
                                              {goal.status === 'completed' && (
                                                <span className="text-[#01F9C6] ml-1">✓</span>
                                              )}
                                              {goal.status === 'in-progress' && (
                                                <span className="text-[#01F9C6] ml-1">→</span>
                                              )}
                                              {goal.status === 'pending' && (
                                                <span className="text-gray-400 ml-1">◯</span>
                                              )}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Input Tab Content */}
                <div className={`tab-content ${activeTab === 'input' ? 'active' : ''}`}>
                  <div className="chat-messages">
                    {chatMessages.map((msg, index) => (
                      <div 
                        key={index} 
                        className={`chat-message ${msg.sender === 'user' ? 'user' : 'system'}`}
                      >
                        <div className="text-xs text-gray-400 mb-1">
                          {msg.timestamp.toLocaleTimeString()}
                        </div>
                        <div className="text-sm">
                          {msg.message}
                        </div>
                      </div>
                    ))}
                  </div>
                  <textarea 
                    className="chat-input" 
                    placeholder="Type your message here..."
                    rows={3}
                  ></textarea>
                </div>
                
                {/* Log Tab Content */}
                <div className={`tab-content ${activeTab === 'log' ? 'active' : ''}`}>
                  <div className="log-tab">
                    {logEntries.map((entry, index) => (
                      <div key={index} className="log-entry">
                        <span className="log-timestamp">
                          {entry.timestamp.toLocaleTimeString()} - {entry.timestamp.toLocaleDateString()}
                        </span>
                        {entry.message}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Sales Tab Content */}
                <div className={`tab-content ${activeTab === 'sales' ? 'active' : ''}`}>
                  <div className="p-2 text-sm text-gray-300">
                    <p>Sales and revenue monitoring dashboard will be displayed here.</p>
                  </div>
                </div>
                
                {/* Output Tab Content */}
                <div className={`tab-content ${activeTab === 'output' ? 'active' : ''}`}>
                  <div className="p-2 text-sm text-gray-300">
                    <p>System output and metrics will be displayed here.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="project-header w-full" onClick={() => toggleProject(1)}>
              <div className="project-title-area">
                <div className="status-indicator active"></div>
                <span className="font-semibold titan-green">Findom</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-[rgba(1,249,198,0.1)] px-2 py-1 rounded text-xs">
                  <span className="text-primary">100%</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          )}
        </div>
        
        {/* Other projects */}
        {projectList
          .filter(project => project?.name?.toUpperCase() !== 'FINDOM')
          .map(project => (
            <div 
              key={project.id}
              className={`project-list-item ${expandedProject === project.id ? 'expanded' : ''}`}
            >
              {expandedProject === project.id ? (
                <div className="w-full">
                  <div className="project-header" onClick={() => toggleProject(project.id)}>
                    <div className="project-title-area">
                      <div className={`status-indicator ${project.isWorking ? 'active' : 'inactive'}`}></div>
                      <span className="font-semibold text-white">{project.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-[rgba(1,249,198,0.1)] px-2 py-1 rounded text-xs">
                        <span className="text-primary">{project.progress}%</span>
                      </div>
                      <ChevronRight 
                        className="h-5 w-5 text-gray-400 transition-transform rotate-90" 
                      />
                    </div>
                  </div>
                  
                  <div className="project-content mt-5">
                    <div className="titan-tabs">
                      <button 
                        className={`titan-tab ${activeTab === 'progress' ? 'active' : ''}`}
                        onClick={() => setActiveTab('progress')}
                      >
                        <Activity className="w-4 h-4 mr-1" />
                        Progress
                      </button>
                      <button 
                        className={`titan-tab ${activeTab === 'input' ? 'active' : ''}`}
                        onClick={() => setActiveTab('input')}
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Input
                      </button>
                      <button 
                        className={`titan-tab ${activeTab === 'log' ? 'active' : ''}`}
                        onClick={() => setActiveTab('log')}
                      >
                        <List className="w-4 h-4 mr-1" />
                        Log
                      </button>
                      <button 
                        className={`titan-tab ${activeTab === 'sales' ? 'active' : ''}`}
                        onClick={() => setActiveTab('sales')}
                      >
                        <DollarSign className="w-4 h-4 mr-1" />
                        Sales
                      </button>
                      <button 
                        className={`titan-tab ${activeTab === 'output' ? 'active' : ''}`}
                        onClick={() => setActiveTab('output')}
                      >
                        <BarChart className="w-4 h-4 mr-1" />
                        Output
                      </button>
                    </div>
                    
                    {/* Progress Tab Content */}
                    <div className={`tab-content ${activeTab === 'progress' ? 'active' : ''}`}>
                      <div className="system-status-area">
                        <div className="flex items-center">
                          <div className={`status-indicator ${project.isWorking ? 'active' : 'inactive'} mr-2`}></div>
                          <span className="text-xs text-gray-300">
                            Status: {project.isWorking ? 'Operational' : 'Inactive'}
                          </span>
                        </div>
                        <div className="project-progress-bar">
                          <div 
                            className="project-progress-fill" 
                            style={{ width: `${project.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <p className="text-sm text-gray-300 mb-3">{project.description}</p>
                        
                        <div className="text-xs text-gray-400 flex justify-between items-center mt-2">
                          <span>Last Updated</span>
                          <span>{new Date(project.lastUpdated).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="text-xs text-gray-400 flex justify-between items-center mt-2">
                          <span>Project Type</span>
                          <span className="capitalize">{project.projectType}</span>
                        </div>
                        
                        <div className="text-xs text-gray-400 flex justify-between items-center mt-2">
                          <span>Auto Mode</span>
                          <span>{project.autoMode ? 'Enabled' : 'Disabled'}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Other tabs would follow the same pattern */}
                    <div className={`tab-content ${activeTab !== 'progress' ? 'active' : ''}`}>
                      <p className="text-sm text-gray-300 py-4">
                        This tab is under development for {project.name}.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="project-header w-full" onClick={() => toggleProject(project.id)}>
                  <div className="project-title-area">
                    <div className={`status-indicator ${project.isWorking ? 'active' : 'inactive'}`}></div>
                    <span className="font-semibold text-white">{project.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-[rgba(1,249,198,0.1)] px-2 py-1 rounded text-xs">
                      <span className="text-primary">{project.progress}%</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              )}
            </div>
          ))
        }
      </div>
      
      {/* Add Project Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px] bg-[rgba(5,10,15,0.95)] border border-[rgba(1,249,198,0.25)]">
          <DialogHeader>
            <DialogTitle className="titan-green">Create New Findom Project</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-300 mt-4">
            Project creation form will be added here.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}