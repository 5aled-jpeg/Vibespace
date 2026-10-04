import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
  Radio,
  Link2,
  Upload,
  Video as VideoIcon,
  Sparkles,
  Film,
  Plus,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Slider from '../primitives/Slider';
import Button from '../primitives/Button';
import WindowHeader from '../layout/WindowHeader';
import { stopCanvasPropagation, interactiveProps, textInputProps } from '../../utils/canvas-events';

export interface VideoPlayerProps {
  id?: string;
  src?: string;
  title?: string;
  isHost?: boolean;
  syncEnabled?: boolean;
  externalCurrentTime?: number;
  externalIsPlaying?: boolean;
  onPlaybackChange?: (currentTime: number, isPlaying: boolean) => void;
  onSourceChange?: (newSrc: string, title?: string) => void;
  onDelete?: () => void;
  onMaximize?: () => void;
  onToggleMinimize?: () => void;
  className?: string;
  slotTopBar?: React.ReactNode;
  slotBottomBar?: React.ReactNode;
}

const SAMPLE_VIDEOS = [
  {
    name: 'Big Buck Bunny (Animation)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  },
  {
    name: 'For Bigger Blazes (Action 4K)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
  {
    name: 'We Are Going On Bullrun (Cinematic)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
  },
];

export function VideoPlayer({
  id = 'video-node',
  src = '',
  title = 'Watch Party Stream',
  isHost = true,
  syncEnabled = true,
  externalCurrentTime,
  externalIsPlaying,
  onPlaybackChange,
  onSourceChange,
  onDelete,
  onMaximize,
  onToggleMinimize,
  className,
  slotTopBar,
  slotBottomBar,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hasError, setHasError] = useState(false);

  const isYouTube = src.includes('youtube.com') || src.includes('youtu.be');

  // Parse YouTube video ID
  const getYouTubeEmbedUrl = (url: string) => {
    let videoId = '';
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0] || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    }
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&enablejsapi=1`;
  };

  // Sync with external state (drift sync pulse)
  useEffect(() => {
    if (!isHost && externalCurrentTime !== undefined && videoRef.current) {
      const current = videoRef.current.currentTime;
      if (Math.abs(current - externalCurrentTime) > 0.25) {
        videoRef.current.currentTime = externalCurrentTime;
      }
    }
  }, [externalCurrentTime, isHost]);

  useEffect(() => {
    if (!isHost && externalIsPlaying !== undefined && videoRef.current) {
      if (externalIsPlaying && videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      } else if (!externalIsPlaying && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    }
  }, [externalIsPlaying, isHost]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
      if (isHost && onPlaybackChange) {
        onPlaybackChange(videoRef.current.currentTime, true);
      }
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      if (isHost && onPlaybackChange) {
        onPlaybackChange(videoRef.current.currentTime, false);
      }
    }
  }, [isHost, onPlaybackChange]);

  const handleSeek = (newTime: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    if (isHost && onPlaybackChange) {
      onPlaybackChange(newTime, !videoRef.current.paused);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      if (newVolume === 0) setIsMuted(true);
      else setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (isHost && onPlaybackChange && Math.floor(videoRef.current.currentTime) % 3 === 0) {
        onPlaybackChange(videoRef.current.currentTime, !videoRef.current.paused);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setHasError(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const applyCustomUrl = (urlToApply?: string, customTitle?: string) => {
    const target = (urlToApply || inputUrl).trim();
    if (target && onSourceChange) {
      setHasError(false);
      onSourceChange(target, customTitle || (target.includes('youtube') ? 'YouTube Party' : 'Spatial Stream'));
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

  const hasValidVideo = src && src.trim() !== '' && !hasError;

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
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/ogg,video/quicktime,video/mkv,video/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Apple Frosted macOS Window Header */}
      {slotTopBar || (
        <WindowHeader
          title={title}
          icon={<Film className="w-3.5 h-3.5 text-accent-blue" />}
          onDelete={onDelete}
          onToggleMinimize={onToggleMinimize || (() => setIsCollapsed(!isCollapsed))}
          isMinimized={isCollapsed}
          onMaximize={onMaximize}
        >
          {syncEnabled && (
            <span className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-accent-blue/15 text-accent-blue border border-accent-blue/30 shadow-glow-blue mr-1">
              <Radio className="w-2.5 h-2.5 animate-pulse" />
              {isHost ? 'Sync Host' : 'Synced'}
            </span>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs px-2.5 py-1 h-7 rounded-xl text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10"
            title="Upload Local Video"
            leftIcon={<Upload className="w-3 h-3" />}
          >
            Upload
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-xs p-1.5 h-7 w-7 rounded-full text-white/60 hover:text-white"
            title="Enter Video URL"
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
              placeholder="Paste direct MP4 URL, WebM, or YouTube Link..."
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
              Load Video
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Viewport */}
      {!isCollapsed && (
        <div className="flex-1 w-full h-full relative bg-black/90 flex items-center justify-center overflow-hidden">
          {hasValidVideo ? (
            isYouTube ? (
              <iframe
                src={getYouTubeEmbedUrl(src)}
                title={title}
                className="w-full h-full border-0 pointer-events-auto"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                ref={videoRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onError={() => setHasError(true)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                playsInline
                className="w-full h-full object-contain pointer-events-auto"
              />
            )
          ) : (
            /* Apple-Style Frosted Video Dropzone / Upload Placeholder */
            <div
              className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-white/[0.04] to-black/60 backdrop-blur-xl pointer-events-auto"
              onPointerDown={stopCanvasPropagation}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                {...interactiveProps}
                className="w-16 h-16 rounded-3xl bg-accent-blue/15 border border-accent-blue/30 shadow-glow-blue flex items-center justify-center text-accent-blue mb-4 cursor-pointer hover:scale-105 transition-transform"
                onClick={(e) => {
                  stopCanvasPropagation(e);
                  fileInputRef.current?.click();
                }}
              >
                <VideoIcon className="w-8 h-8" />
              </motion.div>

              <h3 className="text-sm font-semibold text-white tracking-tight mb-1">
                Drop Video File or Choose Media
              </h3>
              <p className="text-xs text-white/50 tracking-tight max-w-sm mb-5">
                Drag and drop any MP4, WebM, or MKV video from your PC, or select from watch-party samples below.
              </p>

              <div className="flex items-center gap-2 mb-6">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                  className="px-4 py-2 text-xs font-semibold rounded-xl"
                >
                  Browse Video File
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowUrlInput(true)}
                  leftIcon={<Link2 className="w-3.5 h-3.5" />}
                  className="px-4 py-2 text-xs rounded-xl"
                >
                  Paste URL / YouTube
                </Button>
              </div>

              {/* 1-Click Fast Presets */}
              <div className="flex flex-col items-center gap-2 w-full max-w-md">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-white/40">
                  Instant Demo Streams
                </span>
                <div className="flex flex-wrap justify-center gap-2">
                  {SAMPLE_VIDEOS.map((sample) => (
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

      {/* Video Control Bar */}
      {!isCollapsed && hasValidVideo && !isYouTube && (
        <div
          className="px-4 py-3 bg-white/5 border-t border-white/10 backdrop-blur-2xl flex flex-col gap-2 z-10"
          onPointerDown={stopCanvasPropagation}
        >
          {/* Progress Slider */}
          <div className="flex items-center gap-3 text-xs text-white/60">
            <span className="font-mono text-[11px] min-w-[35px] text-white/75">{formatTime(currentTime)}</span>
            <div className="flex-1">
              <Slider
                value={currentTime}
                min={0}
                max={duration || 100}
                step={0.1}
                onChange={handleSeek}
              />
            </div>
            <span className="font-mono text-[11px] min-w-[35px] text-white/50">{formatTime(duration)}</span>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleSeek(0)}
                className="h-8 w-8 rounded-full text-white/60 hover:text-white hover:bg-white/10"
                title="Restart"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>

              {/* Volume Slider */}
              <div className="flex items-center gap-2 ml-1 w-28">
                <button
                  type="button"
                  {...interactiveProps}
                  onClick={(e) => {
                    stopCanvasPropagation(e);
                    toggleMute();
                  }}
                  className="text-white/60 hover:text-white cursor-pointer"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-accent-red" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <Slider
                  value={isMuted ? 0 : volume}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={handleVolumeChange}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-7 px-2.5 text-xs text-white/60 hover:text-white rounded-lg"
                title="Change File"
              >
                Change
              </Button>
              <button
                type="button"
                {...interactiveProps}
                onClick={(e) => {
                  stopCanvasPropagation(e);
                  videoRef.current?.requestFullscreen?.();
                }}
                className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                title="Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {slotBottomBar}
    </div>
  );
}

export default VideoPlayer;
