import React, { useState, useRef, useEffect } from 'react';
import { Editor, useValue } from 'tldraw';
import { MoveDiagonal2 } from 'lucide-react';
import { clsx } from 'clsx';
import { stopCanvasPropagation, useIsolateCanvasWheel } from '../../utils/canvas-events';
import { useAppStore } from '../../stores/appStore';
import { ErrorBoundary } from '../ui/ErrorBoundary';

export interface WindowFrameProps {
  shapeId: string;
  width: number;
  height: number;
  editor: Editor;
  children: React.ReactNode;
  minWidth?: number;
  minHeight?: number;
  className?: string;
}

export function WindowFrame({
  shapeId,
  width,
  height,
  editor,
  children,
  minWidth = 320,
  minHeight = 200,
  className,
}: WindowFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const rafRef = useRef<number | null>(null);
  const pendingUpdateRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  // Isolate wheel/scroll events to this tool, preventing tldraw canvas zoom/pan
  useIsolateCanvasWheel(frameRef);

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Reactive selection state from tldraw editor
  const isSelected = useValue(
    'is-selected',
    () => {
      try {
        return editor.getSelectedShapeIds().includes(shapeId as any);
      } catch {
        return false;
      }
    },
    [editor, shapeId]
  );

  // Ensure clicking the window selects it in tldraw
  const handleContainerPointerDown = (e: React.PointerEvent) => {
    try {
      if (!editor.getSelectedShapeIds().includes(shapeId as any)) {
        editor.setSelectedShapes([shapeId as any]);
      }
    } catch {
      // safe fallback
    }
  };

  // High-performance Top-Left Corner Resizer Drag Logic
  const handleTopLeftDragStart = (e: React.PointerEvent) => {
    stopCanvasPropagation(e);
    e.preventDefault();
    e.nativeEvent?.stopImmediatePropagation?.();

    const shape = editor.getShape(shapeId as any);
    if (!shape) return;

    // Capture pointer on handle so mouse events are never stolen by iframes/videos
    const target = e.currentTarget as HTMLElement;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      // fallback
    }

    setIsResizing(true);

    // Use page space coordinates for 100% precision regardless of canvas pan or zoom
    const startPagePoint = editor.screenToPage({ x: e.clientX, y: e.clientY });
    const initialW = (shape.props as any).w;
    const initialH = (shape.props as any).h;
    const initialX = shape.x;
    const initialY = shape.y;
    const fixedRight = initialX + initialW;
    const fixedBottom = initialY + initialH;

    let latestW = initialW;
    let latestH = initialH;
    let latestX = initialX;
    let latestY = initialY;

    const handlePointerMove = (ev: PointerEvent) => {
      ev.preventDefault();
      const currentPagePoint = editor.screenToPage({ x: ev.clientX, y: ev.clientY });
      const dx = currentPagePoint.x - startPagePoint.x;
      const dy = currentPagePoint.y - startPagePoint.y;

      latestW = Math.max(minWidth, Math.round(initialW - dx));
      latestH = Math.max(minHeight, Math.round(initialH - dy));
      latestX = Math.round(fixedRight - latestW);
      latestY = Math.round(fixedBottom - latestH);

      pendingUpdateRef.current = { x: latestX, y: latestY, w: latestW, h: latestH };

      // Batch updates to requestAnimationFrame for buttery smooth 60-120 FPS
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          if (pendingUpdateRef.current) {
            editor.updateShape({
              id: shapeId as any,
              type: shape.type,
              x: pendingUpdateRef.current.x,
              y: pendingUpdateRef.current.y,
              props: {
                ...shape.props,
                w: pendingUpdateRef.current.w,
                h: pendingUpdateRef.current.h,
              },
            } as any);
          }
        });
      }
    };

    const handlePointerUp = (ev: PointerEvent) => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      try {
        target.releasePointerCapture(ev.pointerId);
      } catch {
        // fallback
      }

      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);

      // Commit final accurate position & dimension
      editor.updateShape({
        id: shapeId as any,
        type: shape.type,
        x: latestX,
        y: latestY,
        props: {
          ...shape.props,
          w: latestW,
          h: latestH,
        },
      } as any);

      setIsResizing(false);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp, { passive: false });
    window.addEventListener('pointercancel', handlePointerUp, { passive: false });
  };

  const accentColor = useAppStore((s) => s.accentColor);
  const isMinimized = useAppStore((s) =>
    s.minimizedShapes.some((m) => m.id === shapeId)
  );

  if (isMinimized) {
    return null;
  }

  return (
    <div
      ref={frameRef}
      data-spatial-widget={shapeId}
      onPointerDown={handleContainerPointerDown}
      className={clsx(
        'relative w-full h-full group rounded-2xl md:rounded-3xl transition-all duration-150',
        isResizing ? 'select-none' : '',
        className
      )}
      style={{
        width,
        height,
        overscrollBehavior: 'contain',
      }}
    >
      {/* Invisible shield while dragging so nested iframes or media cannot steal mouse events */}
      {isResizing && (
        <div
          className="fixed inset-0 z-[99999] cursor-nwse-resize select-none bg-transparent"
          style={{ pointerEvents: 'all' }}
        />
      )}

      {/* Content */}
      <div className={clsx('w-full h-full', isResizing ? 'pointer-events-none' : '')}>
        <ErrorBoundary variant="widget">
          {children}
        </ErrorBoundary>
      </div>

      {/* ONLY ONE Resizer on Top-Left Corner (as requested) */}
      <div
        onPointerDown={handleTopLeftDragStart}
        title="Resize Window (Drag from top-left)"
        style={{
          borderColor: accentColor,
          boxShadow: isResizing || isSelected ? `0 0 14px ${accentColor}80` : undefined,
        }}
        className={clsx(
          'absolute -top-3.5 -left-3.5 z-50 w-7 h-7 rounded-full flex items-center justify-center cursor-nwse-resize select-none transform-gpu transition-all duration-150 shadow-xl',
          'bg-white/95 dark:bg-[#1a1f2c]/95 border backdrop-blur-xl',
          'hover:scale-125 active:scale-95',
          isSelected
            ? 'opacity-100 scale-100 ring-2'
            : 'opacity-0 group-hover:opacity-90 scale-90',
          isResizing ? '!opacity-100 !scale-110 ring-2' : ''
        )}
      >
        <MoveDiagonal2
          className="w-3.5 h-3.5 rotate-90 transition-colors"
          style={{ color: accentColor }}
        />
      </div>
    </div>
  );
}

export default WindowFrame;
