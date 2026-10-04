/**
 * Tauri Local Media Service
 * Converts local OS filesystem paths into streamable asset URLs.
 */

let convertFileSrc: ((filePath: string, protocol?: string) => string) | null = null;

// Dynamically import Tauri API if available in desktop runtime
try {
  import('@tauri-apps/api/core').then((mod) => {
    if (mod.convertFileSrc) {
      convertFileSrc = mod.convertFileSrc;
    }
  }).catch(() => {
    // Web fallback mode
  });
} catch (e) {
  // Web browser environment
}

export interface LocalMediaItem {
  name: string;
  type: 'video' | 'audio' | 'image' | 'pdf' | 'other';
  streamUrl: string;
  filePath?: string;
  size?: number;
}

export function resolveLocalMediaUrl(filePath: string): string {
  if (convertFileSrc) {
    return convertFileSrc(filePath);
  }
  // Browser fallback or custom protocol
  if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('blob:')) {
    return filePath;
  }
  return `asset://localhost/${encodeURIComponent(filePath)}`;
}

export function detectMediaType(filename: string): LocalMediaItem['type'] {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mkv') || lower.endsWith('.mov')) {
    return 'video';
  }
  if (lower.endsWith('.mp3') || lower.endsWith('.wav') || lower.endsWith('.ogg') || lower.endsWith('.m4a') || lower.endsWith('.flac')) {
    return 'audio';
  }
  if (
    lower.endsWith('.png') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.gif') ||
    lower.endsWith('.svg') ||
    lower.endsWith('.bmp') ||
    lower.endsWith('.ico') ||
    lower.endsWith('.avif')
  ) {
    return 'image';
  }
  if (lower.endsWith('.pdf')) {
    return 'pdf';
  }
  return 'other';
}

export function processDroppedFiles(files: FileList | File[]): LocalMediaItem[] {
  const items: LocalMediaItem[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const type = detectMediaType(file.name);
    const streamUrl = URL.createObjectURL(file);
    items.push({
      name: file.name,
      type,
      streamUrl,
      size: file.size,
    });
  }
  return items;
}
