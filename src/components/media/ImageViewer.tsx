import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Upload,
  Download,
  Link2,
  Maximize2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import Button from '../primitives/Button';
import WindowHeader from '../layout/WindowHeader';
import { stopCanvasPropagation, interactiveProps, textInputProps } from '../../utils/canvas-events';

export interface ImageViewerProps {
  id?: string;
  src?: string;
  title?: string;
  caption?: string;
  onSourceChange?: (newSrc: string, title?: string) => void;
  onDelete?: () => void;
  onMaximize?: () => void;
  onToggleMinimize?: () => void;
  className?: string;
  slotTopBar?: React.ReactNode;
}

const SAMPLE_IMAGES = [
  {
    name: 'Sierra Dawn',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Neon Tokyo',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Minimalist Architecture',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
  },
];

export function ImageViewer({
  id = 'image-node',
  src = '',
  title = 'Spatial Photo Canvas',
  caption,
  onSourceChange,
  onDelete,
  onMaximize,
  onToggleMinimize,
  className,
  slotTopBar,
}: ImageViewerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain');
  const [inputUrl, setInputUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hasError, setHasError] = useState(false);

  const applyCustomUrl = (urlToApply?: string, customTitle?: string) => {
    const target = (urlToApply || inputUrl).trim();
    if (target && onSourceChange) {
      setHasError(false);
      onSourceChange(target, customTitle || 'Online Photo');
      setShowUrlInput(false);
      setInputUrl('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onSourceChange) {
      const localUrl = URL.createObjectURL(file);
      setHasError(false);
      onSourceChange(localUrl, file.name);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && onSourceChange) {
      const localUrl = URL.createObjectURL(file);
      setHasError(false);
      onSourceChange(localUrl, file.name);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownload = () => {
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = `${title || 'photo'}.png`;
    a.click();
  };

  const hasValidImage = src && src.trim() !== '' && !hasError;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
      }}
      onDrop={handleDrop}
      className={twMerge(
        'w-full h-full flex flex-col glass-vision-card rounded-2xl md:rounded-3xl border transition-all duration-300 overflow-hidden shadow-vision-elevated relative select-none transform-gpu will-change-transform font-sans',
        isDraggingOver ? 'border-accent-blue ring-2 ring-accent-blue/50 bg-accent-blue/5' : 'border-white/10',
        className
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Apple macOS Window Header */}
      {slotTopBar || (
        <WindowHeader
          title={title}
          icon={<ImageIcon className="w-3.5 h-3.5 text-accent-cyan" />}
          onDelete={onDelete}
          onToggleMinimize={onToggleMinimize || (() => setIsCollapsed(!isCollapsed))}
          isMinimized={isCollapsed}
          onMaximize={onMaximize}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs px-2.5 py-1 h-7 rounded-xl text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10"
            title="Upload Local Photo"
            leftIcon={<Upload className="w-3 h-3" />}
          >
            Upload
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-xs p-1.5 h-7 w-7 rounded-full text-white/60 hover:text-white"
            title="Enter Image URL"
          >
            <Link2 className="w-3.5 h-3.5" />
          </Button>
        </WindowHeader>
      )}

      {/* URL Input Drawer */}
      <AnimatePresence>
        {showUrlInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 bg-white/5 border-b border-white/10 flex items-center gap-2 z-20 backdrop-blur-2xl"
            onPointerDown={stopCanvasPropagation}
          >
            <input
              type="text"
              placeholder="Paste direct Image URL (.png, .jpg, .webp)..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') applyCustomUrl();
              }}
              {...textInputProps}
              className="flex-1 px-3 py-1.5 text-xs bg-black/50 border border-white/15 rounded-xl text-white focus:outline-none focus:border-accent-blue font-sans tracking-tight"
            />
            <Button size="sm" variant="primary" onClick={() => applyCustomUrl()}>
              Load Image
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Viewport */}
      {!isCollapsed && (
        <div className="flex-1 w-full h-full relative bg-black/90 flex items-center justify-center overflow-hidden">
          {hasValidImage ? (
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <motion.img
                src={src}
                alt={title}
                onError={() => setHasError(true)}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  objectFit: fitMode,
                }}
                className="w-full h-full transition-transform duration-200 pointer-events-auto"
              />

              {/* Floating Image Control Pill */}
              <div
                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-1.5 glass-vision-pill rounded-full border border-white/15 shadow-vision-float z-10"
                onPointerDown={stopCanvasPropagation}
              >
                <button
                  type="button"
                  {...interactiveProps}
                  onClick={(e) => {
                    stopCanvasPropagation(e);
                    setZoom((z) => Math.max(0.5, z - 0.2));
                  }}
                  className="p-1 text-white/60 hover:text-white rounded cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono text-white/80 min-w-[32px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  {...interactiveProps}
                  onClick={(e) => {
                    stopCanvasPropagation(e);
                    setZoom((z) => Math.min(3, z + 0.2));
                  }}
                  className="p-1 text-white/60 hover:text-white rounded cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <div className="w-[1px] h-3 bg-white/15 mx-0.5" />
                <button
                  type="button"
                  {...interactiveProps}
                  onClick={(e) => {
                    stopCanvasPropagation(e);
                    handleRotate();
                  }}
                  className="p-1 text-white/60 hover:text-white rounded cursor-pointer"
                  title="Rotate 90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  {...interactiveProps}
                  onClick={(e) => {
                    stopCanvasPropagation(e);
                    setFitMode(fitMode === 'contain' ? 'cover' : 'contain');
                  }}
                  className="p-1 text-white/60 hover:text-white rounded cursor-pointer text-[10px] font-medium"
                  title="Toggle Fit / Fill"
                >
                  {fitMode === 'contain' ? 'Fit' : 'Fill'}
                </button>
                <button
                  type="button"
                  {...interactiveProps}
                  onClick={(e) => {
                    stopCanvasPropagation(e);
                    handleDownload();
                  }}
                  className="p-1 text-white/60 hover:text-white rounded cursor-pointer"
                  title="Save Image"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Apple Photos Frosted Dropzone */
            <div
              className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-white/[0.04] to-black/60 backdrop-blur-xl pointer-events-auto"
              onPointerDown={stopCanvasPropagation}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                {...interactiveProps}
                className="w-16 h-16 rounded-3xl bg-accent-cyan/15 border border-accent-cyan/30 shadow-glow-blue flex items-center justify-center text-accent-cyan mb-4 cursor-pointer hover:scale-105 transition-transform"
                onClick={(e) => {
                  stopCanvasPropagation(e);
                  fileInputRef.current?.click();
                }}
              >
                <ImageIcon className="w-8 h-8" />
              </motion.div>

              <h3 className="text-sm font-semibold text-white tracking-tight mb-1">
                Drop Image File or Browse Photos
              </h3>
              <p className="text-xs text-white/50 tracking-tight max-w-sm mb-5">
                Supports PNG, JPEG, WebP, GIF, and SVG. Drag right onto this frame or pick a curated sample.
              </p>

              <div className="flex items-center gap-2 mb-6">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-accent-cyan text-black hover:bg-accent-cyan/90"
                >
                  Browse Photo
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowUrlInput(true)}
                  leftIcon={<Link2 className="w-3.5 h-3.5" />}
                  className="px-4 py-2 text-xs rounded-xl"
                >
                  Paste Photo URL
                </Button>
              </div>

              {/* Sample Wallpapers */}
              <div className="flex flex-col items-center gap-2 w-full max-w-md">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-white/40">
                  Featured Gallery Presets
                </span>
                <div className="flex flex-wrap justify-center gap-2">
                  {SAMPLE_IMAGES.map((sample) => (
                    <button
                      key={sample.name}
                      type="button"
                      {...interactiveProps}
                      onClick={(e) => {
                        stopCanvasPropagation(e);
                        applyCustomUrl(sample.url, sample.name);
                      }}
                      className="px-3 py-1.5 text-xs text-white/80 bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 rounded-xl transition-all duration-150 cursor-pointer shadow-sm active:scale-95"
                    >
                      {sample.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ImageViewer;
