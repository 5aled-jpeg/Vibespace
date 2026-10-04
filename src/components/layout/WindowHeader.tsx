import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { stopCanvasPropagation, interactiveProps, textInputProps } from '../../utils/canvas-events';
import { twMerge } from 'tailwind-merge';

export interface WindowHeaderProps {
  title: string;
  onTitleChange?: (newTitle: string) => void;
  icon?: ReactNode;
  onDelete?: () => void;
  onToggleMinimize?: () => void;
  isMinimized?: boolean;
  onMaximize?: () => void;
  children?: ReactNode; // Right-side actions slot
  className?: string;
}

function EditableTitle({
  title,
  onTitleChange,
}: {
  title: string;
  onTitleChange: (newTitle: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempTitle(title);
  }, [title]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = tempTitle.trim();
    if (trimmed && trimmed !== title) {
      onTitleChange(trimmed);
    } else {
      setTempTitle(title);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempTitle(title);
    setIsEditing(false);
  };

  const startEditing = (e: React.SyntheticEvent) => {
    stopCanvasPropagation(e);
    setIsEditing(true);
  };

  if (isEditing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          stopCanvasPropagation(e);
          handleSave();
        }}
        {...interactiveProps}
        className="flex items-center gap-1.5 z-30"
      >
        <input
          ref={inputRef}
          type="text"
          value={tempTitle}
          onChange={(e) => setTempTitle(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.nativeEvent) e.nativeEvent.stopImmediatePropagation?.();
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSave();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              handleCancel();
            }
          }}
          onBlur={handleSave}
          autoFocus
          {...textInputProps}
          className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-neutral-900 border-2 border-blue-500 rounded-lg text-slate-900 dark:text-white shadow-md focus:outline-none ring-2 ring-blue-500/30 tracking-tight w-44"
        />
        <button
          type="button"
          {...interactiveProps}
          onMouseDown={(e) => {
            e.preventDefault();
            stopCanvasPropagation(e);
            handleSave();
          }}
          onClick={(e) => {
            stopCanvasPropagation(e);
            handleSave();
          }}
          className="p-1 rounded-md bg-blue-500 hover:bg-blue-600 text-white cursor-pointer shadow-xs transition-transform active:scale-95"
          title="Save title (Enter)"
        >
          <Check className="w-3 h-3" />
        </button>
        <button
          type="button"
          {...interactiveProps}
          onMouseDown={(e) => {
            e.preventDefault();
            stopCanvasPropagation(e);
            handleCancel();
          }}
          onClick={(e) => {
            stopCanvasPropagation(e);
            handleCancel();
          }}
          className="p-1 rounded-md bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white/70 hover:bg-slate-300 transition-colors cursor-pointer"
          title="Cancel (Esc)"
        >
          <X className="w-3 h-3" />
        </button>
      </form>
    );
  }

  return (
    <div
      {...interactiveProps}
      onClick={startEditing}
      onDoubleClick={startEditing}
      title="Click or double-click to rename"
      className="group/title flex items-center gap-1.5 px-2 py-0.5 -ml-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 border border-transparent hover:border-slate-300/60 dark:hover:border-white/15 transition-all cursor-pointer select-none"
    >
      <span className="text-xs font-semibold tracking-tight text-slate-800 dark:text-white/90 truncate max-w-[160px] md:max-w-[240px]">
        {title}
      </span>
      <button
        type="button"
        {...interactiveProps}
        onClick={startEditing}
        className="p-0.5 rounded text-slate-400 dark:text-white/40 hover:text-blue-500 dark:hover:text-white transition-colors"
        title="Rename"
      >
        <Pencil className="w-3 h-3 opacity-70 group-hover/title:opacity-100 transition-opacity" />
      </button>
    </div>
  );
}

export function WindowHeader({
  title,
  onTitleChange,
  icon,
  onDelete,
  onToggleMinimize,
  isMinimized = false,
  onMaximize,
  children,
  className,
}: WindowHeaderProps) {
  return (
    <div
      className={twMerge(
        'flex items-center justify-between px-4 py-2.5 bg-slate-100/70 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10 backdrop-blur-2xl z-20 select-none cursor-grab active:cursor-grabbing font-sans transition-colors',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* macOS Traffic Lights */}
        <div className="flex items-center gap-2 mr-1">
          {/* Red: Close / Delete */}
          <button
            type="button"
            {...interactiveProps}
            onClick={(e) => {
              stopCanvasPropagation(e);
              onDelete?.();
            }}
            title="Close Layer"
            className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/80 border border-[#e0443e] cursor-pointer flex items-center justify-center group shadow-sm transition-transform active:scale-90"
          >
            <span className="opacity-0 group-hover:opacity-100 text-[9px] text-black/90 font-bold leading-none select-none">
              ×
            </span>
          </button>

          {/* Yellow: Minimize / Collapse */}
          <button
            type="button"
            {...interactiveProps}
            onClick={(e) => {
              stopCanvasPropagation(e);
              onToggleMinimize?.();
            }}
            title={isMinimized ? 'Expand Window' : 'Minimize Window'}
            className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#ffbd2e]/80 border border-[#dea123] cursor-pointer flex items-center justify-center group shadow-sm transition-transform active:scale-90"
          >
            <span className="opacity-0 group-hover:opacity-100 text-[9px] text-black/90 font-bold leading-none select-none">
              -
            </span>
          </button>

          {/* Green: Zoom to Fit / Maximize */}
          <button
            type="button"
            {...interactiveProps}
            onClick={(e) => {
              stopCanvasPropagation(e);
              onMaximize?.();
            }}
            title="Zoom to Fit"
            className="w-3 h-3 rounded-full bg-[#27c93f] hover:bg-[#27c93f]/80 border border-[#1aab29] cursor-pointer flex items-center justify-center group shadow-sm transition-transform active:scale-90"
          >
            <span className="opacity-0 group-hover:opacity-100 text-[8px] text-black/90 font-bold leading-none select-none">
              +
            </span>
          </button>
        </div>

        {/* Title and Icon */}
        <div className="flex items-center gap-2 text-slate-800 dark:text-white">
          {icon && <span className="text-slate-500 dark:text-white/70">{icon}</span>}
          {onTitleChange ? (
            <EditableTitle title={title} onTitleChange={onTitleChange} />
          ) : (
            <span className="text-xs font-semibold tracking-tight text-slate-800 dark:text-white/90 truncate max-w-[200px] md:max-w-[300px]">
              {title}
            </span>
          )}
        </div>
      </div>

      {/* Right Actions Slot */}
      {children && (
        <div
          className="flex items-center gap-1.5"
          onPointerDown={stopCanvasPropagation}
          onMouseDown={stopCanvasPropagation}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default WindowHeader;
