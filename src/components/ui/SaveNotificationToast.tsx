import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Info, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';
import { subscribeSaveToast, SaveToastData } from '../../services/environment-persistence';

export default function SaveNotificationToast() {
  const [toast, setToast] = useState<SaveToastData | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeSaveToast((newToast) => {
      setToast(newToast);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none select-none flex flex-col items-center">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-full bg-slate-900/90 dark:bg-[#151923]/95 text-white shadow-[0_12px_36px_rgba(0,0,0,0.35)] backdrop-blur-xl border border-white/15 dark:border-white/10 max-w-md"
          >
            {/* Status Icon */}
            <div className="shrink-0 flex items-center justify-center">
              {toast.type === 'success' && (
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
              {toast.type === 'info' && (
                <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Info className="w-4 h-4" />
                </div>
              )}
              {toast.type === 'warning' && (
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
              )}
              {toast.type === 'error' && (
                <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Message Body */}
            <div className="flex flex-col text-left pr-1 min-w-0">
              <span className="text-xs font-semibold tracking-wide text-slate-100 flex items-center gap-1.5 truncate">
                {toast.title}
                {toast.type === 'success' && (
                  <Sparkles className="w-3 h-3 text-emerald-400/80 inline" />
                )}
              </span>
              {toast.detail && (
                <span className="text-[11px] text-slate-300/80 truncate">
                  {toast.detail}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
