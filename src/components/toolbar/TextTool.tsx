import React from 'react';
import { Type } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface TextToolProps {
  isActive: boolean;
  onSelect: () => void;
  className?: string;
  slotBefore?: React.ReactNode;
  slotAfter?: React.ReactNode;
}

export function TextTool({
  isActive,
  onSelect,
  className,
  slotBefore,
  slotAfter,
}: TextToolProps) {
  return (
    <div className={twMerge('relative flex items-center', className)}>
      {slotBefore}
      <button
        type="button"
        title="Text Tool (T)"
        onClick={onSelect}
        className={clsx(
          'p-2.5 rounded-full transition-colors flex items-center gap-1.5 select-none cursor-pointer',
          isActive
            ? 'bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-600/30 shadow-sm'
            : 'text-slate-800 dark:text-slate-200 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
        )}
      >
        <Type className="w-4 h-4" />
      </button>
      {slotAfter}
    </div>
  );
}

export default TextTool;
