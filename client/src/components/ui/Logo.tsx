export function Logo() {
  return (
    <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center overflow-hidden">
      <svg className="w-6 h-6 text-accent" viewBox="0 0 24 24" fill="currentColor">
        {/* Simple ninja star with slightly curved edges */}
        <path d="M12,2 Q11.5,6 9.5,10 Q6,9.5 2,9 Q6,10.5 9,12 Q6,13.5 2,15 Q6,14.5 9.5,14 Q11.5,18 12,22 Q12.5,18 14.5,14 Q18,14.5 22,15 Q18,13.5 15,12 Q18,10.5 22,9 Q18,9.5 14.5,10 Q12.5,6 12,2 Z" />
        
        {/* Center hole */}
        <circle cx="12" cy="12" r="1.5" fill="white" />
      </svg>
    </div>
  );
}
