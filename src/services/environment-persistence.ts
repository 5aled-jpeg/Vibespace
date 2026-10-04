/**
 * Environment Persistence Service
 * Manages dual-layer workspace storage (IndexedDB + synchronous LocalStorage),
 * full shape coordinates, dimensions, camera zoom/pan, minimized dock windows,
 * and portable file export/import (.vibe and .json).
 */

import { Editor, getSnapshot, loadSnapshot } from 'tldraw';
import { useAppStore } from '../stores/appStore';

export interface VibeEnvironmentSnapshot {
  version: 1;
  appName: 'Vibe Space';
  savedAt: string;
  timestamp: number;
  stats: {
    shapeCount: number;
    minimizedCount: number;
  };
  camera: {
    x: number;
    y: number;
    z: number;
  };
  editorSnapshot: any;
  appState: {
    minimizedShapes: Array<{
      id: string;
      type: 'web' | 'video' | 'image' | 'table' | 'todo' | 'audio' | 'code' | 'pdf' | 'note';
      title: string;
    }>;
    canvasBackground: string;
    theme: 'light' | 'dark' | 'system';
    accentColor: string;
    windowStyle: 'glass' | 'solid' | 'high-contrast';
    codeFontSize: number;
    codeTheme: 'vs-dark' | 'vs-light';
    timeFormat: '12h' | '24h';
    language: string;
  };
}

export interface SaveToastData {
  id: string;
  title: string;
  detail?: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: number;
}

// Global active editor reference
let activeEditor: Editor | null = null;

export function setActiveEditor(editor: Editor | null) {
  activeEditor = editor;
}

export function getActiveEditor(): Editor | null {
  return activeEditor;
}

// Toast notification emitter
type ToastListener = (toast: SaveToastData | null) => void;
const toastListeners = new Set<ToastListener>();

export function subscribeSaveToast(listener: ToastListener): () => void {
  toastListeners.add(listener);
  return () => {
    toastListeners.delete(listener);
  };
}

export function showSaveToast(
  title: string,
  detail?: string,
  type: SaveToastData['type'] = 'success'
) {
  const data: SaveToastData = {
    id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    detail,
    type,
    timestamp: Date.now(),
  };
  toastListeners.forEach((l) => l(data));
}

// Storage keys
const IDB_DB_NAME = 'vibe_space_db';
const IDB_STORE_NAME = 'environments';
const IDB_KEY = 'workspace_snapshot_v1';
const LOCAL_STORAGE_KEY = 'vibe_space_environment_backup';
const LOCAL_STORAGE_META_KEY = 'vibe_space_last_saved_meta';

// IndexedDB Helper
function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(IDB_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function setIDB(key: string, value: any): Promise<void> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
    const store = tx.objectStore(IDB_STORE_NAME);
    const req = store.put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function getIDB<T>(key: string): Promise<T | null> {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readonly');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function removeIDB(key: string): Promise<void> {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // ignore
  }
}

/**
 * Builds a complete VibeEnvironmentSnapshot from the current editor and appStore state.
 */
export function buildEnvironmentSnapshot(editor: Editor): VibeEnvironmentSnapshot {
  let editorSnapshot: any;
  try {
    editorSnapshot = getSnapshot(editor.store);
  } catch {
    editorSnapshot = editor.store.getStoreSnapshot();
  }

  const cam = editor.getCamera();
  const currentShapes = editor.getCurrentPageShapes();
  const app = useAppStore.getState();

  return {
    version: 1,
    appName: 'Vibe Space',
    savedAt: new Date().toISOString(),
    timestamp: Date.now(),
    stats: {
      shapeCount: currentShapes.length,
      minimizedCount: app.minimizedShapes.length,
    },
    camera: {
      x: cam.x,
      y: cam.y,
      z: cam.z,
    },
    editorSnapshot,
    appState: {
      minimizedShapes: [...app.minimizedShapes],
      canvasBackground: app.canvasBackground,
      theme: app.theme,
      accentColor: app.accentColor,
      windowStyle: app.windowStyle,
      codeFontSize: app.codeFontSize,
      codeTheme: app.codeTheme,
      timeFormat: app.timeFormat,
      language: app.language,
    },
  };
}

/**
 * Synchronously writes a snapshot to localStorage.
 * Used during window unload / beforeunload where async operations cannot be guaranteed.
 */
