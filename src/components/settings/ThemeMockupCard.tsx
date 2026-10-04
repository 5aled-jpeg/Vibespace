import React from 'react';
import { Check } from 'lucide-react';
import { clsx } from 'clsx';

export interface ThemeMockupCardProps {
  type: 'light' | 'dark' | 'system';
  label: string;
  isSelected: boolean;
  onSelect: () => void;
  accentColor?: string;
}

export function ThemeMockupCard({
  type,
  label,
  isSelected,
  onSelect,
  accentColor = '#3b82f6',
}: ThemeMockupCardProps) {
  return (
    <div
      onClick={onSelect}
      className={clsx(
        'group relative flex flex-col rounded-2xl p-2.5 transition-all duration-200 cursor-pointer border select-none',
        isSelected
          ? 'border-indigo-500/80 bg-indigo-50/40 dark:bg-indigo-950/30 shadow-sm ring-2 ring-indigo-500/20'
          : 'border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/50 dark:bg-white/[0.02]'
      )}
    >
      {/* Miniature Window Mockup Frame */}
      <div className="relative w-full h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-inner">
        {/* LIGHT THEME MOCKUP */}
        {type === 'light' && (
          <div className="w-full h-full bg-[#f8fafc] flex flex-col">
            {/* Window header */}
            <div className="h-4 px-2 flex items-center gap-1 bg-[#f1f5f9] border-b border-slate-200">
              <div className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
            </div>
            {/* Window content */}
            <div className="flex-1 flex p-2 gap-2">
              {/* Mini sidebar */}
              <div className="w-7 bg-white rounded flex flex-col gap-1 p-1 border border-slate-200/60 shadow-2xs">
                <div className="w-full h-1 bg-slate-200 rounded-xs" />
                <div className="w-3/4 h-1 bg-slate-200 rounded-xs" />
                <div className="w-4/5 h-1 bg-slate-200 rounded-xs" />
              </div>
              {/* Mini cards */}
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="w-full h-4 bg-white rounded border border-slate-200/60 shadow-2xs" />
                <div className="grid grid-cols-2 gap-1.5 flex-1">
                  <div className="bg-white rounded border border-slate-200/60 shadow-2xs" />
                  <div className="bg-white rounded border border-slate-200/60 shadow-2xs" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DARK THEME MOCKUP */}
        {type === 'dark' && (
          <div className="w-full h-full bg-[#0f172a] flex flex-col">
            {/* Window header */}
            <div className="h-4 px-2 flex items-center gap-1 bg-[#1e293b] border-b border-slate-700/50">
              <div className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
            </div>
            {/* Window content */}
            <div className="flex-1 flex p-2 gap-2">
              {/* Mini sidebar */}
              <div className="w-7 bg-[#1e293b]/70 rounded flex flex-col gap-1 p-1 border border-slate-700/40">
                <div className="w-full h-1 bg-slate-600 rounded-xs" />
                <div className="w-3/4 h-1 bg-slate-600 rounded-xs" />
                <div className="w-4/5 h-1 bg-slate-600 rounded-xs" />
              </div>
              {/* Mini cards */}
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="w-full h-4 bg-[#1e293b] rounded border border-slate-700/50" />
                <div className="grid grid-cols-2 gap-1.5 flex-1">
                  <div className="bg-[#1e293b] rounded border border-slate-700/50" />
                  <div className="bg-[#1e293b] rounded border border-slate-700/50" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SYSTEM PREFERENCES (SPLIT LIGHT / DARK) */}
        {type === 'system' && (
          <div className="w-full h-full flex">
            {/* Left half: Light */}
            <div className="w-1/2 h-full bg-[#f8fafc] flex flex-col border-r border-slate-300 dark:border-slate-700">
              <div className="h-4 px-2 flex items-center gap-1 bg-[#f1f5f9] border-b border-slate-200">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
              </div>
              <div className="flex-1 p-2 flex flex-col gap-1.5">
                <div className="w-full h-3 bg-white rounded border border-slate-200" />
                <div className="w-full flex-1 bg-white rounded border border-slate-200" />
              </div>
            </div>

            {/* Right half: Dark */}
            <div className="w-1/2 h-full bg-[#0f172a] flex flex-col">
              <div className="h-4 px-2 flex items-center justify-end gap-1 bg-[#1e293b] border-b border-slate-700/50">
                <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
              </div>
              <div className="flex-1 p-2 flex flex-col gap-1.5">
                <div className="w-full h-3 bg-[#1e293b] rounded border border-slate-700/50" />
                <div className="w-full flex-1 bg-[#1e293b] rounded border border-slate-700/50" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Radio Selection Row */}
      <div className="flex items-center gap-2.5 mt-3 px-1">
        <div
          className={clsx(
            'w-4 h-4 rounded-full flex items-center justify-center transition-all',
            isSelected
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
          )}
          style={{ backgroundColor: isSelected ? accentColor : undefined }}
        >
          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
        </div>
        <span
          className={clsx(
            'text-xs font-medium transition-colors',
            isSelected
              ? 'text-slate-900 dark:text-white font-semibold'
              : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
          )}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

export default ThemeMockupCard;
