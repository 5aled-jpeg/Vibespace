'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MousePointer,
  Hand,
  Pen,
  Highlighter,
  Type,
  Video,
  Music,
  Image as ImageIcon,
  Globe,
  Code2,
  FileText,
  Table,
  CheckSquare,
  StickyNote,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Settings,
  ChevronDown,
  LayoutGrid,
  Compass,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAppStore } from '../../stores/appStore';

export type ActiveToolType = 'select' | 'hand' | 'pen' | 'brush' | 'text';

export interface CanvasToolbarProps {
  activeTool: ActiveToolType;
  onSelectTool: (tool: ActiveToolType) => void;
  onSpawnShape: (
    type: 'video' | 'audio' | 'image' | 'web' | 'code' | 'pdf' | 'table' | 'todo' | 'note'
  ) => void;
  onRestoreShape?: (
    shapeId: string,
    type: 'video' | 'audio' | 'image' | 'web' | 'table' | 'todo' | 'code' | 'pdf' | 'note'
  ) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  zoomLevel?: number;
  onResetZoom?: () => void;
  onBackToCenter?: () => void;
  onCleanUpCanvas?: () => void;
  onOpenSettings?: () => void;
  penColor?: string;
  penStrokeWidth?: number;
  onPenColorChange?: (color: string) => void;
  onPenStrokeWidthChange?: (width: number) => void;
  brushColor?: string;
  brushSize?: number;
  onBrushColorChange?: (color: string) => void;
  onBrushSizeChange?: (size: number) => void;
  className?: string;
  slotLeading?: React.ReactNode;
  slotTrailing?: React.ReactNode;
}

const PEN_COLORS = ['#f0f6fc', '#58a6ff', '#bc8cff', '#3fb950', '#f85149', '#d29922'];
const BRUSH_COLORS = ['#ffd60a', '#30d158', '#0a84ff', '#bf5af2', '#ff453a', '#ff9f0a'];

interface DockItemConfig {
  id: string;
  name: string;
  isDivider?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  customContent?: React.ReactNode;
  colorClass?: string;
  isActive?: boolean;
  isMinimized?: boolean;
  badge?: React.ReactNode;
  onClick?: () => void;
  hasSubmenu?: boolean;
}