export function saveEnvironmentSync(
  editorInstance?: Editor | null,
  forceEmpty?: boolean
): boolean {
  const editor = editorInstance || activeEditor;
  if (!editor) return false;

  try {
    const currentShapes = editor.getCurrentPageShapes();
    const app = useAppStore.getState();

    // SAFETY GUARD: Do NOT overwrite a saved workspace with 0 shapes
    // unless forceEmpty is true (i.e. user explicitly clicked "Reset Workspace").
    if (currentShapes.length === 0 && app.minimizedShapes.length === 0 && !forceEmpty) {
      const lastInfo = getLastSavedInfo();
      if (lastInfo && lastInfo.shapeCount > 0) {
        return false;
      }
    }

    const snapshot = buildEnvironmentSnapshot(editor);
    const json = JSON.stringify(snapshot);
    localStorage.setItem(LOCAL_STORAGE_KEY, json);
    localStorage.setItem(
      LOCAL_STORAGE_META_KEY,
      JSON.stringify({
        timestamp: snapshot.timestamp,
        savedAt: snapshot.savedAt,
        shapeCount: snapshot.stats.shapeCount,
        minimizedCount: snapshot.stats.minimizedCount,
      })
    );
    return true;
  } catch (err) {
    console.warn('[Persistence] Synchronous localStorage save failed:', err);
    return false;
  }
}

/**
 * Asynchronously saves the environment to IndexedDB and updates the localStorage fast mirror.
 */
export async function saveEnvironment(
  editorInstance?: Editor | null,
  options: { showToast?: boolean; detail?: string; forceEmpty?: boolean } = {}
): Promise<boolean> {
  const editor = editorInstance || activeEditor;
  if (!editor) return false;

  try {
    const currentShapes = editor.getCurrentPageShapes();
    const app = useAppStore.getState();

    // SAFETY GUARD: Do NOT overwrite a populated saved workspace with 0 shapes
    // unless forceEmpty is true (i.e. user explicitly clicked "Reset Workspace" in settings).
    // This protects against temporary unmounts, crashes, or timing glitches wiping the canvas!
    if (currentShapes.length === 0 && app.minimizedShapes.length === 0 && !options.forceEmpty) {
      const lastInfo = getLastSavedInfo();
      if (lastInfo && lastInfo.shapeCount > 0) {
        console.warn('[Persistence] Blocked auto-save of 0 shapes over existing', lastInfo.shapeCount, 'shapes.');
        return false;
      }
    }

    const snapshot = buildEnvironmentSnapshot(editor);

    // 1. Synchronously update fast mirror
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(snapshot));
      localStorage.setItem(
        LOCAL_STORAGE_META_KEY,
        JSON.stringify({
          timestamp: snapshot.timestamp,
          savedAt: snapshot.savedAt,
          shapeCount: snapshot.stats.shapeCount,
          minimizedCount: snapshot.stats.minimizedCount,
        })
      );
    } catch {
      // localStorage may fail if quota is exceeded with large assets, which IndexedDB handles
    }

    // 2. Persist to IndexedDB (primary resilient storage)
    await setIDB(IDB_KEY, snapshot);

    if (options.showToast) {
      const shapeCount = snapshot.stats.shapeCount;
      const minCount = snapshot.stats.minimizedCount;
      const detail =
        options.detail ||
        `${shapeCount} active item${shapeCount === 1 ? '' : 's'}${minCount > 0 ? `, ${minCount} minimized` : ''} • All coordinates preserved`;
      showSaveToast('Environment Saved', detail, 'success');
    }

    return true;
  } catch (err) {
    console.error('[Persistence] saveEnvironment error:', err);
    if (options.showToast) {
      showSaveToast('Save Failed', 'Could not write to local storage', 'error');
    }
    return false;
  }
}

/**
 * Checks whether any saved environment exists in either IndexedDB or LocalStorage.
 */
export async function hasSavedEnvironment(): Promise<boolean> {
  try {
    const fromIdb = await getIDB<VibeEnvironmentSnapshot>(IDB_KEY);
    if (fromIdb) return true;

    const fromLs = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (fromLs) return true;

    return false;
  } catch {
    return false;
  }
}

/**
 * Gets metadata about the last saved state for UI status displays.
 */
export function getLastSavedInfo(): {
  timestamp: number;
  formatted: string;
  shapeCount: number;
  minimizedCount: number;
} | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_META_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const date = new Date(data.timestamp);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return {
      timestamp: data.timestamp,
      formatted: timeStr,
      shapeCount: data.shapeCount ?? 0,
      minimizedCount: data.minimizedCount ?? 0,
    };
  } catch {
    return null;
  }
}

/**
 * Loads the saved environment from IndexedDB / LocalStorage into the editor and appStore.
 * Compares timestamps to ensure the freshest copy is loaded.
 */
