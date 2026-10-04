'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
  className?: string;
  variant?: 'canvas' | 'widget' | 'editor';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Spatial Canvas ErrorBoundary caught]:', error, errorInfo);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(
          'vibe_space_last_error',
          JSON.stringify({
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            time: new Date().toISOString(),
          })
        );
      }
    } catch {}
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      const { variant = 'widget', fallbackTitle, fallbackMessage } = this.props;

      if (variant === 'canvas') {
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0d14] text-white p-6 z-50 select-none">
            <div className="max-w-md w-full p-6 rounded-2xl bg-zinc-900/90 border border-zinc-700/80 shadow-2xl text-center space-y-4 backdrop-blur-xl">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-zinc-100">
                  {fallbackTitle || 'Canvas Rendering Recovered'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {fallbackMessage ||
                    'The spatial canvas encountered a rendering issue. Your workspace data is protected.'}
                </p>
                {this.state.error?.message && (
                  <p className="text-[11px] font-mono text-zinc-500 bg-zinc-950/60 p-2 rounded-lg border border-zinc-800 break-all text-left">
                    {this.state.error.message}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  this.handleReset();
                  window.location.reload();
                }}
                className="w-full py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Workspace</span>
              </button>
            </div>
          </div>
        );
      }

      if (variant === 'editor') {
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0d14] text-zinc-300 p-4 select-none">
            <AlertTriangle className="w-6 h-6 text-amber-400 mb-2" />
            <p className="text-xs font-medium text-zinc-200">Editor unavailable</p>
            <p className="text-[10px] text-zinc-500 mt-1 max-w-[200px] text-center truncate">
              {this.state.error?.message || 'Component failed to initialize'}
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="mt-3 px-3 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 cursor-pointer"
            >
              Retry
            </button>
          </div>
        );
      }

      // Default widget card variant
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-zinc-900/80 text-zinc-300 select-none text-center">
          <AlertTriangle className="w-5 h-5 text-amber-400 mb-2" />
          <p className="text-xs font-semibold text-zinc-200">
            {fallbackTitle || 'Widget Paused'}
          </p>
          <p className="text-[10px] text-zinc-400 mt-1 max-w-xs line-clamp-2">
            {this.state.error?.message || fallbackMessage || 'This window encountered a minor error.'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-3 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-medium text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reload Widget</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
