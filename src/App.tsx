import React, { useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import { clsx } from 'clsx';
import CanvasRoot from './canvas/CanvasRoot';
import { useAppStore } from './stores/appStore';
import { getPatternDataUri } from './canvas/backgroundLibrary';

import { SpatialFocusProvider } from './context/SpatialFocusContext';

export function App() {
  const theme = useAppStore((s) => s.theme);
  const accentColor = useAppStore((s) => s.accentColor);
  const showAnimations = useAppStore((s) => s.showAnimations);
  const windowStyle = useAppStore((s) => s.windowStyle);
  const canvasBackground = useAppStore((s) => s.canvasBackground);

  useEffect(() => {
    const root = document.documentElement;

    // Apply dark / light mode class
    let isDark = theme === 'dark';
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      isDark = false;
    } else {
      // System preferences
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
    }

    // Dynamic canvas background SVG pattern
    const patternUrl = getPatternDataUri(canvasBackground, isDark);
    root.style.setProperty('--canvas-pattern-url', patternUrl);

    // Dynamic accent color CSS variables
    root.style.setProperty('--accent-color', accentColor);
    const hex = accentColor.replace('#', '');
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      root.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
    }

    // Window style: frosted glass vs solid opaque
    root.setAttribute('data-window-style', windowStyle);

    // Dynamic animation control
    if (!showAnimations) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [theme, accentColor, showAnimations, windowStyle, canvasBackground]);

  const isLight = theme === 'light' || (theme === 'system' && !window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <MotionConfig reducedMotion={!showAnimations ? 'always' : 'never'}>
      <SpatialFocusProvider>
        <main
          className={clsx(
            'w-screen h-screen overflow-hidden select-none transition-colors duration-200',
            isLight ? 'bg-[#f0f2f5] text-slate-800' : 'bg-[#0a0d14] text-slate-100'
          )}
        >
          <CanvasRoot />
        </main>
      </SpatialFocusProvider>
    </MotionConfig>
  );
}

export default App;


