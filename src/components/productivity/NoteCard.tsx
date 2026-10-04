'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import {
  Image as ImageIcon,
  Trash2,
  Edit3,
  Eraser,
  X,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading,
  Quote,
  ListTodo,
  Code2,
  Strikethrough,
  Check,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
import { Tilt } from '../ui/tilt';
import { Spotlight } from '../ui/spotlight';
import {
  stopCanvasPropagation,
  textInputProps,
  interactiveProps,
  useIsolateCanvasWheel,
} from '../../utils/canvas-events';
import { exportEnvironmentToFile } from '../../services/environment-persistence';

export interface NoteCardProps {
  id?: string;
  text?: string;
  background?: string;
  isEditing?: boolean;
  onSetEditing?: (editing: boolean) => void;
  onTextChange?: (newText: string) => void;
  onBackgroundChange?: (newBg: string | undefined) => void;
  onDelete?: () => void;
  className?: string;
}

export interface TextFormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  code: boolean;
  quote: boolean;
  todo: boolean;
  heading: boolean;
}

/**
 * Checks if a string is a default placeholder rather than genuine user content.
 */
export const isPlaceholderText = (val?: string | null): boolean => {
  if (!val) return true;
  const t = val.trim().toLowerCase();
  return (
    t === '' ||
    t === 'double-click to write your note...' ||
    t === 'double-click to write a note...' ||
    t === 'double-click to write your note' ||
    t === 'double-click to write a note' ||
    t.startsWith('double-click to write')
  );
};

/**
 * Detects Discord-style active formats from the current selection & surrounding text.
 */
export function detectFormatState(
  val: string,
  start: number,
  end: number
): TextFormatState {
  if (start < 0 || end < 0 || start === end) {
    return {
      bold: false,
      italic: false,
      underline: false,
      strike: false,
      code: false,
      quote: false,
      todo: false,
      heading: false,
    };
  }

  const selected = val.substring(start, end);
  const lineStart = val.lastIndexOf('\n', start - 1) + 1;
  const nextNewline = val.indexOf('\n', end);
  const lineEnd = nextNewline === -1 ? val.length : nextNewline;
  const currentLine = val.substring(lineStart, lineEnd);

  // Line-level checks (Discord quotes & checklists)
  const quote =
    currentLine.trimStart().startsWith('>') || selected.trimStart().startsWith('>');
  const todo =
    /^(\s*)(?:-\s*)?\[([ xX])\]/.test(currentLine) ||
    /^(\s*)(?:-\s*)?\[([ xX])\]/.test(selected);
  const heading =
    /^(\s*)#+\s/.test(currentLine) || /^(\s*)#+\s/.test(selected);

  // Helper to check if selection is wrapped or enclosed in token
  const isWrappedIn = (token: string): boolean => {
    // Check inside selection: e.g. **text**
    if (
      selected.startsWith(token) &&
      selected.endsWith(token) &&
      selected.length >= token.length * 2
    ) {
      return true;
    }
    // Check if inner content after blockquote prefix is wrapped: e.g. > **text**
    if (selected.startsWith('> ') || selected.startsWith('>')) {
      const inner = selected.replace(/^>\s?/, '');
      if (
        inner.startsWith(token) &&
        inner.endsWith(token) &&
        inner.length >= token.length * 2
      ) {
        return true;
      }
    }
    // Check surrounding characters: **|selection|**
    const before = val.substring(Math.max(0, start - token.length), start);
    const after = val.substring(end, end + token.length);
    if (before === token && after === token) {
      return true;
    }
    return false;
  };

  const bold = isWrappedIn('**') || isWrappedIn('***');
  const italic =
    (isWrappedIn('*') || isWrappedIn('_') || isWrappedIn('***')) &&
    !isWrappedIn('**');
  const underline = isWrappedIn('__');
  const strike = isWrappedIn('~~');
  const code = isWrappedIn('`');

  return {
    bold,
    italic: isWrappedIn('***') ? true : italic,
    underline,
    strike,
    code,
    quote,
    todo,
    heading,
  };
}

/**
 * Recursive inline markdown parser supporting nested formatting:
 * ***bold+italic***, **bold**, *italic*, __underline__, ~~strike~~, `code`, and [label](url).
 */
function renderInlineMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  const parts: React.ReactNode[] = [];
  const regex =
    /(\*\*\*[^*]+?\*\*\*|\*\*[^*]+?\*\*|\*[^*]+?\*|__(?:[^_]|_[^_])+?__|~~[^~]+?~~|`[^`]+?`|\[[^\]]+?\]\([^)]+?\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${match.index}-${token.length}`;

    if (token.startsWith('***') && token.endsWith('***')) {
      const inner = token.slice(3, -3);
      parts.push(
        <strong key={key} className="font-bold text-zinc-50">
          <em className="italic text-zinc-200">{renderInlineMarkdown(inner)}</em>
        </strong>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      const inner = token.slice(2, -2);
      parts.push(
        <strong key={key} className="font-bold text-zinc-50">
          {renderInlineMarkdown(inner)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      const inner = token.slice(1, -1);
      parts.push(
        <em key={key} className="italic text-zinc-200">
          {renderInlineMarkdown(inner)}
        </em>
      );
    } else if (token.startsWith('__') && token.endsWith('__')) {
      const inner = token.slice(2, -2);
      parts.push(
        <u key={key} className="underline underline-offset-2 decoration-zinc-400">
          {renderInlineMarkdown(inner)}
        </u>
      );
    } else if (token.startsWith('~~') && token.endsWith('~~')) {
      const inner = token.slice(2, -2);
      parts.push(
        <del key={key} className="line-through text-zinc-500">
          {renderInlineMarkdown(inner)}
        </del>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      const inner = token.slice(1, -1);
      parts.push(
        <code
          key={key}
          className="px-1.5 py-0.5 rounded bg-zinc-800/90 border border-zinc-700/80 font-mono text-[11px] text-blue-300 mx-0.5"
        >
          {inner}
        </code>
      );
    } else if (token.startsWith('[') && token.includes('](') && token.endsWith(')')) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const [, label, url] = linkMatch;
        const targetUrl =
          url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
        parts.push(
          <a
            key={key}
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors font-medium inline-flex items-center gap-0.5"
          >
            <span>{label}</span>
          </a>
        );
      } else {
        parts.push(token);
      }
    } else {
      parts.push(token);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

export function NoteCard({
  id = 'note-card',
  text = '',
  background,
  isEditing: isEditingProp,
  onSetEditing,
  onTextChange,
  onBackgroundChange,
  onDelete,
  className,
}: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(isEditingProp || false);
  const [currentText, setCurrentText] = useState(() => (isPlaceholderText(text) ? '' : text));
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);

  // Floating selection bubble toolbar state (Fixed viewport coordinates via Portal)
  const [floatingToolbar, setFloatingToolbar] = useState<{
    show: boolean;
    x: number;
    y: number;
    placement: 'above' | 'below';
    start: number;
    end: number;
    formats: TextFormatState;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Isolate wheel/scroll events to note card
  useIsolateCanvasWheel(cardRef);

  useEffect(() => {
    setCurrentText(isPlaceholderText(text) ? '' : text);
  }, [text]);

  useEffect(() => {
    if (isEditingProp !== undefined) {
      setIsEditing(isEditingProp);
    }
  }, [isEditingProp]);

  // Clean empty/placeholder text when entering edit mode so the user never has to delete it
  useEffect(() => {
    if (isEditing) {
      if (isPlaceholderText(currentText)) {
        setCurrentText('');
      }
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    } else {
      setFloatingToolbar(null);
    }
  }, [isEditing]);

  const lastPointerDownTimeRef = useRef<number>(0);

  // Start editing handler
  const startEditing = () => {
    if (isPlaceholderText(currentText)) {
      setCurrentText('');
    }
    setIsEditing(true);
    onSetEditing?.(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        if (isPlaceholderText(textareaRef.current.value)) {
          textareaRef.current.value = '';
          setCurrentText('');
        }
      }
    }, 0);
  };

  // Add To-Do Item directly: appends - [ ] and opens editor with cursor ready
  const handleAddTodoItem = () => {
    let base = isPlaceholderText(currentText) ? '' : currentText.trimEnd();
    if (base.length > 0) {
      base += '\n- [ ] ';
    } else {
      base = '- [ ] ';
    }
    setCurrentText(base);
    setIsEditing(true);
    onSetEditing?.(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(base.length, base.length);
      }
    }, 10);
  };

  // Capture-phase native event listeners on cardRef to intercept double-click & contextmenu
  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;

    const handleNativePointerDown = (e: PointerEvent) => {
      if (isEditing) {
        e.stopPropagation();
        e.stopImmediatePropagation();
        return;
      }

      const now = Date.now();
      const elapsed = now - lastPointerDownTimeRef.current;

      if (elapsed > 0 && elapsed < 400) {
        e.stopPropagation();
        e.stopImmediatePropagation();
        e.preventDefault();

        lastPointerDownTimeRef.current = 0;
        startEditing();
        return;
      }

      lastPointerDownTimeRef.current = now;
    };

    const handleNativeDblClick = (e: MouseEvent) => {
      e.stopPropagation();
      e.stopImmediatePropagation();
      e.preventDefault();
      startEditing();
    };

    const handleNativeContextMenu = (e: MouseEvent) => {
      e.stopPropagation();
      e.stopImmediatePropagation();
      e.preventDefault();
      // Close floating selection toolbar if context menu opens
      setFloatingToolbar(null);
      const clampX = Math.min(Math.max(10, e.clientX), window.innerWidth - 230);
      const clampY = Math.min(Math.max(10, e.clientY), window.innerHeight - 260);
      setMenuPosition({ x: clampX, y: clampY });
    };

    node.addEventListener('pointerdown', handleNativePointerDown, { capture: true });
    node.addEventListener('dblclick', handleNativeDblClick, { capture: true });
    node.addEventListener('contextmenu', handleNativeContextMenu, { capture: true });

    return () => {
      node.removeEventListener('pointerdown', handleNativePointerDown, { capture: true });
      node.removeEventListener('dblclick', handleNativeDblClick, { capture: true });
      node.removeEventListener('contextmenu', handleNativeContextMenu, { capture: true });
    };
  }, [isEditing, currentText, onSetEditing]);

  // Close context menu when clicking outside
  useEffect(() => {
    if (!menuPosition) return;
    const handleGlobalDismiss = (e: MouseEvent | PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('.note-context-menu')) return;
      setMenuPosition(null);
    };

    const timer = setTimeout(() => {
      window.addEventListener('pointerdown', handleGlobalDismiss, { capture: true });
      window.addEventListener('contextmenu', handleGlobalDismiss, { capture: true });
    }, 50);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', handleGlobalDismiss, { capture: true });
      window.removeEventListener('contextmenu', handleGlobalDismiss, { capture: true });
    };
  }, [menuPosition]);

  const handleSave = () => {
    const trimmed = isPlaceholderText(currentText) ? '' : currentText.trim();
    setCurrentText(trimmed);
    onTextChange?.(trimmed);
    setIsEditing(false);
    onSetEditing?.(false);
    setFloatingToolbar(null);
    setMenuPosition(null);
  };

  const handleCancel = () => {
    setCurrentText(isPlaceholderText(text) ? '' : text);
    setIsEditing(false);
    onSetEditing?.(false);
    setFloatingToolbar(null);
    setMenuPosition(null);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.nativeEvent) {
      e.nativeEvent.preventDefault?.();
      e.nativeEvent.stopPropagation?.();
      e.nativeEvent.stopImmediatePropagation?.();
    }
    setFloatingToolbar(null);
    const clampX = Math.min(Math.max(10, e.clientX), window.innerWidth - 230);
    const clampY = Math.min(Math.max(10, e.clientY), window.innerHeight - 260);
    setMenuPosition({ x: clampX, y: clampY });
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    stopCanvasPropagation(e);
    e.preventDefault();
    if (e.nativeEvent) {
      e.nativeEvent.stopPropagation?.();
      e.nativeEvent.stopImmediatePropagation?.();
    }
    startEditing();
  };

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onBackgroundChange?.(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
    setMenuPosition(null);
  };

  // Checkbox toggle handler in view mode
  const handleToggleTodo = (lineIndex: number) => {
    const lines = currentText.split('\n');
    if (lineIndex < 0 || lineIndex >= lines.length) return;

    const line = lines[lineIndex];
    let updatedLine = line;

    if (line.includes('- [ ]')) {
      updatedLine = line.replace('- [ ]', '- [x]');
    } else if (line.includes('- [x]') || line.includes('- [X]')) {
      updatedLine = line.replace(/- \[[xX]\]/, '- [ ]');
    } else if (line.includes('[ ]')) {
      updatedLine = line.replace('[ ]', '[x]');
    } else if (line.includes('[x]') || line.includes('[X]')) {
      updatedLine = line.replace(/\[[xX]\]/, '[ ]');
    }

    lines[lineIndex] = updatedLine;
    const newText = lines.join('\n');
    setCurrentText(newText);
    onTextChange?.(newText);
  };

  // -------------------------------------------------------------
  // Discord-Style Floating Selection Bubble Toolbar (Viewport Fixed via Portal)
  // -------------------------------------------------------------
  const checkTextSelection = (clientX?: number, clientY?: number) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setFloatingToolbar(null);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start === end || start < 0 || end < 0) {
      setFloatingToolbar(null);
      return;
    }

    const selected = textarea.value.substring(start, end).trim();
    if (!selected) {
      setFloatingToolbar(null);
      return;
    }

    // Dismiss context menu when user is actively selecting text
    setMenuPosition(null);

    // Detect Discord active formats
    const formats = detectFormatState(textarea.value, start, end);

    let targetX = window.innerWidth / 2;
    let targetY = 100;
    let placement: 'above' | 'below' = 'above';

    // 1. If mouse coordinates are available from mouseup
    if (clientX !== undefined && clientY !== undefined) {
      targetX = Math.max(135, Math.min(clientX, window.innerWidth - 135));
      if (clientY - 48 >= 10) {
        targetY = clientY - 46;
        placement = 'above';
      } else {
        targetY = clientY + 28;
        placement = 'below';
      }
    } else {
      // 2. Keyboard selection or fallback: calculate from textarea client coordinates
      const textareaRect = textarea.getBoundingClientRect();
      const textBefore = textarea.value.substring(0, start);
      const lineCount = textBefore.split('\n').length - 1;
      const lineHeight = 21;

      const lineClientY =
        textareaRect.top + 14 + lineCount * lineHeight - textarea.scrollTop;

      targetX = Math.max(
        135,
        Math.min(textareaRect.left + textareaRect.width / 2, window.innerWidth - 135)
      );

      if (lineClientY - 48 >= 10) {
        targetY = lineClientY - 46;
        placement = 'above';
      } else {
        targetY = lineClientY + 28;
        placement = 'below';
      }
    }

    // Ensure targetY never bleeds off top or bottom of viewport
    targetY = Math.max(10, Math.min(targetY, window.innerHeight - 50));

    setFloatingToolbar({
      show: true,
      x: targetX,
      y: targetY,
      placement,
      start,
      end,
      formats,
    });
  };

  /**
   * Discord-style Toggle Formatting Backend:
   * Correctly handles toggle/untoggle, active state updates, and prevents inverted
   * wrappers like ~~> text~~ or **> text** (always keeps > at line start).
   */
  const handleToggleFormat = (
    type:
      | 'bold'
      | 'italic'
      | 'underline'
      | 'strike'
      | 'code'
      | 'quote'
      | 'todo'
      | 'heading'
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const val = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (type === 'quote') {
      // Toggle blockquote > on selected line(s)
      const lineStart = val.lastIndexOf('\n', start - 1) + 1;
      const nextNewline = val.indexOf('\n', end);
      const lineEnd = nextNewline === -1 ? val.length : nextNewline;

      const section = val.substring(lineStart, lineEnd);
      const lines = section.split('\n');
      const isQuoteActive = lines.some((l) => l.trimStart().startsWith('>'));

      const transformed = lines
        .map((l) => {
          if (isQuoteActive) {
            // Untoggle: remove leading >
            return l.replace(/^(\s*)>\s?/, '$1');
          } else {
            // Toggle on: add >
            const cleaned = l.replace(/^(\s*)(?:- \[[ xX]\]\s*)?/, '$1');
            return `> ${cleaned}`;
          }
        })
        .join('\n');

      const nextVal = val.substring(0, lineStart) + transformed + val.substring(lineEnd);
      setCurrentText(nextVal);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(lineStart, lineStart + transformed.length);
          checkTextSelection(floatingToolbar?.x, floatingToolbar?.y ? floatingToolbar.y + 46 : undefined);
        }
      }, 0);
      return;
    }

    if (type === 'todo') {
      // Toggle to-do - [ ] on selected line(s)
      const lineStart = val.lastIndexOf('\n', start - 1) + 1;
      const nextNewline = val.indexOf('\n', end);
      const lineEnd = nextNewline === -1 ? val.length : nextNewline;

      const section = val.substring(lineStart, lineEnd);
      const lines = section.split('\n');
      const isTodoActive = lines.some((l) => /^(\s*)(?:-\s*)?\[([ xX])\]/.test(l));

      const transformed = lines
        .map((l) => {
          if (isTodoActive) {
            return l.replace(/^(\s*)(?:-\s*)?\[([ xX])\]\s*/, '$1');
          } else {
            const cleaned = l.replace(/^(\s*)#+\s*/, '$1');
            return `- [ ] ${cleaned}`;
          }
        })
        .join('\n');

      const nextVal = val.substring(0, lineStart) + transformed + val.substring(lineEnd);
      setCurrentText(nextVal);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(lineStart, lineStart + transformed.length);
          checkTextSelection(floatingToolbar?.x, floatingToolbar?.y ? floatingToolbar.y + 46 : undefined);
        }
      }, 0);
      return;
    }

    if (type === 'heading') {
      const lineStart = val.lastIndexOf('\n', start - 1) + 1;
      const nextNewline = val.indexOf('\n', end);
      const lineEnd = nextNewline === -1 ? val.length : nextNewline;

      const section = val.substring(lineStart, lineEnd);
      const lines = section.split('\n');
      const isHeadingActive = lines.some((l) => /^(\s*)#+\s/.test(l));

      const transformed = lines
        .map((l) => {
          if (isHeadingActive) {
            return l.replace(/^(\s*)#+\s*/, '$1');
          } else {
            return `# ${l.replace(/^(\s*)>\s*/, '$1')}`;
          }
        })
        .join('\n');

      const nextVal = val.substring(0, lineStart) + transformed + val.substring(lineEnd);
      setCurrentText(nextVal);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(lineStart, lineStart + transformed.length);
          checkTextSelection(floatingToolbar?.x, floatingToolbar?.y ? floatingToolbar.y + 46 : undefined);
        }
      }, 0);
      return;
    }

    // Inline formats (Discord-style toggle backend)
    const tokenMap = {
      bold: '**',
      italic: '*',
      underline: '__',
      strike: '~~',
      code: '`',
    } as const;

    const token = tokenMap[type as keyof typeof tokenMap];
    if (!token) return;

    const selected = val.substring(start, end);
    const currentState = detectFormatState(val, start, end);
    const isActive = currentState[type as keyof TextFormatState];

    let nextVal = val;
    let newStart = start;
    let newEnd = end;

    if (isActive) {
      // UNTOGGLE: Strip token
      if (
        selected.startsWith(token) &&
        selected.endsWith(token) &&
        selected.length >= token.length * 2
      ) {
        // Selection itself has the token: **word** -> word
        const stripped = selected.slice(token.length, -token.length);
        nextVal = val.substring(0, start) + stripped + val.substring(end);
        newStart = start;
        newEnd = start + stripped.length;
      } else {
        // Surrounding characters have the token: **|word|** -> word
        const before = val.substring(start - token.length, start);
        const after = val.substring(end, end + token.length);
        if (before === token && after === token) {
          nextVal =
            val.substring(0, start - token.length) +
            selected +
            val.substring(end + token.length);
          newStart = start - token.length;
          newEnd = newStart + selected.length;
        }
      }
    } else {
      // TOGGLE ON: Add token
      // Discord Rule: If selection includes a block prefix (like `> ` or `- [ ] `), preserve the block prefix outside!
      let prefixBlock = '';
      let targetText = selected;

      if (targetText.startsWith('> ')) {
        prefixBlock = '> ';
        targetText = targetText.slice(2);
      } else if (targetText.startsWith('>')) {
        prefixBlock = '> ';
        targetText = targetText.slice(1);
      } else if (targetText.startsWith('- [ ] ')) {
        prefixBlock = '- [ ] ';
        targetText = targetText.slice(6);
      } else if (targetText.startsWith('- [x] ')) {
        prefixBlock = '- [x] ';
        targetText = targetText.slice(6);
      }

      const wrapped = `${prefixBlock}${token}${targetText}${token}`;
      nextVal = val.substring(0, start) + wrapped + val.substring(end);
      newStart = start;
      newEnd = start + wrapped.length;
    }

    setCurrentText(nextVal);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newStart, newEnd);
        checkTextSelection(floatingToolbar?.x, floatingToolbar?.y ? floatingToolbar.y + 46 : undefined);
      }
    }, 0);
  };

  // -------------------------------------------------------------
  // Textarea input & [] Shortcut handler
  // -------------------------------------------------------------
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let val = e.target.value;
    const cursorPos = e.target.selectionStart;

    // Fast check for [] shortcut auto-conversion
    const lineStart = val.lastIndexOf('\n', cursorPos - 1) + 1;
    const currentPrefix = val.substring(lineStart, cursorPos);

    if (
      currentPrefix === '[] ' ||
      currentPrefix === '[ ] ' ||
      currentPrefix === '- [] '
    ) {
      const replacement = '- [ ] ';
      val = val.substring(0, lineStart) + replacement + val.substring(cursorPos);
      const newPos = lineStart + replacement.length;
      setCurrentText(val);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(newPos, newPos);
        }
      }, 0);
      return;
    }

    setCurrentText(val);
  };

  // Keyboard Shortcuts & Smart Enter
  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    if (e.nativeEvent) e.nativeEvent.stopImmediatePropagation?.();

    // Ctrl+S or Cmd+S to save note and export backup file to PC
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      handleSave();
      exportEnvironmentToFile(undefined, 'vibe');
      return;
    }

    // Ctrl+Enter or Cmd+Enter to save immediately
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
      return;
    }

    // Escape to cancel
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
      return;
    }

    // Ctrl+B for Bold
    if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      handleToggleFormat('bold');
      return;
    }

    // Ctrl+I for Italic
    if ((e.ctrlKey || e.metaKey) && (e.key === 'i' || e.key === 'I')) {
      e.preventDefault();
      handleToggleFormat('italic');
      return;
    }

    // Ctrl+U for Underline
    if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
      e.preventDefault();
      handleToggleFormat('underline');
      return;
    }

    // Shortcut: Space after typing "[]" or "[ ]" converts to "- [ ] "
    if (e.key === ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const textarea = textareaRef.current;
      if (textarea) {
        const pos = textarea.selectionStart;
        const lineStart = textarea.value.lastIndexOf('\n', pos - 1) + 1;
        const before = textarea.value.substring(lineStart, pos);

        if (before === '[]' || before === '[ ]' || before === '- []') {
          e.preventDefault();
          const replacement = '- [ ] ';
          const nextVal =
            textarea.value.substring(0, lineStart) +
            replacement +
            textarea.value.substring(pos);
          setCurrentText(nextVal);
          setTimeout(() => {
            const newPos = lineStart + replacement.length;
            textarea.setSelectionRange(newPos, newPos);
          }, 0);
          return;
        }
      }
    }

    // Smart Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const val = textarea.value;

      const lastNewline = val.lastIndexOf('\n', start - 1);
      const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
      const currentLine = val.substring(lineStart, start);

      // Shortcut: Hitting Enter on pure "[]" or "[ ]"
      if (currentLine.trim() === '[]' || currentLine.trim() === '[ ]') {
        e.preventDefault();
        const replacement = '- [ ] ';
        const nextVal = val.substring(0, lineStart) + replacement + val.substring(start);
        setCurrentText(nextVal);
        setTimeout(() => {
          const newPos = lineStart + replacement.length;
          textarea.setSelectionRange(newPos, newPos);
        }, 0);
        return;
      }

      // 1. Checklist continuation: - [ ] or - [x]
      const todoMatch = currentLine.match(/^(\s*)-\s*\[([ xX])\]\s*(.*)$/);
      if (todoMatch) {
        e.preventDefault();
        const indent = todoMatch[1];
        const taskContent = todoMatch[3];

        // If empty checklist line, hitting enter removes checkbox
        if (!taskContent.trim()) {
          const nextValue = val.substring(0, lineStart) + indent + val.substring(start);
          setCurrentText(nextValue);
          setTimeout(() => {
            textarea.setSelectionRange(lineStart + indent.length, lineStart + indent.length);
          }, 0);
          return;
        }

        // Otherwise insert next checkbox item
        const insertion = `\n${indent}- [ ] `;
        const nextValue = val.substring(0, start) + insertion + val.substring(start);
        setCurrentText(nextValue);
        setTimeout(() => {
          const newPos = start + insertion.length;
          textarea.setSelectionRange(newPos, newPos);
        }, 0);
        return;
      }

      // 2. Bullet list continuation: -
      const bulletMatch = currentLine.match(/^(\s*)-\s*(.*)$/);
      if (bulletMatch) {
        e.preventDefault();
        const indent = bulletMatch[1];
        const textContent = bulletMatch[2];

        if (!textContent.trim()) {
          const nextValue = val.substring(0, lineStart) + indent + val.substring(start);
          setCurrentText(nextValue);
          setTimeout(() => {
            textarea.setSelectionRange(lineStart + indent.length, lineStart + indent.length);
          }, 0);
          return;
        }

        const insertion = `\n${indent}- `;
        const nextValue = val.substring(0, start) + insertion + val.substring(start);
        setCurrentText(nextValue);
        setTimeout(() => {
          const newPos = start + insertion.length;
          textarea.setSelectionRange(newPos, newPos);
        }, 0);
        return;
      }

      // 3. Quote continuation: >
      const quoteMatch = currentLine.match(/^(\s*)>\s*(.*)$/);
      if (quoteMatch) {
        e.preventDefault();
        const indent = quoteMatch[1];
        const quoteContent = quoteMatch[2];

        if (!quoteContent.trim()) {
          const nextValue = val.substring(0, lineStart) + indent + val.substring(start);
          setCurrentText(nextValue);
          setTimeout(() => {
            textarea.setSelectionRange(lineStart + indent.length, lineStart + indent.length);
          }, 0);
          return;
        }

        const insertion = `\n${indent}> `;
        const nextValue = val.substring(0, start) + insertion + val.substring(start);
        setCurrentText(nextValue);
        setTimeout(() => {
          const newPos = start + insertion.length;
          textarea.setSelectionRange(newPos, newPos);
        }, 0);
        return;
      }
    }
  };

  // Render Formatted Content in View Mode
  const renderFormattedLines = () => {
    // If empty or placeholder, show subtle hint
    if (!currentText.trim() || isPlaceholderText(currentText)) {
      return (
        <div className="py-2 text-zinc-500 italic text-sm select-none flex flex-col items-start justify-center flex-1 min-h-[70px]">
          <p className="text-xs text-zinc-400">Double-click to write a note...</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-400 not-italic">
            <span className="text-zinc-500">Shortcut: Type</span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800/90 border border-zinc-700/80 font-mono text-[11px] text-blue-400 font-bold">
              []
            </kbd>
            <span className="text-zinc-500">for to-do task</span>
          </div>
        </div>
      );
    }

    const lines = currentText.split('\n');

    return (
      <div className="space-y-1.5 leading-relaxed text-sm text-zinc-100">
        {lines.map((rawLine, idx) => {
          let line = rawLine.trimEnd();

          // Normalization: clean broken patterns like ~~> text~~ or **> text**
          if (/^~~>\s*(.*)~~$/.test(line)) {
            line = `> ~~${line.replace(/^~~>\s*(.*)~~$/, '$1')}~~`;
          } else if (/^\*\*>(.*)\*\*$/.test(line)) {
            line = `> **${line.replace(/^\*\*>(.*)\*\*$/, '$1')}**`;
          }

          // 1. Checklist line: - [ ] or - [x]
          const todoMatch = line.match(/^(\s*)(?:-\s*)?\[([ xX])\]\s*(.*)$/);
          if (todoMatch) {
            const indent = todoMatch[1];
            const isDone = todoMatch[2].toLowerCase() === 'x';
            const taskContent = todoMatch[3];
            return (
              <div
                key={idx}
                className="flex items-start gap-2.5 py-0.5 group/todo select-none"
                style={{ paddingLeft: `${indent.length * 8}px` }}
              >
                <button
                  type="button"
                  {...interactiveProps}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleTodo(idx);
                  }}
                  className={clsx(
                    'mt-0.5 w-4 h-4 rounded-[5px] flex items-center justify-center transition-all cursor-pointer shrink-0 border shadow-xs active:scale-90',
                    isDone
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'border-zinc-600/90 bg-zinc-800/80 hover:border-zinc-400 group-hover/todo:border-blue-400'
                  )}
                  title={isDone ? 'Mark uncompleted' : 'Mark completed'}
                >
                  {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                </button>
                <span
                  className={clsx(
                    'flex-1 break-words transition-all text-sm',
                    isDone
                      ? 'line-through text-zinc-500 italic decoration-zinc-600'
                      : 'text-zinc-200 font-normal'
                  )}
                >
                  {renderInlineMarkdown(taskContent)}
                </span>
              </div>
            );
          }

          // 2. Blockquote: > ... or >... (handles with or without space)
          if (line.trimStart().startsWith('>')) {
            const quoteText = line.replace(/^\s*>\s?/, '');
            return (
              <blockquote
                key={idx}
                className="my-1 pl-3 py-1 border-l-2 border-blue-500 bg-blue-500/10 rounded-r-lg text-zinc-300 italic text-xs flex items-start gap-2"
              >
                <Quote className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                <div className="flex-1 break-words">{renderInlineMarkdown(quoteText)}</div>
              </blockquote>
            );
          }

          // 3. Headings: # or ##
          if (line.startsWith('# ')) {
            return (
              <h1
                key={idx}
                className="text-base font-bold text-zinc-50 pt-1 pb-0.5 border-b border-zinc-800/60"
              >
                {renderInlineMarkdown(line.slice(2))}
              </h1>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h2 key={idx} className="text-sm font-semibold text-zinc-100 pt-0.5">
                {renderInlineMarkdown(line.slice(3))}
              </h2>
            );
          }

          // 4. Bullet item: - ...
          if (line.startsWith('- ')) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mt-2 shrink-0" />
                <span className="flex-1 break-words text-zinc-200">
                  {renderInlineMarkdown(line.slice(2))}
                </span>
              </div>
            );
          }

          // 5. Blank line
          if (!line.trim()) {
            return <div key={idx} className="h-2" />;
          }

          // 6. Normal line
          return (
            <p key={idx} className="break-words text-zinc-200 leading-relaxed">
              {renderInlineMarkdown(line)}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div
      ref={cardRef}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
      onPointerDown={(e) => {
        if (isEditing) {
          stopCanvasPropagation(e);
        }
      }}
      style={{ overscrollBehavior: 'contain' }}
      className={clsx('relative w-full h-full select-none font-sans', className)}
    >
      {/* Hidden File Picker for PC Background Images */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.png,.jpg,.jpeg,.webp,.avif"
        onChange={handleSelectFile}
        className="hidden"
      />

      {/* 3D Tilt Card with Dynamic Mouse Perspective */}
      <Tilt
        rotationFactor={8}
        isRevese
        springOptions={{
          stiffness: 160,
          damping: 18,
          mass: 0.2,
        }}
        className="w-full h-full"
      >
        <div
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Inter, sans-serif',
          }}
          className="group relative w-full h-full flex flex-col overflow-hidden rounded-[14px] border border-zinc-800/80 dark:border-zinc-50/15 bg-[#18181b] shadow-2xl transition-all duration-200"
        >
          {/* Dynamic Mouse-following Specular Spotlight Glare */}
          <Spotlight
            className="from-white/35 via-white/10 to-transparent blur-2xl"
            size={220}
          />

          {/* Optional Background Image from PC */}
          {background && (
            <div className="relative h-36 w-full overflow-hidden shrink-0 border-b border-zinc-800/80">
              <img
                src={background}
                alt="Note background"
                className="h-full w-full object-cover select-none pointer-events-none transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          )}

          {/* Top-Right Quick Action Corner Buttons (Left-click menu & Quick Todo) */}
          <div
            className="absolute top-2.5 right-2.5 z-30 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            onMouseDown={stopCanvasPropagation}
            onClick={stopCanvasPropagation}
          >
            {/* Quick Add To-Do Button */}
            <button
              type="button"
              {...interactiveProps}
              onClick={(e) => {
                stopCanvasPropagation(e);
                handleAddTodoItem();
              }}
              className="p-1 rounded-md bg-zinc-800/90 hover:bg-blue-600/30 text-zinc-400 hover:text-blue-300 border border-zinc-700/60 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Add To-Do task ([] shortcut)"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            {/* Left-Click Action Menu Trigger (···) */}
            <button
              type="button"
              {...interactiveProps}
              onClick={(e) => {
                stopCanvasPropagation(e);
                const rect = e.currentTarget.getBoundingClientRect();
                setMenuPosition({
                  x: Math.min(rect.left, window.innerWidth - 220),
                  y: rect.bottom + 6,
                });
              }}
              className="p-1 rounded-md bg-zinc-800/90 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Note actions menu"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Note Content & Editor Area */}
          <div
            className="flex-1 p-3.5 flex flex-col justify-start relative z-20 min-h-0 overflow-y-auto"
            onDoubleClick={handleDoubleClick}
          >
            {isEditing ? (
              <div
                className="flex-1 flex flex-col h-full"
                onPointerDown={stopCanvasPropagation}
                onMouseDown={stopCanvasPropagation}
                onClick={stopCanvasPropagation}
                onDoubleClick={stopCanvasPropagation}
              >
                {/* Textarea Editor */}
                <textarea
                  ref={textareaRef}
                  value={currentText}
                  onChange={handleTextareaChange}
                  onKeyDown={handleEditorKeyDown}
                  onMouseUp={(e) => checkTextSelection(e.clientX, e.clientY)}
                  onKeyUp={(e) => {
                    if (
                      e.shiftKey ||
                      e.key.startsWith('Arrow') ||
                      ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a')
                    ) {
                      checkTextSelection();
                    } else {
                      const sel = textareaRef.current;
                      if (!sel || sel.selectionStart === sel.selectionEnd) {
                        setFloatingToolbar(null);
                      }
                    }
                  }}
                  onScroll={() => {
                    if (floatingToolbar?.show) {
                      checkTextSelection();
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      if (!cardRef.current?.contains(document.activeElement)) {
                        handleSave();
                      }
                    }, 180);
                  }}
                  {...textInputProps}
                  placeholder="Write your note... (type [] for to-do checklist)"
                  className="w-full flex-1 min-h-[90px] bg-transparent text-sm text-zinc-100 placeholder-zinc-500/70 resize-none outline-none leading-relaxed tracking-tight font-sans selection:bg-blue-600/40"
                />

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-400 select-none">
                  <span className="truncate pr-2 text-zinc-500">
                    Ctrl + Enter to save • Type{' '}
                    <code className="px-1 py-0.5 rounded bg-zinc-800 text-blue-400 font-mono">
                      []
                    </code>{' '}
                    for to-do
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      {...interactiveProps}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        stopCanvasPropagation(e);
                        handleSave();
                      }}
                      className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer shadow-xs active:scale-95 transition-all"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      {...interactiveProps}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        stopCanvasPropagation(e);
                        handleCancel();
                      }}
                      className="px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium cursor-pointer active:scale-95 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                title="Double-click to edit note & tasks"
                className="text-left select-none cursor-pointer flex-1 flex flex-col justify-between"
              >
                <div>{renderFormattedLines()}</div>

                {/* Subtle Add To-Do Row at the bottom of the card in view mode */}
                <div className="mt-3 pt-2 border-t border-zinc-800/50 flex items-center justify-between">
                  <button
                    type="button"
                    {...interactiveProps}
                    onClick={(e) => {
                      stopCanvasPropagation(e);
                      handleAddTodoItem();
                    }}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all cursor-pointer select-none group/add"
                  >
                    <span className="w-3.5 h-3.5 rounded border border-dashed border-zinc-600 group-hover/add:border-blue-400 flex items-center justify-center text-[10px] text-zinc-400 group-hover/add:text-blue-400 leading-none">
                      +
                    </span>
                    <span>Add to-do task</span>
                    <kbd className="ml-1 px-1 py-0.2 rounded bg-zinc-800 text-[10px] text-zinc-500 font-mono group-hover/add:text-blue-400">
                      []
                    </kbd>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Tilt>

      {/* Discord-Style Floating Selection Bubble Toolbar (Rendered via Portal to avoid card overflow-hidden and 3D tilt clipping) */}
      {isEditing &&
        floatingToolbar &&
        floatingToolbar.show &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed z-[9999999] flex items-center gap-1 p-1 rounded-xl bg-[#1e1f22] border border-zinc-700 shadow-[0_12px_32px_rgba(0,0,0,0.7)] animate-in fade-in zoom-in-95 duration-100 -translate-x-1/2 pointer-events-auto select-none"
            style={{
              left: floatingToolbar.x,
              top: floatingToolbar.y,
            }}
            onPointerDown={stopCanvasPropagation}
            onMouseDown={(e) => {
              e.preventDefault();
              stopCanvasPropagation(e);
            }}
            onClick={stopCanvasPropagation}
          >
            {/* Caret pointing towards text */}
            {floatingToolbar.placement === 'above' ? (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-[#1e1f22] border-r border-b border-zinc-700 pointer-events-none" />
            ) : (
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-[#1e1f22] border-l border-t border-zinc-700 pointer-events-none" />
            )}

            {/* 1. Bold */}
            <button
              type="button"
              {...interactiveProps}
              onClick={() => handleToggleFormat('bold')}
              className={clsx(
                'w-7 h-7 flex items-center justify-center rounded-md transition-colors cursor-pointer shrink-0',
                floatingToolbar.formats.bold
                  ? 'bg-zinc-700 text-white font-bold ring-1 ring-white/20 shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              )}
              title="Bold (**text** • Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            {/* 2. Italic */}
            <button
              type="button"
              {...interactiveProps}
              onClick={() => handleToggleFormat('italic')}
              className={clsx(
                'w-7 h-7 flex items-center justify-center rounded-md transition-colors cursor-pointer shrink-0',
                floatingToolbar.formats.italic
                  ? 'bg-zinc-700 text-white font-bold ring-1 ring-white/20 shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              )}
              title="Italic (*text* • Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            {/* 3. Underline */}
            <button
              type="button"
              {...interactiveProps}
              onClick={() => handleToggleFormat('underline')}
              className={clsx(
                'w-7 h-7 flex items-center justify-center rounded-md transition-colors cursor-pointer shrink-0',
                floatingToolbar.formats.underline
                  ? 'bg-zinc-700 text-white font-bold ring-1 ring-white/20 shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              )}
              title="Underline (__text__ • Ctrl+U)"
            >
              <UnderlineIcon className="w-3.5 h-3.5" />
            </button>

            {/* 4. Strikethrough */}
            <button
              type="button"
              {...interactiveProps}
              onClick={() => handleToggleFormat('strike')}
              className={clsx(
                'w-7 h-7 flex items-center justify-center rounded-md transition-colors cursor-pointer shrink-0',
                floatingToolbar.formats.strike
                  ? 'bg-zinc-700 text-white font-bold ring-1 ring-white/20 shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              )}
              title="Strikethrough (~~text~~)"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>

            {/* 5. Quote */}
            <button
              type="button"
              {...interactiveProps}
              onClick={() => handleToggleFormat('quote')}
              className={clsx(
                'w-7 h-7 flex items-center justify-center rounded-md transition-colors cursor-pointer shrink-0',
                floatingToolbar.formats.quote
                  ? 'bg-zinc-700 text-white font-bold ring-1 ring-white/20 shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              )}
              title="Quote (> text)"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>

            {/* 6. Code */}
            <button
              type="button"
              {...interactiveProps}
              onClick={() => handleToggleFormat('code')}
              className={clsx(
                'w-7 h-7 flex items-center justify-center rounded-md transition-colors cursor-pointer shrink-0',
                floatingToolbar.formats.code
                  ? 'bg-zinc-700 text-white font-bold ring-1 ring-white/20 shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              )}
              title="Code (`text`)"
            >
              <Code2 className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-3.5 bg-zinc-700/80 mx-0.5 shrink-0" />

            {/* 7. To-Do (Compact Icon Button) */}
            <button
              type="button"
              {...interactiveProps}
              onClick={() => handleToggleFormat('todo')}
              className={clsx(
                'w-7 h-7 flex items-center justify-center rounded-md transition-colors cursor-pointer shrink-0',
                floatingToolbar.formats.todo
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-blue-400 hover:bg-blue-600/20'
              )}
              title="To-Do Checklist (- [ ] task)"
            >
              <ListTodo className="w-3.5 h-3.5" />
            </button>

            {/* 8. Heading */}
            <button
              type="button"
              {...interactiveProps}
              onClick={() => handleToggleFormat('heading')}
              className={clsx(
                'w-7 h-7 flex items-center justify-center rounded-md transition-colors cursor-pointer shrink-0',
                floatingToolbar.formats.heading
                  ? 'bg-zinc-700 text-white font-bold ring-1 ring-white/20 shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              )}
              title="Heading (# title)"
            >
              <Heading className="w-3.5 h-3.5" />
            </button>
          </div>,
          document.body
        )}

      {/* VisionOS Menu (Available via Left-Click ··· button or Right-Click) */}
      {menuPosition &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="note-context-menu fixed p-1.5 rounded-xl bg-zinc-900/95 backdrop-blur-2xl border border-zinc-700/80 shadow-2xl text-xs text-zinc-200 animate-in fade-in zoom-in-95 duration-100 min-w-[210px]"
            style={{
              left: menuPosition.x,
              top: menuPosition.y,
              zIndex: 9999999,
            }}
            onPointerDown={stopCanvasPropagation}
            onMouseDown={stopCanvasPropagation}
            onClick={stopCanvasPropagation}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {/* Primary Action: Add To-Do Task */}
            <button
              type="button"
              {...interactiveProps}
              onClick={(e) => {
                stopCanvasPropagation(e);
                setMenuPosition(null);
                handleAddTodoItem();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-blue-600/20 hover:text-blue-300 transition-colors text-left cursor-pointer text-blue-400"
            >
              <div className="flex items-center gap-2.5">
                <ListTodo className="w-4 h-4 shrink-0" />
                <span className="font-semibold text-zinc-100">Add To-Do Task</span>
              </div>
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 font-mono">
                []
              </kbd>
            </button>

            <button
              type="button"
              {...interactiveProps}
              onClick={(e) => {
                stopCanvasPropagation(e);
                setMenuPosition(null);
                startEditing();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 hover:text-white transition-colors text-left cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium">Edit Note</span>
            </button>

            <div className="my-1 border-t border-zinc-800" />

            {/* Background Options */}
            <button
              type="button"
              {...interactiveProps}
              onClick={(e) => {
                stopCanvasPropagation(e);
                setMenuPosition(null);
                fileInputRef.current?.click();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 hover:text-white transition-colors text-left cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-zinc-400 shrink-0" />
              <span className="font-medium">
                {background ? 'Change Background (PC)' : 'Add Background (PC)'}
              </span>
            </button>

            {background && (
              <button
                type="button"
                {...interactiveProps}
                onClick={(e) => {
                  stopCanvasPropagation(e);
                  onBackgroundChange?.(undefined);
                  setMenuPosition(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 hover:text-white transition-colors text-left cursor-pointer"
              >
                <X className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-medium">Remove Background</span>
              </button>
            )}

            <div className="my-1 border-t border-zinc-800" />

            {/* Clear Text */}
            <button
              type="button"
              {...interactiveProps}
              onClick={(e) => {
                stopCanvasPropagation(e);
                setMenuPosition(null);
                setCurrentText('');
                onTextChange?.('');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 hover:text-white transition-colors text-left cursor-pointer"
            >
              <Eraser className="w-4 h-4 text-zinc-400 shrink-0" />
              <span className="font-medium">Clear Text</span>
            </button>

            {onDelete && (
              <>
                <div className="my-1 border-t border-zinc-800" />
                <button
                  type="button"
                  {...interactiveProps}
                  onClick={(e) => {
                    stopCanvasPropagation(e);
                    setMenuPosition(null);
                    onDelete();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors text-left cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 shrink-0 text-red-400" />
                  <span className="font-medium text-red-400">Delete Note</span>
                </button>
              </>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}

export default NoteCard;
