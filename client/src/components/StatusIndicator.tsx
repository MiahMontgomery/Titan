interface StatusIndicatorProps {
  isActive: boolean;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function StatusIndicator({ isActive, showLabel = false, size = "md" }: StatusIndicatorProps) {
  const sizeClass = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  
  return (
    <div className="flex items-center">
      <span 
        className={`${sizeClass} ${isActive ? "bg-accent" : "bg-gray-900"} rounded-full flex items-center justify-center mr-2`} 
        title={isActive ? "Active" : "Inactive"}
      >
        {isActive ? (
          <svg className="h-3 w-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
          </svg>
        ) : (
          <svg className="h-3 w-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        )}
      </span>
      {showLabel && (
        <span className="text-sm text-gray-300">{isActive ? "Active" : "Inactive"}</span>
      )}
    </div>
  );
}
