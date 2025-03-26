export function Logo() {
  return (
    <div className="flex items-center w-10 h-10 relative">
      <svg
        viewBox="0 0 24 24"
        width="40"
        height="40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2L2 12L12 22L22 12L12 2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-accent"
        />
        <path
          d="M12 6L6 12L12 18L18 12L12 6Z"
          fill="currentColor"
          className="text-accent"
        />
        <circle
          cx="12"
          cy="12"
          r="2"
          fill="currentColor"
          className="text-background"
        />
      </svg>
    </div>
  );
}