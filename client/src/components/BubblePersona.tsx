import { useState, useEffect, useRef } from 'react';
import { Persona } from '@shared/schema';
import { useLocation } from 'wouter';

interface BubblePersonaProps {
  persona: Persona;
  size: number;
  x: number;
  y: number;
  mainBubbleRadius: number;
}

export const BubblePersona = ({ persona, size, x, y, mainBubbleRadius }: BubblePersonaProps) => {
  const [position, setPosition] = useState({ x, y });
  const [oscillation, setOscillation] = useState(Math.random() * Math.PI * 2);
  const animationRef = useRef<number>();
  const [, setLocation] = useLocation();
  
  // Calculate angle between center and current position
  const angle = Math.atan2(position.y - mainBubbleRadius, position.x - mainBubbleRadius);
  
  // Handle click on bubble
  const handleClick = () => {
    setLocation(`/personas/${persona.id}`);
  };
  
  useEffect(() => {
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const deltaTime = elapsed / 1000;
      
      // Create gentle oscillating movement
      const newX = x + Math.sin(deltaTime + oscillation) * 10;
      const newY = y + Math.cos(deltaTime * 0.8 + oscillation) * 10;
      
      setPosition({ x: newX, y: newY });
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [x, y, oscillation]);
  
  return (
    <div 
      className="absolute cursor-pointer flex items-center justify-center text-center transition-transform hover:scale-110"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(60, 60, 70, 0.8)',
        border: '2px solid rgba(100, 255, 180, 0.6)',
        boxShadow: '0 0 15px rgba(100, 255, 180, 0.5)',
        zIndex: 2,
      }}
      onClick={handleClick}
    >
      <div className="flex flex-col items-center justify-center w-full h-full p-2">
        <div className="rounded-full bg-gray-700 w-10 h-10 flex items-center justify-center mb-1">
          {persona.imageUrl ? (
            <img 
              src={persona.imageUrl} 
              alt={persona.displayName} 
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <span className="text-lg">
              {persona.emoji || '🧠'}
            </span>
          )}
        </div>
        <span className="text-xs font-medium text-white truncate max-w-full">
          {persona.displayName || persona.name}
        </span>
      </div>
    </div>
  );
};