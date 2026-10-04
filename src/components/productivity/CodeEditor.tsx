import React, { useState } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { Play, RotateCcw, Terminal, CheckCircle2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Button from '../primitives/Button';
import WindowHeader from '../layout/WindowHeader';
import { stopCanvasPropagation, interactiveProps, textInputProps } from '../../utils/canvas-events';
import { runSandboxedCode, ExecutionResult } from '../../services/code-runner';
import { useAppStore } from '../../stores/appStore';
import { ErrorBoundary } from '../ui/ErrorBoundary';

try {
  loader.config({ monaco });
} catch (e) {
  console.warn('[CodeEditor] Local Monaco config fallback:', e);
}

export interface CodeEditorProps {
  id?: string;
  initialCode?: string;
  initialLanguage?: 'javascript' | 'typescript';
  title?: string;
  onCodeChange?: (code: string) => void;
  onDelete?: () => void;
  onMaximize?: () => void;
  onToggleMinimize?: () => void;
  className?: string;
  slotHeader?: React.ReactNode;
  slotOutput?: React.ReactNode;
}

const DEFAULT_SAMPLE_CODE = `// Spatial JS/TS Sandbox
// Execute reactive scripts inside your spatial canvas node!

const matrix = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
];

const flattened = matrix.flatMap(row => row.map(n => n * 2));
console.log("Calculated Matrix Transform:", flattened);

const stats = {
  elements: flattened.length,
  sum: flattened.reduce((a, b) => a + b, 0),
  timestamp: new Date().toISOString()
};

console.log("Stats Output:", JSON.stringify(stats, null, 2));
`;

export function CodeEditor({
  id = 'code-runner',
  initialCode = DEFAULT_SAMPLE_CODE,
  initialLanguage = 'typescript',
  title = 'Code Runner',
  onCodeChange,
  onDelete,
  onMaximize,
  onToggleMinimize,
  className,
  slotHeader,
  slotOutput,
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState<'javascript' | 'typescript'>(initialLanguage);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [showOutput, setShowOutput] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const codeTheme = useAppStore((s) => s.codeTheme);
  const codeFontSize = useAppStore((s) => s.codeFontSize);

  const handleEditorChange = (value: string | undefined) => {
    const updated = value || '';
    setCode(updated);
    onCodeChange?.(updated);
  };

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const res = await runSandboxedCode(code);
      setResult(res);
      setShowOutput(true);
    } catch (err: any) {
      setResult({
        output: [],
        errors: [err.message || 'Unknown runtime error'],
        executionTimeMs: 0,
        success: false,
      });
      setShowOutput(true);
    } finally {
      setIsRunning(false);
    }
  };

  const handleClearOutput = () => {
    setResult(null);
  };

  return (
    <div
      className={twMerge(
        'w-full h-full flex flex-col glass-vision-card rounded-2xl border border-white/10 overflow-hidden shadow-vision-elevated select-none transform-gpu will-change-transform font-sans',
        className
      )}
    >
      {/* Apple Frosted Header */}
      {slotHeader || (
        <WindowHeader
          title={title}
          icon={<Terminal className="w-3.5 h-3.5 text-accent-green" />}
          onDelete={onDelete}
          onToggleMinimize={onToggleMinimize || (() => setIsCollapsed(!isCollapsed))}
          isMinimized={isCollapsed}
          onMaximize={onMaximize}
        >
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            {...interactiveProps}
            className="text-[11px] bg-black/40 border border-white/15 text-white/80 rounded-lg px-2 py-0.5 focus:outline-none focus:border-accent-blue mr-1"
          >
            <option value="typescript">TypeScript</option>
            <option value="javascript">JavaScript</option>
          </select>

          {result && (
            <span
              className={clsx(
                'text-[10px] font-mono flex items-center gap-1 px-2.5 py-0.5 rounded-full border',
                result.success
                  ? 'text-accent-green bg-accent-green/10 border-accent-green/30 shadow-glow-green'
                  : 'text-accent-red bg-accent-red/10 border-accent-red/30'
              )}
            >
              {result.success ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <AlertCircle className="w-3 h-3" />
              )}
              {result.executionTimeMs.toFixed(1)}ms
            </span>
          )}

          <Button
            variant="primary"
            size="sm"
            isLoading={isRunning}
            onClick={handleRun}
            leftIcon={<Play className="w-3 h-3 fill-current" />}
            className="text-xs py-1 px-3 h-7 bg-accent-green text-black hover:bg-accent-green/90 shadow-glow-green"
          >
            Run
          </Button>
        </WindowHeader>
      )}

      {/* Editor Body */}
      {!isCollapsed && (
        <>
          <div
            className={clsx(
              'flex-1 w-full min-h-[180px] relative pointer-events-auto transition-colors',
              codeTheme === 'vs-light' ? 'bg-white' : 'bg-[#0a0d14]/90'
            )}
            onPointerDown={stopCanvasPropagation}
          >
            <ErrorBoundary
              variant="editor"
              fallbackTitle="Code Editor Fallback"
              fallbackMessage="Editor is running in native lightweight mode"
            >
              <Editor
                height="100%"
                language={language}
                value={code}
                theme={codeTheme}
                onChange={handleEditorChange}
                loading={
                  <div className="flex items-center justify-center h-full text-xs text-zinc-500 font-mono">
                    Initializing workspace editor...
                  </div>
                }
                options={{
                  minimap: { enabled: false },
                  fontSize: codeFontSize,
                  fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  padding: { top: 10, bottom: 10 },
                  overviewRulerBorder: false,
                  lineNumbersMinChars: 3,
                  folding: true,
                }}
              />
            </ErrorBoundary>
          </div>

          {/* Frosted Console Drawer */}
          {showOutput && (
            <div
              className="h-32 bg-black/70 border-t border-white/10 backdrop-blur-xl flex flex-col font-mono text-xs z-10 pointer-events-auto"
              onPointerDown={stopCanvasPropagation}
            >
              <div className="flex items-center justify-between px-3.5 py-1.5 bg-white/5 border-b border-white/10">
                <div className="flex items-center gap-1.5 text-white/50">
                  <Terminal className="w-3 h-3" />
                  <span className="text-[10px] uppercase tracking-wider font-semibold">
                    Console Output
                  </span>
                </div>
                <button
                  type="button"
                  {...interactiveProps}
                  onClick={(e) => {
                    stopCanvasPropagation(e);
                    handleClearOutput();
                  }}
                  className="text-white/40 hover:text-white text-[10px] p-0.5 cursor-pointer"
                  title="Clear Console"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-1">
            {slotOutput}
            {!slotOutput && (
              <>
                {!result && (
                  <span className="text-white/30 italic text-[11px]">
                    Press "Run" to execute in isolated sandbox...
                  </span>
                )}
                {result?.output.map((line, idx) => (
                  <div key={`out-${idx}`} className="text-white/90 whitespace-pre-wrap">
                    {line}
                  </div>
                ))}
                {result?.errors.map((err, idx) => (
                  <div key={`err-${idx}`} className="text-accent-red whitespace-pre-wrap">
                    {err}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )}
</div>
);
}

export default CodeEditor;
