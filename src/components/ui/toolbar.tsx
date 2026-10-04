"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bold,
  Italic,
  Link as LinkIcon,
  Heading,
  Quote,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Underline,
  Strikethrough,
  Check,
  ExternalLink,
  Trash2,
  X,
} from "lucide-react";
import type { Editor, TLDefaultColorStyle } from "tldraw";
import {
  Box,
  TldrawUiContextualToolbar,
  useEditor,
  useValue,
  DefaultColorStyle,
  DefaultSizeStyle,
} from "tldraw";
import { DefaultTextAlignStyle } from "@tldraw/tlschema";

export interface ToolbarProps {
  editor?: Editor | null;
  activeButtons?: string[];
  textAlign?: "left" | "center" | "right";
  onAction?: (action: string, payload?: any) => void;
  className?: string;
  containerClassName?: string;
  isFloating?: boolean;
}

const COLOR_PALETTE: { name: string; hex: string; style: TLDefaultColorStyle }[] = [
  { name: 'Black', hex: '#1e293b', style: 'black' },
  { name: 'Grey', hex: '#64748b', style: 'grey' },
  { name: 'Blue', hex: '#2563eb', style: 'blue' },
  { name: 'Violet', hex: '#7c3aed', style: 'violet' },
  { name: 'Green', hex: '#16a34a', style: 'green' },
  { name: 'Yellow', hex: '#eab308', style: 'yellow' },
  { name: 'Orange', hex: '#ea580c', style: 'orange' },
  { name: 'Red', hex: '#dc2626', style: 'red' },
];

