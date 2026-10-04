import React, { createContext, useContext, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface TabsContextValue {
  activeTab: string;
  onChange: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export interface TabsProps {
  value: string;
  onChange: (id: string) => void;
  children: ReactNode;
  className?: string;
}

export function Tabs({ value, onChange, children, className }: TabsProps) {
  return (
    <TabsContext.Provider value={{ activeTab: value, onChange }}>
      <div className={twMerge('w-full flex flex-col', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export interface TabListProps {
  children: ReactNode;
  className?: string;
  unstyled?: boolean;
}

export function TabList({ children, className, unstyled = false }: TabListProps) {
  return (
    <div
      role="tablist"
      className={twMerge(
        unstyled
          ? className
          : clsx(
              'flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl',
              className
            )
      )}
    >
      {children}
    </div>
  );
}

export interface TabTriggerProps {
  id: string;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
  disabled?: boolean;
}

export function TabTrigger({
  id,
  children,
  className,
  activeClassName,
  disabled = false,
}: TabTriggerProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabTrigger must be used inside Tabs');

  const isActive = context.activeTab === id;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => !disabled && context.onChange(id)}
      className={twMerge(
        clsx(
          'relative px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors select-none cursor-pointer tracking-tight outline-none',
          isActive
            ? (activeClassName || 'text-white font-semibold')
            : 'text-white/60 hover:text-white/90 hover:bg-white/5',
          disabled && 'opacity-40 cursor-not-allowed',
          className
        )
      )}
    >
      {isActive && (
        <motion.div
          layoutId="active-tab-pill"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="absolute inset-0 bg-white/15 border border-white/20 rounded-lg shadow-sm -z-0"
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export interface TabPanelProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function TabPanel({ id, children, className }: TabPanelProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabPanel must be used inside Tabs');

  if (context.activeTab !== id) return null;

  return (
    <motion.div
      role="tabpanel"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={twMerge('w-full pt-3 focus:outline-none', className)}
    >
      {children}
    </motion.div>
  );
}

export default Tabs;
