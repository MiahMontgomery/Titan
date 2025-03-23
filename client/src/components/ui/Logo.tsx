export function Logo() {
  return (
    <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center overflow-hidden">
      <svg className="w-7 h-7 text-accent" viewBox="0 0 24 24" fill="none">
        {/* Ninja star with curved edges like reference image */}
        <path 
          d="M12,2 C11,2 10,6 4,10 C2,11 3,14 5,15 C7,16 10,14 12,22 C14,14 17,16 19,15 C21,14 22,11 20,10 C14,6 13,2 12,2 Z" 
          fill="currentColor" 
        />
        
        {/* Inner lines */}
        <path 
          d="M11,3 C10.5,8 8,11 4.5,12 M13,3 C13.5,8 16,11 19.5,12 M12,4 C12,10 12,18 12,20" 
          stroke="white" 
          strokeWidth="0.5" 
          opacity="0.7" 
        />
        
        {/* Center hole */}
        <circle cx="12" cy="12" r="1.8" fill="none" stroke="white" strokeWidth="0.6" />
      </svg>
    </div>
  );
}