export function applyFormat(editor: Editor | null | undefined, action: string, value?: any) {
  if (!editor) return;

  const textEditor = (editor as any).getRichTextEditor?.();
  const selectedShapes = editor.getSelectedShapes ? editor.getSelectedShapes() : [];
  const textShapes = selectedShapes.filter((s) => s.type === 'text');

  switch (action) {
    case 'bold': {
      if (textEditor?.view) {
        textEditor.chain().focus().toggleBold().run();
      } else if (textShapes.length > 0) {
        textShapes.forEach((s) => {
          const text = (s.props as any)?.text || '';
          if (text) {
            const isBold = text.startsWith('**') && text.endsWith('**');
            const newText = isBold ? text.slice(2, -2) : `**${text}**`;
            editor.updateShape({ id: s.id, type: 'text', props: { text: newText } } as any);
          }
        });
      } else {
        document.execCommand('bold', false);
      }
      break;
    }
    case 'italic': {
      if (textEditor?.view) {
        textEditor.chain().focus().toggleItalic().run();
      } else if (textShapes.length > 0) {
        textShapes.forEach((s) => {
          const text = (s.props as any)?.text || '';
          if (text) {
            const isItalic = text.startsWith('*') && text.endsWith('*') && !text.startsWith('**');
            const newText = isItalic ? text.slice(1, -1) : `*${text}*`;
            editor.updateShape({ id: s.id, type: 'text', props: { text: newText } } as any);
          }
        });
      } else {
        document.execCommand('italic', false);
      }
      break;
    }
    case 'underline': {
      if (textEditor?.view && textEditor.commands?.toggleUnderline) {
        textEditor.chain().focus().toggleUnderline().run();
      } else if (textShapes.length > 0) {
        textShapes.forEach((s) => {
          const text = (s.props as any)?.text || '';
          if (text) {
            const isU = text.startsWith('<u>') && text.endsWith('</u>');
            const newText = isU ? text.slice(3, -4) : `<u>${text}</u>`;
            editor.updateShape({ id: s.id, type: 'text', props: { text: newText } } as any);
          }
        });
      } else {
        document.execCommand('underline', false);
      }
      break;
    }
    case 'strikethrough': {
      if (textEditor?.view) {
        textEditor.chain().focus().toggleStrike().run();
      } else if (textShapes.length > 0) {
        textShapes.forEach((s) => {
          const text = (s.props as any)?.text || '';
          if (text) {
            const isS = text.startsWith('~~') && text.endsWith('~~');
            const newText = isS ? text.slice(2, -2) : `~~${text}~~`;
            editor.updateShape({ id: s.id, type: 'text', props: { text: newText } } as any);
          }
        });
      } else {
        document.execCommand('strikeThrough', false);
      }
      break;
    }
    case 'highlight': {
      if (textEditor?.view) {
        textEditor.chain().focus().toggleHighlight().run();
      } else if (textShapes.length > 0) {
        textShapes.forEach((s) => {
          const text = (s.props as any)?.text || '';
          if (text) {
            const isH = text.startsWith('==') && text.endsWith('==');
            const newText = isH ? text.slice(2, -2) : `==${text}==`;
            editor.updateShape({ id: s.id, type: 'text', props: { text: newText } } as any);
          }
        });
      } else {
        document.execCommand('hiliteColor', false, '#ffd60a');
      }
      break;
    }
    case 'heading': {
      if (textEditor?.view && textEditor.commands?.toggleHeading) {
        textEditor.chain().focus().toggleHeading({ level: 1 }).run();
      }
      try {
        if (textShapes.length > 0) {
          textShapes.forEach((s) => {
            const currentSize = (s.props as any)?.size;
            const newSize = currentSize === 'xl' || currentSize === 'l' ? 'm' : 'xl';
            editor.updateShape({ id: s.id, type: 'text', props: { size: newSize } } as any);
          });
        } else {
          editor.setStyleForNextShapes(DefaultSizeStyle, 'xl');
        }
      } catch (e) {}
      break;
    }
    case 'quote': {
      if (textEditor?.view && textEditor.commands?.toggleBlockquote) {
        textEditor.chain().focus().toggleBlockquote().run();
      } else if (textShapes.length > 0) {
        textShapes.forEach((s) => {
          const text = (s.props as any)?.text || '';
          if (text) {
            const isQ = text.startsWith('> ');
            const newText = isQ ? text.slice(2) : `> ${text}`;
            editor.updateShape({ id: s.id, type: 'text', props: { text: newText } } as any);
          }
        });
      }
      break;
    }
    case 'link': {
      const url = typeof value === 'string' && value ? value : window.prompt('Enter link URL (e.g. https://example.com):');
      if (url) {
        if (textEditor?.view) {
          textEditor.chain().focus().setLink({ href: url }).run();
        } else if (textShapes.length > 0) {
          textShapes.forEach((s) => {
            const text = (s.props as any)?.text || 'link';
            editor.updateShape({ id: s.id, type: 'text', props: { text: `[${text}](${url})` } } as any);
          });
        }
      }
      break;
    }
    case 'color': {
      const color = (value as TLDefaultColorStyle) || 'blue';
      try {
        editor.setStyleForNextShapes(DefaultColorStyle, color);
        if (textShapes.length > 0) {
          textShapes.forEach((s) => {
            editor.updateShape({ id: s.id, type: 'text', props: { color } } as any);
          });
        }
      } catch (e) {}
      break;
    }
    case 'align-left': {
      const align = 'start';
      try {
        editor.setStyleForNextShapes(DefaultTextAlignStyle, align);
        if (textShapes.length > 0) {
          textShapes.forEach((s) => {
            editor.updateShape({ id: s.id, type: 'text', props: { textAlign: align } } as any);
          });
        }
      } catch (e) {}
      break;
    }
    case 'align-center': {
      const align = 'middle';
      try {
        editor.setStyleForNextShapes(DefaultTextAlignStyle, align);
        if (textShapes.length > 0) {
          textShapes.forEach((s) => {
            editor.updateShape({ id: s.id, type: 'text', props: { textAlign: align } } as any);
          });
        }
      } catch (e) {}
      break;
    }
    case 'align-right': {
      const align = 'end';
      try {
        editor.setStyleForNextShapes(DefaultTextAlignStyle, align);
        if (textShapes.length > 0) {
          textShapes.forEach((s) => {
            editor.updateShape({ id: s.id, type: 'text', props: { textAlign: align } } as any);
          });
        }
      } catch (e) {}
      break;
    }
  }
}

const ToolbarButton = ({
  label,
  icon: Icon,
  isActive,
  onClick,
  tooltip,
  showTooltip,
  hideTooltip,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick: () => void;
  tooltip: string | null;
  showTooltip: (label: string) => void;
  hideTooltip: () => void;
}) => (
  <div
    className="relative"
    onMouseEnter={() => showTooltip(label)}
    onMouseLeave={hideTooltip}
  >
    <button
      type="button"
      onPointerDown={(e) => e.preventDefault()}
      className={`h-8 w-8 flex items-center justify-center rounded-md transition-colors duration-200 cursor-pointer ${
        isActive ? "bg-primary/20 text-blue-500 dark:text-blue-400 font-semibold" : "text-slate-700 dark:text-slate-200"
      } hover:bg-primary/10 hover:text-black dark:hover:text-white focus:outline-none`}
      aria-label={label}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
    </button>
    {tooltip === label && (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="text-nowrap font-medium absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded-md px-2 py-1 shadow-lg pointer-events-none select-none z-50"
      >
        {label}
      </motion.div>
    )}
  </div>
);