export function CanvasToolbar({
  activeTool,
  onSelectTool,
  onSpawnShape,
  onRestoreShape,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  zoomLevel,
  onResetZoom,
  onBackToCenter,
  onCleanUpCanvas,
  onOpenSettings,
  penColor = '#f0f6fc',
  penStrokeWidth = 2,
  onPenColorChange,
  onPenStrokeWidthChange,
  brushColor = '#ffd60a',
  brushSize = 2,
  onBrushColorChange,
  onBrushSizeChange,
  className,
  slotLeading,
  slotTrailing,
}: CanvasToolbarProps) {
  const accentColor = useAppStore((s) => s.accentColor);
  const isSettingsOpen = useAppStore((s) => s.isSettingsOpen);
  const minimizedShapes = useAppStore((s) => s.minimizedShapes);

  const minVideo = minimizedShapes.find((s) => s.type === 'video');
  const minAudio = minimizedShapes.find((s) => s.type === 'audio');
  const minImage = minimizedShapes.find((s) => s.type === 'image');
  const minWeb = minimizedShapes.find((s) => s.type === 'web');
  const minCode = minimizedShapes.find((s) => s.type === 'code');
  const minPdf = minimizedShapes.find((s) => s.type === 'pdf');
  const minTable = minimizedShapes.find((s) => s.type === 'table');
  const minTodo = minimizedShapes.find((s) => s.type === 'todo');
  const minNote = minimizedShapes.find((s) => s.type === 'note');

  const [openPenSettings, setOpenPenSettings] = useState(false);
  const [openBrushSettings, setOpenBrushSettings] = useState(false);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  const [mouseX, setMouseX] = useState<number | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastMouseMoveTime = useRef<number>(0);

  // Responsive size calculations based on viewport
  const getResponsiveConfig = useCallback(() => {
    if (typeof window === 'undefined') {
      return { baseIconSize: 40, maxScale: 1.5, effectWidth: 220, baseSpacing: 5 };
    }

    const smallerDim = Math.min(window.innerWidth, window.innerHeight);
    const winWidth = window.innerWidth;

    if (winWidth < 768 || smallerDim < 500) {
      return { baseIconSize: 28, maxScale: 1.28, effectWidth: 140, baseSpacing: 2.5 };
    } else if (winWidth < 1080) {
      return { baseIconSize: 34, maxScale: 1.45, effectWidth: 190, baseSpacing: 4 };
    } else {
      return { baseIconSize: 40, maxScale: 1.55, effectWidth: 230, baseSpacing: 5 };
    }
  }, []);

  const [config, setConfig] = useState(getResponsiveConfig);
  const { baseIconSize, maxScale, effectWidth, baseSpacing } = config;
  const minScale = 1.0;

  useEffect(() => {
    const handleResize = () => setConfig(getResponsiveConfig());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getResponsiveConfig]);

  // Build full list of Dock Items representing all application capabilities
  const dockItems: DockItemConfig[] = [
    // Navigation Tools
    {
      id: 'select',
      name: 'Select Tool (1)',
      icon: MousePointer,
      isActive: activeTool === 'select',
      onClick: () => onSelectTool('select'),
    },
    {
      id: 'hand',
      name: 'Pan / Hand Tool (0)',
      icon: Hand,
      isActive: activeTool === 'hand',
      onClick: () => onSelectTool('hand'),
    },

    // Divider
    { id: 'div-1', name: '', isDivider: true },

    // Annotation Tools
    {
      id: 'pen',
      name: 'Pen Tool (P)',
      icon: Pen,
      isActive: activeTool === 'pen',
      hasSubmenu: true,
      badge: (
        <span
          className="w-2 h-2 rounded-full border border-black/25 dark:border-white/30"
          style={{ backgroundColor: penColor }}
        />
      ),
      onClick: () => {
        if (activeTool === 'pen') {
          setOpenPenSettings((prev) => !prev);
        } else {
          onSelectTool('pen');
        }
      },
    },
    {
      id: 'brush',
      name: 'Highlighter Brush',
      icon: Highlighter,
      isActive: activeTool === 'brush',
      hasSubmenu: true,
      badge: (
        <span
          className="w-2 h-2 rounded-full border border-black/25 dark:border-white/30"
          style={{ backgroundColor: brushColor }}
        />
      ),
      onClick: () => {
        if (activeTool === 'brush') {
          setOpenBrushSettings((prev) => !prev);
        } else {
          onSelectTool('brush');
        }
      },
    },
    {
      id: 'text',
      name: 'Text Tool (T)',
      icon: Type,
      isActive: activeTool === 'text',
      onClick: () => onSelectTool('text'),
    },

    // Divider
    { id: 'div-2', name: '', isDivider: true },

    // Media & Productivity Spawners
    {
      id: 'video',
      name: minVideo ? `Restore Video: ${minVideo.title}` : 'Video Stream (Ctrl+V)',
      icon: Video,
      colorClass: 'text-blue-600 dark:text-blue-400 hover:text-blue-500',
      isMinimized: !!minVideo,
      onClick: () => {
        if (minVideo && onRestoreShape) {
          onRestoreShape(minVideo.id, 'video');
        } else {
          onSpawnShape('video');
        }
      },
    },
    {
      id: 'audio',
      name: minAudio ? `Restore Music Player: ${minAudio.title || 'Playing'}` : 'Audio Player (Ctrl+I)',
      icon: Music,
      colorClass: 'text-purple-600 dark:text-purple-400 hover:text-purple-500',
      isMinimized: !!minAudio,
      onClick: () => {
        if (minAudio && onRestoreShape) {
          onRestoreShape(minAudio.id, 'audio');
        } else {
          onSpawnShape('audio');
        }
      },
    },
    {
      id: 'image',
      name: minImage ? `Restore Photo Canvas: ${minImage.title}` : 'Photo Canvas (Ctrl+P)',
      icon: ImageIcon,
      colorClass: 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-500',
      isMinimized: !!minImage,
      onClick: () => {
        if (minImage && onRestoreShape) {
          onRestoreShape(minImage.id, 'image');
        } else {
          onSpawnShape('image');
        }
      },
    },
    {
      id: 'web',
      name: minWeb ? `Restore Browser: ${minWeb.title}` : 'Internet Browser (Ctrl+B)',
      icon: Compass,
      colorClass: 'text-sky-600 dark:text-sky-400 hover:text-sky-500',
      isMinimized: !!minWeb,
      onClick: () => {
        if (minWeb && onRestoreShape) {
          onRestoreShape(minWeb.id, 'web');
        } else {
          onSpawnShape('web');
        }
      },
    },
    {
      id: 'code',
      name: minCode ? `Restore Code Runner: ${minCode.title}` : 'JS/TS Code Runner',
      icon: Code2,
      colorClass: 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-500',
      isMinimized: !!minCode,
      onClick: () => {
        if (minCode && onRestoreShape) {
          onRestoreShape(minCode.id, 'code');
        } else {
          onSpawnShape('code');
        }
      },
    },
    {
      id: 'pdf',
      name: minPdf ? `Restore PDF Viewer: ${minPdf.title}` : 'PDF Document Viewer',
      icon: FileText,
      colorClass: 'text-rose-600 dark:text-rose-400 hover:text-rose-500',
      isMinimized: !!minPdf,
      onClick: () => {
        if (minPdf && onRestoreShape) {
          onRestoreShape(minPdf.id, 'pdf');
        } else {
          onSpawnShape('pdf');
        }
      },
    },
    {
      id: 'table',
      name: minTable ? `Restore Data Grid: ${minTable.title}` : 'Reactive Data Grid (Ctrl+T)',
      icon: Table,
      colorClass: 'text-amber-600 dark:text-amber-400 hover:text-amber-500',
      isMinimized: !!minTable,
      onClick: () => {
        if (minTable && onRestoreShape) {
          onRestoreShape(minTable.id, 'table');
        } else {
          onSpawnShape('table');
        }
      },
    },
    {
      id: 'todo',
      name: minTodo ? `Restore Action Items: ${minTodo.title}` : 'Action Items (N)',
      icon: CheckSquare,
      colorClass: 'text-teal-600 dark:text-teal-400 hover:text-teal-500',
      isMinimized: !!minTodo,
      onClick: () => {
        if (minTodo && onRestoreShape) {
          onRestoreShape(minTodo.id, 'todo');
        } else {
          onSpawnShape('todo');
        }
      },
    },
    {
      id: 'note',
      name: 'Note Adder',
      icon: StickyNote,
      colorClass: 'text-amber-500 dark:text-amber-400 hover:text-amber-500',
      isMinimized: !!minNote,
      onClick: () => {
        if (minNote && onRestoreShape) {
          onRestoreShape(minNote.id, 'note');
        } else {
          onSpawnShape('note');
        }
      },
    },

    // Divider
    { id: 'div-3', name: '', isDivider: true },

    // History & Settings Controls
    ...(onUndo
      ? [
          {
            id: 'undo',
            name: 'Undo (Ctrl+Z)',
            icon: Undo2,
            onClick: onUndo,
          },
        ]
      : []),
    ...(onRedo
      ? [
          {
            id: 'redo',
            name: 'Redo (Ctrl+Y)',
            icon: Redo2,
            onClick: onRedo,
          },
        ]
      : []),
    ...(onOpenSettings
      ? [
          {
            id: 'settings',
            name: 'Settings (Ctrl+,)',
            icon: Settings,
            isActive: isSettingsOpen,
            onClick: onOpenSettings,
          },
        ]
      : []),
  ];

  const [currentScales, setCurrentScales] = useState<number[]>(dockItems.map(() => 1));
  const [currentPositions, setCurrentPositions] = useState<number[]>([]);

  // Authentic macOS cosine-based magnification algorithm
  const calculateTargetMagnification = useCallback(
    (mousePosition: number | null) => {
      if (mousePosition === null) {
        return dockItems.map(() => minScale);
      }

      // Compute standard item centers based on base sizes
      let accumulatedX = 0;
      const normalCenters = dockItems.map((item) => {
        const itemWidth = item.isDivider ? 8 : baseIconSize;
        const center = accumulatedX + itemWidth / 2;
        accumulatedX += itemWidth + baseSpacing;
        return center;
      });

      return dockItems.map((item, index) => {
        if (item.isDivider) return minScale;

        const normalIconCenter = normalCenters[index];
        const minX = mousePosition - effectWidth / 2;
        const maxX = mousePosition + effectWidth / 2;

        if (normalIconCenter < minX || normalIconCenter > maxX) {
          return minScale;
        }

        const theta = ((normalIconCenter - minX) / effectWidth) * 2 * Math.PI;
        const cappedTheta = Math.min(Math.max(theta, 0), 2 * Math.PI);
        const scaleFactor = (1 - Math.cos(cappedTheta)) / 2;

        return minScale + scaleFactor * (maxScale - minScale);
      });
    },
    [dockItems, baseIconSize, baseSpacing, effectWidth, maxScale, minScale]
  );

  // Calculate dynamic positions along the dock shelf based on current scales
  const calculatePositions = useCallback(
    (scales: number[]) => {
      let currentX = 0;

      return scales.map((scale, index) => {
        const item = dockItems[index];
        const scaledWidth = item?.isDivider ? 8 : baseIconSize * (scale || 1);
        const centerX = currentX + scaledWidth / 2;
        currentX += scaledWidth + baseSpacing;
        return centerX;
      });
    },
    [baseIconSize, baseSpacing, dockItems]
  );

  // Initialize positions on mount or config change
  useEffect(() => {
    const initialScales = dockItems.map(() => minScale);
    const initialPositions = calculatePositions(initialScales);
    setCurrentScales(initialScales);
    setCurrentPositions(initialPositions);
  }, [config]);

  // RequestAnimationFrame physics loop with smooth lerping
  const animateToTarget = useCallback(() => {
    const targetScales = calculateTargetMagnification(mouseX);
    const targetPositions = calculatePositions(targetScales);
    const lerpFactor = mouseX !== null ? 0.22 : 0.14;

    setCurrentScales((prevScales) => {
      return prevScales.map((currentScale, index) => {
        const diff = targetScales[index] - currentScale;
        return currentScale + diff * lerpFactor;
      });
    });

    setCurrentPositions((prevPositions) => {
      return prevPositions.map((currentPos, index) => {
        const diff = targetPositions[index] - currentPos;
        return currentPos + diff * lerpFactor;
      });
    });

    const scalesNeedUpdate = currentScales.some(
      (scale, index) => Math.abs(scale - targetScales[index]) > 0.002
    );
    const positionsNeedUpdate = currentPositions.some(
      (pos, index) => Math.abs(pos - targetPositions[index]) > 0.1
    );

    if (scalesNeedUpdate || positionsNeedUpdate || mouseX !== null) {
      animationFrameRef.current = requestAnimationFrame(animateToTarget);
    }
  }, [mouseX, calculateTargetMagnification, calculatePositions, currentScales, currentPositions]);

  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(animateToTarget);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animateToTarget]);

  // Throttled mouse movement
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const now = performance.now();
      if (now - lastMouseMoveTime.current < 14) return;
      lastMouseMoveTime.current = now;

      if (dockRef.current) {
        const rect = dockRef.current.getBoundingClientRect();
        const pad = Math.max(10, baseIconSize * 0.2);
        setMouseX(e.clientX - rect.left - pad);
      }
    },
    [baseIconSize]
  );

  const handleMouseLeave = useCallback(() => {
    setMouseX(null);
    setHoveredItemId(null);
  }, []);

  // Mobile touch movement support
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length > 0 && dockRef.current) {
        const touch = e.touches[0];
        const rect = dockRef.current.getBoundingClientRect();
        const pad = Math.max(10, baseIconSize * 0.2);
        setMouseX(touch.clientX - rect.left - pad);
      }
    },
    [baseIconSize]
  );

  const handleTouchEnd = useCallback(() => {
    setMouseX(null);
    setHoveredItemId(null);
  }, []);

  // Authentic macOS click bounce
  const createBounceAnimation = (element: HTMLElement) => {
    const bounceHeight = Math.max(-14, -baseIconSize * 0.25);
    element.style.transition = 'transform 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    element.style.transform = `translateY(${bounceHeight}px)`;

    setTimeout(() => {
      element.style.transform = 'translateY(0px)';
    }, 180);
  };

  const handleItemClick = (item: DockItemConfig, index: number) => {
    if (iconRefs.current[index]) {
      createBounceAnimation(iconRefs.current[index]!);
    }
    item.onClick?.();
  };

  // Dynamic width of dock shelf
  const contentWidth =
    currentPositions.length > 0
      ? Math.max(
          ...currentPositions.map((pos, index) => {
            const isDiv = dockItems[index]?.isDivider;
            return pos + (isDiv ? 4 : (baseIconSize * currentScales[index]) / 2);
          })
        )
      : dockItems.length * (baseIconSize + baseSpacing) - baseSpacing;

  const padding = Math.max(10, baseIconSize * 0.2);

  return (
    <div className="relative inline-flex items-center justify-center select-none font-sans">
      {/* The Authentic macOS Dock Shelf */}
      <nav
        ref={dockRef}
        aria-label="Canvas Workspace Tools"
        className={twMerge(
          'relative backdrop-blur-2xl transition-shadow will-change-transform transform-gpu',
          className
        )}
        style={{
          width: `${contentWidth + padding * 2}px`,
          height: `${baseIconSize + padding * 1.6}px`,
          background: 'rgba(28, 32, 45, 0.72)',
          borderRadius: `${Math.max(18, baseIconSize * 0.55)}px`,
          border: '1px solid rgba(255, 255, 255, 0.16)',
          boxShadow: `
            0 20px 50px rgba(0, 0, 0, 0.45),
            0 4px 14px rgba(0, 0, 0, 0.30),
            inset 0 1px 0 rgba(255, 255, 255, 0.25),
            inset 0 -1px 0 rgba(0, 0, 0, 0.25)
          `,
          padding: `${padding * 0.8}px ${padding}px`,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {slotLeading}

        <div
          className="relative"
          style={{
            height: `${baseIconSize}px`,
            width: '100%',
          }}
        >
          {dockItems.map((item, index) => {
            const scale = currentScales[index] || 1;
            const position = currentPositions[index] || 0;
            const isDivider = item.isDivider;
            const isHovered = hoveredItemId === item.id;
            const Icon = item.icon;

            if (isDivider) {
              return (
                <div
                  key={item.id}
                  className="absolute flex items-center justify-center pointer-events-none"
                  style={{
                    left: `${position - 4}px`,
                    bottom: '0px',
                    width: '8px',
                    height: `${baseIconSize}px`,
                  }}
                >
                  <div className="h-6 w-[1.5px] bg-slate-400/40 dark:bg-white/20 rounded-full" />
                </div>
              );
            }

            const scaledSize = baseIconSize * scale;

            return (
              <div
                key={item.id}
                data-dock-tool={item.id}
                ref={(el) => {
                  iconRefs.current[index] = el;
                }}
                className="absolute cursor-pointer flex flex-col items-center justify-end"
                onMouseEnter={() => setHoveredItemId(item.id)}
                onMouseLeave={() => setHoveredItemId(null)}
                onClick={() => handleItemClick(item, index)}
                style={{
                  left: `${position - scaledSize / 2}px`,
                  bottom: '0px',
                  width: `${scaledSize}px`,
                  height: `${scaledSize}px`,
                  transformOrigin: 'bottom center',
                  zIndex: Math.round(scale * 10),
                }}
              >
                {/* macOS Tooltip Pill */}
                {isHovered && item.name && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, x: '-50%', scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
                    exit={{ opacity: 0, y: 8, x: '-50%', scale: 0.94 }}
                    transition={{ duration: 0.12 }}
                    className="absolute bottom-full mb-3 left-1/2 px-2.5 py-1 text-[11px] font-medium text-white bg-slate-900/90 dark:bg-black/90 rounded-md shadow-2xl border border-white/10 whitespace-nowrap pointer-events-none select-none z-50 backdrop-blur-md"
                  >
                    {item.name}
                  </motion.div>
                )}

                {/* macOS App Squircle Icon */}
                <div
                  className={clsx(
                    'relative w-full h-full rounded-2xl flex items-center justify-center transition-colors shadow-sm select-none',
                    item.isActive
                      ? 'bg-blue-600/25 text-blue-500 dark:text-blue-400 border border-blue-500/40 shadow-glow-blue'
                      : item.isMinimized
                      ? 'bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/40 shadow-glow-amber'
                      : 'bg-white/10 dark:bg-white/10 hover:bg-white/20 dark:hover:bg-white/20 border border-white/10 text-slate-800 dark:text-slate-100',
                    item.colorClass
                  )}
                  style={{
                    ...(item.isActive && accentColor
                      ? {
                          borderColor: accentColor,
                          backgroundColor: `rgba(var(--accent-rgb), 0.22)`,
                          boxShadow: `0 0 16px rgba(var(--accent-rgb), 0.4)`,
                          color: accentColor,
                        }
                      : item.isMinimized
                      ? {
                          borderColor: '#f59e0b',
                          boxShadow: '0 0 14px rgba(245, 158, 11, 0.45)',
                        }
                      : {}),
                    filter: `drop-shadow(0 ${
                      scale > 1.2 ? Math.max(3, baseIconSize * 0.08) : Math.max(1, baseIconSize * 0.03)
                    }px ${
                      scale > 1.2 ? Math.max(6, baseIconSize * 0.16) : Math.max(2, baseIconSize * 0.07)
                    }px rgba(0,0,0,${0.28 + (scale - 1) * 0.18}))`,
                  }}
                >
                  {Icon ? (
                    <Icon
                      className="w-[52%] h-[52%] transition-transform"
                    />
                  ) : item.customContent ? (
                    item.customContent
                  ) : null}

                  {/* Badge (e.g. current Pen/Brush color dot) */}
                  {item.badge && (
                    <div className="absolute top-1 right-1 pointer-events-none">
                      {item.badge}
                    </div>
                  )}

                  {/* Chevron for tools with submenus when active */}
                  {item.hasSubmenu && item.isActive && (
                    <ChevronDown className="absolute bottom-1 right-1 w-2.5 h-2.5 opacity-70" />
                  )}
                </div>

                {/* macOS Running / Minimized Indicator Dot */}
                {(item.isActive || item.isMinimized) && (
                  <div
                    className="absolute rounded-full pointer-events-none transition-all"
                    style={{
                      bottom: `${Math.max(-4, -baseIconSize * 0.08)}px`,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: `${Math.max(4, baseIconSize * 0.09)}px`,
                      height: `${Math.max(4, baseIconSize * 0.09)}px`,
                      backgroundColor: item.isMinimized ? '#f59e0b' : (accentColor || 'rgba(255, 255, 255, 0.95)'),
                      boxShadow: `0 0 6px ${item.isMinimized ? '#f59e0b' : (accentColor || 'rgba(255, 255, 255, 0.85)')}, 0 0 2px rgba(0, 0, 0, 0.5)`,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {slotTrailing}
      </nav>

      {/* Pen Settings Popover */}
      <AnimatePresence>
        {openPenSettings && activeTool === 'pen' && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute bottom-full mb-3 left-16 p-3.5 bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl flex flex-col gap-2.5 z-50 min-w-[180px] text-slate-900 dark:text-white pointer-events-auto select-none"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Pen Color
              </span>
              <button
                type="button"
                onClick={() => setOpenPenSettings(false)}
                className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-2">
              {PEN_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={clsx(
                    'w-5 h-5 rounded-full border transition-transform cursor-pointer',
                    penColor === c
                      ? 'scale-110 border-slate-900 dark:border-white shadow-sm ring-2 ring-blue-500/40'
                      : 'border-slate-300 dark:border-slate-600 hover:scale-110'
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => onPenColorChange?.(c)}
                />
              ))}
            </div>

            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pt-1">
              Stroke: {penStrokeWidth}px
            </div>
            <div className="flex items-center gap-1.5">
              {[1, 2, 4, 6].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => onPenStrokeWidthChange?.(w)}
                  className={clsx(
                    'px-2.5 py-1 text-xs rounded-lg border cursor-pointer font-medium transition-all flex-1 text-center',
                    penStrokeWidth === w
                      ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500'
                  )}
                >
                  {w}px
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Brush Settings Popover */}
      <AnimatePresence>
        {openBrushSettings && activeTool === 'brush' && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute bottom-full mb-3 left-28 p-3.5 bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl flex flex-col gap-2.5 z-50 min-w-[180px] text-slate-900 dark:text-white pointer-events-auto select-none"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Highlighter Color
              </span>
              <button
                type="button"
                onClick={() => setOpenBrushSettings(false)}
                className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-2">
              {BRUSH_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={clsx(
                    'w-5 h-5 rounded-full border transition-transform cursor-pointer',
                    brushColor === c
                      ? 'scale-110 border-slate-900 dark:border-white shadow-sm ring-2 ring-yellow-500/40'
                      : 'border-slate-300 dark:border-slate-600 hover:scale-110'
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => onBrushColorChange?.(c)}
                />
              ))}
            </div>

            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pt-1">
              Brush Size
            </div>
            <div className="flex items-center gap-1.5">
              {[
                { size: 1, label: 'S' },
                { size: 2, label: 'M' },
                { size: 4, label: 'L' },
                { size: 8, label: 'XL' },
              ].map(({ size: s, label }) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onBrushSizeChange?.(s)}
                  className={clsx(
                    'px-2.5 py-1 text-xs rounded-lg border cursor-pointer font-medium transition-all flex-1 text-center',
                    brushSize === s
                      ? 'border-yellow-500 text-yellow-600 dark:border-yellow-400 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/60 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CanvasToolbar;
