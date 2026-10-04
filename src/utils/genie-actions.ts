import { Editor } from 'tldraw';
import { useAppStore } from '../stores/appStore';
import {
  triggerGenieEffect,
  captureWindowTexture,
  getOrCreateToolTexture,
  GenieToolType,
  Pt,
} from '../components/ui/mac-genie';

export interface MinimizeOptions {
  shapeId: string;
  toolType: GenieToolType;
  title: string;
  editor: Editor;
  element?: HTMLElement | null;
}

export interface RestoreOptions {
  shapeId: string;
  toolType: GenieToolType;
  editor: Editor;
}

export interface SpawnGenieOptions {
  toolType: GenieToolType;
  editor: Editor;
  targetShape: {
    w: number;
    h: number;
  };
  targetPos?: {
    x: number;
    y: number;
  };
  onSpawn: () => void;
}

// Locate dock icon center in screen coordinates
export function getDockIconCenter(toolType: GenieToolType): Pt {
  const el = document.querySelector(`[data-dock-tool="${toolType}"]`);
  if (el) {
    const rect = el.getBoundingClientRect();
    return {
      x: Math.round(rect.left + rect.width / 2),
      y: Math.round(rect.top + rect.height / 2),
    };
  }

  // Fallback to bottom center of screen
  return {
    x: Math.round(window.innerWidth / 2),
    y: Math.round(window.innerHeight - 35),
  };
}

// Minimize an active window to the dock with Mac Genie Effect
export async function minimizeShapeWithGenie({
  shapeId,
  toolType,
  title,
  editor,
  element,
}: MinimizeOptions) {
  const showAnimations = useAppStore.getState().showAnimations;
  const dock = getDockIconCenter(toolType);

  let win = { x: 0, y: 0 };
  let winW = 400;
  let winH = 300;

  const targetEl = element || document.getElementById(shapeId);
  if (targetEl) {
    const rect = targetEl.getBoundingClientRect();
    win = { x: Math.round(rect.left), y: Math.round(rect.top) };
    winW = Math.round(rect.width);
    winH = Math.round(rect.height);
  } else {
    try {
      const shape = editor.getShape(shapeId as any);
      if (shape) {
        const screenPoint = editor.pageToScreen({ x: shape.x, y: shape.y });
        const zoom = editor.getZoomLevel();
        const sw = ((shape.props as any)?.w || 400) * zoom;
        const sh = ((shape.props as any)?.h || 300) * zoom;
        win = { x: Math.round(screenPoint.x), y: Math.round(screenPoint.y) };
        winW = Math.round(sw);
        winH = Math.round(sh);
      }
    } catch {
      win = { x: Math.round((window.innerWidth - winW) / 2), y: Math.round((window.innerHeight - winH) / 2) };
    }
  }

  if (!showAnimations) {
    useAppStore.getState().minimizeShape({ id: shapeId, type: toolType, title });
    return;
  }

  // Snapshot or fallback texture
  let texture: HTMLCanvasElement;
  if (targetEl) {
    texture = await captureWindowTexture(targetEl, toolType, winW, winH);
  } else {
    texture = getOrCreateToolTexture(toolType, winW, winH);
  }

  // Hide the shape in tldraw immediately as the genie vacuum starts
  useAppStore.getState().minimizeShape({ id: shapeId, type: toolType, title });

  // Play Genie Minimize Animation
  triggerGenieEffect({
    toolType,
    dir: 'minimize',
    dock,
    win,
    winW,
    winH,
    texture,
    duration: 460,
  });
}

// Restore a minimized window from the dock with Mac Genie Effect
export function restoreShapeWithGenie({
  shapeId,
  toolType,
  editor,
}: RestoreOptions) {
  const showAnimations = useAppStore.getState().showAnimations;
  const dock = getDockIconCenter(toolType);

  let win = { x: 0, y: 0 };
  let winW = 400;
  let winH = 300;

  try {
    const shape = editor.getShape(shapeId as any);
    if (shape) {
      const screenPoint = editor.pageToScreen({ x: shape.x, y: shape.y });
      const zoom = editor.getZoomLevel();
      const sw = ((shape.props as any)?.w || 400) * zoom;
      const sh = ((shape.props as any)?.h || 300) * zoom;
      win = { x: Math.round(screenPoint.x), y: Math.round(screenPoint.y) };
      winW = Math.round(sw);
      winH = Math.round(sh);
    }
  } catch {
    win = { x: Math.round((window.innerWidth - winW) / 2), y: Math.round((window.innerHeight - winH) / 2) };
  }

  if (!showAnimations) {
    useAppStore.getState().restoreShape(shapeId);
    try {
      editor.setSelectedShapes([shapeId as any]);
    } catch {
      // safe fallback
    }
    return;
  }

  const texture = getOrCreateToolTexture(toolType, winW, winH);

  triggerGenieEffect({
    toolType,
    dir: 'open',
    dock,
    win,
    winW,
    winH,
    texture,
    duration: 480,
    onDone: () => {
      useAppStore.getState().restoreShape(shapeId);
      try {
        editor.setSelectedShapes([shapeId as any]);
      } catch {
        // safe fallback
      }
    },
  });
}

