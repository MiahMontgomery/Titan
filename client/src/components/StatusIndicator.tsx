import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  isWorking: boolean;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function StatusIndicator({ isWorking, showLabel = false, size = "md" }: StatusIndicatorProps) {
  return (
    <div className="flex items-center">
      <div 
        className={cn(
          "relative flex-shrink-0 rounded-full",
          {
            "bg-green-500": isWorking,
            "bg-gray-500": !isWorking,
            "w-2 h-2": size === "sm",
            "w-3 h-3": size === "md"
          }
        )}
      >
        {isWorking && (
          <span className="absolute inset-0 rounded-full animate-ping bg-green-400 opacity-75"></span>
        )}
      </div>
      
      {showLabel && (
        <span className={cn(
          "ml-2 text-sm", 
          { 
            "text-green-500": isWorking,
            "text-gray-500": !isWorking,
          }
        )}>
          {isWorking ? "System Active" : "System Idle"}
        </span>
      )}
    </div>
  );
}