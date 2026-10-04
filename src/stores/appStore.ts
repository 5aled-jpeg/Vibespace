import { create } from 'zustand';
import { ActiveToolType } from '../components/toolbar/CanvasToolbar';

export interface AppState {
  roomId: string;
  isHost: boolean;
  activeTool: ActiveToolType;
  penColor: string;
  penStrokeWidth: number;
  brushColor: string;
  brushSize: number;
  // Media watch-party sync state
  syncMediaId: string | null;
  syncCurrentTime: number;
  syncIsPlaying: boolean;
  // UI state
  showVoiceDock: boolean;
  showToolbar: boolean;

  // Settings State
  isSettingsOpen: boolean;
  currentSettingsTab: string;
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  showAnimations: boolean;
  windowStyle: 'glass' | 'solid' | 'high-contrast';
  mediaSyncToleranceMs: number;
  codeFontSize: number;
  codeTheme: 'vs-dark' | 'vs-light';
  timeFormat: '12h' | '24h';
  language: string;
  canvasBackground: string;

  // Minimized Windows State (Mac Genie Effect)
  minimizedShapes: Array<{
    id: string;
    type: 'web' | 'video' | 'image' | 'table' | 'todo' | 'audio' | 'code' | 'pdf' | 'note';
    title: string;
  }>;
  minimizeShape: (shape: {
    id: string;
    type: 'web' | 'video' | 'image' | 'table' | 'todo' | 'audio' | 'code' | 'pdf' | 'note';
    title: string;
  }) => void;
  restoreShape: (id: string) => void;
  removeMinimizedShape: (id: string) => void;

  // Actions
  setRoomId: (id: string) => void;
  setIsHost: (isHost: boolean) => void;
  setActiveTool: (tool: ActiveToolType) => void;
  setPenColor: (color: string) => void;
  setPenStrokeWidth: (width: number) => void;
  setBrushColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  updateMediaSync: (mediaId: string, currentTime: number, isPlaying: boolean) => void;
  toggleVoiceDock: () => void;

  // Settings Actions
  openSettings: (tab?: string) => void;
  closeSettings: () => void;
  toggleSettings: () => void;
  setCurrentSettingsTab: (tab: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setAccentColor: (color: string) => void;
  setShowAnimations: (show: boolean) => void;
  setWindowStyle: (style: 'glass' | 'solid' | 'high-contrast') => void;
  setMediaSyncToleranceMs: (tolerance: number) => void;
  setCodeFontSize: (size: number) => void;
  setCodeTheme: (theme: 'vs-dark' | 'vs-light') => void;
  setTimeFormat: (format: '12h' | '24h') => void;
  setLanguage: (lang: string) => void;
  setCanvasBackground: (bg: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  roomId: 'Vibe-Lounge-Alpha',
  isHost: true,
  activeTool: 'select',
  penColor: '#58a6ff',
  penStrokeWidth: 3,
  brushColor: '#bc8cff',
  brushSize: 6,

  syncMediaId: 'video-node-1',
  syncCurrentTime: 0,
  syncIsPlaying: false,

  showVoiceDock: true,
  showToolbar: true,

  // Settings Defaults
  isSettingsOpen: false,
  currentSettingsTab: 'appearance',
  theme: 'dark',
  accentColor: '#3b82f6',
  showAnimations: true,
  windowStyle: 'glass',
  mediaSyncToleranceMs: 120,
  codeFontSize: 14,
  codeTheme: 'vs-dark',
  timeFormat: '24h',
  language: 'en',
  canvasBackground: 'grid',

  minimizedShapes: [],
  minimizeShape: (shape) =>
    set((state) => ({
      minimizedShapes: state.minimizedShapes.some((s) => s.id === shape.id)
        ? state.minimizedShapes
        : [...state.minimizedShapes, shape],
    })),
  restoreShape: (id) =>
    set((state) => ({
      minimizedShapes: state.minimizedShapes.filter((s) => s.id !== id),
    })),
  removeMinimizedShape: (id) =>
    set((state) => ({
      minimizedShapes: state.minimizedShapes.filter((s) => s.id !== id),
    })),

  setRoomId: (id) => set({ roomId: id }),
  setIsHost: (isHost) => set({ isHost }),
  setActiveTool: (activeTool) => set({ activeTool }),
  setPenColor: (penColor) => set({ penColor }),
  setPenStrokeWidth: (penStrokeWidth) => set({ penStrokeWidth }),
  setBrushColor: (brushColor) => set({ brushColor }),
  setBrushSize: (brushSize) => set({ brushSize }),
  updateMediaSync: (mediaId, currentTime, isPlaying) =>
    set({
      syncMediaId: mediaId,
      syncCurrentTime: currentTime,
      syncIsPlaying: isPlaying,
    }),
  toggleVoiceDock: () => set((state) => ({ showVoiceDock: !state.showVoiceDock })),

  openSettings: (tab) =>
    set((state) => ({
      isSettingsOpen: true,
      currentSettingsTab: tab || state.currentSettingsTab,
    })),
  closeSettings: () => set({ isSettingsOpen: false }),
  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
  setCurrentSettingsTab: (tab) => set({ currentSettingsTab: tab }),
  setTheme: (theme) => set({ theme }),
  setAccentColor: (accentColor) => set({ accentColor }),
  setShowAnimations: (showAnimations) => set({ showAnimations }),
  setWindowStyle: (windowStyle) => set({ windowStyle }),
  setMediaSyncToleranceMs: (mediaSyncToleranceMs) => set({ mediaSyncToleranceMs }),
  setCodeFontSize: (codeFontSize) => set({ codeFontSize }),
  setCodeTheme: (codeTheme) => set({ codeTheme }),
  setTimeFormat: (timeFormat) => set({ timeFormat }),
  setLanguage: (language) => set({ language }),
  setCanvasBackground: (canvasBackground) => set({ canvasBackground }),
}));
