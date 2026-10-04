import React, { useState } from 'react';
import { Paintbrush, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BrushToolProps {
  isActive: boolean;
  onSelect: () => void;
  color?: string;
  size?: number;
  onColorChange?: (color: string) => void;
  onSizeChange?: (size: number) => void;
  className?: string;
  slotBefore?: React.ReactNode;
  slotAfter?: React.ReactNode;
}

const DEFAULT_COLORS = ['#58a6ff', '#bc8cff', '#3fb950', '#f85149', '#d29922', '#f0f6fc'];

export function BrushTool({
  isActive,
  onSelect,
  color = '#58a6ff',
  size = 4,
  onColorChange,
  onSizeChange,
  className,
  slotBefore,
  slotAfter,
}: BrushToolProps) {
  const [openSettings, setOpenSettings] = useState(false);

  return (
    <div className={twMerge('relative flex items-center', className)}>
      {slotBefore}
      <button
        type="button"
        title="Brush Tool (Highlighter / Marker) (B)"
        onClick={onSelect}
        className={clsx(
          'p-2.5 rounded-full transition-colors flex items-center gap-1.5 select-none cursor-pointer',
          isActive
            ? 'bg-blue-600/15 text-blue-600 border border-blue-600/30 shadow-sm'
            : 'text-slate-800 dark:text-slate-200 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
        )}
      >
        <Paintbrush className="w-4 h-4" />
        <span
          className="w-2.5 h-2.5 rounded-full border border-black/20 dark:border-white/20"
          style={{ backgroundColor: color }}
        />
      </button>

      {isActive && (
        <button
          type="button"
          onClick={() => setOpenSettings(!openSettings)}
          className="p-1 -ml-1 text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white rounded cursor-pointer"
          title="Brush Settings"
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      )}

      {openSettings && isActive && (
        <div className="absolute bottom-full left-0 mb-2 p-3 bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col gap-2.5 z-50 min-w-[170px] text-slate-900 dark:text-white">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Brush Color
          </div>
          <div className="flex items-center gap-1.5">
            {DEFAULT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={clsx(
                  'w-5 h-5 rounded-full border transition-transform cursor-pointer',
                  color === c ? 'scale-110 border-slate-900 dark:border-white shadow-sm' : 'border-slate-300 dark:border-slate-600 hover:scale-105'
                )}
                style={{ backgroundColor: c }}
                onClick={() => onColorChange?.(c)}
              />
            ))}
          </div>

          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pt-1">
            Size: {size}px
          </div>
          <div className="flex items-center gap-2">
            {[2, 4, 8, 16].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSizeChange?.(s)}
                className={clsx(
                  'px-2 py-0.5 text-xs rounded border cursor-pointer font-medium',
                  size === s
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      {slotAfter}
    </div>
  );
}

export default BrushTool;
