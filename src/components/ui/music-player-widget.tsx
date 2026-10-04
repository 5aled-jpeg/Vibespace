import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import {
  Upload,
  Plus,
  ListMusic,
  Image as ImageIcon,
  Sparkles,
  X,
  Check,
  Music,
  Trash2,
  Shuffle,
  Volume2,
  Volume1,
  VolumeX,
} from 'lucide-react';
import './music-player-widget.css';
import {
  cleanFileName,
  createRandomGradientCover,
  extractAudioMetadata,
} from '../../utils/id3-parser';
import { useSpatialFocus } from '../../context/SpatialFocusContext';
import {
  stopCanvasPropagation,
  stopKeyPropagation,
} from '../../utils/canvas-events';

/* ----------------------------------------------------------------- types */

export interface Track {
  title: string;
  artist: string;
  cover: string;
  src: string;
}

export type LoopMode = 'off' | 'all' | 'one';
export type Direction = 'next' | 'prev' | null;
type AudioCtor = typeof AudioContext;

export const DEFAULT_TRACKS: Track[] = [];

/* ------------------------------------------------------------- useRafLoop */

function useRafLoop(cb: (now: number, dt: number) => void) {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = now - last;
      last = now;
      cbRef.current(now, dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
}

/* -------------------------------------------------- useTransitionSound */

function useTransitionSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  useEffect(() => {
    return () => {
      ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
    };
  }, []);
  return useCallback((bassEnergy = 0.5) => {
    try {
      if (!ctxRef.current) {
        const Ctor: AudioCtor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: AudioCtor })
            .webkitAudioContext;
        if (!Ctor) return;
        ctxRef.current = new Ctor();
      }
      const ctx = ctxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startFreq = 440 + bassEnergy * 440;
      const endFreq = startFreq * (2 / 3);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.09);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.06, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      /* Web Audio unavailable */
    }
  }, []);
}

/* --------------------------------------------------- useAudioAnalyser */

const FFT_SIZE = 256;

function useAudioAnalyser(
  audioRef: React.RefObject<HTMLAudioElement | null>
) {
  const dataRef = useRef<Uint8Array>(new Uint8Array(FFT_SIZE / 2));

  const getFrequencyData = useCallback((): Uint8Array | null => {
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      const data = dataRef.current;
      const t = audio.currentTime;
      for (let i = 0; i < data.length; i++) {
        const val = Math.floor(
          75 +
            55 * Math.sin(t * 7 + i * 0.45) +
            35 * Math.cos(t * 13 + i * 0.75)
        );
        data[i] = Math.max(0, Math.min(255, val));
      }
      return data;
    }
    return null;
  }, [audioRef]);

  const getBandEnergy = useCallback(
    (startBin: number, endBin: number): number => {
      const data = dataRef.current;
      const count = endBin - startBin;
      if (count <= 0) return 0;
      let sum = 0;
      for (let i = startBin; i < endBin && i < data.length; i++) sum += data[i];
      return sum / count / 255;
    },
    []
  );

  return { getFrequencyData, getBandEnergy };
}

/* ------------------------------------------------------ useAudioPlayer */

interface State {
  currentIndex: number;
  order: number[];
  shuffled: boolean;
  loopMode: LoopMode;
  isPlaying: boolean;
  direction: Direction;
}
type Action =
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'SET_TRACK'; index: number; direction: Direction }
  | { type: 'TOGGLE_SHUFFLE'; trackCount: number }
  | { type: 'CYCLE_LOOP' }
  | { type: 'UPDATE_ORDER'; trackCount: number };

function shuffleOrder(pinFirst: number, count: number): number[] {
  const rest = Array.from({ length: count }, (_, i) => i).filter(
    (x) => x !== pinFirst
  );
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [pinFirst, ...rest];
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'PLAY':
      return { ...state, isPlaying: true };
    case 'PAUSE':
      return { ...state, isPlaying: false };
    case 'SET_TRACK':
      return {
        ...state,
        currentIndex: action.index,
        direction: action.direction,
      };
    case 'TOGGLE_SHUFFLE': {
      const shuffled = !state.shuffled;
      const order = shuffled
        ? shuffleOrder(state.currentIndex, action.trackCount)
        : Array.from({ length: action.trackCount }, (_, i) => i);
      return { ...state, shuffled, order };
    }
    case 'CYCLE_LOOP': {
      const next: LoopMode =
        state.loopMode === 'off'
          ? 'all'
          : state.loopMode === 'all'
          ? 'one'
          : 'off';
      return { ...state, loopMode: next };
    }
    case 'UPDATE_ORDER': {
      if (state.shuffled) {
        return {
          ...state,
          order: shuffleOrder(state.currentIndex, action.trackCount),
        };
      }
      return {
        ...state,
        order: Array.from({ length: action.trackCount }, (_, i) => i),
      };
    }
    default:
      return state;
  }
}

