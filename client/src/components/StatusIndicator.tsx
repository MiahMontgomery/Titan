interface StatusIndicatorProps {
  isWorking: boolean;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function StatusIndicator({ isWorking, showLabel = false, size = "md" }: StatusIndicatorProps) {
  const sizeClass = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  
  return (
    <div className="flex items-center">
      <span 
        className={`${sizeClass} ${isWorking ? "bg-accent" : "bg-gray-900"} rounded-full flex items-center justify-center mr-2`} 
        title={isWorking ? "Working" : "Not Working"}
      >
        {isWorking ? (
          <span className="h-2 w-2 rounded-full bg-green-400"></span>
        ) : (
          <span className="h-2 w-2 rounded-full bg-gray-600"></span>
        )}
      </span>
      {showLabel && (
        <span className="text-sm text-gray-300">{isWorking ? "Working" : "Not Working"}</span>
      )}
    </div>
  );
}
