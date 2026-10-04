import React, { useRef, useCallback, useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tldraw,
  Editor,
  createShapeId,
  TLUiComponents,
  DefaultColorStyle,
  DefaultSizeStyle,
  TLDefaultColorStyle,
  TLDefaultSizeStyle,
} from 'tldraw';
import VideoShapeUtil from './shapes/VideoShape';
import AudioShapeUtil from './shapes/AudioShape';
import ImageShapeUtil from './shapes/ImageShape';
import WebEmbedShapeUtil from './shapes/WebEmbedShape';
import CodeRunnerShapeUtil from './shapes/CodeRunnerShape';
import PdfShapeUtil from './shapes/PdfShape';
import TableShapeUtil from './shapes/TableShape';
import TodoShapeUtil from './shapes/TodoShape';
import NoteShapeUtil from './shapes/NoteShape';
import CanvasToolbar, { ActiveToolType } from '../components/toolbar/CanvasToolbar';
import { CanvasLeftControls, CanvasZoomControls } from '../components/canvas/CanvasCornerControls';
import VoiceDock from '../components/hangout/VoiceDock';
import SettingsModal from '../components/settings/SettingsModal';
import { useAppStore } from '../stores/appStore';
import { processDroppedFiles } from '../services/local-media';
import { CustomRichTextToolbar } from '../components/ui/toolbar';
import { GenieEffectOverlay } from '../components/ui/mac-genie';
import {
  spawnShapeWithGenie,
  restoreShapeWithGenie,
  getCascadedSpawnPosition,
  getAdaptiveWindowDimensions,
} from '../utils/genie-actions';
import { cleanUpCanvas } from '../utils/canvas-organizer';
import {
  setActiveEditor,
  saveEnvironment,
  saveEnvironmentSync,
  loadSavedEnvironment,
  exportEnvironmentToFile,
} from '../services/environment-persistence';
import SaveNotificationToast from '../components/ui/SaveNotificationToast';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

const customShapeUtils = [
  VideoShapeUtil,
  AudioShapeUtil,
  ImageShapeUtil,
  WebEmbedShapeUtil,
  CodeRunnerShapeUtil,
  PdfShapeUtil,
  TableShapeUtil,
  TodoShapeUtil,
  NoteShapeUtil,
];

// Hide tldraw default chrome so our atomic custom UI controls everything
const components: TLUiComponents = {
  Toolbar: null,
  ActionsMenu: null,
  HelpMenu: null,
  MainMenu: null,
  NavigationPanel: null,
  PageMenu: null,
  QuickActions: null,
  StylePanel: null,
  ZoomMenu: null,
  ContextMenu: null,
  RichTextToolbar: CustomRichTextToolbar,
};

// Map user hex color to tldraw color tokens
const mapHexToTldrawColor = (hex: string): TLDefaultColorStyle => {
  switch (hex.toLowerCase()) {
    case '#58a6ff':
      return 'blue';
    case '#bc8cff':
      return 'violet';
    case '#3fb950':
      return 'green';
    case '#f85149':
      return 'red';
    case '#d29922':
      return 'orange';
    case '#f0f6fc':
    case '#ffffff':
      return 'grey';
    case '#000000':
    case '#0f172a':
      return 'black';
    default:
      return 'blue';
  }
};

const mapPenWidthToTldrawSize = (width: number): TLDefaultSizeStyle => {
  if (width <= 1) return 's';
  if (width <= 2) return 'm';
  if (width <= 4) return 'l';
  return 'xl';
};

const mapBrushSizeToTldrawSize = (size: number): TLDefaultSizeStyle => {
  if (size <= 2) return 's';
  if (size <= 4) return 'm';
  if (size <= 8) return 'l';
  return 'xl';
};