const Toolbar = ({
  editor,
  activeButtons: initialActiveButtons,
  textAlign: initialTextAlign,
  onAction,
  className,
  containerClassName,
  isFloating = false,
}: ToolbarProps = {}) => {
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">(
    initialTextAlign || "left"
  );
  const [activeButtons, setActiveButtons] = useState<string[]>(
    initialActiveButtons || []
  );
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [showPalette, setShowPalette] = useState(false);
  const [currentColor, setCurrentColor] = useState<TLDefaultColorStyle>('black');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkInputUrl, setLinkInputUrl] = useState('');

  // Synchronize state with editor selection if provided
  useEffect(() => {
    if (!editor) return;

    const syncEditorState = () => {
      const textEditor = (editor as any).getRichTextEditor?.();
      const currentActive: string[] = [];

      if (textEditor?.view) {
        if (textEditor.isActive('bold')) currentActive.push('bold');
        if (textEditor.isActive('italic')) currentActive.push('italic');
        if (textEditor.isActive('strike')) currentActive.push('strikethrough');
        if (textEditor.isActive('highlight')) currentActive.push('highlight');
        if (textEditor.isActive('heading')) currentActive.push('heading');
        if (textEditor.isActive('blockquote')) currentActive.push('quote');
        if (textEditor.isActive('link')) currentActive.push('link');
      }

      const selected = editor.getSelectedShapes?.() || [];
      const textShape = selected.find((s: any) => s.type === 'text' || s.type === 'note' || s.type === 'geo');
      if (textShape) {
        const align = (textShape.props as any)?.textAlign;
        if (align === 'start') setTextAlign('left');
        else if (align === 'middle') setTextAlign('center');
        else if (align === 'end') setTextAlign('right');

        const col = (textShape.props as any)?.color;
        if (col) setCurrentColor(col);
      }

      if (currentActive.length > 0) {
        setActiveButtons((prev) => Array.from(new Set([...prev, ...currentActive])));
      }
    };

    syncEditorState();
    const unsub = editor.store?.listen?.(syncEditorState);
    return () => {
      unsub?.();
    };
  }, [editor]);

  const toggleActiveButton = useCallback(
    (button: string) => {
      setActiveButtons((prev) =>
        prev.includes(button)
          ? prev.filter((b) => b !== button)
          : [...prev, button]
      );

      if (button === "color") {
        setShowPalette((p) => !p);
        setShowLinkInput(false);
        return;
      }

      if (button === "link") {
        setShowLinkInput((p) => !p);
        setShowPalette(false);
        return;
      }

      // Execute formatting action
      if (onAction) {
        onAction(button);
      } else if (editor) {
        applyFormat(editor, button);
      }
    },
    [editor, onAction]
  );

  const handleTextAlign = useCallback(
    (align: "left" | "center" | "right") => {
      setTextAlign(align);
      const action = `align-${align}`;
      if (onAction) {
        onAction(action);
      } else if (editor) {
        applyFormat(editor, action);
      }
    },
    [editor, onAction]
  );

  const handleColorSelect = useCallback(
    (color: TLDefaultColorStyle) => {
      setCurrentColor(color);
      setShowPalette(false);
      if (onAction) {
        onAction('color', color);
      } else if (editor) {
        applyFormat(editor, 'color', color);
      }
    },
    [editor, onAction]
  );

  const handleLinkConfirm = useCallback(() => {
    if (linkInputUrl.trim()) {
      if (onAction) {
        onAction('link', linkInputUrl.trim());
      } else if (editor) {
        applyFormat(editor, 'link', linkInputUrl.trim());
      }
    }
    setShowLinkInput(false);
    setLinkInputUrl('');
  }, [editor, onAction, linkInputUrl]);

  const showTooltip = (label: string) => {
    setTooltip(label);
  };

  const hideTooltip = () => setTooltip(null);

  const containerClasses =
    containerClassName ||
    (isFloating
      ? "relative inline-flex items-center justify-center pointer-events-auto"
      : "relative w-full min-h-[300px] flex items-center justify-center rounded-lg p-6");

  return (
    <div className={containerClasses}>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className={`relative z-50 bg-secondary dark:bg-slate-900/90 bg-white/95 rounded-lg shadow-xl border border-primary/10 dark:border-white/10 flex items-center gap-1 p-1 backdrop-blur-xl ${
            className || ""
          }`}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Text Formatting Section */}
          <ToolbarButton
            label="Bold"
            icon={Bold}
            isActive={activeButtons.includes("bold")}
            onClick={() => toggleActiveButton("bold")}
            tooltip={tooltip}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />
          <ToolbarButton
            label="Italic"
            icon={Italic}
            isActive={activeButtons.includes("italic")}
            onClick={() => toggleActiveButton("italic")}
            tooltip={tooltip}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />
          <ToolbarButton
            label="Underline"
            icon={Underline}
            isActive={activeButtons.includes("underline")}
            onClick={() => toggleActiveButton("underline")}
            tooltip={tooltip}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />
          <ToolbarButton
            label="Strikethrough"
            icon={Strikethrough}
            isActive={activeButtons.includes("strikethrough")}
            onClick={() => toggleActiveButton("strikethrough")}
            tooltip={tooltip}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />
          <ToolbarButton
            label="Link"
            icon={LinkIcon}
            isActive={activeButtons.includes("link")}
            onClick={() => toggleActiveButton("link")}
            tooltip={tooltip}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />
          <ToolbarButton
            label="Heading"
            icon={Heading}
            isActive={activeButtons.includes("heading")}
            onClick={() => toggleActiveButton("heading")}
            tooltip={tooltip}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />
          <ToolbarButton
            label="Quote"
            icon={Quote}
            isActive={activeButtons.includes("quote")}
            onClick={() => toggleActiveButton("quote")}
            tooltip={tooltip}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />

          {/* Divider */}
          <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-0.5" />

          {/* Highlight and Color Section */}
          <ToolbarButton
            label="Highlight"
            icon={Highlighter}
            isActive={activeButtons.includes("highlight")}
            onClick={() => toggleActiveButton("highlight")}
            tooltip={tooltip}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />
          <ToolbarButton
            label="Change Color"
            icon={Palette}
            isActive={activeButtons.includes("color") || showPalette}
            onClick={() => toggleActiveButton("color")}
            tooltip={tooltip}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />

          {/* Divider */}
          <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-0.5" />

          {/* Text Alignment Section */}
          <ToolbarButton
            label="Align Left"
            icon={AlignLeft}
            isActive={textAlign === "left"}
            onClick={() => handleTextAlign("left")}
            tooltip={tooltip}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />
          <ToolbarButton
            label="Align Center"
            icon={AlignCenter}
            isActive={textAlign === "center"}
            onClick={() => handleTextAlign("center")}
            tooltip={tooltip}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />
          <ToolbarButton
            label="Align Right"
            icon={AlignRight}
            isActive={textAlign === "right"}
            onClick={() => handleTextAlign("right")}
            tooltip={tooltip}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />

          {/* Color Palette Popover */}
          <AnimatePresence>
            {showPalette && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-white/10 rounded-xl p-2 shadow-2xl backdrop-blur-xl flex items-center gap-1.5 z-50"
                onPointerDown={(e) => e.preventDefault()}
              >
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.style}
                    type="button"
                    title={c.name}
                    onClick={() => handleColorSelect(c.style)}
                    onPointerDown={(e) => e.preventDefault()}
                    className={`w-5 h-5 rounded-full border transition-transform cursor-pointer flex items-center justify-center ${
                      currentColor === c.style
                        ? 'scale-110 border-slate-900 dark:border-white shadow-sm ring-2 ring-blue-500/40'
                        : 'border-slate-300 dark:border-slate-600 hover:scale-110'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {currentColor === c.style && (
                      <Check className="w-3 h-3 text-white drop-shadow" />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Link Input Popover */}
          <AnimatePresence>
            {showLinkInput && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-white/10 rounded-xl p-2 shadow-2xl backdrop-blur-xl flex items-center gap-1.5 z-50 min-w-[260px]"
                onPointerDown={(e) => e.preventDefault()}
              >
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={linkInputUrl}
                  onChange={(e) => setLinkInputUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleLinkConfirm();
                    }
                  }}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white flex-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleLinkConfirm}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  Set
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const ContextualButton = ({
  label,
  icon: Icon,
  isActive,
  onClick,
  tooltip,
  onHover,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick: () => void;
  tooltip: string | null;
  onHover: (label: string | null) => void;
}) => (
  <div
    className="relative"
    onMouseEnter={() => onHover(label)}
    onMouseLeave={() => onHover(null)}
  >
    <button
      type="button"
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className={`h-7 w-7 flex items-center justify-center rounded-lg transition-colors duration-150 cursor-pointer ${
        isActive
          ? "bg-blue-600/20 text-blue-500 dark:text-blue-400 font-semibold"
          : "hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
      } focus:outline-none`}
      aria-label={label}
      onClick={onClick}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
    {tooltip === label && (
      <div className="whitespace-nowrap font-medium absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-slate-900/90 text-white text-[11px] rounded-md px-2 py-0.5 shadow-lg pointer-events-none select-none z-50 border border-white/10">
        {label}
      </div>
    )}
  </div>
);

function CustomRichTextToolbar() {
  const editor = useEditor();
  const textEditor = useValue('textEditor', () => (editor as any).getRichTextEditor?.(), [editor]);
  const [currentSelection, setCurrentSelection] = useState<any>(null);
  const previousSelectionBounds = useRef<Box | undefined>(undefined);
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [linkValue, setLinkValue] = useState('');
  const [showPalette, setShowPalette] = useState(false);
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [activeMarks, setActiveMarks] = useState<Record<string, boolean>>({});
  const [currentAlign, setCurrentAlign] = useState<'start' | 'middle' | 'end'>('start');
  const [currentColor, setCurrentColor] = useState<TLDefaultColorStyle>('black');
  const linkInputRef = useRef<HTMLInputElement>(null);

  // Sync active states from textEditor and selected shape
  useEffect(() => {
    const updateActiveMarks = () => {
      if (textEditor?.view) {
        setActiveMarks({
          bold: textEditor.isActive('bold'),
          italic: textEditor.isActive('italic'),
          underline: textEditor.isActive('underline'),
          strike: textEditor.isActive('strike'),
          link: textEditor.isActive('link'),
          heading: textEditor.isActive('heading'),
          quote: textEditor.isActive('blockquote'),
          highlight: textEditor.isActive('highlight'),
        });
        if (textEditor.isActive('link')) {
          setLinkValue(textEditor.getAttributes('link')?.href || '');
        }
      }

      const selected = editor.getSelectedShapes();
      const textShape = selected.find((s) => s.type === 'text');
      if (textShape) {
        const align = (textShape.props as any)?.textAlign || 'start';
        setCurrentAlign(align);
        const col = (textShape.props as any)?.color || 'black';
        setCurrentColor(col);
      }
    };

    updateActiveMarks();
    if (textEditor) {
      textEditor.on('transaction', updateActiveMarks);
      textEditor.on('selectionUpdate', updateActiveMarks);
    }
    const unsub = editor.store.listen(updateActiveMarks);

    return () => {
      if (textEditor) {
        textEditor.off('transaction', updateActiveMarks);
        textEditor.off('selectionUpdate', updateActiveMarks);
      }
      unsub();
    };
  }, [editor, textEditor]);

  // Track textEditor selection updates for positioning
  useEffect(() => {
    if (!textEditor) return;
    const handleSelectionUpdate = ({ editor: te }: any) => {
      setCurrentSelection(te.state.selection);
    };
    textEditor.on('selectionUpdate', handleSelectionUpdate);
    handleSelectionUpdate({ editor: textEditor });
    return () => {
      textEditor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [textEditor]);

  // Focus link input when opening link editor
  useEffect(() => {
    if (isEditingLink) {
      setTimeout(() => {
        linkInputRef.current?.focus();
        linkInputRef.current?.select();
      }, 50);
    }
  }, [isEditingLink]);

  const getSelectionBounds = useCallback(() => {
    if ((isEditingLink || showPalette) && previousSelectionBounds.current) {
      return previousSelectionBounds.current;
    }

    // 1. Check if user highlighted text inside editor
    const win = (editor as any).getContainerWindow?.() || editor.getContainer?.()?.ownerDocument?.defaultView || window;
    const domSelection = win ? win.getSelection() : null;
    if (currentSelection && domSelection && domSelection.rangeCount > 0 && !domSelection.isCollapsed) {
      const rangeBoxes: Box[] = [];
      for (let i = 0; i < domSelection.rangeCount; i++) {
        const range = domSelection.getRangeAt(i);
        const rect = range.getBoundingClientRect();
        if (rect.width > 0 || rect.height > 0) {
          rangeBoxes.push(new Box(rect.x, rect.y, rect.width, rect.height));
        }
      }
      if (rangeBoxes.length > 0) {
        const bounds = Box.Common(rangeBoxes);
        previousSelectionBounds.current = bounds;
        return bounds;
      }
    }

    // 2. Check if text shape is being edited or selected
    const editingShapeId = editor.getEditingShapeId();
    const selectedShapes = editor.getSelectedShapes();
    const editingShape = editingShapeId ? editor.getShape(editingShapeId) : null;
    const textShape =
      (editingShape && editingShape.type === 'text' ? editingShape : null) ||
      (selectedShapes.length === 1 && selectedShapes[0].type === 'text' ? selectedShapes[0] : null);

    if (textShape) {
      const pageBounds = editor.getShapePageBounds(textShape.id);
      if (pageBounds) {
        const topLeft = editor.pageToScreen({ x: pageBounds.x, y: pageBounds.y });
        const zoom = editor.getZoomLevel();
        const bounds = new Box(topLeft.x, topLeft.y, pageBounds.w * zoom, pageBounds.h * zoom);
        previousSelectionBounds.current = bounds;
        return bounds;
      }
    }

    return undefined;
  }, [editor, currentSelection, isEditingLink, showPalette]);

  const handleFormat = (action: string) => {
    applyFormat(editor, action);
  };

  const handleAlign = (align: 'start' | 'middle' | 'end') => {
    setCurrentAlign(align);
    const action = align === 'start' ? 'align-left' : align === 'middle' ? 'align-center' : 'align-right';
    applyFormat(editor, action);
  };

  const handleColor = (color: TLDefaultColorStyle) => {
    setCurrentColor(color);
    setShowPalette(false);
    applyFormat(editor, 'color', color);
  };

  const handleApplyLink = () => {
    const raw = linkValue.trim();
    if (!raw) {
      handleRemoveLink();
      return;
    }
    const finalUrl = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
    if (textEditor?.view) {
      textEditor.chain().focus().setLink({ href: finalUrl }).run();
    } else {
      applyFormat(editor, 'link', finalUrl);
    }
    setIsEditingLink(false);
  };

  const handleRemoveLink = () => {
    if (textEditor?.view) {
      textEditor.chain().focus().unsetLink().run();
    }
    setLinkValue('');
    setIsEditingLink(false);
  };

  const handleVisitLink = () => {
    const raw = linkValue.trim();
    if (raw) {
      const finalUrl = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
      window.open(finalUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Only render if a text shape is selected or text is being edited
  const editingShapeId = editor.getEditingShapeId();
  const selectedShapes = editor.getSelectedShapes();
  const editingShape = editingShapeId ? editor.getShape(editingShapeId) : null;
  const isEditingText = editingShape?.type === 'text';
  const hasTextSelected = selectedShapes.length === 1 && selectedShapes[0].type === 'text';
  if (!isEditingText && !hasTextSelected) {
    return null;
  }

  return (
    <TldrawUiContextualToolbar
      className="tlui-rich-text__toolbar"
      getSelectionBounds={getSelectionBounds}
      changeOnlyWhenYChanges={true}
      label="Text Formatting"
    >
      <div
        className="flex items-center gap-0.5 p-1 bg-white/95 dark:bg-[#121620]/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl z-50 select-none text-slate-800 dark:text-slate-200"
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {isEditingLink ? (
          <div className="flex items-center gap-1 px-1">
            <input
              ref={linkInputRef}
              type="text"
              value={linkValue}
              onChange={(e) => setLinkValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApplyLink();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  setIsEditingLink(false);
                }
              }}
              placeholder="https://example.com"
              className="h-7 w-48 px-2 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              title="Visit Link in Browser"
              disabled={!linkValue.trim()}
              onClick={handleVisitLink}
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-blue-500 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Apply Link"
              onClick={handleApplyLink}
              className="h-7 px-2 flex items-center gap-1 text-xs font-medium rounded-md bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Apply
            </button>
            {activeMarks.link && (
              <button
                type="button"
                title="Remove Link"
                onClick={handleRemoveLink}
                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-red-500/10 text-red-500 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              title="Cancel"
              onClick={() => setIsEditingLink(false)}
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            {/* 1. Bold */}
            <ContextualButton
              label="Bold"
              icon={Bold}
              isActive={!!activeMarks.bold}
              onClick={() => handleFormat('bold')}
              tooltip={tooltip}
              onHover={setTooltip}
            />
            {/* 2. Italic */}
            <ContextualButton
              label="Italic"
              icon={Italic}
              isActive={!!activeMarks.italic}
              onClick={() => handleFormat('italic')}
              tooltip={tooltip}
              onHover={setTooltip}
            />
            {/* 3. Underline */}
            <ContextualButton
              label="Underline"
              icon={Underline}
              isActive={!!activeMarks.underline}
              onClick={() => handleFormat('underline')}
              tooltip={tooltip}
              onHover={setTooltip}
            />
            {/* 4. Strikethrough */}
            <ContextualButton
              label="Strikethrough"
              icon={Strikethrough}
              isActive={!!activeMarks.strike}
              onClick={() => handleFormat('strikethrough')}
              tooltip={tooltip}
              onHover={setTooltip}
            />
            {/* 5. Link */}
            <ContextualButton
              label="Link"
              icon={LinkIcon}
              isActive={!!activeMarks.link || isEditingLink}
              onClick={() => {
                setShowPalette(false);
                setIsEditingLink(true);
              }}
              tooltip={tooltip}
              onHover={setTooltip}
            />
            {/* 6. Heading */}
            <ContextualButton
              label="Heading"
              icon={Heading}
              isActive={!!activeMarks.heading}
              onClick={() => handleFormat('heading')}
              tooltip={tooltip}
              onHover={setTooltip}
            />
            {/* 7. Quote */}
            <ContextualButton
              label="Quote"
              icon={Quote}
              isActive={!!activeMarks.quote}
              onClick={() => handleFormat('quote')}
              tooltip={tooltip}
              onHover={setTooltip}
            />

            {/* Separator */}
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700/80 mx-0.5" />

            {/* 8. Highlighter */}
            <ContextualButton
              label="Highlight"
              icon={Highlighter}
              isActive={!!activeMarks.highlight}
              onClick={() => handleFormat('highlight')}
              tooltip={tooltip}
              onHover={setTooltip}
            />
            {/* 9. Palette */}
            <div className="relative">
              <ContextualButton
                label="Palette"
                icon={Palette}
                isActive={showPalette}
                onClick={() => {
                  setShowPalette((p) => !p);
                  setIsEditingLink(false);
                }}
                tooltip={tooltip}
                onHover={setTooltip}
              />
              <AnimatePresence>
                {showPalette && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white/95 dark:bg-[#151923]/95 border border-slate-200 dark:border-white/10 rounded-xl p-2 shadow-2xl backdrop-blur-xl flex items-center gap-1.5 z-50"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => handleColor(c.style)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-115 cursor-pointer flex items-center justify-center ${
                          currentColor === c.style
                            ? "border-primary scale-110 shadow-sm"
                            : "border-transparent"
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      >
                        {currentColor === c.style && (
                          <Check className="w-3.5 h-3.5 text-white drop-shadow-md" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Separator */}
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700/80 mx-0.5" />

            {/* 10. Align Left */}
            <ContextualButton
              label="Align Left"
              icon={AlignLeft}
              isActive={currentAlign === 'start'}
              onClick={() => handleAlign('start')}
              tooltip={tooltip}
              onHover={setTooltip}
            />
            {/* 11. Align Center */}
            <ContextualButton
              label="Align Center"
              icon={AlignCenter}
              isActive={currentAlign === 'middle'}
              onClick={() => handleAlign('middle')}
              tooltip={tooltip}
              onHover={setTooltip}
            />
            {/* 12. Align Right */}
            <ContextualButton
              label="Align Right"
              icon={AlignRight}
              isActive={currentAlign === 'end'}
              onClick={() => handleAlign('end')}
              tooltip={tooltip}
              onHover={setTooltip}
            />
          </>
        )}
      </div>
    </TldrawUiContextualToolbar>
  );
}

export default function DemoOne() {
  return <Toolbar />;
}

export { Toolbar, CustomRichTextToolbar };
