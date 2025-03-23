export function Logo() {
  return (
    <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center overflow-hidden">
      <svg className="w-6 h-6 text-accent" viewBox="0 0 24 24" fill="currentColor">
        {/* 4-point ninja star with slightly curved edges */}
        <path d="M12,2 Q11,5 8,8 Q5,11 2,12 Q5,13 8,16 Q11,19 12,22 Q13,19 16,16 Q19,13 22,12 Q19,11 16,8 Q13,5 12,2 Z" />
        
        {/* Center hole */}
        <circle cx="12" cy="12" r="1.8" fill="white" />
      </svg>
    </div>
  );
}
