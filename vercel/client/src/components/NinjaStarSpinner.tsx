import React from 'react';

interface NinjaStarSpinnerProps {
  size?: string;
  color?: string;
}

export function NinjaStarSpinner({ size = "1.5rem", color = "currentColor" }: NinjaStarSpinnerProps) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={color}
        width={size}
        height={size}
      >
        {/* Ninja star shape */}
        <path d="M12,0 L15,9 L24,12 L15,15 L12,24 L9,15 L0,12 L9,9 Z" />
      </svg>
    </div>
  );
}