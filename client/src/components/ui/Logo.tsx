export function Logo() {
  return (
    <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center overflow-hidden">
      <svg className="w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        {/* Classic ninja star with 4 sharp points */}
        <path d="M12,2L7,12L12,22L17,12L12,2Z" fill="currentColor" />
        <path d="M2,12L12,7L22,12L12,17L2,12Z" fill="currentColor" />
        <circle cx="12" cy="12" r="2.5" fill="black" stroke="none" />
        <circle cx="12" cy="12" r="1.5" fill="white" stroke="none" />
      </svg>
    </div>
  );
}
