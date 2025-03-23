export function Logo() {
  return (
    <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center overflow-hidden">
      <svg className="w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12,2L4,12L12,22L20,12L12,2Z" fill="currentColor" />
        <path d="M12,7L2,12L12,17L22,12L12,7Z" fill="currentColor" />
        <path d="M12,2L12,22M2,12L22,12" strokeLinecap="round" />
        <circle cx="12" cy="12" r="3" fill="black" stroke="none" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    </div>
  );
}