function useAudioPlayer(
  tracks: Track[],
  options?: {
    isHost?: boolean;
    externalCurrentTime?: number;
    externalIsPlaying?: boolean;
    onPlaybackChange?: (currentTime: number, isPlaying: boolean) => void;
  }
) {
  const isHost = options?.isHost ?? true;
  const externalCurrentTime = options?.externalCurrentTime;
  const externalIsPlaying = options?.externalIsPlaying;
  const onPlaybackChange = options?.onPlaybackChange;

  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // YouTube-style sound level and mute states
  const [volume, setVolumeState] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const previousVolumeRef = useRef<number>(1.0);

  const setVolume = useCallback((val: number) => {
    const v = Math.max(0, Math.min(1, val));
    setVolumeState(v);
    if (v > 0) {
      previousVolumeRef.current = v;
      setIsMuted(false);
      if (audioRef.current) {
        audioRef.current.muted = false;
        audioRef.current.volume = v;
      }
    } else {
      setIsMuted(true);
      if (audioRef.current) {
        audioRef.current.muted = true;
        audioRef.current.volume = 0;
      }
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prevMuted) => {
      const nextMuted = !prevMuted;
      if (audioRef.current) {
        audioRef.current.muted = nextMuted;
        if (nextMuted) {
          audioRef.current.volume = 0;
        } else {
          const restoreVol =
            previousVolumeRef.current > 0 ? previousVolumeRef.current : 1.0;
          setVolumeState(restoreVol);
          audioRef.current.volume = restoreVol;
        }
      }
      return nextMuted;
    });
  }, []);

  const [state, dispatch] = useReducer(reducer, {
    currentIndex: 0,
    order: Array.from({ length: tracks.length }, (_, i) => i),
    shuffled: false,
    loopMode: 'all',
    isPlaying: false,
    direction: null,
  });

  const { getFrequencyData, getBandEnergy } = useAudioAnalyser(audioRef);
  const playTransitionSound = useTransitionSound();

  // External sync when not host
  useEffect(() => {
    if (!isHost && externalCurrentTime !== undefined && audioRef.current) {
      if (Math.abs(audioRef.current.currentTime - externalCurrentTime) > 0.3) {
        audioRef.current.currentTime = externalCurrentTime;
      }
    }
  }, [externalCurrentTime, isHost]);

  useEffect(() => {
    if (!isHost && externalIsPlaying !== undefined && audioRef.current) {
      if (externalIsPlaying && audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      } else if (!externalIsPlaying && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    }
  }, [externalIsPlaying, isHost]);

  // Keep order in sync when tracks change
  useEffect(() => {
    dispatch({ type: 'UPDATE_ORDER', trackCount: tracks.length });
  }, [tracks.length]);

  const loadTrack = useCallback(
    (index: number, autoplay: boolean, direction: Direction) => {
      const audio = audioRef.current;
      if (!audio || !tracks[index]) return;
      const bassEnergy = getBandEnergy(0, 4);
      playTransitionSound(bassEnergy);
      dispatch({ type: 'SET_TRACK', index, direction });
      audio.src = tracks[index].src;
      audio.volume = isMuted ? 0 : volume;
      audio.muted = isMuted;
      if (autoplay) {
        let played = false;
        const attemptPlay = () => {
          if (played) return;
          played = true;
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              console.warn('Playback error on track load:', err);
            });
          }
        };

        const onReady = () => {
          audio.removeEventListener('canplay', onReady);
          audio.removeEventListener('loadeddata', onReady);
          attemptPlay();
        };

        audio.addEventListener('canplay', onReady);
        audio.addEventListener('loadeddata', onReady);
        audio.load();
        attemptPlay();
      } else {
        audio.load();
      }
    },
    [tracks, playTransitionSound, getBandEnergy, volume, isMuted]
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      if (!audio.src || audio.src === '' || audio.src === window.location.href) {
        audio.src = tracks[state.currentIndex]?.src || tracks[0]?.src;
        audio.load();
      }
      audio.volume = isMuted ? 0 : volume;
      audio.muted = isMuted;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.error('Audio playback error:', err);
        });
      }
    } else {
      audio.pause();
    }
  }, [tracks, state.currentIndex, volume, isMuted]);

  const next = useCallback((forceAutoplay?: boolean) => {
    const audio = audioRef.current;
    if (!audio || state.order.length === 0) return;
    const shouldPlay = forceAutoplay !== undefined ? forceAutoplay : (!audio.paused || state.isPlaying);
    const pos = state.order.indexOf(state.currentIndex);
    const np = pos + 1;
    if (np >= state.order.length) {
      if (state.loopMode === 'all' || forceAutoplay) {
        loadTrack(state.order[0], shouldPlay, 'next');
      } else {
        audio.pause();
        audio.currentTime = 0;
      }
      return;
    }
    loadTrack(state.order[np], shouldPlay, 'next');
  }, [state.order, state.currentIndex, state.loopMode, state.isPlaying, loadTrack]);

  const prev = useCallback((forceAutoplay?: boolean) => {
    const audio = audioRef.current;
    if (!audio || state.order.length === 0) return;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    const shouldPlay = forceAutoplay !== undefined ? forceAutoplay : (!audio.paused || state.isPlaying);
    const pos = state.order.indexOf(state.currentIndex);
    const pp = pos - 1;
    if (pp < 0) {
      if (state.loopMode === 'all')
        loadTrack(state.order[state.order.length - 1], shouldPlay, 'prev');
      else audio.currentTime = 0;
      return;
    }
    loadTrack(state.order[pp], shouldPlay, 'prev');
  }, [state.order, state.currentIndex, state.loopMode, state.isPlaying, loadTrack]);

  const seek = useCallback(
    (pct: number) => {
      const audio = audioRef.current;
      if (!audio || !audio.duration) return;
      const newTime = pct * audio.duration;
      audio.currentTime = newTime;
      setCurrentTime(newTime);
      if (isHost && onPlaybackChange) {
        onPlaybackChange(newTime, !audio.paused);
      }
    },
    [isHost, onPlaybackChange]
  );

  const toggleShuffle = useCallback(() => {
    dispatch({ type: 'TOGGLE_SHUFFLE', trackCount: tracks.length });
  }, [tracks.length]);

  const cycleLoop = useCallback(() => {
    dispatch({ type: 'CYCLE_LOOP' });
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => {
      dispatch({ type: 'PLAY' });
      if (isHost && onPlaybackChange && audioRef.current) {
        onPlaybackChange(audioRef.current.currentTime, true);
      }
    };
    const onPause = () => {
      dispatch({ type: 'PAUSE' });
      if (isHost && onPlaybackChange && audioRef.current) {
        onPlaybackChange(audioRef.current.currentTime, false);
      }
    };
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) setDuration(audio.duration);
    };
    const onEnded = () => {
      if (state.loopMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        // Auto start next song immediately
        next(true);
      }
    };
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [state.loopMode, next, isHost, onPlaybackChange]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !tracks[0]) return;
    const target = tracks[state.currentIndex]?.src || tracks[0].src;
    if (!audio.src || !audio.src.includes(target)) {
      audio.src = target;
      audio.load();
    }
  }, [tracks, state.currentIndex]);

  return {
    audioRef,
    state,
    currentTime,
    duration,
    currentTrack: tracks[state.currentIndex] || tracks[0],
    loadTrack,
    toggle,
    next,
    prev,
    seek,
    toggleShuffle,
    cycleLoop,
    getFrequencyData,
    // YouTube-style Sound & Level controls
    volume,
    setVolume,
    isMuted,
    toggleMute,
  };
}

