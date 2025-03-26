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
        {/* Ninja Star - Basic 4-pointed star shape based on reference image */}
        <g className="text-accent">
          {/* Top triangle */}
          <path
            d="M12 2L16 12L12 12L12 2Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Right triangle */}
          <path
            d="M22 12L12 16L12 12L22 12Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Bottom triangle */}
          <path
            d="M12 22L8 12L12 12L12 22Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Left triangle */}
          <path
            d="M2 12L12 8L12 12L2 12Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Center square */}
          <path
            d="M10 10L14 10L14 14L10 14Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="0.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Fold lines */}
          <path
            d="M12 2L12 22"
            stroke="white"
            strokeWidth="0.25"
            strokeOpacity="0.5"
            strokeLinecap="round"
          />
          <path
            d="M2 12L22 12"
            stroke="white"
            strokeWidth="0.25"
            strokeOpacity="0.5"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}