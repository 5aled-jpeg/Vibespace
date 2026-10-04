import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Settings,
  User,
  Radio,
  Sliders,
  Sparkles,
  Shield,
  Volume2,
  Code2,
  Keyboard,
  Info,
  ChevronDown,
  ChevronRight,
  Monitor,
  LayoutGrid,
  Check,
  Grid3X3,
  HardDrive,
  Download,
  Upload,
  FileDown,
  FileUp,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Layers,
  Clock,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '../../stores/appStore';
import { SyncClock } from '../../realtime/sync-clock';
import ThemeMockupCard from './ThemeMockupCard';
import { CANVAS_BACKGROUNDS, getPatternDataUri } from '../../canvas/backgroundLibrary';
import CustomKeyboard, { KeyboardThemeName } from '../ui/custom-keyboard';
import {
  saveEnvironment,
  exportEnvironmentToFile,
  importEnvironmentFromFile,
  resetEnvironment,
  getLastSavedInfo,
  getActiveEditor,
} from '../../services/environment-persistence';

const ACCENT_PRESETS = [
  { name: 'Slate', color: '#1e293b' },
  { name: 'Red', color: '#ef4444' },
  { name: 'Green', color: '#10b981' },
  { name: 'Blue', color: '#3b82f6' },
  { name: 'Purple', color: '#8b5cf6' },
  { name: 'Amber', color: '#f59e0b' },
];

