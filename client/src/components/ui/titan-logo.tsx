import React from "react";

interface TitanLogoProps {
  size?: number;
  spinning?: boolean;
  className?: string;
}

interface TitanLogoWithTextProps {
  size?: number;
  className?: string;
}

// The TitanLogo component is a stylized "T" in a hexagon
export function TitanLogo({ size = 24, spinning = false, className = "" }: TitanLogoProps) {
  const spin = spinning ? "animate-spin" : "";
  return (
    <div 
      className={`relative flex items-center justify-center ${spin} ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 titan-logo-shape">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M50 0L93.3 25V75L50 100L6.7 75V25L50 0Z" 
            className="fill-primary"
          />
          <path 
            d="M40 30H60V40H55V70H45V40H40V30Z" 
            fill="currentColor" 
            className="text-primary-foreground"
          />
        </svg>
      </div>
    </div>
  );
}

// The TitanLogoWithText component adds the "TITAN" text to the right of the logo
export function TitanLogoWithText({ size = 24, className = "" }: TitanLogoWithTextProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <TitanLogo size={size} />
      <div 
        className="ml-2 font-bold tracking-wide text-foreground"
        style={{ fontSize: Math.round(size * 0.8) }}
      >
        TITAN
      </div>
    </div>
  );
}