/* ------------------------------------------------ useKeyboardShortcuts */

interface ShortcutActions {
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seekForward: () => void;
  seekBackward: () => void;
  toggleShuffle: () => void;
  cycleLoop: () => void;
  toggleMute: () => void;
  volumeUp: () => void;
  volumeDown: () => void;
}

const isInteractiveTextInput = (el: HTMLElement | null): boolean => {
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

function useKeyboardShortcuts(
  actions: ShortcutActions,
  containerRef?: React.RefObject<HTMLElement | null>
) {
  const { focusedWidgetId } = useSpatialFocus();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const active = document.activeElement as HTMLElement | null;

      // Only handle music shortcuts when the user is hovering, focused, or within the player widget
      const isFocused = focusedWidgetId === 'music-player';
      const isInside = containerRef?.current
        ? containerRef.current.contains(target) ||
          containerRef.current.contains(active) ||
          containerRef.current.matches(':hover')
        : false;

      if (!isFocused && !isInside) {
        return;
      }

      if (isInteractiveTextInput(target) || isInteractiveTextInput(active)) {
        return;
      }
      switch (e.key) {
        case ' ':
          e.preventDefault();
          actions.toggle();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) actions.next();
          else actions.seekForward();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) actions.prev();
          else actions.seekBackward();
          break;
        case 'ArrowUp':
          e.preventDefault();
          actions.volumeUp();
          break;
        case 'ArrowDown':
          e.preventDefault();
          actions.volumeDown();
          break;
        case 'm':
        case 'M':
          actions.toggleMute();
          break;
        case 's':
        case 'S':
          actions.toggleShuffle();
          break;
        case 'l':
        case 'L':
          actions.cycleLoop();
          break;
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [actions, containerRef]);
}

/* --------------------------------------------------------- ScalesMixer */

const COLS = 10;
const ROWS = 10;
const BAND_RANGES: [number, number][] = [
  [0, 1],
  [1, 3],
  [3, 6],
  [6, 10],
  [10, 16],
  [16, 24],
  [24, 36],
  [36, 52],
  [52, 74],
  [74, 100],
];
const sineOut = (x: number) => Math.sin((x * Math.PI) / 2);
const sineIn = (x: number) => 1 - Math.cos((x * Math.PI) / 2);
const sineInOut = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const PART_A_DUR = 1.5;
const PART_A_TO = 11;
const PART_A_STEP = 3 / (COLS - 1);
const PART_B_DUR = 1;
const SCALE_FROM = 0.133;
const SCALE_TO = 0.8;

function partAColumnY(time: number, col: number): number {
  const local = time - col * PART_A_STEP;
  const period = PART_A_DUR * 2;
  const cyc = ((local % period) + period) % period;
  if (cyc < PART_A_DUR) return PART_A_TO * sineInOut(cyc / PART_A_DUR);
  return PART_A_TO * sineInOut(1 - (cyc - PART_A_DUR) / PART_A_DUR);
}

function partBCircle(time: number, col: number, row: number): [number, number] {
  const frac = row / ROWS;
  const yFrom = lerp(77, -77, frac);
  const yTo = lerp(col, -col, frac);
  const local = time - col / COLS;
  const period = PART_B_DUR * 2;
  const cyc = ((local % period) + period) % period;
  let e: number;
  if (cyc < PART_B_DUR) e = sineOut(cyc / PART_B_DUR);
  else e = sineIn(1 - (cyc - PART_B_DUR) / PART_B_DUR);
  return [lerp(yFrom, yTo, e), lerp(SCALE_FROM, SCALE_TO, e)];
}

