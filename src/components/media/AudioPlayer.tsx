import React, { useState, useMemo, useCallback } from 'react';
import { Radio, Music2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import WindowHeader from '../layout/WindowHeader';
import { Tilt } from '../ui/tilt';
import { Spotlight } from '../ui/spotlight';
import { stopCanvasPropagation } from '../../utils/canvas-events';
import {
  MusicPlayer,
  Track,
  DEFAULT_TRACKS,
} from '../ui/music-player-widget';
import { extractAudioMetadata, createRandomGradientCover } from '../../utils/id3-parser';

export interface AudioPlayerProps {
  id?: string;
  src?: string;
  title?: string;
  artist?: string;
  cover?: string;
  isHost?: boolean;
  syncEnabled?: boolean;
  externalCurrentTime?: number;
  externalIsPlaying?: boolean;
  onPlaybackChange?: (currentTime: number, isPlaying: boolean) => void;
  onSourceChange?: (newSrc: string, title?: string, artist?: string, cover?: string) => void;
  onDelete?: () => void;
  onMaximize?: () => void;
  onToggleMinimize?: () => void;
  className?: string;
  slotHeader?: React.ReactNode;
  slotWaveform?: React.ReactNode;
}

export function AudioPlayer({
  id = 'audio-node',
  src = '',
  title = '',
  artist = '',
  cover,
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
  slotHeader,
}: AudioPlayerProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Compute initial tracks based on props, filtering legacy and demo sounds
  const initialTracks = useMemo<Track[]>(() => {
    if (src && src.trim() !== '') {
      // Filter out legacy Google ambient tracks & default demo tracks
      const isDefaultDemo =
        src.includes('actions.google.com') ||
        src.includes('rain_heavy') ||
        src.includes('campfire') ||
        src.includes('coffee_shop') ||
        src.includes('cadd2666') ||
        src.includes('ab5cb084') ||
        src.includes('793e6ffd');

      if (isDefaultDemo) {
        return [];
      }

      const customTrack: Track = {
        title: title || 'Local Audio Track',
        artist: artist || 'Local Artist',
        cover: cover || createRandomGradientCover(title || src),
        src: src,
      };
      return [customTrack];
    }
    return [];
  }, [src, title, artist, cover]);

  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [activeTrack, setActiveTrack] = useState<Track>(tracks[0]);

  // Handle track selection / switch
  const handleTrackChange = useCallback(
    (track: Track) => {
      setActiveTrack(track);
      if (onSourceChange) {
        onSourceChange(track.src, track.title, track.artist, track.cover);
      }
    },
    [onSourceChange]
  );

  // Handle new track added
  const handleAddTrack = useCallback(
    (newTrack: Track) => {
      setTracks((prev) => [...prev, newTrack]);
      setActiveTrack(newTrack);
      if (onSourceChange) {
        onSourceChange(newTrack.src, newTrack.title, newTrack.artist, newTrack.cover);
      }
    },
    [onSourceChange]
  );

  // Drag and drop audio files directly into the window frame
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|ogg|flac|m4a|aac)$/i))) {
      try {
        const meta = await extractAudioMetadata(file);
        const streamUrl = URL.createObjectURL(file);
        const newTrack: Track = {
          title: meta.title || file.name.replace(/\.[^/.]+$/, ''),
          artist: meta.artist || 'Local Artist',
          cover: meta.coverUrl || createRandomGradientCover(),
          src: streamUrl,
        };
        handleAddTrack(newTrack);
      } catch (err) {
        console.error('Failed to parse dropped audio file:', err);
      }
    }
  };

  return (
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
          'w-full h-full flex flex-col glass-vision-card rounded-2xl md:rounded-3xl border border-white/10 overflow-hidden shadow-vision-elevated select-none transform-gpu will-change-transform font-sans relative',
          isDraggingOver ? 'ring-2 ring-indigo-500/60 shadow-lg' : '',
          className
        )}
      >
        {/* Dynamic Specular Spotlight Glare */}
        <Spotlight
          className="from-white/30 via-white/10 to-transparent blur-2xl"
          size={300}
        />

        {/* Apple Frosted macOS Window Header / Window Tool Manager to move the player */}
        {slotHeader || (
          <WindowHeader
            title={activeTrack?.title || title || 'Song Player'}
            icon={<Music2 className="w-3.5 h-3.5 text-accent-blue" />}
            onDelete={onDelete}
            onToggleMinimize={onToggleMinimize || (() => setIsCollapsed(!isCollapsed))}
            isMinimized={isCollapsed}
            onMaximize={onMaximize}
            className="border-b border-white/10 bg-transparent"
          >
            {activeTrack?.artist && (
              <span className="text-[11px] font-mono text-white/60 truncate max-w-[120px]">
                {activeTrack.artist}
              </span>
            )}
          </WindowHeader>
        )}

        {!isCollapsed && (
          <div
            className="flex-1 min-h-0 relative overflow-hidden"
            onPointerDown={stopCanvasPropagation}
          >
            <MusicPlayer
              tracks={tracks}
              isHost={isHost}
              externalCurrentTime={externalCurrentTime}
              externalIsPlaying={externalIsPlaying}
              onPlaybackChange={onPlaybackChange}
              onTrackChange={handleTrackChange}
              onAddTrack={handleAddTrack}
              showUploadButton={true}
              className="w-full h-full seamless-player"
            />
          </div>
        )}
      </div>
    </Tilt>
  );
}

export default AudioPlayer;