// Spawn a new window with Mac Genie Effect
export function spawnShapeWithGenie({
  toolType,
  editor,
  targetShape,
  targetPos,
  onSpawn,
}: SpawnGenieOptions) {
  const showAnimations = useAppStore.getState().showAnimations;
  const dock = getDockIconCenter(toolType);

  const viewport = editor.getViewportPageBounds();
  const centerX = viewport.minX + viewport.width / 2;
  const centerY = viewport.minY + viewport.height / 2;

  const pageX = targetPos ? targetPos.x : centerX - targetShape.w / 2;
  const pageY = targetPos ? targetPos.y : centerY - targetShape.h / 2;

  const screenPoint = editor.pageToScreen({ x: pageX, y: pageY });
  const zoom = editor.getZoomLevel();
  const winW = Math.round(targetShape.w * zoom);
  const winH = Math.round(targetShape.h * zoom);
  const win = { x: Math.round(screenPoint.x), y: Math.round(screenPoint.y) };

  if (!showAnimations) {
    onSpawn();
    return;
  }

  const texture = getOrCreateToolTexture(toolType, winW, winH);

  triggerGenieEffect({
    toolType,
    dir: 'open',
    dock,
    win,
    winW,
    winH,
    texture,
    duration: 480,
    onDone: () => {
      onSpawn();
    },
  });
}

export interface CascadeOptions {
  editor: Editor;
  shapeType: string;
  width: number;
  height: number;
  stepX?: number;
  stepY?: number;
  maxSteps?: number;
}

interface PendingSpawn {
  shapeType: string;
  x: number;
  y: number;
  timestamp: number;
}

const pendingSpawns: PendingSpawn[] = [];

/**
 * Adapts window default dimensions to fit gracefully within mobile / smaller screen viewports.
 */
export function getAdaptiveWindowDimensions(baseW: number, baseH: number): { w: number; h: number } {
  if (typeof window === 'undefined') return { w: baseW, h: baseH };
  const winW = window.innerWidth;
  const winH = window.innerHeight;
  const isMobile = winW < 768;

  if (!isMobile) return { w: baseW, h: baseH };

  // On mobile (<768px), keep windows responsive with breathing margin for titlebar & dock
  const maxW = Math.max(280, winW - 28);
  const maxH = Math.max(300, winH - 150);

  return {
    w: Math.min(baseW, maxW),
    h: Math.min(baseH, maxH),
  };
}

/**
 * Calculates a cascading position for a newly spawned window so multiple instances
 * of an application appear staggered diagonally down and to the right (like macOS window cascade),
 * instead of stacking exactly on top of each other.
 */
export function getCascadedSpawnPosition({
  editor,
  shapeType,
  width,
  height,
  stepX = 36,
  stepY = 36,
  maxSteps = 8,
}: CascadeOptions): { x: number; y: number } {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const actualStepX = isMobile ? Math.min(stepX, 16) : stepX;
  const actualStepY = isMobile ? Math.min(stepY, 16) : stepY;
  const actualMaxSteps = isMobile ? Math.min(maxSteps, 4) : maxSteps;

  const viewport = editor.getViewportPageBounds();
  const centerX = viewport.minX + viewport.width / 2;
  const centerY = viewport.minY + viewport.height / 2;

  // Base centered position in the current viewport
  const baseX = Math.round(centerX - width / 2);
  const baseY = Math.round(centerY - height / 2);

  // Prune pending spawns older than 4 seconds
  const now = Date.now();
  for (let i = pendingSpawns.length - 1; i >= 0; i--) {
    if (now - pendingSpawns[i].timestamp > 4000) {
      pendingSpawns.splice(i, 1);
    }
  }

  // Find all existing shapes on canvas of this application type
  const existingShapes = editor
    .getCurrentPageShapes()
    .filter((s) => s.type === shapeType);

  // Combine both live canvas shapes and any rapidly-clicked pending spawns
  const occupiedPositions: Array<{ x: number; y: number }> = [
    ...existingShapes.map((s) => ({ x: s.x, y: s.y })),
    ...pendingSpawns
      .filter((p) => p.shapeType === shapeType)
      .map((p) => ({ x: p.x, y: p.y })),
  ];

  const THRESHOLD = 24;

  // Test candidate cascade steps (0, 1, 2, ... actualMaxSteps - 1)
  for (let step = 0; step < actualMaxSteps; step++) {
    const candidateX = baseX + step * actualStepX;
    const candidateY = baseY + step * actualStepY;

    // Check if candidate would push window past viewport boundaries
    const fitsInViewport =
      candidateX + width <= viewport.maxX - 20 &&
      candidateY + height <= viewport.maxY - 40;

    if (!fitsInViewport && step > 0) {
      break;
    }

    const isOccupied = occupiedPositions.some((pos) => {
      return (
        Math.abs(pos.x - candidateX) < THRESHOLD &&
        Math.abs(pos.y - candidateY) < THRESHOLD
      );
    });

    if (!isOccupied) {
      pendingSpawns.push({ shapeType, x: candidateX, y: candidateY, timestamp: now });
      return { x: candidateX, y: candidateY };
    }
  }

  // If all tested cascade steps are occupied, wrap around with a modular step
  const count = occupiedPositions.length;
  const wrappedStep = count % actualMaxSteps;
  let finalX = baseX + wrappedStep * actualStepX;
  let finalY = baseY + wrappedStep * actualStepY;

  // Ensure it doesn't push completely outside the visible viewport
  if (finalX + width > viewport.maxX - 20) {
    finalX = Math.max(viewport.minX + 20, viewport.maxX - width - 20);
  }
  if (finalY + height > viewport.maxY - 40) {
    finalY = Math.max(viewport.minY + 20, viewport.maxY - height - 40);
  }

  pendingSpawns.push({ shapeType, x: finalX, y: finalY, timestamp: now });
  return { x: finalX, y: finalY };
}
