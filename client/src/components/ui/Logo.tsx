export function Logo() {
  return (
    <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center overflow-hidden">
      <svg className="w-6 h-6 text-accent" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12,2L1,12L12,22L23,12L12,2M12,6.5L16,12L12,17.5L8,12L12,6.5M12,11.3L10.7,12L12,12.7L13.3,12L12,11.3Z" />
      </svg>
    </div>
  );
}
