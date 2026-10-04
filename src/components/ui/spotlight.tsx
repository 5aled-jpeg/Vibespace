'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  motion,
  useSpring,
  useTransform,
  useMotionValue,
  type SpringOptions,
} from 'framer-motion';
import { clsx } from 'clsx';

export interface SpotlightProps {
  className?: string;
  size?: number;
  springOptions?: SpringOptions;
}

export function Spotlight({
  className = 'from-white/40 via-white/15 to-transparent blur-2xl',
  size = 220,
  springOptions = {
    stiffness: 180,
    damping: 20,
    mass: 0.2,
  },
}: SpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(-size);
  const mouseY = useMotionValue(-size);

  const smoothX = useSpring(mouseX, springOptions);
  const smoothY = useSpring(mouseY, springOptions);

  useEffect(() => {
    const parent = containerRef.current?.parentElement;
    if (!parent) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      mouseX.set(x);
      mouseY.set(y);
      setIsHovered(true);
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
    };

    parent.addEventListener('mousemove', handleMouseMove);
    parent.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      parent.removeEventListener('mousemove', handleMouseMove);
      parent.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [size, mouseX, mouseY]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] z-20"
    >
      <motion.div
        style={{
          x: smoothX,
          y: smoothY,
          width: size,
          height: size,
          opacity: isHovered ? 1 : 0,
        }}
        className={clsx(
          'absolute rounded-full bg-radial transition-opacity duration-300',
          className
        )}
      />
    </div>
  );
}

export default Spotlight;