export async function loadSavedEnvironment(editor: Editor): Promise<boolean> {
  try {
    let idbSnapshot: VibeEnvironmentSnapshot | null = null;
    let lsSnapshot: VibeEnvironmentSnapshot | null = null;

    try {
      idbSnapshot = await getIDB<VibeEnvironmentSnapshot>(IDB_KEY);
    } catch {}

    try {
      const rawLs = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (rawLs) {
        lsSnapshot = JSON.parse(rawLs);
      }
    } catch {}

    // Choose snapshot with the newest timestamp
    let snapshotToApply: VibeEnvironmentSnapshot | null = null;
    if (idbSnapshot && lsSnapshot) {
      snapshotToApply =
        idbSnapshot.timestamp >= lsSnapshot.timestamp ? idbSnapshot : lsSnapshot;
    } else {
      snapshotToApply = idbSnapshot || lsSnapshot;
    }

    if (!snapshotToApply || !snapshotToApply.editorSnapshot) {
      return false;
    }

    // 1. Load editor store snapshot
    loadSnapshot(editor.store, snapshotToApply.editorSnapshot);

    // 2. Restore camera position and zoom level
    if (snapshotToApply.camera) {
      try {
        editor.setCamera(snapshotToApply.camera);
      } catch (camErr) {
        console.warn('[Persistence] Error restoring camera:', camErr);
      }
    }

    // 3. Restore appStore preferences & minimized shapes
    if (snapshotToApply.appState) {
      const {
        minimizedShapes = [],
        canvasBackground,
        theme,
        accentColor,
        windowStyle,
        codeFontSize,
        codeTheme,
        timeFormat,
        language,
      } = snapshotToApply.appState;

      useAppStore.setState({
        minimizedShapes: Array.isArray(minimizedShapes) ? minimizedShapes : [],
        ...(canvasBackground ? { canvasBackground } : {}),
        ...(theme ? { theme } : {}),
        ...(accentColor ? { accentColor } : {}),
        ...(windowStyle ? { windowStyle } : {}),
        ...(codeFontSize ? { codeFontSize } : {}),
        ...(codeTheme ? { codeTheme } : {}),
        ...(timeFormat ? { timeFormat } : {}),
        ...(language ? { language } : {}),
      });

      // Sync color scheme to editor user preferences
      if (theme) {
        try {
          editor.user.updateUserPreferences({
            colorScheme: theme === 'system' ? 'system' : theme,
          });
        } catch {}
      }
    }

    return true;
  } catch (err) {
    console.error('[Persistence] Error loading saved environment:', err);
    return false;
  }
}

/**
 * Exports the current environment snapshot to a file (.vibe or .json).
 * Automatically handles native OS save dialogs in Tauri runtime and modern browsers (showSaveFilePicker),
 * with universal fallback to direct browser downloads.
 * Synchronizes local storage & IndexedDB in tandem.
 */
export async function exportEnvironmentToFile(
  editorInstance?: Editor | null,
  format: 'vibe' | 'json' = 'vibe'
): Promise<boolean> {
  const editor = editorInstance || activeEditor;
  if (!editor) {
    showSaveToast('Export Error', 'No active canvas found to export', 'error');
    return false;
  }

  try {
    // 1. Synchronize local storage and IndexedDB first
    await saveEnvironment(editor, { showToast: false });

    const snapshot = buildEnvironmentSnapshot(editor);
    const jsonStr = JSON.stringify(snapshot, null, 2);

    const now = new Date();
    const dateStamp = now.toISOString().slice(0, 10);
    const timeStamp = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
    const filename = `vibe-space-${dateStamp}_${timeStamp}.${format}`;

    // 2. Tauri Runtime: Native OS File Dialog
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      try {
        const dialog = await import('@tauri-apps/plugin-dialog');
        const fs = await import('@tauri-apps/plugin-fs');
        const filePath = await dialog.save({
          defaultPath: filename,
          filters: [
            {
              name: format === 'vibe' ? 'Vibe Space Environment (*.vibe)' : 'JSON Environment (*.json)',
              extensions: [format],
            },
          ],
        });
        if (filePath) {
          await fs.writeTextFile(filePath, jsonStr);
          showSaveToast(
            'Environment Saved & Backed Up',
            `Saved ${snapshot.stats.shapeCount} items to ${filePath}`,
            'success'
          );
          return true;
        } else {
          // User cancelled native dialog, but local storage is saved
          showSaveToast(
            'Environment Saved Locally',
            `Preserved ${snapshot.stats.shapeCount} items (file dialog cancelled)`,
            'info'
          );
          return true;
        }
      } catch (tauriErr) {
        console.warn('[Persistence] Tauri save error, falling back:', tauriErr);
      }
    }

    // 3. Modern Browser: File System Access API (showSaveFilePicker)
    if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description:
                format === 'vibe'
                  ? 'Vibe Space Environment (*.vibe)'
                  : 'JSON Environment (*.json)',
              accept: {
                [format === 'vibe' ? 'application/octet-stream' : 'application/json']: [`.${format}`],
              },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(jsonStr);
        await writable.close();

        showSaveToast(
          'Environment Saved & Backed Up',
          `Saved ${snapshot.stats.shapeCount} items to "${handle.name}"`,
          'success'
        );
        return true;
      } catch (pickerErr: any) {
        if (pickerErr?.name === 'AbortError') {
          // User intentionally cancelled save dialog; local persistence is already saved
          showSaveToast(
            'Environment Saved Locally',
            `Preserved ${snapshot.stats.shapeCount} items in browser storage`,
            'info'
          );
          return true;
        }
        console.warn('[Persistence] File picker failed, falling back to download:', pickerErr);
      }
    }

    // 4. Universal Fallback: Download via Blob link
    const blob = new Blob([jsonStr], {
      type: format === 'vibe' ? 'application/octet-stream' : 'application/json',
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showSaveToast(
      'Environment Saved & Backed Up',
      `Saved ${snapshot.stats.shapeCount} items to ${filename}`,
      'success'
    );
    return true;
  } catch (err) {
    console.error('[Persistence] Export error:', err);
    showSaveToast('Export Failed', 'An error occurred while creating backup file', 'error');
    return false;
  }
}

