'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Compass, ZoomIn, ZoomOut } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useAppStore } from '../../stores/appStore';

interface CornerButtonProps {
  icon?: React.ComponentType<{ className?: string }>;
  label?: string;
  tooltip: string;
  onClick: () => void;
  colorClass?: string;
  badge?: React.ReactNode;
}

function CornerButton({
  icon: Icon,
  label,
  tooltip,
  onClick,
  colorClass,
  badge,
}: CornerButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const accentColor = useAppStore((s) => s.accentColor);

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={tooltip}
        className={twMerge(
          'h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-150 select-none',
          label ? 'px-2.5 min-w-[3.25rem]' : 'w-9',
          'text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white',
          'hover:bg-white/20 dark:hover:bg-white/15 active:scale-95',
          colorClass
        )}
        style={{
          boxShadow: isHovered && accentColor ? `0 0 12px ${accentColor}40` : undefined,
        }}
      >
        {Icon && <Icon className="w-4 h-4 transition-transform" />}
        {label && <span className="text-[11px] font-bold font-mono tracking-tight">{label}</span>}
        {badge}
      </button>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.94 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 text-[11px] font-medium text-white bg-slate-900/90 dark:bg-black/90 rounded-md shadow-2xl border border-white/10 whitespace-nowrap pointer-events-none select-none z-50 backdrop-blur-md"
          >
            {tooltip}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export interface CanvasLeftControlsProps {
  onCleanUpCanvas?: () => void;
  onBackToCenter?: () => void;
  className?: string;
}

export function CanvasLeftControls({
  onCleanUpCanvas,
  onBackToCenter,
  className,
}: CanvasLeftControlsProps) {
  const theme = useAppStore((s) => s.theme);
  const isLight =
    theme === 'light' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      !window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (!onCleanUpCanvas && !onBackToCenter) return null;

  return (
    <div
      className={twMerge(
        'fixed bottom-20 left-4 md:bottom-7 md:left-7 z-40 pointer-events-auto',
        className
      )}
    >
      <div
        className="flex items-center gap-1 p-1.5 rounded-2xl backdrop-blur-2xl transition-all shadow-xl select-none"
        style={{
          background: isLight ? 'rgba(255, 255, 255, 0.82)' : 'rgba(28, 32, 45, 0.76)',
          border: isLight ? '1px solid rgba(0, 0, 0, 0.09)' : '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: isLight
            ? '0 12px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
            : '0 20px 48px rgba(0, 0, 0, 0.40), inset 0 1px 0 rgba(255, 255, 255, 0.20)',
        }}
      >
        {onCleanUpCanvas && (
          <CornerButton
            icon={LayoutGrid}
            tooltip="Clean Up Canvas (Ctrl+Shift+C)"
            colorClass="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500"
            onClick={onCleanUpCanvas}
          />
        )}

        {onCleanUpCanvas && onBackToCenter && (
          <div className="w-[1px] h-5 bg-slate-300/60 dark:bg-white/15 mx-0.5" />
        )}

        {onBackToCenter && (
          <CornerButton
            icon={Compass}
            tooltip="Back to Center (0, 0)"
            colorClass="text-cyan-600 dark:text-cyan-400 hover:text-cyan-300"
            onClick={onBackToCenter}
          />
        )}
      </div>
    </div>
  );
}

export interface CanvasZoomControlsProps {
  zoomLevel?: number;
  onResetZoom?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  className?: string;
}

export function CanvasZoomControls({
  zoomLevel = 100,
  onResetZoom,
  onZoomIn,
  onZoomOut,
  className,
}: CanvasZoomControlsProps) {
  const theme = useAppStore((s) => s.theme);
  const isLight =
    theme === 'light' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      !window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div
      className={twMerge(
        'fixed bottom-20 right-4 md:bottom-7 md:right-7 z-40 pointer-events-auto',
        className
      )}
    >
      <div
        className="flex items-center gap-1 p-1.5 rounded-2xl backdrop-blur-2xl transition-all shadow-xl select-none"
        style={{
          background: isLight ? 'rgba(255, 255, 255, 0.82)' : 'rgba(28, 32, 45, 0.76)',
          border: isLight ? '1px solid rgba(0, 0, 0, 0.09)' : '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: isLight
            ? '0 12px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
            : '0 20px 48px rgba(0, 0, 0, 0.40), inset 0 1px 0 rgba(255, 255, 255, 0.20)',
        }}
      >
        {onZoomOut && (
          <CornerButton
            icon={ZoomOut}
            tooltip="Zoom Out (Ctrl -)"
            onClick={onZoomOut}
          />
        )}

        {onResetZoom && (
          <CornerButton
            label={`${zoomLevel}%`}
            tooltip={`Zoom: ${zoomLevel}% (Click to Reset 100%)`}
            onClick={onResetZoom}
          />
        )}

        {onZoomIn && (
          <CornerButton
            icon={ZoomIn}
            tooltip="Zoom In (Ctrl +)"
            onClick={onZoomIn}
          />
        )}
      </div>
    </div>
  );
}
