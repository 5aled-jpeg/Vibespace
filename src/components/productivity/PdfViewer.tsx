import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Upload,
  Link2,
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import Button from '../primitives/Button';
import WindowHeader from '../layout/WindowHeader';
import { PDFViewer } from '../extend/pdf-viewer';
import { stopCanvasPropagation, interactiveProps, textInputProps } from '../../utils/canvas-events';

export interface PdfViewerProps {
  id?: string;
  fileUrl?: string;
  title?: string;
  onFileChange?: (url: string, title?: string) => void;
  onDelete?: () => void;
  onMaximize?: () => void;
  onToggleMinimize?: () => void;
  className?: string;
  slotToolbar?: React.ReactNode;
}

const SAMPLE_PDFS = [
  {
    name: 'Workspace Guide',
    url: '/sample.pdf',
  },
  {
    name: 'Mozilla PDF Spec',
    url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
  },
];

export function PdfViewer({
  id = 'pdf-node',
  fileUrl = '',
  title = 'Document Specification.pdf',
  onFileChange,
  onDelete,
  onMaximize,
  onToggleMinimize,
  className,
  slotToolbar,
}: PdfViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [useNativeViewer, setUseNativeViewer] = useState(false);
  const [embedLoadError, setEmbedLoadError] = useState(false);
  const [currentBuffer, setCurrentBuffer] = useState<ArrayBuffer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!fileUrl.startsWith('blob:')) {
      setCurrentBuffer(null);
    }
  }, [fileUrl]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileChange) {
      setEmbedLoadError(false);
      try {
        const buffer = await file.arrayBuffer();
        setCurrentBuffer(buffer);
        const url = URL.createObjectURL(file);
        onFileChange(url, file.name);
      } catch (err) {
        console.error('Error reading PDF file buffer:', err);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && onFileChange) {
      setEmbedLoadError(false);
      try {
        const buffer = await file.arrayBuffer();
        setCurrentBuffer(buffer);
        const url = URL.createObjectURL(file);
        onFileChange(url, file.name);
      } catch (err) {
        console.error('Error reading dropped PDF buffer:', err);
      }
    }
  };

  const handleApplyUrl = () => {
    if (inputUrl.trim() && onFileChange) {
      setCurrentBuffer(null);
      setEmbedLoadError(false);
      onFileChange(inputUrl.trim(), inputUrl.split('/').pop() || 'Remote Document.pdf');
      setShowUrlInput(false);
      setInputUrl('');
    }
  };

  const applyCustomUrl = (urlToApply?: string, customTitle?: string) => {
    const target = (urlToApply || inputUrl).trim();
    if (target && onFileChange) {
      setCurrentBuffer(null);
      setEmbedLoadError(false);
      onFileChange(target, customTitle || 'Online Document.pdf');
      setShowUrlInput(false);
      setInputUrl('');
    }
  };

  const hasValidPdf = fileUrl && fileUrl.trim() !== '';

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
        'w-full h-full flex flex-col glass-vision-card rounded-2xl md:rounded-3xl border transition-all duration-300 overflow-hidden shadow-vision-elevated select-none relative transform-gpu will-change-transform font-sans',
        isDraggingOver ? 'border-accent-red ring-2 ring-accent-red/50 bg-accent-red/5' : 'border-white/10',
        className
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Apple macOS Window Header */}
      {slotToolbar || (
        <WindowHeader
          title={title}
          icon={<FileText className="w-3.5 h-3.5 text-accent-red" />}
          onDelete={onDelete}
          onToggleMinimize={onToggleMinimize || (() => setIsCollapsed(!isCollapsed))}
          isMinimized={isCollapsed}
          onMaximize={onMaximize}
        >
          {hasValidPdf && (
            <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-lg border border-white/10 mr-1">
              <button
                type="button"
                {...interactiveProps}
                onClick={(e) => {
                  stopCanvasPropagation(e);
                  setPage(Math.max(1, page - 1));
                }}
                disabled={page <= 1}
                className="text-white/50 hover:text-white disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono text-white/80">Page {page}</span>
              <button
                type="button"
                {...interactiveProps}
                onClick={(e) => {
                  stopCanvasPropagation(e);
                  setPage(page + 1);
                }}
                className="text-white/50 hover:text-white cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {hasValidPdf && (
            <div className="flex items-center gap-0.5 mr-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom(Math.max(50, zoom - 15))}
                className="h-7 w-7 rounded-lg text-white/60 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </Button>
              <span className="text-[11px] font-mono text-white/50 min-w-[32px] text-center">
                {zoom}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom(Math.min(200, zoom + 15))}
                className="h-7 w-7 rounded-lg text-white/60 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}

          {hasValidPdf && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setUseNativeViewer(!useNativeViewer);
                setEmbedLoadError(false);
              }}
              className="text-xs px-2.5 py-1 h-7 rounded-xl text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 font-medium"
              title="Toggle Viewer Engine"
            >
              {useNativeViewer ? 'EmbedPDF' : 'Native View'}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs px-2.5 py-1 h-7 rounded-xl text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10"
            title="Upload PDF"
            leftIcon={<Upload className="w-3 h-3" />}
          >
            Upload
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-xs p-1.5 h-7 w-7 rounded-full text-white/60 hover:text-white"
            title="Enter PDF URL"
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
              placeholder="Paste direct PDF document link..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') applyCustomUrl();
              }}
              {...textInputProps}
              className="flex-1 px-3 py-1.5 text-xs bg-black/50 border border-white/15 rounded-xl text-white focus:outline-none focus:border-accent-red font-sans tracking-tight"
            />
            <Button size="sm" variant="primary" onClick={() => applyCustomUrl()}>
              Load PDF
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Viewport */}
      {!isCollapsed && (
        <div className="flex-1 w-full h-full relative bg-[#1c212e] flex items-center justify-center overflow-hidden">
          {hasValidPdf ? (
            <div
              className="w-full h-full relative overflow-hidden pointer-events-auto bg-[#18181b] flex flex-col"
              onPointerDown={stopCanvasPropagation}
            >
              {useNativeViewer || embedLoadError ? (
                <div className="w-full h-full relative flex flex-col">
                  {embedLoadError && (
                    <div className="bg-amber-500/15 border-b border-amber-500/30 px-3 py-1.5 flex items-center justify-between text-xs text-amber-200">
                      <span>Loaded with Native PDF Engine</span>
                      <button
                        type="button"
                        {...interactiveProps}
                        onClick={(e) => {
                          stopCanvasPropagation(e);
                          setEmbedLoadError(false);
                          setUseNativeViewer(false);
                        }}
                        className="underline hover:text-white cursor-pointer ml-2"
                      >
                        Try EmbedPDF Pro
                      </button>
                    </div>
                  )}
                  <iframe
                    src={`${fileUrl}#toolbar=1&navpanes=1`}
                    title={title}
                    className="w-full h-full border-none bg-[#18181b]"
                  />
                </div>
              ) : (
                <PDFViewer
                  src={fileUrl}
                  pdfData={currentBuffer || undefined}
                  fileName={title}
                  className="w-full h-full text-white"
                  defaultZoom="fit-width"
                  showDownload={true}
                  showToolbar={true}
                  showRotateControls={true}
                  showUpload={true}
                  onPdfUpload={async (file) => {
                    setEmbedLoadError(false);
                    try {
                      const buffer = await file.arrayBuffer();
                      setCurrentBuffer(buffer);
                      const url = URL.createObjectURL(file);
                      onFileChange?.(url, file.name);
                    } catch (err) {
                      console.error('Error in onPdfUpload:', err);
                    }
                  }}
                  onDocumentLoadSuccess={() => {
                    setEmbedLoadError(false);
                  }}
                  onError={(err) => {
                    console.warn('EmbedPDF load error, switching to native viewer:', err);
                    setEmbedLoadError(true);
                  }}
                />
              )}
            </div>
          ) : (
            /* Apple Preview Frosted PDF Dropzone */
            <div
              className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-white/[0.04] to-black/60 backdrop-blur-xl pointer-events-auto"
              onPointerDown={stopCanvasPropagation}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                {...interactiveProps}
                className="w-16 h-16 rounded-3xl bg-accent-red/15 border border-accent-red/30 shadow-glow-red flex items-center justify-center text-accent-red mb-4 cursor-pointer hover:scale-105 transition-transform"
                onClick={(e) => {
                  stopCanvasPropagation(e);
                  fileInputRef.current?.click();
                }}
              >
                <FileText className="w-8 h-8" />
              </motion.div>

              <h3 className="text-sm font-semibold text-white tracking-tight mb-1">
                Drop PDF Document or Browse Files
              </h3>
              <p className="text-xs text-white/50 tracking-tight max-w-sm mb-5">
                Drag and drop your PDF file onto this frame, or pick a sample documentation below.
              </p>

              <div className="flex items-center gap-2 mb-6">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-accent-red text-white hover:bg-accent-red/90"
                >
                  Browse PDF File
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowUrlInput(true)}
                  leftIcon={<Link2 className="w-3.5 h-3.5" />}
                  className="px-4 py-2 text-xs rounded-xl"
                >
                  Paste PDF Link
                </Button>
              </div>

              {/* Sample PDF presets */}
              <div className="flex flex-col items-center gap-2 w-full max-w-md">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-white/40">
                  Quick Sample Documents
                </span>
                <div className="flex flex-wrap justify-center gap-2">
                  {SAMPLE_PDFS.map((sample) => (
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

export default PdfViewer;