/**
 * Imports a previously exported .vibe or .json backup file and restores canvas & settings.
 */
export async function importEnvironmentFromFile(
  file: File,
  editorInstance?: Editor | null
): Promise<{ success: boolean; message: string }> {
  const editor = editorInstance || activeEditor;
  if (!editor) {
    return { success: false, message: 'Canvas editor is not ready' };
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text) as VibeEnvironmentSnapshot;

    if (!parsed || !parsed.editorSnapshot) {
      return { success: false, message: 'Invalid backup file: missing canvas snapshot data' };
    }

    // Apply snapshot to store
    loadSnapshot(editor.store, parsed.editorSnapshot);

    // Apply camera
    if (parsed.camera) {
      try {
        editor.setCamera(parsed.camera);
      } catch {}
    }

    // Apply app store
    if (parsed.appState) {
      useAppStore.setState({
        minimizedShapes: Array.isArray(parsed.appState.minimizedShapes)
          ? parsed.appState.minimizedShapes
          : [],
        ...(parsed.appState.canvasBackground ? { canvasBackground: parsed.appState.canvasBackground } : {}),
        ...(parsed.appState.theme ? { theme: parsed.appState.theme } : {}),
        ...(parsed.appState.accentColor ? { accentColor: parsed.appState.accentColor } : {}),
        ...(parsed.appState.windowStyle ? { windowStyle: parsed.appState.windowStyle } : {}),
        ...(parsed.appState.codeFontSize ? { codeFontSize: parsed.appState.codeFontSize } : {}),
        ...(parsed.appState.codeTheme ? { codeTheme: parsed.appState.codeTheme } : {}),
        ...(parsed.appState.timeFormat ? { timeFormat: parsed.appState.timeFormat } : {}),
        ...(parsed.appState.language ? { language: parsed.appState.language } : {}),
      });

      if (parsed.appState.theme) {
        try {
          editor.user.updateUserPreferences({
            colorScheme: parsed.appState.theme === 'system' ? 'system' : parsed.appState.theme,
          });
        } catch {}
      }
    }

    // Immediately persist imported environment to disk/IDB
    await saveEnvironment(editor);

    const shapeCount = editor.getCurrentPageShapes().length;
    showSaveToast(
      'Environment Imported',
      `Restored ${shapeCount} items from "${file.name}"`,
      'success'
    );

    return {
      success: true,
      message: `Successfully restored ${shapeCount} shapes from ${file.name}`,
    };
  } catch (err: any) {
    console.error('[Persistence] Import error:', err);
    showSaveToast('Import Failed', err?.message || 'File parsing error', 'error');
    return { success: false, message: err?.message || 'Could not parse backup file' };
  }
}

/**
 * Resets the canvas to an empty state and clears local persistence.
 */
export async function resetEnvironment(editorInstance?: Editor | null): Promise<void> {
  const editor = editorInstance || activeEditor;
  if (!editor) return;

  try {
    // 1. Delete all current shapes
    const shapes = editor.getCurrentPageShapes();
    if (shapes.length > 0) {
      editor.deleteShapes(shapes.map((s) => s.id));
    }

    // 2. Clear minimized shapes
    useAppStore.setState({ minimizedShapes: [] });

    // 3. Reset camera
    try {
      editor.resetZoom();
    } catch {}

    // 4. Save blank state so initial demo shapes don't randomly reappear (explicit user action)
    await saveEnvironment(editor, { showToast: false, forceEmpty: true });

    showSaveToast('Canvas Reset', 'Canvas cleared and state synchronized', 'info');
  } catch (err) {
    console.error('[Persistence] Reset error:', err);
  }
}
