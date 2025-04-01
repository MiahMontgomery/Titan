import { useState, useEffect, useRef } from 'react';
import { Persona } from '@shared/schema';
import { BubblePersona } from './BubblePersona';

interface BubblingPersonaHomeProps {
  personas: Persona[];
  isLoading: boolean;
}

export const BubblingPersonaHome = ({ personas, isLoading }: BubblingPersonaHomeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [mainBubbleRadius, setMainBubbleRadius] = useState(0);
  const [animating, setAnimating] = useState(false);
  
  // Calculate the container size on mount and on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
        // Main bubble radius is 40% of the smaller dimension
        setMainBubbleRadius(Math.min(width, height) * 0.4);
      }
    };
    
    // Initial size calculation
    updateSize();
    
    // Re-calculate on window resize
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  // Start animation when everything is loaded
  useEffect(() => {
    if (containerSize.width > 0 && !isLoading) {
      setAnimating(true);
    }
  }, [containerSize, isLoading]);
  
  // Calculate positions for persona bubbles
  const getPositions = () => {
    if (!containerSize.width || personas.length === 0) return [];
    
    const centerX = containerSize.width / 2;
    const centerY = containerSize.height / 2;
    
    return personas.map((persona, index) => {
      // Calculate position in a circle around the main bubble
      const angle = (index / personas.length) * Math.PI * 2;
      const distance = mainBubbleRadius * 0.8; // Distance from center
      
      return {
        persona,
        size: 80, // Size of each persona bubble
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance
      };
    });
  };
  
  const bubblePositions = getPositions();
  
  return (
    <div 
      ref={containerRef} 
      className="w-full h-[calc(100vh-120px)] relative overflow-hidden bg-gray-950"
    >
      {/* Main glowing bubble */}
      {containerSize.width > 0 && (
        <div 
          className="absolute"
          style={{
            left: `${containerSize.width / 2}px`,
            top: `${containerSize.height / 2}px`,
            width: `${mainBubbleRadius * 2}px`,
            height: `${mainBubbleRadius * 2}px`,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(30,30,40,0.7) 0%, rgba(40,40,60,0.6) 70%, rgba(50,50,80,0.4) 100%)',
            boxShadow: '0 0 60px rgba(80, 255, 170, 0.3)',
            border: '3px solid rgba(100, 255, 180, 0.4)',
            transform: 'translate(-50%, -50%)',
            zIndex: 1,
            animation: animating ? 'pulse 10s infinite ease-in-out' : 'none'
          }}
        >
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: 'rgba(20, 20, 30, 0.5)',
              filter: 'blur(10px)',
              animation: animating ? 'rotate 60s linear infinite' : 'none'
            }}
          />
        </div>
      )}
      
      {/* Central text */}
      {containerSize.width > 0 && (
        <div 
          className="absolute flex flex-col items-center justify-center z-10 text-center"
          style={{
            left: `${containerSize.width / 2}px`,
            top: `${containerSize.height / 2}px`,
            width: `${mainBubbleRadius * 1.2}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <h2 className="text-3xl font-bold text-white mb-2">FINDOM</h2>
          <p className="text-green-300 text-sm">Select a persona to begin</p>
        </div>
      )}
      
      {/* Loading state */}
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <>
          {/* Persona bubbles */}
          {bubblePositions.map((bubbleProps, index) => (
            <BubblePersona 
              key={bubbleProps.persona.id}
              {...bubbleProps}
              mainBubbleRadius={mainBubbleRadius}
            />
          ))}
          
          {/* Empty state */}
          {personas.length === 0 && containerSize.width > 0 && (
            <div 
              className="absolute z-10 text-center bg-gray-800/70 rounded-lg p-4 shadow-lg"
              style={{
                left: `${containerSize.width / 2}px`,
                top: `${containerSize.height / 2 + mainBubbleRadius * 0.7}px`,
                transform: 'translate(-50%, -50%)',
                maxWidth: '80%'
              }}
            >
              <p className="text-gray-300 mb-2">No personas available</p>
              <p className="text-gray-400 text-sm">Create a persona to begin your journey</p>
            </div>
          )}
        </>
      )}
      
      {/* CSS animations */}
      <style>{`
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
          50% { transform: translate(-50%, -50%) scale(1.05); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
        }
        
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};