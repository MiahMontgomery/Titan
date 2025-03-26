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
        {/* Ninja Star - Basic Shape */}
        <path
          d="M12 2L6 12L12 22L18 12L12 2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-accent"
        />
        {/* Horizontal Line */}
        <path
          d="M3 12L21 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-accent"
        />
        {/* Vertical Line */}
        <path
          d="M12 3L12 21"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-accent"
        />
        {/* Center Circle */}
        <circle
          cx="12"
          cy="12"
          r="2"
          fill="currentColor"
          className="text-accent"
        />
      </svg>
    </div>
  );
}