import { 
  FolderIcon, 
  BotIcon, 
  BarChart3Icon, 
  CheckCircleIcon 
} from "lucide-react";
import { Stats } from "@shared/types";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor: string;
  iconBgColor: string;
  badge?: {
    text: string;
    color: string;
  };
}

const StatCard = ({ title, value, icon, iconColor, iconBgColor, badge }: StatCardProps) => {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted">{title}</span>
        <div className={`w-8 h-8 rounded-md ${iconBgColor} flex items-center justify-center ${iconColor}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline">
        <span className="text-2xl font-semibold text-white">{value}</span>
        {badge && (
          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-md ${badge.color}`}>
            {badge.text}
          </span>
        )}
      </div>
    </div>
  );
};

interface StatGridProps {
  stats: Stats;
}

const StatGrid = ({ stats }: StatGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Active Projects"
        value={stats.activeProjects}
        icon={<FolderIcon className="h-4 w-4" />}
        iconColor="text-primary"
        iconBgColor="bg-primary/10"
        badge={{
          text: "+2 new",
          color: "bg-green-500/10 text-green-500"
        }}
      />
      
      <StatCard
        title="Active Agents"
        value={stats.activeAgents}
        icon={<BotIcon className="h-4 w-4" />}
        iconColor="text-blue-500"
        iconBgColor="bg-blue-500/10"
        badge={{
          text: "1 idle",
          color: "bg-yellow-500/10 text-yellow-500"
        }}
      />
      
      <StatCard
        title="API Usage"
        value={`${stats.apiUsage}%`}
        icon={<BarChart3Icon className="h-4 w-4" />}
        iconColor="text-purple-500"
        iconBgColor="bg-purple-500/10"
        badge={{
          text: "of limit",
          color: "text-muted"
        }}
      />
      
      <StatCard
        title="Tasks Completed"
        value={stats.tasksCompleted}
        icon={<CheckCircleIcon className="h-4 w-4" />}
        iconColor="text-green-500"
        iconBgColor="bg-green-500/10"
        badge={{
          text: "+5 today",
          color: "bg-green-500/10 text-green-500"
        }}
      />
    </div>
  );
};

export default StatGrid;