export function CanvasRoot() {
  const editorRef = useRef<Editor | null>(null);
  const activeTool = useAppStore((s) => s.activeTool);
  const setActiveTool = useAppStore((s) => s.setActiveTool);
  const penColor = useAppStore((s) => s.penColor);
  const setPenColor = useAppStore((s) => s.setPenColor);
  const penStrokeWidth = useAppStore((s) => s.penStrokeWidth);
  const setPenStrokeWidth = useAppStore((s) => s.setPenStrokeWidth);
  const brushColor = useAppStore((s) => s.brushColor);
  const setBrushColor = useAppStore((s) => s.setBrushColor);
  const brushSize = useAppStore((s) => s.brushSize);
  const setBrushSize = useAppStore((s) => s.setBrushSize);
  const showVoiceDock = useAppStore((s) => s.showVoiceDock);
  const roomId = useAppStore((s) => s.roomId);
  const openSettings = useAppStore((s) => s.openSettings);
  const toggleSettings = useAppStore((s) => s.toggleSettings);
  const theme = useAppStore((s) => s.theme);
  const minimizedShapes = useAppStore((s) => s.minimizedShapes);
  const canvasBackground = useAppStore((s) => s.canvasBackground);

  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const handleResetZoom = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.resetZoom(undefined, { animation: { duration: 300 } });
  }, []);

  const handleBackToCenter = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.setCamera({ x: 0, y: 0, z: 1 }, { animation: { duration: 350 } });
  }, []);

  const handleCleanUpCanvas = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    cleanUpCanvas(editor);
  }, []);

  // Global keyboard shortcut: Ctrl+Shift+C to Clean Up Canvas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        handleCleanUpCanvas();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCleanUpCanvas]);

  // Sync theme with tldraw native dark/light mode canvas
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    try {
      editor.user.updateUserPreferences({
        colorScheme: theme === 'system' ? 'system' : theme,
      });
    } catch {
      // safe fallback
    }
  }, [theme]);

  // Global keyboard shortcut: Ctrl+, or Cmd+, to toggle settings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        toggleSettings();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSettings]);

  // Global auto-save on dock minimized shapes or background customization
  useEffect(() => {
    if (!editorRef.current) return;
    const timer = setTimeout(() => {
      saveEnvironment(editorRef.current, { showToast: false });
    }, 800);
    return () => clearTimeout(timer);
  }, [minimizedShapes, canvasBackground]);

  // Synchronous environment persistence on app exit, window close, or page reload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveEnvironmentSync(editorRef.current);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, []);

  const handleMount = useCallback((editor: Editor) => {
    editorRef.current = editor;
    setActiveEditor(editor);

    try {
      editor.user.updateUserPreferences({
        colorScheme: theme === 'system' ? 'system' : theme,
      });
    } catch {
      // safe fallback
    }

    // Smooth animated camera zooming helper (320ms fluid cubic ease-out)
    const SMOOTH_ZOOM_OPTS = {
      animation: {
        duration: 320,
        easing: (t: number) => 1 - Math.pow(1 - t, 3),
      },
    };

    const origZoomIn = editor.zoomIn.bind(editor);
    editor.zoomIn = (point, opts) => {
      return origZoomIn(point, {
        ...SMOOTH_ZOOM_OPTS,
        ...opts,
      });
    };

    const origZoomOut = editor.zoomOut.bind(editor);
    editor.zoomOut = (point, opts) => {
      return origZoomOut(point, {
        ...SMOOTH_ZOOM_OPTS,
        ...opts,
      });
    };

    const origResetZoom = editor.resetZoom.bind(editor);
    editor.resetZoom = (point, opts) => {
      return origResetZoom(point, {
        ...SMOOTH_ZOOM_OPTS,
        ...opts,
      });
    };

    const origZoomToFit = editor.zoomToFit.bind(editor);
    editor.zoomToFit = (opts) => {
      return origZoomToFit({
        ...SMOOTH_ZOOM_OPTS,
        ...opts,
      });
    };

    const origZoomToSelection = editor.zoomToSelection.bind(editor);
    editor.zoomToSelection = (opts) => {
      return origZoomToSelection({
        ...SMOOTH_ZOOM_OPTS,
        ...opts,
      });
    };

    // Realtime background pattern tracking and zoom percentage tracking with camera panning & zooming
    const updateCameraAndZoom = () => {
      const cam = editor.getCamera();
      const s = 48 * cam.z;
      const xo = cam.x * cam.z;
      const yo = cam.y * cam.z;
      const gxo = xo > 0 ? xo % s : s + (xo % s);
      const gyo = yo > 0 ? yo % s : s + (yo % s);
      const root = document.documentElement;
      root.style.setProperty('--canvas-pattern-size', `${s}px ${s}px`);
      root.style.setProperty('--canvas-pattern-pos', `${gxo}px ${gyo}px`);

      const current = Math.round(editor.getZoomLevel() * 100);
      setZoomLevel((prev) => (prev !== current ? current : prev));
    };

    // Debounced real-time auto-save on any store changes (800ms)
    let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleAutoSave = () => {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(() => {
        saveEnvironment(editor, { showToast: false });
      }, 800);
    };

    updateCameraAndZoom();
    editor.store.listen(() => {
      updateCameraAndZoom();
      scheduleAutoSave();
    });

    // Helper to sanitize any existing audio nodes: remove demo songs and ensure 340x500 dimensions
    const sanitizeAudioNodes = () => {
      const shapes = editor.getCurrentPageShapes();
      shapes.forEach((s) => {
        if (s.type === 'audio-node') {
          const p = s.props as any;
          const isDemo =
            !p.src ||
            p.src.includes('actions.google.com') ||
            p.src.includes('rain_heavy') ||
            p.src.includes('cadd2666') ||
            p.src.includes('ab5cb084') ||
            p.src.includes('793e6ffd');
          if (isDemo || p.w > 400 || p.h < 400) {
            editor.updateShape({
              id: s.id,
              type: s.type,
              props: {
                ...p,
                w: 340,
                h: 500,
                src: '',
                title: '',
                artist: '',
                cover: '',
              },
            });
          }
        }
      });
    };

    // Helper to seed initial demo shapes on fresh canvas for brand new users
    const seedDefaultDemoShapes = () => {
      // 1. Initial Video node
      editor.createShape({
        id: createShapeId('video-initial'),
        type: 'video-node' as any,
        x: 100,
        y: 100,
        props: {
          w: 640,
          h: 420,
          src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          title: 'Big Buck Bunny (Sync Stream)',
          isHost: true,
        },
      });

      // 2. Photo Canvas node
      editor.createShape({
        id: createShapeId('image-initial'),
        type: 'image-node' as any,
        x: 770,
        y: 100,
        props: {
          w: 520,
          h: 420,
          src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
          title: 'Sierra Dawn (Wallpaper)',
        },
      });

      // 3. Audio player node
      editor.createShape({
        id: createShapeId('audio-initial'),
        type: 'audio-node' as any,
        x: 100,
        y: 550,
        props: {
          w: 340,
          h: 500,
          src: '',
          title: '',
          artist: '',
          cover: '',
        },
      });

      // 4. Code Runner node
      editor.createShape({
        id: createShapeId('code-initial'),
        type: 'code-runner-node' as any,
        x: 570,
        y: 550,
        props: {
          w: 580,
          h: 440,
          code: `// Spatial JS/TS Interactive Node\nconsole.log("Spatial Workspace Ready!");\nconst latency = Math.floor(Math.random() * 15 + 25);\nconsole.log("LiveKit Mesh RTC Latency:", latency, "ms");\n`,
          language: 'typescript',
          title: 'Interactive Code Runner',
        },
      });

      // 5. Todo card node
      editor.createShape({
        id: createShapeId('todo-initial'),
        type: 'todo-node' as any,
        x: 1180,
        y: 550,
        props: {
          w: 360,
          h: 440,
          title: 'Action Items',
        },
      });
    };

    // Load persisted local environment with full coordinates, camera, and shapes
    loadSavedEnvironment(editor).then((restored) => {
      if (restored) {
        const currentShapes = editor.getCurrentPageShapes();
        const appState = useAppStore.getState();
        if (currentShapes.length === 0 && appState.minimizedShapes.length === 0) {
          seedDefaultDemoShapes();
        } else {
          sanitizeAudioNodes();
        }
      } else {
        // Only seed demo shapes if canvas is completely empty and no prior state exists
        if (editor.getCurrentPageShapes().length === 0) {
          seedDefaultDemoShapes();
        }
      }
    });
  }, [theme]);

  // Sync tool selection with tldraw editor
  const handleSelectTool = useCallback(
    (tool: ActiveToolType) => {
      setActiveTool(tool);
      const editor = editorRef.current;
      if (!editor) return;

      if (tool === 'select') {
        editor.setCurrentTool('select');
      } else if (tool === 'hand') {
        editor.setCurrentTool('hand');
      } else if (tool === 'pen') {
        editor.setCurrentTool('draw');
        editor.setStyleForNextShapes(DefaultColorStyle, mapHexToTldrawColor(penColor));
        editor.setStyleForNextShapes(DefaultSizeStyle, mapPenWidthToTldrawSize(penStrokeWidth));
      } else if (tool === 'brush') {
        editor.setCurrentTool('highlight');
        editor.setStyleForNextShapes(DefaultColorStyle, mapHexToTldrawColor(brushColor));
        editor.setStyleForNextShapes(DefaultSizeStyle, mapBrushSizeToTldrawSize(brushSize));
      } else if (tool === 'text') {
        editor.setCurrentTool('text');
      }
    },
    [penColor, penStrokeWidth, brushColor, brushSize, setActiveTool]
  );

  const handlePenColorChange = useCallback(
    (color: string) => {
      setPenColor(color);
      if (editorRef.current && activeTool === 'pen') {
        editorRef.current.setStyleForNextShapes(DefaultColorStyle, mapHexToTldrawColor(color));
      }
    },
    [activeTool, setPenColor]
  );

  const handlePenStrokeWidthChange = useCallback(
    (width: number) => {
      setPenStrokeWidth(width);
      if (editorRef.current && activeTool === 'pen') {
        editorRef.current.setStyleForNextShapes(DefaultSizeStyle, mapPenWidthToTldrawSize(width));
      }
    },
    [activeTool, setPenStrokeWidth]
  );

  const handleBrushColorChange = useCallback(
    (color: string) => {
      setBrushColor(color);
      if (editorRef.current && activeTool === 'brush') {
        editorRef.current.setStyleForNextShapes(DefaultColorStyle, mapHexToTldrawColor(color));
      }
    },
    [activeTool, setBrushColor]
  );

  const handleBrushSizeChange = useCallback(
    (size: number) => {
      setBrushSize(size);
      if (editorRef.current && activeTool === 'brush') {
        editorRef.current.setStyleForNextShapes(DefaultSizeStyle, mapBrushSizeToTldrawSize(size));
      }
    },
    [activeTool, setBrushSize]
  );

  // Restore a minimized shape with Mac Genie Effect
  const handleRestoreShape = useCallback(
    (shapeId: string, type: 'video' | 'audio' | 'image' | 'web' | 'table' | 'todo' | 'code' | 'pdf' | 'note') => {
      const editor = editorRef.current;
      if (!editor) return;
      restoreShapeWithGenie({ shapeId, toolType: type, editor });
    },
    []
  );

  // Spawn node shapes in center of current viewport with Mac Genie Effect
  const handleSpawnShape = useCallback((
    type: 'video' | 'audio' | 'image' | 'web' | 'code' | 'pdf' | 'table' | 'todo' | 'note'
  ) => {
    const editor = editorRef.current;
    if (!editor) return;

    const viewport = editor.getViewportPageBounds();
    const centerX = viewport.minX + viewport.width / 2;
    const centerY = viewport.minY + viewport.height / 2;

    const shapeId = createShapeId();

    switch (type) {
      case 'video': {
        const shapeType = 'video-node';
        const { w, h } = getAdaptiveWindowDimensions(640, 420);
        const pos = getCascadedSpawnPosition({ editor, shapeType, width: w, height: h });

        const createVideo = () => {
          editor.createShape({
            id: shapeId,
            type: shapeType as any,
            x: pos.x,
            y: pos.y,
            props: {
              w,
              h,
              src: '',
              title: 'New Video Stream',
              isHost: true,
            },
          });
          editor.select(shapeId);
          try {
            editor.bringToFront([shapeId]);
          } catch {}
        };

        spawnShapeWithGenie({
          toolType: 'video',
          editor,
          targetShape: { w, h },
          targetPos: pos,
          onSpawn: createVideo,
        });
        break;
      }
      case 'audio': {
        const shapeType = 'audio-node';
        const { w, h } = getAdaptiveWindowDimensions(340, 500);
        const pos = getCascadedSpawnPosition({ editor, shapeType, width: w, height: h });

        const createAudio = () => {
          editor.createShape({
            id: shapeId,
            type: shapeType as any,
            x: pos.x,
            y: pos.y,
            props: {
              w,
              h,
              src: '',
              title: '',
              artist: '',
              cover: '',
            },
          });
          editor.select(shapeId);
          try {
            editor.bringToFront([shapeId]);
          } catch {}
        };

        spawnShapeWithGenie({
          toolType: 'audio',
          editor,
          targetShape: { w, h },
          targetPos: pos,
          onSpawn: createAudio,
        });
        break;
      }
      case 'image': {
        const shapeType = 'image-node';
        const { w, h } = getAdaptiveWindowDimensions(560, 440);
        const pos = getCascadedSpawnPosition({ editor, shapeType, width: w, height: h });

        const createImage = () => {
          editor.createShape({
            id: shapeId,
            type: shapeType as any,
            x: pos.x,
            y: pos.y,
            props: {
              w,
              h,
              src: '',
              title: 'New Photo Canvas',
            },
          });
          editor.select(shapeId);
          try {
            editor.bringToFront([shapeId]);
          } catch {}
        };

        spawnShapeWithGenie({
          toolType: 'image',
          editor,
          targetShape: { w, h },
          targetPos: pos,
          onSpawn: createImage,
        });
        break;
      }
      case 'web': {
        const shapeType = 'web-embed-node';
        const { w, h } = getAdaptiveWindowDimensions(780, 540);
        const pos = getCascadedSpawnPosition({ editor, shapeType, width: w, height: h });

        const createWeb = () => {
          editor.createShape({
            id: shapeId,
            type: shapeType as any,
            x: pos.x,
            y: pos.y,
            props: {
              w,
              h,
              url: '',
              title: 'Web Browser',
            },
          });
          editor.select(shapeId);
          try {
            editor.bringToFront([shapeId]);
          } catch {}
        };

        spawnShapeWithGenie({
          toolType: 'web',
          editor,
          targetShape: { w, h },
          targetPos: pos,
          onSpawn: createWeb,
        });
        break;
      }
      case 'code': {
        const shapeType = 'code-runner-node';
        const { w, h } = getAdaptiveWindowDimensions(620, 460);
        const pos = getCascadedSpawnPosition({ editor, shapeType, width: w, height: h });

        const createCode = () => {
          editor.createShape({
            id: shapeId,
            type: shapeType as any,
            x: pos.x,
            y: pos.y,
            props: {
              w,
              h,
              code: `// JS/TS Code Evaluator\nconsole.log("Hello from spatial canvas!");\n`,
              language: 'typescript',
              title: 'JS/TS Evaluator',
            },
          });
          editor.select(shapeId);
          try {
            editor.bringToFront([shapeId]);
          } catch {}
        };

        spawnShapeWithGenie({
          toolType: 'code',
          editor,
          targetShape: { w, h },
          targetPos: pos,
          onSpawn: createCode,
        });
        break;
      }
      case 'pdf': {
        const shapeType = 'pdf-node';
        const { w, h } = getAdaptiveWindowDimensions(680, 560);
        const pos = getCascadedSpawnPosition({ editor, shapeType, width: w, height: h });

        const createPdf = () => {
          editor.createShape({
            id: shapeId,
            type: shapeType as any,
            x: pos.x,
            y: pos.y,
            props: {
              w,
              h,
              fileUrl: '',
              title: 'PDF Document Viewer',
            },
          });
          editor.select(shapeId);
          try {
            editor.bringToFront([shapeId]);
          } catch {}
        };

        spawnShapeWithGenie({
          toolType: 'pdf',
          editor,
          targetShape: { w, h },
          targetPos: pos,
          onSpawn: createPdf,
        });
        break;
      }
      case 'table': {
        const shapeType = 'table-node';
        const { w, h } = getAdaptiveWindowDimensions(580, 360);
        const pos = getCascadedSpawnPosition({ editor, shapeType, width: w, height: h });

        const createTable = () => {
          editor.createShape({
            id: shapeId,
            type: shapeType as any,
            x: pos.x,
            y: pos.y,
            props: {
              w,
              h,
              title: 'Project Data Grid',
            },
          });
          editor.select(shapeId);
          try {
            editor.bringToFront([shapeId]);
          } catch {}
        };

        spawnShapeWithGenie({
          toolType: 'table',
          editor,
          targetShape: { w, h },
          targetPos: pos,
          onSpawn: createTable,
        });
        break;
      }
      case 'todo': {
        const shapeType = 'todo-node';
        const { w, h } = getAdaptiveWindowDimensions(380, 460);
        const pos = getCascadedSpawnPosition({ editor, shapeType, width: w, height: h });

        const createTodo = () => {
          editor.createShape({
            id: shapeId,
            type: shapeType as any,
            x: pos.x,
            y: pos.y,
            props: {
              w,
              h,
              title: 'Action Items',
            },
          });
          editor.select(shapeId);
          try {
            editor.bringToFront([shapeId]);
          } catch {}
        };

        spawnShapeWithGenie({
          toolType: 'todo',
          editor,
          targetShape: { w, h },
          targetPos: pos,
          onSpawn: createTodo,
        });
        break;
      }
      case 'note': {
        const shapeType = 'note-node';
        const { w, h } = getAdaptiveWindowDimensions(340, 240);
        const pos = getCascadedSpawnPosition({ editor, shapeType, width: w, height: h });

        const createNote = () => {
          editor.createShape({
            id: shapeId,
            type: shapeType as any,
            x: pos.x,
            y: pos.y,
            props: {
              w,
              h,
              text: '',
              background: '',
            },
          });
          editor.select(shapeId);
          try {
            editor.bringToFront([shapeId]);
          } catch {}
        };

        spawnShapeWithGenie({
          toolType: 'note',
          editor,
          targetShape: { w, h },
          targetPos: pos,
          onSpawn: createNote,
        });
        break;
      }
    }
  }, []);

  // Canvas Tools Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const hasCtrlOrMeta = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Global shortcut: Ctrl+S or Cmd+S to Save Environment and Export Backup File
      if (hasCtrlOrMeta && key === 's') {
        e.preventDefault();
        e.stopPropagation();

        // Commit changes from any currently focused text input or editor
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }

        // Export backup file (.vibe) directly to user's computer and synchronize local storage
        exportEnvironmentToFile(editorRef.current, 'vibe');
        return;
      }

      // Do not trigger canvas navigation shortcuts when user is focused inside text inputs, textareas, or editing shapes
      const target = e.target as HTMLElement | null;
      const active = document.activeElement as HTMLElement | null;
      const isEditingShape = !!editorRef.current?.getEditingShapeId();

      const isInput = (el: HTMLElement | null): boolean => {
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

      if (isEditingShape || isInput(target) || isInput(active)) {
        return;
      }

      // Combinations with Ctrl / Meta:
      if (hasCtrlOrMeta) {
        if (key === 'p') {
          // "ctrl + p" for photo
          e.preventDefault();
          e.stopPropagation();
          handleSpawnShape('image');
        } else if (key === 'v') {
          // "ctrl + v" for video
          e.preventDefault();
          e.stopPropagation();
          handleSpawnShape('video');
        } else if (key === 'i') {
          // "ctrl + i" for songs
          e.preventDefault();
          e.stopPropagation();
          handleSpawnShape('audio');
        } else if (key === 't') {
          // "ctrl + t" for table
          e.preventDefault();
          e.stopPropagation();
          handleSpawnShape('table');
        } else if (key === 'b') {
          // "ctrl + b" for internet browser
          e.preventDefault();
          e.stopPropagation();
          handleSpawnShape('web');
        } else if (key === '=' || key === '+' || e.code === 'NumpadAdd' || e.code === 'Equal') {
          // "ctrl + +" for smooth animated zoom in
          e.preventDefault();
          e.stopPropagation();
          editorRef.current?.zoomIn();
        } else if (key === '-' || key === '_' || e.code === 'NumpadSubtract' || e.code === 'Minus') {
          // "ctrl + -" for smooth animated zoom out
          e.preventDefault();
          e.stopPropagation();
          editorRef.current?.zoomOut();
        } else if (key === '0' || e.code === 'Numpad0') {
          // "ctrl + 0" for smooth reset zoom (100%)
          e.preventDefault();
          e.stopPropagation();
          editorRef.current?.resetZoom();
        }
        return;
      }

      // Single-key shortcuts (no modifier keys):
      if (!e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === '0') {
          // "0" for hand tool
          e.preventDefault();
          e.stopPropagation();
          handleSelectTool('hand');
        } else if (e.key === '1') {
          // "1" for select tool
          e.preventDefault();
          e.stopPropagation();
          handleSelectTool('select');
        } else if (key === 'p') {
          // "p" for pen
          e.preventDefault();
          e.stopPropagation();
          handleSelectTool('pen');
        } else if (key === 'b') {
          // "b" for brush tool
          e.preventDefault();
          e.stopPropagation();
          handleSelectTool('brush');
        } else if (key === 't') {
          // "t" for text
          e.preventDefault();
          e.stopPropagation();
          handleSelectTool('text');
        } else if (key === 'n') {
          // "n" for todo list
          e.preventDefault();
          e.stopPropagation();
          handleSpawnShape('todo');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [handleSelectTool, handleSpawnShape]);

  // Open linked text in computer browser on double-click
  useEffect(() => {
    const handleDblClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // 1. Direct anchor element check (e.g. <a href="...">)
      const anchor = target.closest('a');
      if (anchor) {
        const href = anchor.getAttribute('href') || (anchor as any).href;
        if (href && href !== '#' && !href.startsWith('javascript:')) {
          e.preventDefault();
          e.stopPropagation();
          const targetUrl = href.startsWith('http://') || href.startsWith('https://') ? href : `https://${href}`;
          window.open(targetUrl, '_blank', 'noopener,noreferrer');
          return;
        }
      }

      // 2. Tiptap active link mark check
      const editor = editorRef.current;
      if (editor) {
        const textEditor = (editor as any).getRichTextEditor?.();
        if (textEditor?.isActive?.('link')) {
          const href = textEditor.getAttributes('link')?.href;
          if (href) {
            e.preventDefault();
            e.stopPropagation();
            const targetUrl = href.startsWith('http://') || href.startsWith('https://') ? href : `https://${href}`;
            window.open(targetUrl, '_blank', 'noopener,noreferrer');
            return;
          }
        }

        // 3. Double-clicked text shape containing URL or markdown link [text](url)
        const editingShapeId = editor.getEditingShapeId();
        const selectedShapes = editor.getSelectedShapes();
        const textShape =
          (editingShapeId ? editor.getShape(editingShapeId) : null) ||
          selectedShapes.find((s) => s.type === 'text');

        if (textShape && textShape.type === 'text') {
          const text = (textShape.props as any)?.text || '';
          const markdownLinkMatch = text.match(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/i);
          const rawUrlMatch = text.match(/https?:\/\/[^\s)\]]+/i);
          const matchedUrl = markdownLinkMatch ? markdownLinkMatch[2] : (rawUrlMatch ? rawUrlMatch[0] : null);
          if (matchedUrl) {
            e.preventDefault();
            e.stopPropagation();
            window.open(matchedUrl, '_blank', 'noopener,noreferrer');
            return;
          }
        }
      }
    };

    window.addEventListener('dblclick', handleDblClick, { capture: true });
    return () => {
      window.removeEventListener('dblclick', handleDblClick, { capture: true });
    };
  }, []);

  // Drag and Drop Local Media Files directly into Canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const editor = editorRef.current;
    if (!editor) return;

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const items = processDroppedFiles(files);
    const point = editor.screenToPage({ x: e.clientX, y: e.clientY });

    items.forEach((item, idx) => {
      const offset = idx * 40;
      if (item.type === 'video') {
        editor.createShape({
          id: createShapeId(),
          type: 'video-node' as any,
          x: point.x + offset,
          y: point.y + offset,
          props: {
            w: 640,
            h: 420,
            src: item.streamUrl,
            title: item.name,
            isHost: true,
          },
        });
      } else if (item.type === 'audio') {
        editor.createShape({
          id: createShapeId(),
          type: 'audio-node' as any,
          x: point.x + offset,
          y: point.y + offset,
          props: {
            w: 500,
            h: 280,
            src: item.streamUrl,
            title: item.name.replace(/\.[^/.]+$/, ''),
            artist: 'Local Media',
          },
        });
      } else if (item.type === 'image' || item.name.match(/\.(png|jpe?g|webp|gif|svg|bmp|ico|avif)$/i)) {
        editor.createShape({
          id: createShapeId(),
          type: 'image-node' as any,
          x: point.x + offset,
          y: point.y + offset,
          props: {
            w: 560,
            h: 440,
            src: item.streamUrl,
            title: item.name,
          },
        });
      } else if (item.type === 'pdf') {
        editor.createShape({
          id: createShapeId(),
          type: 'pdf-node' as any,
          x: point.x + offset,
          y: point.y + offset,
          props: {
            w: 600,
            h: 520,
            fileUrl: item.streamUrl,
            title: item.name,
          },
        });
      }
    });
  };

  const isLight =
    theme === 'light' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      !window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div
      className={clsx(
        'relative w-screen h-screen overflow-hidden transition-colors duration-200',
        isLight ? 'bg-[#f0f2f5]' : 'bg-[#0a0d14]'
      )}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Infinite Canvas */}
      <div className="absolute inset-0">
        <ErrorBoundary variant="canvas">
          <Tldraw
            shapeUtils={customShapeUtils}
            components={components}
            onMount={handleMount}
            autoFocus
          />
        </ErrorBoundary>
      </div>

      {/* Bottom-Left Corner Controls (Clean Up Canvas & Back to Center) */}
      <CanvasLeftControls
        onCleanUpCanvas={handleCleanUpCanvas}
        onBackToCenter={handleBackToCenter}
      />

      {/* Floating Bottom Center macOS Dock */}
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
        <CanvasToolbar
          activeTool={activeTool}
          onSelectTool={handleSelectTool}
          onSpawnShape={handleSpawnShape}
          onRestoreShape={handleRestoreShape}
          onUndo={() => editorRef.current?.undo()}
          onRedo={() => editorRef.current?.redo()}
          onOpenSettings={openSettings}
          penColor={penColor}
          penStrokeWidth={penStrokeWidth}
          onPenColorChange={handlePenColorChange}
          onPenStrokeWidthChange={handlePenStrokeWidthChange}
          brushColor={brushColor}
          brushSize={brushSize}
          onBrushColorChange={handleBrushColorChange}
          onBrushSizeChange={handleBrushSizeChange}
        />
      </div>

      {/* Bottom-Right Corner Controls (Zoom Out, Live % click to reset, Zoom In) */}
      <CanvasZoomControls
        zoomLevel={zoomLevel}
        onResetZoom={handleResetZoom}
        onZoomIn={() => editorRef.current?.zoomIn()}
        onZoomOut={() => editorRef.current?.zoomOut()}
      />

      {/* Floating Hangout / Voice Dock */}
      {showVoiceDock && (
        <div className="absolute top-6 right-6 z-40 pointer-events-auto">
          <VoiceDock roomId={roomId} />
        </div>
      )}

      {/* Spatial Settings Modal Dialog */}
      <SettingsModal />

      {/* Mac Genie Effect Overlay Canvas */}
      <GenieEffectOverlay />

      {/* Global Apple-Style Save Notification HUD Toast */}
      <SaveNotificationToast />
    </div>
  );
}

export default CanvasRoot;
