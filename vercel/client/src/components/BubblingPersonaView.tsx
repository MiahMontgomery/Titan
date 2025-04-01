import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Persona } from '@/lib/types';
import { SafeImage } from '@/components/ui/safe-image';

interface BubblingPersonaViewProps {
  personas: Persona[];
  isLoading?: boolean;
}

interface BubblePosition {
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  size: number;
}

export function BubblingPersonaView({ personas, isLoading = false }: BubblingPersonaViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<Record<string, BubblePosition>>({});
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [, setLocation] = useLocation();
  const animationFrameRef = useRef<number>();

  // Initialize positions
  useEffect(() => {
    if (personas.length > 0 && containerRef.current) {
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      setContainerSize({ width, height });

      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.35;

      // Initialize positions in a circle around the center
      const newPositions: Record<string, BubblePosition> = {};
      
      personas.forEach((persona, index) => {
        const angle = (index / personas.length) * 2 * Math.PI;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        // Size based on persona importance
        const size = 80 + Math.random() * 40;
        
        // Random speeds (but not too fast)
        const speedX = (Math.random() - 0.5) * 1.2;
        const speedY = (Math.random() - 0.5) * 1.2;
        
        newPositions[persona.id] = { x, y, speedX, speedY, size };
      });
      
      setPositions(newPositions);
    }
  }, [personas, containerRef.current?.clientWidth, containerRef.current?.clientHeight]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      // Update positions using spring physics
      setPositions(prevPositions => {
        const newPositions = { ...prevPositions };
        
        // First update positions
        Object.keys(newPositions).forEach(id => {
          const pos = newPositions[id];
          
          // Apply velocity with damping
          pos.x += pos.speedX;
          pos.y += pos.speedY;
          
          // Add random movement
          pos.speedX += (Math.random() - 0.5) * 0.2;
          pos.speedY += (Math.random() - 0.5) * 0.2;
          
          // Apply drag (damping)
          pos.speedX *= 0.98;
          pos.speedY *= 0.98;
          
          // Bounds checking - bounce off walls
          if (pos.x < pos.size / 2) {
            pos.x = pos.size / 2;
            pos.speedX = Math.abs(pos.speedX) * 0.8;
          } else if (pos.x > width - pos.size / 2) {
            pos.x = width - pos.size / 2;
            pos.speedX = -Math.abs(pos.speedX) * 0.8;
          }
          
          if (pos.y < pos.size / 2) {
            pos.y = pos.size / 2;
            pos.speedY = Math.abs(pos.speedY) * 0.8;
          } else if (pos.y > height - pos.size / 2) {
            pos.y = height - pos.size / 2;
            pos.speedY = -Math.abs(pos.speedY) * 0.8;
          }
        });
        
        // Then apply bubble collision resolution
        const ids = Object.keys(newPositions);
        for (let i = 0; i < ids.length; i++) {
          for (let j = i + 1; j < ids.length; j++) {
            const idA = ids[i];
            const idB = ids[j];
            const bubbleA = newPositions[idA];
            const bubbleB = newPositions[idB];
            
            // Calculate distance between bubbles
            const dx = bubbleB.x - bubbleA.x;
            const dy = bubbleB.y - bubbleA.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = (bubbleA.size + bubbleB.size) / 2;
            
            // If bubbles are overlapping
            if (distance < minDistance) {
              // Calculate normal vector
              const nx = dx / distance;
              const ny = dy / distance;
              
              // Calculate penetration depth
              const penetrationDepth = minDistance - distance;
              
              // Apply position correction (move bubbles apart)
              const correction = penetrationDepth * 0.5;
              bubbleA.x -= nx * correction;
              bubbleA.y -= ny * correction;
              bubbleB.x += nx * correction;
              bubbleB.y += ny * correction;
              
              // Apply collision impulse (bouncing effect)
              const impulse = 0.1;
              bubbleA.speedX -= nx * impulse;
              bubbleA.speedY -= ny * impulse;
              bubbleB.speedX += nx * impulse;
              bubbleB.speedY += ny * impulse;
            }
          }
        }
        
        return newPositions;
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Update container size on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-400"></div>
      </div>
    );
  }

  if (personas.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
        <h3 className="text-xl font-medium mb-2">No Personas Found</h3>
        <p className="text-gray-400 mb-4">There are no personas in this project yet.</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative bg-gray-900 overflow-hidden"
    >
      {/* Central bubble/node */}
      <div 
        className="absolute bg-gradient-to-r from-green-700 to-green-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,255,0,0.4)] border-2 border-green-400"
        style={{
          width: '100px',
          height: '100px',
          left: `${containerSize.width / 2}px`,
          top: `${containerSize.height / 2}px`,
          transform: 'translate(-50%, -50%)',
          zIndex: 10
        }}
      >
        <span className="text-white text-2xl font-bold">FINDOM</span>
      </div>
      
      {/* Connection lines to central node */}
      {personas.map((persona) => {
        const position = positions[persona.id];
        if (!position) return null;
        
        return (
          <div 
            key={`line-${persona.id}`}
            className="absolute bg-gradient-to-r from-green-400/20 to-green-300/10 pointer-events-none"
            style={{
              left: `${containerSize.width / 2}px`,
              top: `${containerSize.height / 2}px`,
              width: `${Math.sqrt(
                Math.pow(position.x - containerSize.width / 2, 2) + 
                Math.pow(position.y - containerSize.height / 2, 2)
              )}px`,
              height: '2px',
              transformOrigin: '0 0',
              transform: `rotate(${Math.atan2(
                position.y - containerSize.height / 2,
                position.x - containerSize.width / 2
              )}rad)`,
              opacity: 0.4,
              zIndex: 5
            }}
          />
        );
      })}
      
      {/* Persona bubbles */}
      {personas.map((persona) => {
        const position = positions[persona.id];
        if (!position) return null;
        
        return (
          <div
            key={persona.id}
            className="absolute cursor-pointer transition-transform duration-150 hover:scale-110"
            onClick={() => setLocation(`/personas/${persona.id}`)}
            style={{
              width: `${position.size}px`,
              height: `${position.size}px`,
              left: `${position.x}px`,
              top: `${position.y}px`,
              transform: 'translate(-50%, -50%)',
              zIndex: 20
            }}
          >
            <div className="relative w-full h-full">
              {/* Outer circle - glowing ring */}
              <div 
                className="absolute inset-0 rounded-full animate-pulse" 
                style={{ 
                  background: `radial-gradient(circle, ${persona.isActive ? 'rgba(74, 222, 128, 0.3)' : 'rgba(200, 200, 200, 0.2)'} 0%, rgba(0, 0, 0, 0) 70%)`,
                  transform: 'scale(1.2)',
                  opacity: 0.6,
                  filter: 'blur(8px)'
                }}
              />
              
              {/* Main circle with persona image/emoji */}
              <div 
                className={`absolute inset-0 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border-2 ${
                  persona.isActive ? 'border-green-400' : 'border-gray-600'
                }`}
              >
                <SafeImage
                  src={persona.imageUrl || ''}
                  alt={persona.displayName || persona.name}
                  className="w-full h-full object-cover"
                  fallback={
                    <div className="w-full h-full flex items-center justify-center bg-gray-700 text-4xl">
                      {persona.emoji || '🧠'}
                    </div>
                  }
                />
              </div>
              
              {/* Persona name label */}
              <div 
                className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 px-2 py-1 rounded whitespace-nowrap text-xs font-medium border border-gray-700"
              >
                {persona.displayName || persona.name}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}