export function SettingsModal() {
  const isSettingsOpen = useAppStore((s) => s.isSettingsOpen);
  const closeSettings = useAppStore((s) => s.closeSettings);
  const currentTab = useAppStore((s) => s.currentSettingsTab);
  const setCurrentTab = useAppStore((s) => s.setCurrentSettingsTab);

  // Settings states from store
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const accentColor = useAppStore((s) => s.accentColor);
  const setAccentColor = useAppStore((s) => s.setAccentColor);
  const showAnimations = useAppStore((s) => s.showAnimations);
  const setShowAnimations = useAppStore((s) => s.setShowAnimations);
  const windowStyle = useAppStore((s) => s.windowStyle);
  const setWindowStyle = useAppStore((s) => s.setWindowStyle);
  const mediaSyncToleranceMs = useAppStore((s) => s.mediaSyncToleranceMs);
  const setMediaSyncToleranceMs = useAppStore((s) => s.setMediaSyncToleranceMs);
  const codeFontSize = useAppStore((s) => s.codeFontSize);
  const setCodeFontSize = useAppStore((s) => s.setCodeFontSize);
  const codeTheme = useAppStore((s) => s.codeTheme);
  const setCodeTheme = useAppStore((s) => s.setCodeTheme);
  const timeFormat = useAppStore((s) => s.timeFormat);
  const setTimeFormat = useAppStore((s) => s.setTimeFormat);
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const canvasBackground = useAppStore((s) => s.canvasBackground);
  const setCanvasBackground = useAppStore((s) => s.setCanvasBackground);

  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Accordion toggle for General section
  const [generalExpanded, setGeneralExpanded] = useState(true);
  const [componentsExpanded, setComponentsExpanded] = useState(true);

  // Keyboard shortcut interactive demo state
  const [keyboardTheme, setKeyboardTheme] = useState<KeyboardThemeName>('dark');
  const [keyboardSound, setKeyboardSound] = useState<boolean>(true);
  const [keyboardScale, setKeyboardScale] = useState<number>(0.64);

  // Custom hex color input state
  const [hexInput, setHexInput] = useState(accentColor);

  useEffect(() => {
    setHexInput(accentColor);
  }, [accentColor]);

  // Environment persistence info state
  const [lastSaved, setLastSaved] = useState(getLastSavedInfo());
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  useEffect(() => {
    if (isSettingsOpen) {
      setLastSaved(getLastSavedInfo());
    }
  }, [isSettingsOpen, currentTab]);

  const handleManualSave = async () => {
    setIsSaving(true);
    try {
      const editor = getActiveEditor();
      await exportEnvironmentToFile(editor, 'vibe');
      setLastSaved(getLastSavedInfo());
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImportFile(file);
    }
  };

  const handleExecuteImport = async () => {
    if (!selectedImportFile) return;
    setIsImporting(true);
    try {
      const editor = getActiveEditor();
      await importEnvironmentFromFile(selectedImportFile, editor);
      setLastSaved(getLastSavedInfo());
      setSelectedImportFile(null);
    } finally {
      setIsImporting(false);
    }
  };

  const handleExecuteReset = async () => {
    const editor = getActiveEditor();
    if (editor) {
      await resetEnvironment(editor);
      setLastSaved(getLastSavedInfo());
    }
    setResetConfirmOpen(false);
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSettingsOpen) {
        closeSettings();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen, closeSettings]);

  if (!isSettingsOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 select-none">
        {/* Backdrop blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={closeSettings}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Dialog Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ type: 'spring', stiffness: 450, damping: 32 }}
          className="relative w-full max-w-4xl h-[660px] max-h-[92vh] bg-white dark:bg-[#141822] rounded-[28px] shadow-[0_25px_70px_rgba(0,0,0,0.45)] border border-slate-200/90 dark:border-white/10 flex overflow-hidden text-slate-900 dark:text-slate-100 z-10"
        >
          {/* ================= LEFT SIDEBAR ================= */}
          <aside className="w-64 bg-slate-50/80 dark:bg-[#0f131a]/95 border-r border-slate-200/80 dark:border-white/10 p-4 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              {/* Title */}
              <div className="px-3 pt-2 pb-1">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Settings
                </h2>
              </div>

              {/* Navigation Group 1: General */}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setGeneralExpanded(!generalExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4 text-indigo-500" />
                    <span>General</span>
                  </div>
                  {generalExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {generalExpanded && (
                  <div className="ml-3 pl-4 border-l border-slate-200 dark:border-white/10 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => setCurrentTab('language')}
                      className={clsx(
                        'w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer',
                        currentTab === 'language'
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                      )}
                    >
                      Language & Region
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentTab('appearance')}
                      className={clsx(
                        'w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer',
                        currentTab === 'appearance'
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                      )}
                    >
                      Appearance
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentTab('backgrounds')}
                      className={clsx(
                        'w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-between',
                        currentTab === 'backgrounds'
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        <Grid3X3 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Canvas Backgrounds</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/80 dark:bg-white/10 font-mono font-semibold">
                        9
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentTab('datetime')}
                      className={clsx(
                        'w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer',
                        currentTab === 'datetime'
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                      )}
                    >
                      Date & Time
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentTab('shortcuts')}
                      className={clsx(
                        'w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer',
                        currentTab === 'shortcuts'
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                      )}
                    >
                      Keyboard Shortcuts
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentTab('export')}
                      className={clsx(
                        'w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-between',
                        currentTab === 'export'
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Environment & Export</span>
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Navigation Group 2: Site Components */}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setComponentsExpanded(!componentsExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutGrid className="w-4 h-4 text-emerald-500" />
                    <span>Components</span>
                  </div>
                  {componentsExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {componentsExpanded && (
                  <div className="ml-3 pl-4 border-l border-slate-200 dark:border-white/10 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => setCurrentTab('mediasync')}
                      className={clsx(
                        'w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer',
                        currentTab === 'mediasync'
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                      )}
                    >
                      Watch Party Sync
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentTab('coderunner')}
                      className={clsx(
                        'w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer',
                        currentTab === 'coderunner'
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                      )}
                    >
                      Code Runner IDE
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentTab('voicehangout')}
                      className={clsx(
                        'w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer',
                        currentTab === 'voicehangout'
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                      )}
                    >
                      Voice & Video Mesh
                    </button>
                  </div>
                )}
              </div>

              {/* Other items */}
              <button
                type="button"
                onClick={() => setCurrentTab('account')}
                className={clsx(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold rounded-xl transition-colors cursor-pointer',
                  currentTab === 'account'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
                )}
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>Account</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentTab('privacy')}
                className={clsx(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold rounded-xl transition-colors cursor-pointer',
                  currentTab === 'privacy'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
                )}
              >
                <Shield className="w-4 h-4 text-slate-400" />
                <span>Privacy & Sync</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentTab('about')}
                className={clsx(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold rounded-xl transition-colors cursor-pointer',
                  currentTab === 'about'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
                )}
              >
                <Info className="w-4 h-4 text-slate-400" />
                <span>About</span>
              </button>
            </div>

            {/* Bottom Status */}
            <div className="pt-4 border-t border-slate-200/80 dark:border-white/10 px-2">
              <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                Vibe Space Desktop • v2.0
              </div>
            </div>
          </aside>

          {/* ================= RIGHT MAIN CONTENT ================= */}
          <main className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#141822]">
            {/* Top Bar with Close Button */}
            <div className="flex items-center justify-between px-8 pt-6 pb-2">
              <div className="text-xs uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">
                {currentTab === 'appearance' && 'General / Appearance'}
                {currentTab === 'backgrounds' && 'General / Canvas Backgrounds'}
                {currentTab === 'language' && 'General / Language & Region'}
                {currentTab === 'datetime' && 'General / Date & Time'}
                {currentTab === 'shortcuts' && 'General / Keyboard Shortcuts'}
                {currentTab === 'export' && 'General / Environment & Export'}
                {currentTab === 'mediasync' && 'Components / Watch Party'}
                {currentTab === 'coderunner' && 'Components / Code Runner'}
                {currentTab === 'voicehangout' && 'Components / Hangout'}
                {currentTab === 'account' && 'Account & Profile'}
                {currentTab === 'privacy' && 'Privacy & Safety'}
                {currentTab === 'about' && 'About Vibe Space'}
              </div>
              <button
                type="button"
                onClick={closeSettings}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable View Area */}
            <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-7">
              {/* ================= APPEARANCE TAB (COPIED FROM SCREENSHOT DESIGN) ================= */}
              {currentTab === 'appearance' && (
                <>
                  {/* 1. THEMES */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Themes
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-3.5">
                      Choose your style or customize your theme
                    </p>

                    <div className="grid grid-cols-3 gap-3.5">
                      <ThemeMockupCard
                        type="light"
                        label="Light Mode"
                        isSelected={theme === 'light'}
                        onSelect={() => setTheme('light')}
                        accentColor={accentColor}
                      />
                      <ThemeMockupCard
                        type="dark"
                        label="Dark Mode"
                        isSelected={theme === 'dark'}
                        onSelect={() => setTheme('dark')}
                        accentColor={accentColor}
                      />
                      <ThemeMockupCard
                        type="system"
                        label="System Preferences"
                        isSelected={theme === 'system'}
                        onSelect={() => setTheme('system')}
                        accentColor={accentColor}
                      />
                    </div>
                  </div>

                  {/* 2. ACCENT COLORS */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          Accent Colors
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Use system or custom accent colors
                        </p>
                      </div>

                      {/* Swatches & Custom Color */}
                      <div className="flex items-center gap-3">
                        {/* Swatches */}
                        <div className="flex items-center gap-2">
                          {ACCENT_PRESETS.map((preset) => {
                            const isCurrent = accentColor.toLowerCase() === preset.color.toLowerCase();
                            return (
                              <button
                                key={preset.name}
                                type="button"
                                onClick={() => setAccentColor(preset.color)}
                                title={preset.name}
                                className={clsx(
                                  'w-6 h-6 rounded-full transition-transform cursor-pointer',
                                  isCurrent
                                    ? 'scale-110 ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-[#141822]'
                                    : 'hover:scale-105'
                                )}
                                style={{ backgroundColor: preset.color }}
                              />
                            );
                          })}
                        </div>

                        {/* Custom Color Input */}
                        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-white/10">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Custom Color
                          </span>
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              value={hexInput}
                              onChange={(e) => {
                                setHexInput(e.target.value);
                                if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                                  setAccentColor(e.target.value);
                                }
                              }}
                              className="w-20 px-2 py-1 text-xs font-mono font-medium rounded-lg border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <input
                              type="color"
                              value={accentColor}
                              onChange={(e) => setAccentColor(e.target.value)}
                              className="w-6 h-6 ml-2 rounded-full cursor-pointer border-0 p-0 bg-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. SHOW ANIMATIONS */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          Show Animations
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Enable or disable UI animations
                        </p>
                      </div>

                      {/* iOS Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => setShowAnimations(!showAnimations)}
                        className={clsx(
                          'relative w-12 h-6.5 rounded-full transition-colors duration-200 cursor-pointer p-0.5',
                          showAnimations
                            ? 'bg-indigo-600'
                            : 'bg-slate-300 dark:bg-slate-700'
                        )}
                        style={{
                          backgroundColor: showAnimations ? accentColor : undefined,
                        }}
                      >
                        <div
                          className={clsx(
                            'w-5.5 h-5.5 rounded-full bg-white shadow-sm transition-transform duration-200 transform',
                            showAnimations ? 'translate-x-5.5' : 'translate-x-0.5'
                          )}
                        />
                      </button>
                    </div>
                  </div>

                  {/* 4. TABLES & WINDOWS VIEW (From Screenshot) */}
                  <div className="pt-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Tables & Window View
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-3.5">
                      Customize how nodes, tables, and windows are rendered on the canvas
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Glass View */}
                      <div
                        onClick={() => setWindowStyle('glass')}
                        className={clsx(
                          'p-3.5 rounded-2xl border cursor-pointer transition-all',
                          windowStyle === 'glass'
                            ? 'border-indigo-500/80 bg-indigo-50/40 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 dark:border-white/10 hover:border-slate-300 bg-slate-50/50 dark:bg-white/[0.02]'
                        )}
                      >
                        <div className="h-20 rounded-xl bg-gradient-to-br from-white/20 to-white/5 dark:from-white/10 dark:to-white/[0.02] backdrop-blur-xl border border-white/20 p-2.5 flex flex-col justify-between shadow-xs">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-red-400/80" />
                            <div className="w-2 h-2 rounded-full bg-yellow-400/80" />
                            <div className="w-2 h-2 rounded-full bg-green-400/80" />
                          </div>
                          <div className="h-4 rounded bg-white/40 dark:bg-white/10" />
                          <div className="grid grid-cols-3 gap-1">
                            <div className="h-3 rounded bg-white/30 dark:bg-white/5" />
                            <div className="h-3 rounded bg-white/30 dark:bg-white/5" />
                            <div className="h-3 rounded bg-white/30 dark:bg-white/5" />
                          </div>
                        </div>
                        <div className="mt-2.5 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            Apple Frosted Glass
                          </span>
                          <span className="text-[10px] text-slate-400">Default</span>
                        </div>
                      </div>

                      {/* Solid View */}
                      <div
                        onClick={() => setWindowStyle('solid')}
                        className={clsx(
                          'p-3.5 rounded-2xl border cursor-pointer transition-all',
                          windowStyle === 'solid'
                            ? 'border-indigo-500/80 bg-indigo-50/40 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 dark:border-white/10 hover:border-slate-300 bg-slate-50/50 dark:bg-white/[0.02]'
                        )}
                      >
                        <div className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 flex flex-col justify-between shadow-xs">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                          </div>
                          <div className="h-4 rounded bg-slate-300 dark:bg-slate-700" />
                          <div className="grid grid-cols-3 gap-1">
                            <div className="h-3 rounded bg-slate-200 dark:bg-slate-600" />
                            <div className="h-3 rounded bg-slate-200 dark:bg-slate-600" />
                            <div className="h-3 rounded bg-slate-200 dark:bg-slate-600" />
                          </div>
                        </div>
                        <div className="mt-2.5 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            Solid Opaque
                          </span>
                          <span className="text-[10px] text-slate-400">High Contrast</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 5. CANVAS BACKGROUND PATTERNS (From user SVG library) */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-3.5">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>Canvas Background Pattern</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 font-mono">
                            9 Patterns
                          </span>
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Choose an infinite canvas background grid or technical coordinate pattern
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setCurrentTab('backgrounds')}
                        className="text-xs font-semibold text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>Expanded View</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3.5">
                      {CANVAS_BACKGROUNDS.map((bg) => {
                        const isSelected = canvasBackground === bg.id;
                        return (
                          <div
                            key={bg.id}
                            onClick={() => setCanvasBackground(bg.id)}
                            className={clsx(
                              'group relative p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between overflow-hidden',
                              isSelected
                                ? 'border-indigo-500/80 bg-indigo-50/40 dark:bg-indigo-950/30 ring-2 ring-indigo-500/30 shadow-md'
                                : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/50 dark:bg-white/[0.02]'
                            )}
                          >
                            {/* Live SVG Pattern Viewport */}
                            <div
                              className="h-22 w-full rounded-xl border border-slate-200/80 dark:border-white/10 relative overflow-hidden transition-all duration-200 shadow-2xs group-hover:scale-[1.01]"
                              style={{
                                backgroundImage: getPatternDataUri(bg.id, isDark),
                                backgroundRepeat: 'repeat',
                                backgroundSize: '32px 32px',
                                backgroundColor: isDark ? '#0a0d14' : '#fafafa',
                              }}
                            >
                              {/* Selection Badge */}
                              {isSelected && (
                                <div
                                  className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white shadow-sm transition-transform scale-100"
                                  style={{ backgroundColor: accentColor }}
                                >
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              )}
                            </div>

                            {/* Label & Description */}
                            <div className="mt-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                  {bg.name}
                                </span>
                                {isSelected && (
                                  <span
                                    className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md font-mono"
                                    style={{
                                      color: accentColor,
                                      backgroundColor: `${accentColor}18`,
                                    }}
                                  >
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1 leading-tight">
                                {bg.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* ================= DEDICATED CANVAS BACKGROUNDS TAB ================= */}
              {currentTab === 'backgrounds' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Infinite Canvas Background Library</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 font-mono">
                        9 SVG Presets
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Choose precision SVG patterns calibrated for high-resolution retina displays and seamless infinite canvas navigation.
                    </p>
                  </div>

                  {/* Big Interactive Live Preview Banner */}
                  <div
                    className="w-full h-32 rounded-2xl border border-slate-200 dark:border-white/10 relative overflow-hidden shadow-inner p-4 flex items-center justify-between transition-all duration-200"
                    style={{
                      backgroundImage: getPatternDataUri(canvasBackground, isDark),
                      backgroundRepeat: 'repeat',
                      backgroundSize: '48px 48px',
                      backgroundColor: isDark ? '#0a0d14' : '#fafafa',
                    }}
                  >
                    <div className="glass-vision-pill px-4 py-2 rounded-xl backdrop-blur-xl border border-white/20 shadow-md flex items-center gap-3">
                      <div className="w-3.5 h-3.5 rounded-full shadow-xs" style={{ backgroundColor: accentColor }} />
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {CANVAS_BACKGROUNDS.find((b) => b.id === canvasBackground)?.name || 'Pattern'}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          48px Seamless Tile • {isDark ? 'Dark Theme' : 'Light Theme'}
                        </div>
                      </div>
                    </div>

                    <div className="glass-vision-pill px-3.5 py-1.5 rounded-xl backdrop-blur-xl border border-white/20 text-[11px] font-medium text-slate-700 dark:text-slate-200 shadow-sm">
                      Interactive 60fps Camera Sync
                    </div>
                  </div>

                  {/* 3x3 Grid of All 9 Patterns */}
                  <div className="grid grid-cols-3 gap-3.5">
                    {CANVAS_BACKGROUNDS.map((bg) => {
                      const isSelected = canvasBackground === bg.id;
                      return (
                        <div
                          key={bg.id}
                          onClick={() => setCanvasBackground(bg.id)}
                          className={clsx(
                            'group relative p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between overflow-hidden',
                            isSelected
                              ? 'border-indigo-500/80 bg-indigo-50/40 dark:bg-indigo-950/30 ring-2 ring-indigo-500/30 shadow-md'
                              : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/50 dark:bg-white/[0.02]'
                          )}
                        >
                          <div
                            className="h-26 w-full rounded-xl border border-slate-200/80 dark:border-white/10 relative overflow-hidden transition-all duration-200 shadow-2xs group-hover:scale-[1.01]"
                            style={{
                              backgroundImage: getPatternDataUri(bg.id, isDark),
                              backgroundRepeat: 'repeat',
                              backgroundSize: '36px 36px',
                              backgroundColor: isDark ? '#0a0d14' : '#fafafa',
                            }}
                          >
                            {isSelected && (
                              <div
                                className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md transition-transform scale-100"
                                style={{ backgroundColor: accentColor }}
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            )}
                          </div>

                          <div className="mt-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {bg.name}
                              </span>
                              {isSelected && (
                                <span
                                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md font-mono"
                                  style={{
                                    color: accentColor,
                                    backgroundColor: `${accentColor}18`,
                                  }}
                                >
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-1 leading-tight">
                              {bg.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ================= WATCH PARTY SYNC TAB ================= */}
              {currentTab === 'mediasync' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Watch Party Millisecond Sync Engine
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-4">
                      Calibrate synchronization tolerance between spatial peers across video & audio streams.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          Drift Correction Threshold
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Resync video seek head when peer clock drifts beyond this limit
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-semibold">
                        {mediaSyncToleranceMs} ms
                      </span>
                    </div>

                    <input
                      type="range"
                      min="50"
                      max="400"
                      step="10"
                      value={mediaSyncToleranceMs}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setMediaSyncToleranceMs(val);
                        SyncClock.getInstance().setDriftThresholdMs(val);
                      }}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>50ms (Ultra-tight)</span>
                      <span>150ms (Optimal)</span>
                      <span>400ms (High latency)</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Host Drift Master
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Allow room host to automatically force seek position on all connected guests
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                      Active
                    </span>
                  </div>
                </div>
              )}

              {/* ================= CODE RUNNER TAB ================= */}
              {currentTab === 'coderunner' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Code Runner & Sandbox IDE
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-4">
                      Configure spatial TypeScript/JavaScript execution sandbox and editor options.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Monaco Editor Theme
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Color palette for code runner nodes
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCodeTheme('vs-dark')}
                        className={clsx(
                          'px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors',
                          codeTheme === 'vs-dark'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        )}
                        style={{
                          backgroundColor: codeTheme === 'vs-dark' ? accentColor : undefined,
                          color: codeTheme === 'vs-dark' ? '#ffffff' : undefined,
                        }}
                      >
                        VS Dark
                      </button>
                      <button
                        type="button"
                        onClick={() => setCodeTheme('vs-light')}
                        className={clsx(
                          'px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors',
                          codeTheme === 'vs-light'
                            ? 'bg-white text-slate-900 border border-slate-300 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        )}
                        style={{
                          backgroundColor: codeTheme === 'vs-light' ? accentColor : undefined,
                          color: codeTheme === 'vs-light' ? '#ffffff' : undefined,
                        }}
                      >
                        VS Light
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          Editor Font Size
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Adjust text size for interactive code nodes
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-semibold">
                        {codeFontSize}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="11"
                      max="20"
                      step="1"
                      value={codeFontSize}
                      onChange={(e) => setCodeFontSize(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                </div>
              )}

              {/* ================= VOICE & VIDEO TAB ================= */}
              {currentTab === 'voicehangout' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      LiveKit Voice & Video Hangout
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-4">
                      Ultra-low-latency WebRTC mesh audio and camera devices.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] space-y-3">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Audio Input Device (Microphone)
                    </div>
                    <select className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      <option>Default - High Definition Audio Device</option>
                      <option>Communications Microphone</option>
                    </select>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] space-y-3">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Video Input Device (Camera)
                    </div>
                    <select className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      <option>Integrated HD Webcam (720p 30fps)</option>
                      <option>Virtual Camera / Screen Capture</option>
                    </select>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Spatial Noise Suppression
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        AI-powered background hiss & echo cancellation
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                      Enabled
                    </span>
                  </div>
                </div>
              )}

              {/* ================= KEYBOARD SHORTCUTS TAB ================= */}
              {currentTab === 'shortcuts' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Interactive Mechanical Keyboard
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Keychron K2 layout with mechanical switches, haptics & live key tracking
                      </p>
                    </div>

                    {/* Controls for Theme, Size & Sound */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Keyboard Scale / Size Selector */}
                      <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 text-[11px] font-semibold">
                        <button
                          type="button"
                          onClick={() => setKeyboardScale(0.56)}
                          className={clsx(
                            'px-2 py-0.5 rounded-md transition-colors cursor-pointer',
                            keyboardScale === 0.56
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          )}
                          title="Compact size (0.56x)"
                        >
                          Small
                        </button>
                        <button
                          type="button"
                          onClick={() => setKeyboardScale(0.64)}
                          className={clsx(
                            'px-2 py-0.5 rounded-md transition-colors cursor-pointer',
                            keyboardScale === 0.64
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          )}
                          title="Standard size (0.64x, Recommended)"
                        >
                          Medium
                        </button>
                        <button
                          type="button"
                          onClick={() => setKeyboardScale(0.72)}
                          className={clsx(
                            'px-2 py-0.5 rounded-md transition-colors cursor-pointer',
                            keyboardScale === 0.72
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          )}
                          title="Large size (0.72x)"
                        >
                          Large
                        </button>
                      </div>

                      {/* Theme Selector */}
                      <select
                        value={keyboardTheme}
                        onChange={(e) => setKeyboardTheme(e.target.value as KeyboardThemeName)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none shadow-xs"
                      >
                        <option value="dark">Dark</option>
                        <option value="classic">Classic</option>
                        <option value="dolch">Dolch</option>
                        <option value="royal">Royal</option>
                        <option value="mint">Mint</option>
                        <option value="sand">Sand</option>
                        <option value="scarlet">Scarlet</option>
                      </select>

                      {/* Sound Toggle */}
                      <button
                        type="button"
                        onClick={() => setKeyboardSound(!keyboardSound)}
                        className={clsx(
                          'px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs',
                          keyboardSound
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                        )}
                        title="Toggle mechanical switch click sound"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{keyboardSound ? 'Sound ON' : 'Muted'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Interactive CustomKeyboard Display */}
                  <div className="w-full flex items-center justify-center p-3 sm:p-4 rounded-3xl bg-slate-100/60 dark:bg-[#0b0e14]/90 border border-slate-200/80 dark:border-white/10 shadow-inner overflow-hidden">
                    <CustomKeyboard
                      theme={keyboardTheme}
                      enableSound={keyboardSound}
                      soundUrl="/sounds/sound.ogg"
                      scale={keyboardScale}
                    />
                  </div>

                  {/* Shortcuts Reference Table */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Workspace Keymap Reference
                    </h4>
                    <div className="divide-y divide-slate-200 dark:divide-white/10 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden text-xs">
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/[0.02]">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Select Tool</span>
                        <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono shadow-2xs">1</kbd>
                      </div>
                      <div className="flex items-center justify-between p-3">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Hand / Pan Tool</span>
                        <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono shadow-2xs">0</kbd>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/[0.02]">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Pen / Draw Tool</span>
                        <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono shadow-2xs">P</kbd>
                      </div>
                      <div className="flex items-center justify-between p-3">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Brush / Highlighter Tool</span>
                        <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono shadow-2xs">B</kbd>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/[0.02]">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Brush / Box-Select Items</span>
                        <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono shadow-2xs">Ctrl + Drag / Click</kbd>
                      </div>
                      <div className="flex items-center justify-between p-3">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Text Tool</span>
                        <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono shadow-2xs">T</kbd>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/[0.02]">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Canvas: Smooth Zoom In</span>
                        <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono shadow-2xs">Ctrl + +</kbd>
                      </div>
                      <div className="flex items-center justify-between p-3">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Canvas: Smooth Zoom Out</span>
                        <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono shadow-2xs">Ctrl + -</kbd>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/[0.02]">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Add Photo / Image Node</span>
                        <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono shadow-2xs">Ctrl + P</kbd>
                      </div>
                      <div className="flex items-center justify-between p-3">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Add Video Stream Node</span>
                        <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono shadow-2xs">Ctrl + V</kbd>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/[0.02]">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Add Songs / Music Node</span>
                        <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono shadow-2xs">Ctrl + I</kbd>
                      </div>
                      <div className="flex items-center justify-between p-3">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Add Reactive Data Grid</span>
                        <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono shadow-2xs">Ctrl + T</kbd>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/[0.02]">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Add Todo Tasks Card</span>
                        <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono shadow-2xs">N</kbd>
                      </div>
                      <div className="flex items-center justify-between p-3">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Open Settings</span>
                        <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono shadow-2xs">Ctrl + ,</kbd>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/[0.02]">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Music: Play / Pause</span>
                        <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono shadow-2xs">Space</kbd>
                      </div>
                      <div className="flex items-center justify-between p-3">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Music: Shuffle / Unshuffle</span>
                        <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono shadow-2xs">S</kbd>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/[0.02]">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Music: Next / Prev Track</span>
                        <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono shadow-2xs">Shift + Left / Right</kbd>
                      </div>
                      <div className="flex items-center justify-between p-3">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Music: Turn Off / On Sound (Mute)</span>
                        <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono shadow-2xs">M</kbd>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/[0.02]">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Music: Level Volume Up / Down</span>
                        <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono shadow-2xs">Up / Down Arrow</kbd>
                      </div>
                      <div className="flex items-center justify-between p-3">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Undo Action</span>
                        <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono shadow-2xs">Ctrl + Z</kbd>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/[0.02]">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Redo Action</span>
                        <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono shadow-2xs">Ctrl + Y</kbd>
                      </div>
                      <div className="flex items-center justify-between p-3">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Close Window / Modal</span>
                        <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono shadow-2xs">Esc</kbd>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= ENVIRONMENT & EXPORT TAB ================= */}
              {currentTab === 'export' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Environment & Export</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-mono">
                        Local Mode Active
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Real-time workspace persistence, full coordinate snapshots, and portable file backup and restore.
                    </p>
                  </div>

                  {/* 1. Persistence Status Card */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            Local Environment Persistence
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            All window coordinates, camera zoom, and notes are automatically saved to local storage
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleManualSave}
                        disabled={isSaving}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                        style={{ backgroundColor: accentColor }}
                      >
                        {isSaving ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>{isSaving ? 'Saving...' : 'Save Now (Ctrl+S)'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-200/70 dark:border-white/5">
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Last Saved: <strong className="text-slate-800 dark:text-slate-200 font-mono">{lastSaved?.formatted || 'Just now'}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>Canvas Items: <strong className="text-slate-800 dark:text-slate-200 font-mono">{lastSaved?.shapeCount ?? 0} shapes</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                        <span>Dock Minimized: <strong className="text-slate-800 dark:text-slate-200 font-mono">{lastSaved?.minimizedCount ?? 0} windows</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Export Workspace Card */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <FileDown className="w-4 h-4 text-indigo-500" />
                          <span>Export Environment Backup</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Download a complete, portable workspace package with all coordinates, widgets, code, and notes
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => exportEnvironmentToFile(undefined, 'vibe')}
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5"
                          style={{ backgroundColor: accentColor }}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export (.vibe)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => exportEnvironmentToFile(undefined, 'json')}
                          className="px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
                        >
                          <FileDown className="w-3.5 h-3.5 text-slate-400" />
                          <span>JSON</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 3. Import Workspace Card */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] space-y-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <FileUp className="w-4 h-4 text-emerald-500" />
                        <span>Import & Restore Environment</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Upload a previously exported (.vibe or .json) file to restore all canvas positions, shapes, and dock windows
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <label className="px-3.5 py-2 rounded-xl text-xs font-medium border border-slate-300 dark:border-white/20 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer active:scale-95 transition-all flex items-center gap-2">
                        <Upload className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedImportFile ? 'Change File' : 'Select .vibe / .json file'}</span>
                        <input
                          type="file"
                          accept=".vibe,.json"
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                      </label>

                      {selectedImportFile && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold truncate max-w-[200px]">
                            {selectedImportFile.name}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            ({(selectedImportFile.size / 1024).toFixed(1)} KB)
                          </span>
                          <button
                            type="button"
                            onClick={handleExecuteImport}
                            disabled={isImporting}
                            className="ml-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            {isImporting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            <span>Restore Now</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4. Reset Canvas Card (Danger Zone) */}
                  <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/[0.03] space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                          <Trash2 className="w-4 h-4" />
                          <span>Reset Canvas & Environment</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Clear all shapes and windows from the canvas. (You can export a backup first).
                        </div>
                      </div>

                      {resetConfirmOpen ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setResetConfirmOpen(false)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleExecuteReset}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer shadow-xs active:scale-95 transition-all"
                          >
                            Confirm Reset
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setResetConfirmOpen(true)}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Reset Workspace</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ================= LANGUAGE & REGION ================= */}
              {currentTab === 'language' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Language & Region
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Set preferred display language and regional formats
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] space-y-3">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Primary Language
                    </div>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="en">English (United States)</option>
                      <option value="en-gb">English (United Kingdom)</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                      <option value="es">Español</option>
                      <option value="ja">日本語</option>
                    </select>
                  </div>
                </div>
              )}

              {/* ================= DATE & TIME ================= */}
              {currentTab === 'datetime' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Date & Time / Clock Sync
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Configure timestamp rendering and peer master clock reference
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Time Format Preference
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Display timestamps in 12-hour AM/PM or 24-hour military clock
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTimeFormat('12h')}
                        className={clsx(
                          'px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors',
                          timeFormat === '12h'
                            ? 'text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        )}
                        style={{
                          backgroundColor: timeFormat === '12h' ? accentColor : undefined,
                        }}
                      >
                        12-Hour
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimeFormat('24h')}
                        className={clsx(
                          'px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors',
                          timeFormat === '24h'
                            ? 'text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        )}
                        style={{
                          backgroundColor: timeFormat === '24h' ? accentColor : undefined,
                        }}
                      >
                        24-Hour
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= ACCOUNT ================= */}
              {currentTab === 'account' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Account & Profile
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Manage your identity in collaborative peer spaces
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-lg font-bold shadow-md">
                      VS
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        Spatial Explorer
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Room Host • Vibe-Lounge-Alpha
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= PRIVACY ================= */}
              {currentTab === 'privacy' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Privacy & Data Sync
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Local media streams and WebRTC security
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] space-y-2">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      End-to-End Encrypted Mesh
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Local videos and songs dragged into your canvas are processed in-memory using Blob streaming URLs and never leave your local machine unless shared in peer watch party mode.
                    </div>
                  </div>
                </div>
              )}

              {/* ================= ABOUT ================= */}
              {currentTab === 'about' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      About Vibe Space
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Spatial Desktop Canvas Workspace
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] space-y-3 text-xs leading-relaxed">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      Vibe Space v2.0 (Native Windows Desktop)
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                      Built with Tauri v2 (Rust backend), React 18, tldraw canvas engine, LiveKit WebRTC, and Framer Motion spring physics.
                    </p>
                    <div className="pt-2 text-slate-400 dark:text-slate-500 text-[11px]">
                      Designed with Apple macOS / visionOS aesthetic.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default SettingsModal;
