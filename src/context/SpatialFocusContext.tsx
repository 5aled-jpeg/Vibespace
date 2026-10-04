'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface SpatialFocusContextType {
  focusedWidgetId: string | null;
  setFocusedWidgetId: (id: string | null) => void;
  isWidgetFocused: (id: string) => boolean;
}

const SpatialFocusContext = createContext<SpatialFocusContextType>({
  focusedWidgetId: 'canvas',
  setFocusedWidgetId: () => {},
  isWidgetFocused: () => false,
});

export const isInteractiveTextInput = (el: HTMLElement | null): boolean => {
  if (!el) return false;
  if (
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT' ||
    el.isContentEditable ||
    el.getAttribute?.('contenteditable') === 'true' ||
    el.getAttribute?.('role') === 'textbox'
  ) {
    return true;
  }
  return !!el.closest?.(
    'input, textarea, select, [contenteditable="true"], [role="textbox"], .tl-text-editor, .tl-text-input, .tl-text, .monaco-editor, [data-testid="tl-text-input"]'
  );
};

export function SpatialFocusProvider({ children }: { children: React.ReactNode }) {
  const [focusedWidgetId, setFocusedWidgetId] = useState<string | null>('canvas');

  // Monitor clicks & focus changes across the entire viewport
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Check if user clicked inside a registered spatial widget
      const widgetEl = target.closest('[data-spatial-widget]');
      if (widgetEl) {
        const id = widgetEl.getAttribute('data-spatial-widget') || widgetEl.id;
        if (id) {
          setFocusedWidgetId(id);
          return;
        }
      }

      // Check if clicked inside infinite canvas
      const canvasEl = target.closest('.tl-container, .tl-canvas');
      if (canvasEl) {
        setFocusedWidgetId('canvas');
      }
    };

    window.addEventListener('pointerdown', handlePointerDown, { capture: true });
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, { capture: true });
    };
  }, []);

  const isWidgetFocused = useCallback(
    (id: string) => focusedWidgetId === id,
    [focusedWidgetId]
  );

  return (
    <SpatialFocusContext.Provider
      value={{
        focusedWidgetId,
        setFocusedWidgetId,
        isWidgetFocused,
      }}
    >
      {children}
    </SpatialFocusContext.Provider>
  );
}

export function useSpatialFocus() {
  return useContext(SpatialFocusContext);
}

/**
 * Hook to bind keyboard shortcuts that ONLY fire when the specified widget is actively focused
 * or being hovered, preventing collisions with canvas shortcuts or text editing.
 */
export function useScopedKeyboardShortcuts(
  widgetId: string,
  handlers: Record<string, (e: KeyboardEvent) => void>,
  containerRef?: React.RefObject<HTMLElement | null>
) {
  const { focusedWidgetId } = useSpatialFocus();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const active = document.activeElement as HTMLElement | null;

      // If user is typing inside an input/textarea/editor, do not fire widget shortcuts
      if (isInteractiveTextInput(target) || isInteractiveTextInput(active)) {
        return;
      }

      // Check if widget is focused or hovered
      const isFocused = focusedWidgetId === widgetId;
      const isHovered = containerRef?.current?.matches?.(':hover') ?? false;
      const isInside = containerRef?.current?.contains?.(target) ?? false;

      if (!isFocused && !isHovered && !isInside) {
        return;
      }

      const key = e.key;
      const handler = handlers[key] || handlers[key.toLowerCase()];
      if (handler) {
        handler(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [widgetId, focusedWidgetId, handlers, containerRef]);
}
