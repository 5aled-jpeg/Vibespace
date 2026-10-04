import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  PhoneOff,
  Radio,
  Users,
  Settings,
  Sparkles,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Button from '../primitives/Button';
import { livekitManager, HangoutParticipant } from '../../realtime/livekit-client';
import { useAppStore } from '../../stores/appStore';

export interface VoiceDockProps {
  roomId?: string;
  isHost?: boolean;
  onLeaveRoom?: () => void;
  className?: string;
  slotLeading?: React.ReactNode;
  slotTrailing?: React.ReactNode;
}

export function VoiceDock({
  roomId = 'Vibe-Lounge-Alpha',
  isHost = true,
  onLeaveRoom,
  className,
  slotLeading,
  slotTrailing,
}: VoiceDockProps) {
  const openSettings = useAppStore((s) => s.openSettings);
  const [isConnected, setIsConnected] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState<HangoutParticipant[]>([
    {
      identity: 'user-self',
      name: 'You (Host)',
      isSpeaking: false,
      isMuted: false,
      isCameraOn: false,
      isScreenSharing: false,
    },
    {
      identity: 'user-alex',
      name: 'Alex Rivera',
      isSpeaking: true,
      isMuted: false,
      isCameraOn: false,
      isScreenSharing: false,
    },
    {
      identity: 'user-sarah',
      name: 'Sarah Chen',
      isSpeaking: false,
      isMuted: true,
      isCameraOn: false,
      isScreenSharing: false,
    },
  ]);

  useEffect(() => {
    const unsub = livekitManager.onParticipantsChange((realParticipants) => {
      if (realParticipants.length > 0) {
        setParticipants(realParticipants);
      }
    });
    return unsub;
  }, []);

  const toggleMic = async () => {
    setIsMuted(!isMuted);
    await livekitManager.toggleMicrophone();
  };

  const toggleCam = async () => {
    setIsCameraOn(!isCameraOn);
    await livekitManager.toggleCamera();
  };

  const toggleScreen = async () => {
    setIsScreenSharing(!isScreenSharing);
    await livekitManager.toggleScreenShare();
  };

  const handleDisconnect = async () => {
    setIsConnected(false);
    await livekitManager.disconnect();
    onLeaveRoom?.();
  };

  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={twMerge(
          'flex items-center gap-3 px-4 py-2.5 glass-vision-pill rounded-full shadow-vision border border-slate-300/40 select-none transform-gpu will-change-transform font-sans',
          className
        )}
      >
        <span className="text-xs text-slate-600 font-medium tracking-tight">Voice Hangout Inactive</span>
        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsConnected(true)}
          className="text-xs py-1 px-3 h-7 bg-accent-green text-black hover:bg-accent-green/90 shadow-glow-green"
        >
          Rejoin Call
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={twMerge(
        'flex items-center gap-3 p-2.5 glass-vision rounded-full shadow-vision-float border border-slate-300/40 select-none transform-gpu will-change-transform font-sans',
        className
      )}
    >
      {slotLeading}

      {/* Room Badge */}
      <div className="flex items-center gap-2.5 pl-2 pr-3 border-r border-slate-300/60">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-green shadow-glow-green"></span>
        </span>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-900 tracking-tight leading-tight">
            {roomId}
          </span>
          <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1 leading-tight tracking-tight">
            <Radio className="w-2.5 h-2.5 text-accent-green" /> sub-40ms RTC
          </span>
        </div>
      </div>

      {/* Tactile Participant Avatars */}
      <div className="flex items-center gap-1.5 px-1">
        {participants.map((p) => {
          const initials = p.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          return (
            <motion.div
              key={p.identity}
              whileHover={{ scale: 1.12 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              title={`${p.name} ${p.isMuted ? '(Muted)' : ''} ${p.isSpeaking ? '(Speaking)' : ''}`}
              className={clsx(
                'relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 cursor-pointer',
                p.isSpeaking
                  ? 'ring-2 ring-accent-green bg-accent-green/20 text-accent-green shadow-glow-green'
                  : 'bg-slate-200/90 text-slate-800 border border-slate-300/80 shadow-sm'
              )}
            >
              {initials}
              {p.isMuted && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-white border border-slate-300 rounded-full flex items-center justify-center text-accent-red shadow-sm">
                  <MicOff className="w-2 h-2" />
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Voice & Video Controls */}
      <div className="flex items-center gap-1.5 pl-2.5 border-l border-slate-300/60">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMic}
          className={clsx(
            'h-8 w-8 rounded-full transition-colors',
            isMuted
              ? 'bg-accent-red/20 text-accent-red border border-accent-red/40 hover:bg-accent-red/30'
              : 'text-slate-700 hover:text-black hover:bg-black/5'
          )}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCam}
          className={clsx(
            'h-8 w-8 rounded-full transition-colors',
            isCameraOn
              ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/40 shadow-glow-blue hover:bg-accent-blue/30'
              : 'text-slate-700 hover:text-black hover:bg-black/5'
          )}
          title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {isCameraOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleScreen}
          className={clsx(
            'h-8 w-8 rounded-full transition-colors',
            isScreenSharing
              ? 'bg-accent-purple/20 text-accent-purple border border-accent-purple/40 shadow-glow-purple hover:bg-accent-purple/30'
              : 'text-slate-700 hover:text-black hover:bg-black/5'
          )}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          <ScreenShare className="w-3.5 h-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => openSettings('voicehangout')}
          className="h-8 w-8 rounded-full text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 ml-0.5"
          title="Voice & Video Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleDisconnect}
          className="h-8 w-8 rounded-full text-accent-red hover:bg-accent-red/15 border border-accent-red/30 ml-1"
          title="Disconnect from voice"
        >
          <PhoneOff className="w-3.5 h-3.5" />
        </Button>
      </div>

      {slotTrailing}
    </motion.div>
  );
}

export default VoiceDock;
