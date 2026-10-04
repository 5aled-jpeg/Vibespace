'use client';

import * as React from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import { clsx } from 'clsx';
import { Trash2 } from 'lucide-react';
import { stopCanvasPropagation, interactiveProps } from '../../../../utils/canvas-events';

export interface PlayfulTaskItem {
  id: string | number;
  label?: string;
  text?: string;
  completed?: boolean;
  defaultChecked?: boolean;
}

export interface PlayfulTodolistProps {
  items?: PlayfulTaskItem[];
  onToggleItem?: (id: string | number) => void;
  onDeleteItem?: (id: string | number) => void;
  className?: string;
}

const defaultDemoItems: PlayfulTaskItem[] = [
  {
    id: '1',
    label: 'Code in Assembly 💾',
    defaultChecked: true,
  },
  {
    id: '2',
    label: 'Present a bug as a feature 🪲',
    defaultChecked: false,
  },
  {
    id: '3',
    label: 'Push to prod on a Friday 🚀',
    defaultChecked: false,
  },
];

const getPathAnimate = (isChecked: boolean) => ({
  pathLength: isChecked ? 1 : 0,
  opacity: isChecked ? 1 : 0,
});

const getPathTransition = (isChecked: boolean): Transition => ({
  pathLength: { duration: 0.85, ease: 'easeInOut' },
  opacity: {
    duration: 0.01,
    delay: isChecked ? 0 : 0.85,
  },
});

export function PlayfulTodolist({
  items,
  onToggleItem,
  onDeleteItem,
  className,
}: PlayfulTodolistProps) {
  const [internalItems, setInternalItems] = React.useState(defaultDemoItems);

  const activeItems = items !== undefined ? items : internalItems;

  const handleToggle = (id: string | number) => {
    if (onToggleItem) {
      onToggleItem(id);
    } else {
      setInternalItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, defaultChecked: !Boolean(item.completed ?? item.defaultChecked) }
            : item
        )
      );
    }
  };

  return (
    <div
      className={clsx(
        'bg-[#18181b] rounded-2xl p-5 space-y-4 select-none font-sans text-white border border-neutral-800/80 shadow-inner',
        className
      )}
      onPointerDown={stopCanvasPropagation}
    >
      <AnimatePresence initial={false}>
        {activeItems.map((item, idx) => {
          const isChecked = Boolean(item.completed ?? item.defaultChecked);
          const taskText = item.text || item.label || '';

          return (
            <div key={item.id} className="space-y-4 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {/* Playful Animated Tactile Checkbox */}
                  <motion.button
                    type="button"
                    {...interactiveProps}
                    whileTap={{ scale: 0.85 }}
                    onClick={(e) => {
                      stopCanvasPropagation(e);
                      handleToggle(item.id);
                    }}
                    aria-label={isChecked ? 'Mark incomplete' : 'Mark complete'}
                    className={clsx(
                      'w-5 h-5 rounded-[5px] flex items-center justify-center shrink-0 cursor-pointer transition-colors duration-200 outline-none select-none',
                      isChecked
                        ? 'bg-white text-black shadow-xs'
                        : 'bg-[#27272a] hover:bg-[#35353c]'
                    )}
                  >
                    <AnimatePresence initial={false}>
                      {isChecked && (
                        <motion.svg
                          initial={{ scale: 0.4, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.4, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                          className="w-3.5 h-3.5 stroke-black fill-none"
                          viewBox="0 0 24 24"
                          strokeWidth={3.2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <motion.path
                            d="M 4.5 12 L 9.5 17 L 19.5 7"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                          />
                        </motion.svg>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  {/* Task Label with Animated Wavy Strikethrough */}
                  <div
                    className="relative inline-block flex-1 min-w-0 cursor-pointer select-none py-0.5"
                    onClick={(e) => {
                      stopCanvasPropagation(e);
                      handleToggle(item.id);
                    }}
                  >
                    <span className="text-[13.5px] font-medium text-white tracking-tight select-none block truncate">
                      {taskText}
                    </span>

                    {/* The Playful Hand-Drawn Wavy Strikethrough Path */}
                    <motion.svg
                      width="340"
                      height="32"
                      viewBox="0 0 340 32"
                      className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none z-20 w-full h-10 overflow-visible"
                      preserveAspectRatio="none"
                    >
                      <motion.path
                        d="M 10 16.91 s 79.8 -11.36 98.1 -11.34 c 22.2 0.02 -47.82 14.25 -33.39 22.02 c 12.61 6.77 124.18 -27.98 133.31 -17.28 c 7.52 8.38 -26.8 20.02 4.61 22.05 c 24.55 1.93 113.37 -20.36 113.37 -20.36"
                        vectorEffect="non-scaling-stroke"
                        strokeWidth={2.2}
                        strokeLinecap="round"
                        strokeMiterlimit={10}
                        fill="none"
                        initial={false}
                        animate={getPathAnimate(isChecked)}
                        transition={getPathTransition(isChecked)}
                        className="stroke-white opacity-95"
                      />
                    </motion.svg>
                  </div>
                </div>

                {/* Subtle Hover Delete Button */}
                {onDeleteItem && (
                  <button
                    type="button"
                    {...interactiveProps}
                    onClick={(e) => {
                      stopCanvasPropagation(e);
                      onDeleteItem(item.id);
                    }}
                    title="Delete task"
                    className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 p-1 rounded-md transition-opacity cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Horizontal divider between items */}
              {idx !== activeItems.length - 1 && (
                <div className="border-t border-neutral-800/90" />
              )}
            </div>
          );
        })}
      </AnimatePresence>

      {activeItems.length === 0 && (
        <div className="py-6 text-center text-xs text-neutral-400 italic">
          No tasks remaining ✨ Add one below!
        </div>
      )}
    </div>
  );
}

export default PlayfulTodolist;
