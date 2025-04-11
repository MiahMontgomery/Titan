import React from "react";
import { cn } from "@/lib/utils";

interface TitanLogoProps {
  className?: string;
  size?: number;
  spinning?: boolean;
}

export function TitanLogo({ className, size = 40, spinning = false }: TitanLogoProps) {
  return (
    <div 
      className={cn(
        "relative flex items-center justify-center",
        spinning && "animate-spin",
        className
      )}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Ring */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="#01F9C6"
          strokeWidth="2"
          className={cn(
            "opacity-80",
            spinning && "animate-pulse"
          )}
        />
        
        {/* Inner Lines/Pattern */}
        <path
          d="M50 5 L50 95"
          stroke="#01F9C6"
          strokeWidth="2"
          className="opacity-70"
        />
        <path
          d="M5 50 L95 50"
          stroke="#01F9C6"
          strokeWidth="2"
          className="opacity-70"
        />
        
        {/* Central Element */}
        <circle
          cx="50"
          cy="50"
          r="15"
          fill="#01F9C6"
          className="opacity-90"
        />
        
        {/* Diagonal Lines */}
        <path
          d="M25 25 L75 75"
          stroke="#01F9C6"
          strokeWidth="2"
          className="opacity-70"
        />
        <path
          d="M75 25 L25 75"
          stroke="#01F9C6"
          strokeWidth="2"
          className="opacity-70"
        />
      </svg>
    </div>
  );
}

export function TitanLogoWithText({ className, size = 40, spinning = false }: TitanLogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <TitanLogo size={size} spinning={spinning} />
      <span className="ml-2 text-xl font-bold text-white">Titan</span>
    </div>
  );
}