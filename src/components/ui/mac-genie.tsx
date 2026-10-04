'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { toCanvas } from 'html-to-image';

// ─── Types ────────────────────────────────────────────────────────────────────
export type GenieDir = 'open' | 'minimize';
export type GenieToolType = 'web' | 'video' | 'image' | 'table' | 'todo' | 'audio' | 'code' | 'pdf' | 'note';

export interface Pt {
  x: number;
  y: number;
}

export interface GenieJob {
  id: string;
  toolType: GenieToolType;
  dir: GenieDir;
  dock: Pt;
  win: Pt;
  winW: number;
  winH: number;
  offscreenCanvas: HTMLCanvasElement;
  startTime: number;
  duration: number;
  onDone?: () => void;
}

// ─── Math Formulas (Authentic macOS Genie Effect) ─────────────────────────────
export const clamp = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v));

export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

export const eioC = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const eIn2 = (t: number): number => t * t;

export const eOut2 = (t: number): number => 1 - (1 - t) * (1 - t);

// ─── Scanline Renderer ────────────────────────────────────────────────────────
export function renderGenie(
  ctx: CanvasRenderingContext2D,
  off: HTMLCanvasElement | CanvasImageSource,
  W: number,
  H: number,
  rawT: number,
  dir: GenieDir,
  dock: Pt,
  win: Pt,
  winW: number,
  winH: number
): void {
  // Clear full canvas area
  ctx.clearRect(0, 0, W, H);

  // Slicing resolution: 1px for pixel-perfection
  const step = 1;
  const numSlices = Math.floor(winH / step);

  for (let i = 0; i < numSlices; i++) {
    const y = i * step;
    const r = y / winH;

    // Authentic macOS curvature delay:
    // In minimize: bottom slices sucked first (r=1 starts at 0, r=0 starts at 0.65)
    // In open: top slices expand first (r=0 starts at 0, r=1 starts at 0.65)
    const rowXStart = dir === 'minimize' ? (1 - r) * 0.65 : r * 0.65;
    const xP = clamp((rawT - rowXStart) / (1 - rowXStart), 0, 1);
    const xE = eioC(xP);

    const rowYStart = dir === 'minimize' ? (1 - r) * 0.2 : r * 0.2;
    const yP = clamp((rawT - rowYStart) / (1 - rowYStart), 0, 1);
    const yE = eIn2(yP);

    let left: number;
    let right: number;
    let destY: number;

    if (dir === 'minimize') {
      left = lerp(win.x, dock.x, xE);
      right = lerp(win.x + winW, dock.x, xE);
      destY = lerp(win.y + y, dock.y, yE);
    } else {
      left = lerp(dock.x, win.x, xE);
      right = lerp(dock.x, win.x + winW, xE);
      destY = lerp(dock.y, win.y + y, yE);
    }

    const rowW = right - left;
    if (rowW < 0.8) continue;

    ctx.drawImage(off as any, 0, y, winW, step, left, destY, rowW, step);
  }

  // Authentic macOS glowing neon aura puff at dock opening
  const glowRaw = dir === 'minimize' ? rawT : 1 - rawT;
  if (glowRaw > 0.68) {
    const a = eOut2((glowRaw - 0.68) / 0.32) * 0.55;
    const hex = Math.round(a * 255)
      .toString(16)
      .padStart(2, '0');

    const g = ctx.createRadialGradient(dock.x, dock.y, 0, dock.x, dock.y, 75);
    g.addColorStop(0, `#ffffff${hex}`);
    g.addColorStop(0.35, `#38bdf8${hex}`);
    g.addColorStop(0.7, `#6366f1${Math.round(a * 140).toString(16).padStart(2, '0')}`);
    g.addColorStop(1, 'transparent');

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
}

// ─── High-Fidelity Tool Texture Generator ─────────────────────────────────────
// Generates authentic visionOS window cards on offscreen canvas with traffic lights,
// headers, gradients, and custom tool layouts.
const textureCache: Record<string, HTMLCanvasElement> = {};

export function getOrCreateToolTexture(
  type: GenieToolType,
  width: number,
  height: number,
  theme: 'dark' | 'light' = 'dark'
): HTMLCanvasElement {
  const key = `${type}-${width}x${height}-${theme}`;
  if (textureCache[key]) {
    return textureCache[key];
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(10, Math.round(width));
  canvas.height = Math.max(10, Math.round(height));
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const w = canvas.width;
  const h = canvas.height;
  const isLight = theme === 'light';

  // 1. Rounded Card Background
  const radius = type === 'audio' ? 28 : 20;
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(0, 0, w, h, radius);
  } else {
    ctx.rect(0, 0, w, h);
  }
  ctx.clip();

  // Glass background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  if (isLight) {
    bgGrad.addColorStop(0, '#ffffff');
    bgGrad.addColorStop(1, '#f1f5f9');
  } else {
    bgGrad.addColorStop(0, '#131929');
    bgGrad.addColorStop(1, '#0d111d');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. Card Header (macOS Traffic Lights + Title)
  const headerH = 40;
  ctx.fillStyle = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
  ctx.fillRect(0, 0, w, headerH);

  // Header separator line
  ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.09)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, headerH);
  ctx.lineTo(w, headerH);
  ctx.stroke();

  // Traffic Light Circles
  // Red (Close)
  ctx.fillStyle = '#ff5f56';
  ctx.beginPath();
  ctx.arc(18, 20, 5.5, 0, Math.PI * 2);
  ctx.fill();

  // Yellow (Minimize)
  ctx.fillStyle = '#ffbd2e';
  ctx.beginPath();
  ctx.arc(36, 20, 5.5, 0, Math.PI * 2);
  ctx.fill();

  // Green (Maximize)
  ctx.fillStyle = '#27c93f';
  ctx.beginPath();
  ctx.arc(54, 20, 5.5, 0, Math.PI * 2);
  ctx.fill();

  // Title Text
  const titles: Record<GenieToolType, string> = {
    web: 'Web Space',
    video: 'New Video Stream',
    image: 'New Photo Canvas',
    table: 'Project Data Grid',
    todo: 'Action Items',
    audio: 'Music Player',
    code: 'JS/TS Code Runner',
    pdf: 'PDF Document Viewer',
    note: 'Note Adder',
  };

  ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
  ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(titles[type], 74, 24);

  // 3. Tool Specific Interior Content
  if (type === 'video') {
    // Dropzone / Preview
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(24, 60, w - 48, h - 140);
    ctx.setLineDash([]);

    // Video Play Circle Icon
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2 - 20, 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(w / 2 - 8, h / 2 - 30);
    ctx.lineTo(w / 2 + 12, h / 2 - 20);
    ctx.lineTo(w / 2 - 8, h / 2 - 10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
    ctx.font = '500 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Drag & Drop Video Stream or MP4', w / 2, h / 2 + 28);
    ctx.textAlign = 'left';

    // Preset chips
    const chipW = 100;
    const chipH = 26;
    ['Lofi Chill', 'Ambient Rain', 'Cyber Live'].forEach((label, i) => {
      const cx = 32 + i * 116;
      const cy = h - 54;
      ctx.fillStyle = isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)';
      if (ctx.roundRect) ctx.roundRect(cx, cy, chipW, chipH, 6);
      else ctx.rect(cx, cy, chipW, chipH);
      ctx.fill();

      ctx.fillStyle = isLight ? '#334155' : '#cbd5e1';
      ctx.font = '11px sans-serif';
      ctx.fillText(label, cx + 18, cy + 17);
    });
  } else if (type === 'audio') {
    // Vinyl Record Top Overflow
    ctx.fillStyle = '#090a0f';
    ctx.beginPath();
    ctx.arc(w / 2, 110, 80, 0, Math.PI * 2);
    ctx.fill();

    // Vinyl grooves
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    [65, 50, 36, 22].forEach((r) => {
      ctx.beginPath();
      ctx.arc(w / 2, 110, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Center spindle label
    ctx.fillStyle = '#8b5cf6';
    ctx.beginPath();
    ctx.arc(w / 2, 110, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(w / 2, 110, 4, 0, Math.PI * 2);
    ctx.fill();

    // Track text
    ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Midnight Lo-Fi Chill', w / 2, 230);

    ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('Spatial Audio Session', w / 2, 250);

    // Scrubber track
    ctx.fillStyle = isLight ? '#cbd5e1' : 'rgba(255,255,255,0.14)';
    if (ctx.roundRect) ctx.roundRect(36, 290, w - 72, 4, 2);
    else ctx.rect(36, 290, w - 72, 4);
    ctx.fill();

    ctx.fillStyle = '#8b5cf6';
    if (ctx.roundRect) ctx.roundRect(36, 290, (w - 72) * 0.42, 4, 2);
    else ctx.rect(36, 290, (w - 72) * 0.42, 4);
    ctx.fill();

    // Circular Play Button
    ctx.fillStyle = isLight ? '#0f172a' : '#ffffff';
    ctx.beginPath();
    ctx.arc(w / 2, 350, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isLight ? '#ffffff' : '#0f172a';
    ctx.beginPath();
    ctx.moveTo(w / 2 - 6, 340);
    ctx.lineTo(w / 2 + 8, 350);
    ctx.lineTo(w / 2 - 6, 360);
    ctx.closePath();
    ctx.fill();

    // YouTube-style volume bar
    ctx.fillStyle = isLight ? '#64748b' : '#a855f7';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('VOLUME 85%', w / 2, 420);
    ctx.textAlign = 'left';
  } else if (type === 'image') {
    // Photo Canvas Dropzone
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(24, 60, w - 48, h - 84);
    ctx.setLineDash([]);

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2 - 20, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
    ctx.font = '600 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Photo & Moodboard Canvas', w / 2, h / 2 + 24);

    ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('Drop image files or paste screenshot', w / 2, h / 2 + 46);
    ctx.textAlign = 'left';
  } else if (type === 'web') {
    // Safari address bar
    const barW = w - 160;
    ctx.fillStyle = isLight ? '#e2e8f0' : 'rgba(0,0,0,0.45)';
    if (ctx.roundRect) ctx.roundRect(110, 8, barW, 24, 12);
    else ctx.rect(110, 8, barW, 24);
    ctx.fill();

    ctx.fillStyle = isLight ? '#475569' : '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText('🔒 https://en.wikipedia.org/wiki/Infinite_canvas', 124, 24);

    // Browser body preview
    ctx.fillStyle = isLight ? '#ffffff' : '#1e293b';
    ctx.fillRect(20, 56, w - 40, h - 76);

    ctx.fillStyle = isLight ? '#0f172a' : '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Infinite Canvas Interface', 40, 94);

    ctx.fillStyle = isLight ? '#475569' : '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('An infinite canvas or spatial zoomable user interface...', 40, 124);
    ctx.fillText('Nodes, multimedia windows, and collaborative workspaces.', 40, 144);
  } else if (type === 'table') {
    // Table spreadsheet header & rows
    const cols = ['Task Name', 'Assignee', 'Status', 'Priority'];
    const colW = (w - 48) / cols.length;

    // Header row
    ctx.fillStyle = isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)';
    ctx.fillRect(24, 56, w - 48, 28);

    cols.forEach((col, i) => {
      ctx.fillStyle = isLight ? '#334155' : '#cbd5e1';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(col, 34 + i * colW, 74);
    });

    // Sample rows
    const rowData = [
      ['Design System v2', 'Maya', 'Completed', 'High'],
      ['Mac Genie Scanlines', 'Antigravity', 'In Progress', 'Urgent'],
      ['Sound Modifier EQ', 'Audio Team', 'Done', 'Medium'],
      ['Infinite Grid Mesh', 'Spatial Dev', 'Review', 'Normal'],
    ];

    rowData.forEach((row, ri) => {
      const ry = 92 + ri * 36;
      ctx.fillStyle = ri % 2 === 0 ? (isLight ? '#ffffff' : 'rgba(255,255,255,0.02)') : 'transparent';
      ctx.fillRect(24, ry - 6, w - 48, 32);

      row.forEach((cell, ci) => {
        if (ci === 2) {
          // Status badge
          ctx.fillStyle = cell === 'Completed' || cell === 'Done' ? '#10b981' : '#f59e0b';
          if (ctx.roundRect) ctx.roundRect(34 + ci * colW, ry, 70, 20, 4);
          else ctx.rect(34 + ci * colW, ry, 70, 20);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText(cell, 42 + ci * colW, ry + 14);
        } else {
          ctx.fillStyle = isLight ? '#1e293b' : '#e2e8f0';
          ctx.font = '11px sans-serif';
          ctx.fillText(cell, 34 + ci * colW, ry + 14);
        }
      });
    });
  } else if (type === 'todo') {
    // Todo card tasks
    const tasks = [
      { text: 'Implement authentic Mac Genie scanlines', done: true },
      { text: 'Add dock spring bounce physics', done: true },
      { text: 'Add YouTube-style sound leveler', done: true },
      { text: 'Add smooth cubic zoom animation', done: true },
      { text: 'Test spatial workspace node minimizing', done: false },
    ];

    tasks.forEach((t, i) => {
      const ty = 68 + i * 42;
      // Checkbox circle
      ctx.fillStyle = t.done ? '#0ea5e9' : 'rgba(255,255,255,0.12)';
      ctx.beginPath();
      ctx.arc(42, ty + 10, 8, 0, Math.PI * 2);
      ctx.fill();

      if (t.done) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(42, ty + 10, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = t.done
        ? isLight ? '#94a3b8' : '#64748b'
        : isLight ? '#0f172a' : '#f8fafc';
      ctx.font = t.done ? '12px sans-serif' : '500 13px sans-serif';
      ctx.fillText(t.text, 62, ty + 14);

      if (t.done) {
        const textW = ctx.measureText(t.text).width;
        ctx.strokeStyle = isLight ? '#94a3b8' : '#64748b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(62, ty + 10);
        ctx.lineTo(62 + textW, ty + 10);
        ctx.stroke();
      }
    });
  } else if (type === 'code') {
    // Monaco Code Runner Editor Preview
    const editorBg = isLight ? '#f8fafc' : '#0b0f19';
    ctx.fillStyle = editorBg;
    if (ctx.roundRect) ctx.roundRect(20, 52, w - 40, h - 72, 8);
    else ctx.rect(20, 52, w - 40, h - 72);
    ctx.fill();

    // Gutter line
    ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(56, 52);
    ctx.lineTo(56, h - 20);
    ctx.stroke();

    // Line numbers
    ctx.font = '11px "JetBrains Mono", Consolas, Menlo, monospace';
    ctx.fillStyle = isLight ? '#94a3b8' : '#475569';
    for (let i = 1; i <= 8; i++) {
      ctx.fillText(`${i}`, 34, 56 + i * 22);
    }

    // Syntax-highlighted code lines
    const codeLines = [
      { color: isLight ? '#16a34a' : '#4ade80', text: '// Spatial JS/TS Interactive Node' },
      { color: isLight ? '#9333ea' : '#c084fc', text: 'const' },
      { color: isLight ? '#2563eb' : '#60a5fa', text: ' matrix = [1, 2, 3, 4];' },
      { color: isLight ? '#9333ea' : '#c084fc', text: 'const' },
      { color: isLight ? '#2563eb' : '#60a5fa', text: ' transformed = matrix.map(n => n * 2);' },
      { color: isLight ? '#e11d48' : '#f43f5e', text: 'console.log("Matrix Ready:", transformed);' },
      { color: isLight ? '#059669' : '#34d399', text: 'return { status: 200, meshSync: true };' },
    ];

    let lineY = 78;
    codeLines.forEach((item, idx) => {
      ctx.fillStyle = item.color;
      ctx.fillText(item.text, 68, lineY);
      lineY += 22;
    });

    // Run button pill in header
    ctx.fillStyle = '#10b981';
    if (ctx.roundRect) ctx.roundRect(w - 110, 8, 80, 24, 6);
    else ctx.rect(w - 110, 8, 80, 24);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('▶ Run Code', w - 100, 24);
  } else if (type === 'pdf') {
    // PDF Document Sheet Preview
    const sheetX = 36;
    const sheetY = 56;
    const sheetW = w - 72;
    const sheetH = h - 80;

    // White paper sheet
    ctx.fillStyle = isLight ? '#ffffff' : '#f8fafc';
    if (ctx.roundRect) ctx.roundRect(sheetX, sheetY, sheetW, sheetH, 6);
    else ctx.rect(sheetX, sheetY, sheetW, sheetH);
    ctx.fill();

    // Red PDF badge
    ctx.fillStyle = '#ef4444';
    if (ctx.roundRect) ctx.roundRect(sheetX + 24, sheetY + 20, 36, 18, 4);
    else ctx.rect(sheetX + 24, sheetY + 20, 36, 18);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('PDF', sheetX + 33, sheetY + 33);

    // Document Title
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('Specification Document', sheetX + 70, sheetY + 35);

    // Paragraph text lines
    ctx.fillStyle = '#94a3b8';
    const textLineWidth = sheetW - 48;
    for (let i = 0; i < 6; i++) {
      const lineLen = i === 2 || i === 5 ? textLineWidth * 0.6 : textLineWidth;
      if (ctx.roundRect) ctx.roundRect(sheetX + 24, sheetY + 68 + i * 16, lineLen, 6, 3);
      else ctx.rect(sheetX + 24, sheetY + 68 + i * 16, lineLen, 6);
      ctx.fill();
    }

    // Page number badge
    ctx.fillStyle = '#e2e8f0';
    if (ctx.roundRect) ctx.roundRect(sheetX + sheetW / 2 - 40, sheetY + sheetH - 28, 80, 18, 4);
    else ctx.rect(sheetX + sheetW / 2 - 40, sheetY + sheetH - 28, 80, 18);
    ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.font = '10px sans-serif';
    ctx.fillText('Page 1 of 12', sheetX + sheetW / 2 - 28, sheetY + sheetH - 16);
  }

  // 4. Subtle Outer Border
  ctx.restore();
  ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(0.75, 0.75, w - 1.5, h - 1.5, radius);
  } else {
    ctx.rect(0.75, 0.75, w - 1.5, h - 1.5);
  }
  ctx.stroke();

  textureCache[key] = canvas;
  return canvas;
}

// ─── Live Window Snapshot Capture (with html-to-image) ────────────────────────
export async function captureWindowTexture(
  element: HTMLElement,
  fallbackType: GenieToolType,
  w: number,
  h: number
): Promise<HTMLCanvasElement> {
  try {
    const canvas = await toCanvas(element, {
      pixelRatio: 1,
      cacheBust: false,
    });
    return canvas;
  } catch {
    // If element is tainted (e.g. cross-origin iframe) or unrendered, fallback to high-fidelity template
    return getOrCreateToolTexture(fallbackType, w, h);
  }
}

// ─── Global Animation Dispatcher ──────────────────────────────────────────────
type Listener = (job: GenieJob) => void;
const listeners = new Set<Listener>();

export const triggerGenieEffect = ({
  toolType,
  dir,
  dock,
  win,
  winW,
  winH,
  texture,
  duration = 480,
  onDone,
}: {
  toolType: GenieToolType;
  dir: GenieDir;
  dock: Pt;
  win: Pt;
  winW: number;
  winH: number;
  texture?: HTMLCanvasElement;
  duration?: number;
  onDone?: () => void;
}) => {
  const offscreenCanvas = texture || getOrCreateToolTexture(toolType, winW, winH);
  const job: GenieJob = {
    id: `${toolType}-${Date.now()}-${Math.random()}`,
    toolType,
    dir,
    dock,
    win,
    winW,
    winH,
    offscreenCanvas,
    startTime: performance.now(),
    duration,
    onDone,
  };

  if (listeners.size === 0) {
    onDone?.();
    return;
  }

  listeners.forEach((fn) => {
    try {
      fn(job);
    } catch (err) {
      console.warn('[Genie] Listener execution error:', err);
    }
  });
};

// ─── Genie Overlay Component ──────────────────────────────────────────────────
export function GenieEffectOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeJobsRef = useRef<GenieJob[]>([]);
  const rafRef = useRef<number | null>(null);

  const renderFrame = useCallback((now: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = window.innerWidth;
    const H = window.innerHeight;

    // Clear background
    ctx.clearRect(0, 0, W, H);

    const remainingJobs: GenieJob[] = [];

    activeJobsRef.current.forEach((job) => {
      const elapsed = now - job.startTime;
      const rawT = clamp(elapsed / job.duration, 0, 1);

      renderGenie(
        ctx,
        job.offscreenCanvas,
        W,
        H,
        rawT,
        job.dir,
        job.dock,
        job.win,
        job.winW,
        job.winH
      );

      if (rawT < 1) {
        remainingJobs.push(job);
      } else {
        job.onDone?.();
      }
    });

    activeJobsRef.current = remainingJobs;

    if (remainingJobs.length > 0) {
      rafRef.current = requestAnimationFrame(renderFrame);
    } else {
      ctx.clearRect(0, 0, W, H);
      rafRef.current = null;
    }
  }, []);

  const handleNewJob = useCallback(
    (job: GenieJob) => {
      activeJobsRef.current.push(job);
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(renderFrame);
      }
    },
    [renderFrame]
  );

  useEffect(() => {
    listeners.add(handleNewJob);
    return () => {
      listeners.delete(handleNewJob);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [handleNewJob]);

  // Handle high-DPI resize
  useEffect(() => {
    const updateSize = () => {
      const c = canvasRef.current;
      if (!c) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = window.innerWidth * dpr;
      c.height = window.innerHeight * dpr;
      const ctx = c.getContext('2d');
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{
        width: '100%',
        height: '100%',
      }}
    />
  );
}

export default GenieEffectOverlay;
