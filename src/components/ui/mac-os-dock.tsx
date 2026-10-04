'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

// Types for the component
export interface DockApp {
  id: string;
  name: string;
  icon: string;
}

export interface MacOSDockProps {
  apps: DockApp[];
  onAppClick: (appId: string) => void;
  openApps?: string[];
  className?: string;
}

export const MacOSDock: React.FC<MacOSDockProps> = ({ 
  apps, 
  onAppClick, 
  openApps = [],
  className = ''
}) => {
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [currentScales, setCurrentScales] = useState<number[]>(apps.map(() => 1));
  const [currentPositions, setCurrentPositions] = useState<number[]>([]);
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastMouseMoveTime = useRef<number>(0);

  // Responsive size calculations based on viewport
  const getResponsiveConfig = useCallback(() => {
    if (typeof window === 'undefined') {
      return { baseIconSize: 52, maxScale: 1.6, effectWidth: 240 };
    }

    const smallerDimension = Math.min(window.innerWidth, window.innerHeight);
    
    if (smallerDimension < 480) {
      return {
        baseIconSize: Math.max(38, smallerDimension * 0.08),
        maxScale: 1.4,
        effectWidth: smallerDimension * 0.4
      };
    } else if (smallerDimension < 768) {
      return {
        baseIconSize: Math.max(44, smallerDimension * 0.07),
        maxScale: 1.5,
        effectWidth: smallerDimension * 0.35
      };
    } else if (smallerDimension < 1024) {
      return {
        baseIconSize: Math.max(48, smallerDimension * 0.06),
        maxScale: 1.6,
        effectWidth: smallerDimension * 0.3
      };
    } else {
      return {
        baseIconSize: Math.max(52, Math.min(68, smallerDimension * 0.05)),
        maxScale: 1.7,
        effectWidth: 260
      };
    }
  }, []);

  const [config, setConfig] = useState(getResponsiveConfig);
  const { baseIconSize, maxScale, effectWidth } = config;
  const minScale = 1.0;
  const baseSpacing = Math.max(6, baseIconSize * 0.1);

  // Update config on window resize
  useEffect(() => {
    const handleResize = () => {
      setConfig(getResponsiveConfig());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getResponsiveConfig]);

  // Authentic macOS cosine-based magnification algorithm
  const calculateTargetMagnification = useCallback((mousePosition: number | null) => {
    if (mousePosition === null) {
      return apps.map(() => minScale);
    }

    return apps.map((_, index) => {
      const normalIconCenter = (index * (baseIconSize + baseSpacing)) + (baseIconSize / 2);
      const minX = mousePosition - (effectWidth / 2);
      const maxX = mousePosition + (effectWidth / 2);
      
      if (normalIconCenter < minX || normalIconCenter > maxX) {
        return minScale;
      }
      
      const theta = ((normalIconCenter - minX) / effectWidth) * 2 * Math.PI;
      const cappedTheta = Math.min(Math.max(theta, 0), 2 * Math.PI);
      const scaleFactor = (1 - Math.cos(cappedTheta)) / 2;
      
      return minScale + (scaleFactor * (maxScale - minScale));
    });
  }, [apps, baseIconSize, baseSpacing, effectWidth, maxScale, minScale]);

  // Calculate positions based on current scales
  const calculatePositions = useCallback((scales: number[]) => {
    let currentX = 0;
    
    return scales.map((scale) => {
      const scaledWidth = baseIconSize * scale;
      const centerX = currentX + (scaledWidth / 2);
      currentX += scaledWidth + baseSpacing;
      return centerX;
    });
  }, [baseIconSize, baseSpacing]);

  // Initialize positions
  useEffect(() => {
    const initialScales = apps.map(() => minScale);
    const initialPositions = calculatePositions(initialScales);
    setCurrentScales(initialScales);
    setCurrentPositions(initialPositions);
  }, [apps, calculatePositions, minScale, config]);

  // Animation loop
  const animateToTarget = useCallback(() => {
    const targetScales = calculateTargetMagnification(mouseX);
    const targetPositions = calculatePositions(targetScales);
    const lerpFactor = mouseX !== null ? 0.22 : 0.14;

    setCurrentScales(prevScales => {
      return prevScales.map((currentScale, index) => {
        const diff = targetScales[index] - currentScale;
        return currentScale + (diff * lerpFactor);
      });
    });

    setCurrentPositions(prevPositions => {
      return prevPositions.map((currentPos, index) => {
        const diff = targetPositions[index] - currentPos;
        return currentPos + (diff * lerpFactor);
      });
    });

    const scalesNeedUpdate = currentScales.some((scale, index) => 
      Math.abs(scale - targetScales[index]) > 0.002
    );
    const positionsNeedUpdate = currentPositions.some((pos, index) => 
      Math.abs(pos - targetPositions[index]) > 0.1
    );
    
    if (scalesNeedUpdate || positionsNeedUpdate || mouseX !== null) {
      animationFrameRef.current = requestAnimationFrame(animateToTarget);
    }
  }, [mouseX, calculateTargetMagnification, calculatePositions, currentScales, currentPositions]);

  // Start/stop animation loop
  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(animateToTarget);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animateToTarget]);

  // Throttled mouse movement handler
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const now = performance.now();
    
    if (now - lastMouseMoveTime.current < 14) {
      return;
    }
    
    lastMouseMoveTime.current = now;
    
    if (dockRef.current) {
      const rect = dockRef.current.getBoundingClientRect();
      const pad = Math.max(8, baseIconSize * 0.14);
      setMouseX(e.clientX - rect.left - pad);
    }
  }, [baseIconSize]);

  const handleMouseLeave = useCallback(() => {
    setMouseX(null);
    setHoveredApp(null);
  }, []);

  const createBounceAnimation = (element: HTMLElement) => {
    const bounceHeight = Math.max(-14, -baseIconSize * 0.22);
    element.style.transition = 'transform 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    element.style.transform = `translateY(${bounceHeight}px)`;
    
    setTimeout(() => {
      element.style.transform = 'translateY(0px)';
    }, 180);
  };

  const handleAppClick = (appId: string, index: number) => {
    if (iconRefs.current[index]) {
      createBounceAnimation(iconRefs.current[index]!);
    }
    onAppClick(appId);
  };

  // Calculate content width
  const contentWidth = currentPositions.length > 0 
    ? Math.max(...currentPositions.map((pos, index) => 
        pos + (baseIconSize * currentScales[index]) / 2
      ))
    : (apps.length * (baseIconSize + baseSpacing)) - baseSpacing;

  const padding = Math.max(8, baseIconSize * 0.14);

  return (
    <div 
      ref={dockRef}
      className={`relative select-none backdrop-blur-2xl transition-shadow ${className}`}
      style={{
        width: `${contentWidth + padding * 2}px`,
        background: 'rgba(28, 32, 45, 0.72)',
        borderRadius: `${Math.max(16, baseIconSize * 0.45)}px`,
        border: '1px solid rgba(255, 255, 255, 0.14)',
        boxShadow: `
          0 ${Math.max(6, baseIconSize * 0.12)}px ${Math.max(20, baseIconSize * 0.5)}px rgba(0, 0, 0, 0.45),
          0 ${Math.max(2, baseIconSize * 0.05)}px ${Math.max(8, baseIconSize * 0.2)}px rgba(0, 0, 0, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.2),
          inset 0 -1px 0 rgba(0, 0, 0, 0.2)
        `,
        padding: `${padding}px`
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        className="relative"
        style={{
          height: `${baseIconSize}px`,
          width: '100%'
        }}
      >
        {apps.map((app, index) => {
          const scale = currentScales[index] || 1;
          const position = currentPositions[index] || 0;
          const scaledSize = baseIconSize * scale;
          const isHovered = hoveredApp === app.id;
          
          return (
            <div
              key={app.id}
              ref={(el) => { iconRefs.current[index] = el; }}
              className="absolute cursor-pointer flex flex-col items-center justify-end"
              onMouseEnter={() => setHoveredApp(app.id)}
              onMouseLeave={() => setHoveredApp(null)}
              onClick={() => handleAppClick(app.id, index)}
              style={{
                left: `${position - scaledSize / 2}px`,
                bottom: '0px',
                width: `${scaledSize}px`,
                height: `${scaledSize}px`,
                transformOrigin: 'bottom center',
                zIndex: Math.round(scale * 10)
              }}
            >
              {/* macOS Tooltip Pill */}
              {isHovered && (
                <div
                  className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-2.5 py-1 text-xs font-medium text-white bg-slate-900/90 dark:bg-black/90 rounded-md shadow-xl border border-white/10 whitespace-nowrap pointer-events-none z-50"
                  style={{ transformOrigin: 'bottom center' }}
                >
                  {app.name}
                </div>
              )}

              <img
                src={app.icon}
                alt={app.name}
                width={scaledSize}
                height={scaledSize}
                className="object-contain pointer-events-none select-none"
                style={{
                  filter: `drop-shadow(0 ${scale > 1.2 ? Math.max(2, baseIconSize * 0.05) : Math.max(1, baseIconSize * 0.03)}px ${scale > 1.2 ? Math.max(4, baseIconSize * 0.1) : Math.max(2, baseIconSize * 0.06)}px rgba(0,0,0,${0.25 + (scale - 1) * 0.15}))`
                }}
              />
              
              {/* macOS App Indicator Dot */}
              {openApps.includes(app.id) && (
                <div 
                  className="absolute"
                  style={{
                    bottom: `${Math.max(-4, -baseIconSize * 0.07)}px`,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: `${Math.max(4, baseIconSize * 0.07)}px`,
                    height: `${Math.max(4, baseIconSize * 0.07)}px`,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 0 5px rgba(255, 255, 255, 0.8), 0 0 2px rgba(0, 0, 0, 0.4)',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MacOSDock;

export const sampleApps: DockApp[] = [
  { id: 'finder', name: 'Finder', icon: 'https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_128x128.png' },
  { id: 'safari', name: 'Safari', icon: 'https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_128x128.png' },
];

export const DockDemo: React.FC = () => {
  const [openApps, setOpenApps] = useState<string[]>(['finder', 'safari']);

  const handleAppClick = (appId: string) => {
    setOpenApps(prev => 
      prev.includes(appId) 
        ? prev.filter(id => id !== appId)
        : [...prev, appId]
    );
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center overflow-hidden">
      <MacOSDock
        apps={sampleApps}
        onAppClick={handleAppClick}
        openApps={openApps}
      />
    </div>
  );
};
