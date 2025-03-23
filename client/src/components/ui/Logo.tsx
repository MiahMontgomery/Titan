export function Logo() {
  return (
    <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center overflow-hidden">
      <svg className="w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        {/* Pointy slanted ninja star with 8 points */}
        <path d="M12,2L5,7L2,12L5,17L12,22L19,17L22,12L19,7L12,2Z" fill="currentColor" transform="rotate(22.5, 12, 12)" />
        <path d="M12,4L6,9L4,12L6,15L12,20L18,15L20,12L18,9L12,4Z" fill="black" opacity="0.3" transform="rotate(22.5, 12, 12)" />
        <path d="M3,12L12,9L21,12L12,15L3,12Z" fill="currentColor" transform="rotate(22.5, 12, 12)" />
        <path d="M12,3L9,12L12,21L15,12L12,3Z" fill="currentColor" transform="rotate(22.5, 12, 12)" />
        <circle cx="12" cy="12" r="2" fill="black" stroke="none" />
        <circle cx="12" cy="12" r="1" fill="white" stroke="none" />
      </svg>
    </div>
  );
}