function ScalesMixer({
  isPlaying,
  getFrequencyData,
}: {
  isPlaying: boolean;
  getFrequencyData?: () => Uint8Array | null;
}) {
  const maskId = useId().replace(/:/g, '_');
  const colRefs = useRef<(SVGGElement | null)[]>([]);
  const circleRefs = useRef<(SVGCircleElement | null)[][]>(
    Array.from({ length: COLS }, () => [])
  );
  const tRef = useRef(50);

  useRafLoop((_, dt) => {
    if (isPlaying) tRef.current += dt / 1000;
    const time = tRef.current;
    const freqData = getFrequencyData?.();
    for (let c = 0; c < COLS; c++) {
      let energy = 1.0;
      if (freqData) {
        const [binStart, binEnd] = BAND_RANGES[c];
        let sum = 0;
        for (let b = binStart; b < binEnd; b++) sum += freqData[b] ?? 0;
        energy = Math.sqrt(sum / (binEnd - binStart) / 255);
      }
      const bobGain = freqData ? 0.4 + energy : 1;
      const scaleGain = freqData ? 0.5 + energy : 1;
      const colEl = colRefs.current[c];
      if (colEl) {
        const ay = partAColumnY(time, c) * bobGain;
        colEl.style.transform = `translate(${c * 10}px, ${ay}px)`;
      }
      for (let r = 0; r < ROWS; r++) {
        const circle = circleRefs.current[c][r];
        if (!circle) continue;
        const [ty, s] = partBCircle(time, c, r);
        circle.style.transform = `translateY(${ty}px) scale(${s * scaleGain})`;
      }
    }
  });

  return (
    <svg className="scales" viewBox="0 0 98 108" aria-hidden="true">
      <mask id={maskId}>
        <rect width="10" height="10" fill="#fff" />
      </mask>
      {Array.from({ length: COLS }, (_, c) => (
        <g
          key={c}
          ref={(el) => {
            colRefs.current[c] = el;
          }}
          style={{ transform: `translate(${c * 10}px, 0px)` }}
        >
          {Array.from({ length: ROWS }, (_, r) => (
            <g
              key={r}
              mask={`url(#${maskId})`}
              transform={`translate(0 ${r * 10})`}
            >
              <circle
                ref={(el) => {
                  circleRefs.current[c][r] = el;
                }}
                cx="5"
                cy="5"
                r="5"
                style={{
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                }}
              />
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------- Disc + layers */

const SPIN_MAX = 0.4375;
const BURST_DURATION = 620;

interface Layer {
  id: number;
  track: Track;
  dir: Direction;
}

function Disc({
  layers,
  isPlaying,
  isZoomed,
  trackKey,
  direction,
  onZoomToggle,
}: {
  layers: Layer[];
  isPlaying: boolean;
  isZoomed: boolean;
  trackKey: number;
  direction: Direction;
  onZoomToggle: () => void;
}) {
  const spinRef = useRef<HTMLDivElement>(null);
  const rotRef = useRef(0);
  const velRef = useRef(0);
  const burstRef = useRef({ from: 0, start: 0, active: false, pending: false });
  const lastKey = useRef(trackKey);

  useEffect(() => {
    if (trackKey !== lastKey.current) {
      lastKey.current = trackKey;
      if (direction) {
        burstRef.current.from = direction === 'prev' ? 360 : -360;
        burstRef.current.pending = true;
      }
    }
  }, [trackKey, direction]);

  useRafLoop((now) => {
    const el = spinRef.current;
    if (!el) return;
    if (isZoomed) {
      el.style.transform = 'none';
      return;
    }
    if (isPlaying) velRef.current += (SPIN_MAX - velRef.current) * 0.2;
    else {
      velRef.current *= 0.96;
      if (velRef.current < 0.001) velRef.current = 0;
    }
    rotRef.current += velRef.current;
    const burst = burstRef.current;
    if (burst.pending) {
      burst.start = now;
      burst.pending = false;
      burst.active = true;
    }
    let b = 0;
    if (burst.active) {
      const t = (now - burst.start) / BURST_DURATION;
      if (t >= 1) burst.active = false;
      else b = burst.from * (1 - (1 - Math.pow(1 - t, 3)));
    }
    el.style.transform = `scale(1.01) rotate(${rotRef.current + b}deg)`;
  });

  return (
    <div
      className={`mask ${isZoomed ? 'is-zoomed' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onZoomToggle();
      }}
      title={isZoomed ? 'Click cover to return to player' : 'Click cover to expand full artwork'}
    >
      <div className="spin" ref={spinRef}>
        {layers.map((l, i) => {
          const isNewest = i === layers.length - 1;
          const cls = isNewest
            ? l.dir
              ? 'cover cover-enter'
              : 'cover'
            : 'cover cover-exit';
          return (
            <img
              key={l.id}
              src={l.track.cover}
              alt={`${l.track.title} — ${l.track.artist}`}
              className={cls}
              draggable={false}
            />
          );
        })}
      </div>
      <div className="hole">
        <div className="hole-inner" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ TrackInfo */

function TrackInfo({ layers }: { layers: Layer[] }) {
  return (
    <div className="track-info">
      {layers.map((l, i) => {
        const isNewest = i === layers.length - 1;
        const dx = l.dir === 'next' ? 14 : l.dir === 'prev' ? -14 : 0;
        const exitDx = -dx;
        const state = isNewest ? (l.dir ? 'ti-enter' : '') : 'ti-exit';
        const style = {
          ['--dx' as string]: `${isNewest ? dx : exitDx}px`,
        } as React.CSSProperties;
        return (
          <div key={l.id} className={`ti-layer ${isNewest ? '' : 'ti-abs'}`}>
            <p className={`artist ${state}`} style={style}>
              {l.track.artist}
            </p>
            <h2 className={`track ${state}`} style={style} title={l.track.title}>
              {l.track.title}
            </h2>
          </div>
        );
      })}
    </div>
  );
}

/* ----------------------------------------------------------- ProgressBar */

function fmt(s: number): string {
  if (!isFinite(s)) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

function ProgressBar({
  currentTime,
  duration,
  onSeek,
}: {
  currentTime: number;
  duration: number;
  onSeek: (pct: number) => void;
}) {
  const pct = duration ? (currentTime / duration) * 100 : 0;
  return (
    <div className="w-full">
      <div
        className="bar"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          onSeek(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
        }}
      >
        <div className="bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="time">
        <span className="current">{fmt(currentTime)}</span>
        <span className="sep">/</span>
        <span className="total">{fmt(duration)}</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- Controls */

function Controls({
  isPlaying,
  shuffled,
  loopMode,
  onToggle,
  onNext,
  onPrev,
  onShuffle,
  onLoop,
}: {
  isPlaying: boolean;
  shuffled: boolean;
  loopMode: LoopMode;
  onToggle: () => void;
  onNext: () => void;
  onPrev: () => void;
  onShuffle: () => void;
  onLoop: () => void;
}) {
  return (
    <div className="controls">
      <button
        className={`ctrl ctrl-toggle ctrl-shuffle ${shuffled ? 'is-active' : ''}`}
        onClick={onShuffle}
        aria-label={shuffled ? 'Unshuffle songs' : 'Shuffle songs'}
        title={shuffled ? 'Unshuffle songs (S)' : 'Shuffle songs (S)'}
      >
        <svg
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 3h5v5" />
          <path d="M21 3l-7 7" />
          <path d="M3 21l7-7" />
          <path d="M16 21h5v-5" />
          <path d="M21 21l-7-7" />
          <path d="M3 3l7 7" />
        </svg>
        {shuffled && <span className="shuffle-dot" />}
      </button>
      <button className="ctrl" onClick={onPrev} aria-label="Previous" title="Previous (Left Arrow)">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M19 5L8 12l11 7zM5 5h2v14H5z" />
        </svg>
      </button>
      <button
        className="ctrl ctrl-play"
        onClick={onToggle}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        title="Play/Pause (Space)"
      >
        {isPlaying ? (
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M6 5h3v14H6zM15 5h3v14h-3z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M7 5v14l11-7z" />
          </svg>
        )}
      </button>
      <button className="ctrl" onClick={onNext} aria-label="Next" title="Next (Right Arrow)">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M5 5l11 7L5 19zM17 5h2v14h-2z" />
        </svg>
      </button>
      <button
        className={`ctrl ctrl-toggle ctrl-loop ${
          loopMode !== 'off' ? 'is-active' : ''
        } ${loopMode === 'one' ? 'mode-one' : ''}`}
        onClick={onLoop}
        aria-label="Loop"
        title="Loop Mode (L)"
      >
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 12V8a2 2 0 0 1 2-2h12" />
          <path d="M16 3l4 3l-4 3" />
          <path d="M20 12v4a2 2 0 0 1-2 2H6" />
          <path d="M8 21l-4-3l4-3" />
        </svg>
        <span className="loop-one">1</span>
      </button>
    </div>
  );
}

/* ----------------------------------------------------- MusicPlayer root */

export interface MusicPlayerProps {
  tracks?: Track[];
  crossOrigin?: 'anonymous' | 'use-credentials';
  onAddTrack?: (track: Track) => void;
  onTrackChange?: (track: Track, isPlaying: boolean) => void;
  onPlaybackChange?: (currentTime: number, isPlaying: boolean) => void;
  onDelete?: () => void;
  onMaximize?: () => void;
  onToggleMinimize?: () => void;
  isHost?: boolean;
  externalCurrentTime?: number;
  externalIsPlaying?: boolean;
  showUploadButton?: boolean;
  className?: string;
}

export function MusicPlayer({
  tracks = DEFAULT_TRACKS,
  crossOrigin,
  onAddTrack,
  onTrackChange,
  onPlaybackChange,
  onDelete,
  onMaximize,
  onToggleMinimize,
  isHost = true,
  externalCurrentTime,
  externalIsPlaying,
  showUploadButton = true,
  className,
}: MusicPlayerProps) {
  const [trackList, setTrackList] = useState<Track[]>(tracks);
  const player = useAudioPlayer(trackList, {
    isHost,
    externalCurrentTime,
    externalIsPlaying,
    onPlaybackChange,
  });
  const [isZoomed, setIsZoomed] = useState(false);

  // Sync external tracks
  useEffect(() => {
    if (tracks && tracks.length > 0) {
      setTrackList(tracks);
    }
  }, [tracks]);

  // Upload & Playlist Drawer states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);

  // Form states for uploading track
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const [pendingAudioFile, setPendingAudioFile] = useState<File | null>(null);
  const [pendingAudioUrl, setPendingAudioUrl] = useState<string>('');
  const [titleInput, setTitleInput] = useState<string>('');
  const [artistInput, setArtistInput] = useState<string>('Local Artist');
  const [coverUrl, setCoverUrl] = useState<string>('');
  const [hasCustomCover, setHasCustomCover] = useState<boolean>(false);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);

  const [layers, setLayers] = useState<Layer[]>(() =>
    trackList[0] ? [{ id: 0, track: trackList[0], dir: null }] : []
  );
  const lastIndex = useRef(0);
  const idRef = useRef(1);

  useEffect(() => {
    if (!player.currentTrack) return;
    if (layers.length > 0 && player.state.currentIndex === lastIndex.current) return;
    lastIndex.current = player.state.currentIndex;
    const id = idRef.current++;
    setLayers((prev) => [
      ...prev,
      { id, track: player.currentTrack!, dir: player.state.direction },
    ]);
    const t = setTimeout(() => {
      setLayers((prev) => prev.filter((l) => l.id === id));
    }, 760);
    return () => clearTimeout(t);
  }, [player.state.currentIndex, player.currentTrack, player.state.direction, layers.length]);

  const handleDeleteTrack = (indexToDelete: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextTracks = trackList.filter((_, idx) => idx !== indexToDelete);
    setTrackList(nextTracks);
    if (nextTracks.length === 0) {
      setIsPlaylistOpen(false);
      return;
    }
    if (player.state.currentIndex >= nextTracks.length) {
      player.loadTrack(0, player.state.isPlaying, 'next');
    } else if (player.state.currentIndex === indexToDelete) {
      player.loadTrack(player.state.currentIndex, player.state.isPlaying, 'next');
    }
  };

  // Notify parent on track / playback changes
  useEffect(() => {
    if (onTrackChange && player.currentTrack) {
      onTrackChange(player.currentTrack, player.state.isPlaying);
    }
  }, [player.currentTrack, player.state.isPlaying, onTrackChange]);

  const seekForward = useCallback(() => {
    const a = player.audioRef.current;
    if (a) a.currentTime = Math.min(a.duration || 0, a.currentTime + 5);
  }, [player.audioRef]);

  const seekBackward = useCallback(() => {
    const a = player.audioRef.current;
    if (a) a.currentTime = Math.max(0, a.currentTime - 5);
  }, [player.audioRef]);

  const volumeUp = useCallback(() => {
    player.setVolume(player.volume + 0.05);
  }, [player.volume, player.setVolume]);

  const volumeDown = useCallback(() => {
    player.setVolume(player.volume - 0.05);
  }, [player.volume, player.setVolume]);

  const shortcuts = useMemo(
    () => ({
      toggle: player.toggle,
      next: player.next,
      prev: player.prev,
      seekForward,
      seekBackward,
      toggleShuffle: player.toggleShuffle,
      cycleLoop: player.cycleLoop,
      toggleMute: player.toggleMute,
      volumeUp,
      volumeDown,
    }),
    [
      player.toggle,
      player.next,
      player.prev,
      seekForward,
      seekBackward,
      player.toggleShuffle,
      player.cycleLoop,
      player.toggleMute,
      volumeUp,
      volumeDown,
    ]
  );
  const playerContainerRef = useRef<HTMLDivElement>(null);
  useKeyboardShortcuts(shortcuts, playerContainerRef);

  // Handle local computer audio file selection
  const handleSelectAudioFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingAudioFile(file);
    const audioObjUrl = URL.createObjectURL(file);
    setPendingAudioUrl(audioObjUrl);

    // Default title from file name
    const defaultTitle = cleanFileName(file.name);
    setTitleInput(defaultTitle);
    setArtistInput('Local Artist');

    // Extract ID3 metadata and embedded APIC cover art
    setIsExtracting(true);
    try {
      const meta = await extractAudioMetadata(file);
      if (meta.title && meta.title.trim() !== '') {
        setTitleInput(meta.title);
      }
      if (meta.artist && meta.artist.trim() !== '') {
        setArtistInput(meta.artist);
      }
      if (meta.coverUrl) {
        setCoverUrl(meta.coverUrl);
        setHasCustomCover(meta.hasEmbeddedCover);
      }
    } catch {
      setCoverUrl(createRandomGradientCover());
    } finally {
      setIsExtracting(false);
    }
  };

  // Handle custom image cover upload
  const handleSelectCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const imgUrl = URL.createObjectURL(file);
    setCoverUrl(imgUrl);
    setHasCustomCover(true);
  };

  // Randomize gradient cover
  const handleRandomizeGradient = () => {
    setCoverUrl(createRandomGradientCover());
    setHasCustomCover(false);
  };

  // Confirm and add new track
  const handleCommitUpload = () => {
    if (!pendingAudioUrl) return;

    const newTrack: Track = {
      title:
        titleInput.trim() ||
        (pendingAudioFile ? cleanFileName(pendingAudioFile.name) : 'Untitled Track'),
      artist: artistInput.trim() || 'Local Artist',
      cover: coverUrl || createRandomGradientCover(titleInput || 'track'),
      src: pendingAudioUrl,
    };

    const nextTracks = [...trackList, newTrack];
    setTrackList(nextTracks);
    if (onAddTrack) onAddTrack(newTrack);

    // Play newly added track
    const newIdx = nextTracks.length - 1;
    setTimeout(() => {
      player.loadTrack(newIdx, true, 'next');
    }, 50);

    // Reset and close dialog
    setIsUploadOpen(false);
    setPendingAudioFile(null);
    setPendingAudioUrl('');
    setTitleInput('');
    setArtistInput('Local Artist');
    setCoverUrl('');
    setHasCustomCover(false);
  };

  return (
    <div
      ref={playerContainerRef}
      data-spatial-widget="music-player"
      className={`music-player-container ${className || ''}`}
    >
      {/* Hidden File Inputs */}
      <input
        ref={audioFileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a,.aac"
        onChange={handleSelectAudioFile}
        className="hidden"
      />
      <input
        ref={coverFileInputRef}
        type="file"
        accept="image/*,.png,.jpg,.jpeg,.webp,.avif"
        onChange={handleSelectCoverFile}
        className="hidden"
      />

      <div
        className={`card ${player.state.isPlaying ? 'is-playing' : ''} ${
          isZoomed ? 'is-zoomed' : ''
        }`}
        onPointerDown={stopCanvasPropagation}
        onClick={() => {
          if (isZoomed) setIsZoomed(false);
        }}
      >
        <audio
          ref={player.audioRef}
          preload="metadata"
        />

        {/* Top-Left macOS Traffic Light Actions (Close, Minimize & Maximize) */}
        {(onDelete || onMaximize || onToggleMinimize) && (
          <div className="absolute top-4 left-4 z-50 flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="w-3 h-3 rounded-full bg-[#ff5f56] hover:brightness-110 border border-[#e0443e]/50 cursor-pointer shadow-sm transition-transform hover:scale-110"
                title="Close Window"
              />
            )}
            {onToggleMinimize && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMinimize();
                }}
                className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:brightness-110 border border-[#dea123]/50 cursor-pointer shadow-sm transition-transform hover:scale-110"
                title="Minimize Window (Genie Effect)"
              />
            )}
            {onMaximize && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMaximize();
                }}
                className="w-3 h-3 rounded-full bg-[#27c93f] hover:brightness-110 border border-[#1aab29]/50 cursor-pointer shadow-sm transition-transform hover:scale-110"
                title="Zoom to Window"
              />
            )}
          </div>
        )}

        {trackList.length === 0 ? (
          /* ================= DIRECT UPLOAD VIEW ================= */
          <div className="w-full h-full flex flex-col justify-between py-2 text-slate-800 dark:text-white">
            {/* Header */}
            <div className="text-center pt-5 pb-1 flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm mb-2">
                <Music className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Upload Song
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Select an audio file from your computer to begin
              </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-2.5 my-auto px-1">
              {/* File Selector */}
              <div
                onClick={() => audioFileInputRef.current?.click()}
                className="w-full p-2.5 rounded-2xl border border-dashed border-indigo-400/50 dark:border-indigo-500/50 bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <Upload className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {pendingAudioFile ? pendingAudioFile.name : 'Choose audio file...'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {pendingAudioFile
                        ? `${(pendingAudioFile.size / (1024 * 1024)).toFixed(1)} MB`
                        : '.mp3, .wav, .flac, .ogg, .m4a'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-lg bg-indigo-600 text-white font-medium flex-shrink-0 shadow-sm">
                  Browse
                </span>
              </div>

              {/* Title & Artist */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5 text-left">
                    Title
                  </label>
                  <input
                    type="text"
                    placeholder="Song title..."
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    onPointerDown={stopCanvasPropagation}
                    onKeyDown={stopKeyPropagation}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5 text-left">
                    Artist
                  </label>
                  <input
                    type="text"
                    placeholder="Artist..."
                    value={artistInput}
                    onChange={(e) => setArtistInput(e.target.value)}
                    onPointerDown={stopCanvasPropagation}
                    onKeyDown={stopKeyPropagation}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Cover Art Section */}
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50">
                <div className="relative w-11 h-11 rounded-full overflow-hidden border border-slate-300 dark:border-slate-600 shadow-sm flex-shrink-0">
                  <img
                    src={coverUrl || createRandomGradientCover()}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-2.5 h-2.5 rounded-full bg-black/70 border border-white/40" />
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                      Cover Artwork
                    </span>
                    {hasCustomCover && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                        Embedded Found
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => coverFileInputRef.current?.click()}
                      className="flex-1 py-1 px-1.5 rounded-lg text-[10px] font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ImageIcon className="w-2.5 h-2.5 text-indigo-500" />
                      <span>Custom Cover</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRandomizeGradient}
                      className="py-1 px-1.5 rounded-lg text-[10px] font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      title="Random Gradient"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-1">
              <button
                type="button"
                disabled={!pendingAudioUrl}
                onClick={handleCommitUpload}
                className={`w-full py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                  pendingAudioUrl
                    ? 'bg-black dark:bg-white text-white dark:text-black hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Add & Play Track</span>
              </button>
            </div>
          </div>
        ) : (
          /* ================= NORMAL PLAYER VIEW ================= */
          <>
            {/* Top-Right Floating Quick Actions (Playlist & Upload) */}
            {showUploadButton && (
              <div className="absolute top-4 right-4 z-50 flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPlaylistOpen(!isPlaylistOpen);
                  }}
                  className={`p-1.5 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${
                    isPlaylistOpen ? 'bg-black/10 dark:bg-white/15 text-slate-900 dark:text-white' : ''
                  }`}
                  title="Playlist Tracks"
                >
                  <ListMusic className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsUploadOpen(true);
                    setIsPlaylistOpen(false);
                    if (!coverUrl) setCoverUrl(createRandomGradientCover());
                  }}
                  className="p-1.5 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="Upload audio file from computer"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Spinning Vinyl Record with Click-to-Zoom */}
            <Disc
              layers={layers}
              isPlaying={player.state.isPlaying}
              isZoomed={isZoomed}
              trackKey={player.state.currentIndex}
              direction={player.state.direction}
              onZoomToggle={() => setIsZoomed((z) => !z)}
            />

            {/* Scales Visualizer Centered */}
            <ScalesMixer
              isPlaying={player.state.isPlaying}
              getFrequencyData={player.getFrequencyData}
            />

            {/* Sliding Typography Track Info */}
            <TrackInfo layers={layers} />

            {/* Scrubbing Progress Bar & Time */}
            <ProgressBar
              currentTime={player.currentTime}
              duration={player.duration}
              onSeek={player.seek}
            />

            {/* Playback Controls */}
            <Controls
              isPlaying={player.state.isPlaying}
              shuffled={player.state.shuffled}
              loopMode={player.state.loopMode}
              onToggle={player.toggle}
              onNext={player.next}
              onPrev={player.prev}
              onShuffle={player.toggleShuffle}
              onLoop={player.cycleLoop}
            />

            {/* YouTube-Style Sound Leveler (Turn Off / Mute & Level Down/Up Slider) */}
            <div
              className="yt-volume-row"
              onPointerDown={stopCanvasPropagation}
            >
              <button
                type="button"
                onClick={player.toggleMute}
                className="yt-volume-btn"
                aria-label={player.isMuted ? 'Turn on sound' : 'Turn off sound'}
                title={player.isMuted ? 'Turn on sound (M)' : 'Turn off sound / Mute (M)'}
              >
                {player.isMuted || player.volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-500" />
                ) : player.volume < 0.5 ? (
                  <Volume1 className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <div className="yt-volume-track">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={player.isMuted ? 0 : player.volume}
                  onChange={(e) => player.setVolume(parseFloat(e.target.value))}
                  onPointerDown={stopCanvasPropagation}
                  className="yt-volume-slider"
                  style={{
                    '--vol-percent': `${Math.round((player.isMuted ? 0 : player.volume) * 100)}%`,
                  } as React.CSSProperties}
                  title={`Volume: ${Math.round((player.isMuted ? 0 : player.volume) * 100)}%`}
                />
              </div>
              <span className="yt-volume-label">
                {player.isMuted ? 'OFF' : `${Math.round(player.volume * 100)}%`}
              </span>
            </div>
          </>
        )}
      </div>

      {/* ================= PLAYLIST DRAWER ================= */}
      {isPlaylistOpen && (
        <div className="absolute inset-x-3 bottom-3 top-3 z-50 bg-slate-900/95 dark:bg-[#0f131a]/95 backdrop-blur-2xl rounded-2xl p-4 border border-white/15 shadow-2xl flex flex-col justify-between overflow-hidden text-white">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <ListMusic className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Playlist ({trackList.length})
              </span>
              <button
                type="button"
                onClick={player.toggleShuffle}
                className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  player.state.shuffled
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/40 hover:bg-indigo-500'
                    : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
                }`}
                title={player.state.shuffled ? 'Unshuffle playlist' : 'Shuffle playlist'}
              >
                <Shuffle className="w-2.5 h-2.5" />
                <span>{player.state.shuffled ? 'Shuffled' : 'Shuffle'}</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsPlaylistOpen(false)}
              className="w-6 h-6 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2 space-y-1 my-1 pr-1">
            {trackList.map((t, idx) => {
              const isCurrent = player.state.currentIndex === idx;
              return (
                <div
                  key={`${t.title}-${idx}`}
                  onClick={() => {
                    player.loadTrack(
                      idx,
                      true,
                      idx > player.state.currentIndex ? 'next' : 'prev'
                    );
                    setIsPlaylistOpen(false);
                  }}
                  className={`flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer group ${
                    isCurrent
                      ? 'bg-indigo-500/20 border border-indigo-500/40 text-white'
                      : 'hover:bg-white/5 text-white/80'
                  }`}
                >
                  <img
                    src={t.cover}
                    alt={t.title}
                    className="w-8 h-8 rounded-full object-cover border border-white/15 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">{t.title}</div>
                    <div className="text-[10px] text-white/50 truncate">
                      {t.artist}
                    </div>
                  </div>
                  {isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse flex-shrink-0" />
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteTrack(idx, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-red-400 transition-opacity"
                      title="Remove Track"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              setIsPlaylistOpen(false);
              setIsUploadOpen(true);
              if (!coverUrl) setCoverUrl(createRandomGradientCover());
            }}
            className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Song from Computer</span>
          </button>
        </div>
      )}

      {/* ================= UPLOAD FROM COMPUTER MODAL ================= */}
      {isUploadOpen && (
        <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-2xl rounded-2xl p-4 border border-white/15 shadow-2xl flex flex-col justify-between overflow-y-auto text-white">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Upload Song from Computer
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              className="w-6 h-6 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="py-2 space-y-3">
            {/* Audio File Input Picker */}
            <div>
              <label className="block text-[10px] font-semibold text-white/60 uppercase tracking-wider mb-1">
                1. Audio File (.mp3, .wav, .flac, .m4a)
              </label>
              <div
                onClick={() => audioFileInputRef.current?.click()}
                className="w-full p-2.5 rounded-xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Music className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span className="text-xs truncate font-medium">
                    {pendingAudioFile ? pendingAudioFile.name : 'Click to select audio file from PC...'}
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-white/80 font-semibold flex-shrink-0">
                  Browse
                </span>
              </div>
            </div>

            {/* Title & Artist with Filename Default */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-white/60 uppercase tracking-wider mb-1">
                  Track Title (Default: Filename)
                </label>
                <input
                  type="text"
                  placeholder="Song Title..."
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onPointerDown={stopCanvasPropagation}
                  onKeyDown={stopKeyPropagation}
                  className="w-full px-2.5 py-1.5 text-xs bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-white/60 uppercase tracking-wider mb-1">
                  Artist
                </label>
                <input
                  type="text"
                  placeholder="Artist name..."
                  value={artistInput}
                  onChange={(e) => setArtistInput(e.target.value)}
                  onPointerDown={stopCanvasPropagation}
                  onKeyDown={stopKeyPropagation}
                  className="w-full px-2.5 py-1.5 text-xs bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Cover Art Section: MP3 Embedded vs Custom vs Random Gradient */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">
                  Cover Art (Embedded, Custom, or Gradient)
                </label>
                {hasCustomCover && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-400 font-mono">
                    Cover Found
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/10">
                {/* Visual Cover Preview */}
                <div className="relative w-14 h-14 rounded-full overflow-hidden border border-white/20 shadow-md flex-shrink-0">
                  <img
                    src={coverUrl || createRandomGradientCover()}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-3 h-3 rounded-full bg-black/80 border border-white/30" />
                  </div>
                </div>

                {/* Cover Options */}
                <div className="flex-1 flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => coverFileInputRef.current?.click()}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-3 h-3 text-indigo-400" />
                    <span>Upload Custom Cover</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRandomizeGradient}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Random Gradient Colors</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              className="px-3 py-1.5 rounded-xl text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!pendingAudioUrl}
              onClick={handleCommitUpload}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                pendingAudioUrl
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-105'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Add & Play Track</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MusicPlayer;
