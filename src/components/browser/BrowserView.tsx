'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Search,
  Globe,
  ExternalLink,
  Plus,
  X,
  Zap,
  Languages,
  ArrowUpRight,
  Copy,
  Check,
  Trash2,
  History,
  BookOpen,
  Loader2,
  Sparkles,
  SearchX,
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { WindowHeader } from '../layout/WindowHeader';
import { stopCanvasPropagation, interactiveProps, textInputProps } from '../../utils/canvas-events';
import {
  executeWebSearch,
  fetchArticleContent,
  getSearchHistory,
  removeFromSearchHistory,
  clearSearchHistory,
  SearchResultsData,
  ReaderArticleData,
} from './searchService';

export interface BrowserTabHistoryItem {
  viewMode: 'home' | 'search' | 'reader' | 'iframe';
  searchQuery?: string;
  url?: string;
  title?: string;
  articleTitle?: string;
}

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  viewMode: 'home' | 'search' | 'reader' | 'iframe';
  searchQuery: string;
  searchResults?: SearchResultsData;
  isSearching?: boolean;
  readerArticle?: ReaderArticleData;
  isReading?: boolean;
  history: BrowserTabHistoryItem[];
  historyIndex: number;
}

export interface BrowserViewProps {
  id?: string;
  initialUrl?: string;
  title?: string;
  onTitleChange?: (newTitle: string) => void;
  onUrlChange?: (url: string) => void;
  onDelete?: () => void;
  onMaximize?: () => void;
  onToggleMinimize?: () => void;
  className?: string;
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className || 'w-4 h-4'} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className || 'w-4 h-4'} viewBox="0 0 24 24">
      <defs>
        <radialGradient id="ig-grad-serp" cx="20%" cy="110%" r="140%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="25%" stopColor="#fdf497" />
          <stop offset="50%" stopColor="#fd5949" />
          <stop offset="75%" stopColor="#d6249f" />
          <stop offset="100%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect width="20" height="20" x="2" y="2" rx="6" fill="url(#ig-grad-serp)" />
      <rect width="12" height="12" x="6" y="6" rx="3.5" fill="none" stroke="#ffffff" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3" fill="none" stroke="#ffffff" strokeWidth="1.6" />
      <circle cx="15.5" cy="8.5" r="0.8" fill="#ffffff" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className || 'w-4 h-4'} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#1877F2" />
      <path
        d="M13.5 12h2l.3-2.5h-2.3V8c0-.7.2-1.2 1.2-1.2h1.2V4.6c-.2 0-1-.1-2-.1-2 0-3.4 1.2-3.4 3.5v1.5H8.5V12h2v6h3v-6z"
        fill="#ffffff"
      />
    </svg>
  );
}

function GoogleTranslateIcon({ className }: { className?: string }) {
  return (
    <div className={twMerge('w-4 h-4 rounded bg-[#4285F4] flex items-center justify-center text-white shrink-0', className)}>
      <Languages className="w-3 h-3 text-white" />
    </div>
  );
}

export function BrowserView({
  id = 'browser-window',
  initialUrl = '',
  title = 'Web Browser',
  onTitleChange,
  onUrlChange,
  onDelete,
  onMaximize,
  onToggleMinimize,
  className,
}: BrowserViewProps) {
  const [tabs, setTabs] = useState<BrowserTab[]>([
    {
      id: 'tab-1',
      title: 'New Tab',
      url: initialUrl,
      viewMode: initialUrl ? 'iframe' : 'home',
      searchQuery: '',
      history: [
        {
          viewMode: initialUrl ? 'iframe' : 'home',
          url: initialUrl,
          title: initialUrl ? 'Web Page' : 'New Tab',
        },
      ],
      historyIndex: 0,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');
  const [searchInput, setSearchInput] = useState<string>('');
  const [recentHistory, setRecentHistory] = useState<string[]>([]);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [clearToast, setClearToast] = useState<boolean>(false);
  const homeInputRef = useRef<HTMLInputElement>(null);
  const topInputRef = useRef<HTMLInputElement>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  useEffect(() => {
    setRecentHistory(getSearchHistory());
  }, []);

  useEffect(() => {
    if (activeTab && onUrlChange) {
      onUrlChange(activeTab.url || activeTab.searchQuery || '');
    }
  }, [activeTab?.url, activeTab?.searchQuery, onUrlChange]);

  useEffect(() => {
    if (activeTab?.viewMode === 'home') {
      setTimeout(() => {
        homeInputRef.current?.focus();
      }, 60);
    }
  }, [activeTabId, activeTab?.viewMode]);

  const updateTab = (tabId: string, partial: Partial<BrowserTab>, pushHistory = false) => {
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id === tabId) {
          let nextHistory = t.history;
          let nextHistoryIndex = t.historyIndex;

          if (pushHistory) {
            const historyItem: BrowserTabHistoryItem = {
              viewMode: partial.viewMode || t.viewMode,
              searchQuery: partial.searchQuery !== undefined ? partial.searchQuery : t.searchQuery,
              url: partial.url !== undefined ? partial.url : t.url,
              title: partial.title !== undefined ? partial.title : t.title,
              articleTitle: partial.readerArticle?.title || t.readerArticle?.title,
            };
            nextHistory = [...t.history.slice(0, t.historyIndex + 1), historyItem];
            nextHistoryIndex = nextHistory.length - 1;
          }

          return {
            ...t,
            ...partial,
            history: nextHistory,
            historyIndex: nextHistoryIndex,
          };
        }
        return t;
      })
    );
  };

  const handlePerformSearch = async (query: string, tabId: string = activeTabId) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const isDomain = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i.test(trimmed);
    const hasProtocol = /^https?:\/\//i.test(trimmed);

    if (hasProtocol || isDomain) {
      const targetUrl = hasProtocol ? trimmed : `https://${trimmed}`;
      let host = trimmed;
      try {
        host = new URL(targetUrl).hostname.replace('www.', '');
      } catch {
        // fallback
      }

      const isBlocked =
        targetUrl.includes('google.com') ||
        targetUrl.includes('instagram.com') ||
        targetUrl.includes('facebook.com') ||
        targetUrl.includes('twitter.com') ||
        targetUrl.includes('x.com');

      if (isBlocked) {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }

      updateTab(
        tabId,
        {
          viewMode: 'iframe',
          url: targetUrl,
          title: host,
          searchQuery: trimmed,
        },
        true
      );
      setSearchInput('');
      return;
    }

    // Actual search query e.g. "potatos"
    updateTab(
      tabId,
      {
        viewMode: 'search',
        searchQuery: trimmed,
        title: `${trimmed} — Search`,
        isSearching: true,
      },
      true
    );
    setSearchInput('');

    try {
      const results = await executeWebSearch(trimmed);
      updateTab(tabId, {
        searchResults: results,
        isSearching: false,
        title: `${trimmed} (${results.totalHits.toLocaleString()})`,
      });
      setRecentHistory(getSearchHistory());
    } catch {
      updateTab(tabId, {
        isSearching: false,
      });
    }
  };

  const handleOpenArticle = async (articleTitle: string, tabId: string = activeTabId) => {
    updateTab(
      tabId,
      {
        viewMode: 'reader',
        title: articleTitle,
        isReading: true,
      },
      true
    );

    try {
      const article = await fetchArticleContent(articleTitle);
      updateTab(tabId, {
        readerArticle: article,
        isReading: false,
      });
    } catch {
      updateTab(tabId, {
        isReading: false,
      });
    }
  };

  const handleClearAllHistory = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    clearSearchHistory();
    setRecentHistory([]);
    setClearToast(true);
    setTimeout(() => setClearToast(false), 2000);
  };

  const handleRemoveHistoryItem = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    const updated = removeFromSearchHistory(item);
    setRecentHistory(updated);
  };

  const handleAddTab = () => {
    const newId = `tab-${Date.now()}`;
    const newTab: BrowserTab = {
      id: newId,
      title: 'New Tab',
      url: '',
      viewMode: 'home',
      searchQuery: '',
      history: [
        {
          viewMode: 'home',
          title: 'New Tab',
        },
      ],
      historyIndex: 0,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
    setSearchInput('');
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    if (tabs.length === 1) {
      updateTab(tabId, {
        title: 'New Tab',
        url: '',
        viewMode: 'home',
        searchQuery: '',
        searchResults: undefined,
        readerArticle: undefined,
      });
      return;
    }
    const nextTabs = tabs.filter((t) => t.id !== tabId);
    setTabs(nextTabs);
    if (activeTabId === tabId) {
      setActiveTabId(nextTabs[nextTabs.length - 1].id);
    }
  };

  const handleGoBack = () => {
    if (!activeTab || activeTab.historyIndex <= 0) return;
    const prevIndex = activeTab.historyIndex - 1;
    const prev = activeTab.history[prevIndex];
    setTabs((prevTabs) =>
      prevTabs.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              viewMode: prev.viewMode,
              searchQuery: prev.searchQuery || '',
              url: prev.url || '',
              title: prev.title || 'Web Browser',
              historyIndex: prevIndex,
            }
          : t
      )
    );
  };

  const handleGoForward = () => {
    if (!activeTab || activeTab.historyIndex >= activeTab.history.length - 1) return;
    const nextIndex = activeTab.historyIndex + 1;
    const next = activeTab.history[nextIndex];
    setTabs((prevTabs) =>
      prevTabs.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              viewMode: next.viewMode,
              searchQuery: next.searchQuery || '',
              url: next.url || '',
              title: next.title || 'Web Browser',
              historyIndex: nextIndex,
            }
          : t
      )
    );
  };

  const handleGoHome = () => {
    updateTab(
      activeTabId,
      {
        title: 'New Tab',
        url: '',
        viewMode: 'home',
        searchQuery: '',
      },
      true
    );
    setSearchInput('');
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1800);
  };

  const quickPresets = [
    {
      id: 'google',
      name: 'google',
      displayUrl: 'google.com',
      url: 'https://www.google.com',
      icon: <GoogleIcon className="w-4 h-4 shrink-0" />,
      action: () => window.open('https://www.google.com', '_blank', 'noopener,noreferrer'),
    },
    {
      id: 'instagram',
      name: 'Instagram',
      displayUrl: 'instagram.com',
      url: 'https://www.instagram.com',
      icon: <InstagramIcon className="w-4 h-4 shrink-0" />,
      action: () => window.open('https://www.instagram.com', '_blank', 'noopener,noreferrer'),
    },
    {
      id: 'facebook',
      name: '(2) Facebook',
      displayUrl: 'facebook.com',
      url: 'https://www.facebook.com',
      icon: <FacebookIcon className="w-4 h-4 shrink-0" />,
      action: () => window.open('https://www.facebook.com', '_blank', 'noopener,noreferrer'),
    },
    {
      id: 'translate',
      name: 'Google Traduction',
      displayUrl: 'translate.google.com',
      url: 'https://translate.google.com',
      icon: <GoogleTranslateIcon className="w-4 h-4 shrink-0" />,
      action: () => window.open('https://translate.google.com', '_blank', 'noopener,noreferrer'),
    },
    {
      id: 'cinema-app',
      name: 'cinema-app',
      displayUrl: 'http://localhost:5173',
      url: 'http://localhost:5173',
      icon: (
        <div className="w-4 h-4 rounded bg-purple-500/20 flex items-center justify-center shrink-0">
          <Zap className="w-3 h-3 text-purple-400" />
        </div>
      ),
      action: () => handlePerformSearch('http://localhost:5173'),
    },
  ];

  return (
    <div
      className={twMerge(
        'relative w-full h-full flex flex-col rounded-2xl md:rounded-3xl overflow-hidden bg-[#161618] dark:bg-[#121418] border border-zinc-800/80 shadow-2xl select-none font-sans transition-all duration-150',
        className
      )}
    >
      {/* Universal Window Tool Manager Header */}
      <WindowHeader
        title={title || 'Web Browser'}
        onTitleChange={onTitleChange}
        icon={<Globe className="w-3.5 h-3.5 text-sky-400" />}
        onDelete={onDelete}
        onToggleMinimize={onToggleMinimize}
        onMaximize={onMaximize}
        className="border-b border-zinc-800/80 bg-[#121214]/95 text-white"
      >
        <div className="flex items-center gap-2" onPointerDown={stopCanvasPropagation}>
          {clearToast && (
            <span className="text-[10px] text-emerald-400 font-medium animate-fade-in">
              History cleared!
            </span>
          )}
          <button
            type="button"
            {...interactiveProps}
            onClick={handleClearAllHistory}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-zinc-400 hover:text-red-400 hover:bg-white/10 transition-colors cursor-pointer"
            title="Clear all search history"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear History</span>
          </button>
        </div>
      </WindowHeader>

      {/* Tab Bar & Navigation Controls */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#18181b] border-b border-zinc-800/80 shrink-0 gap-2 select-none">
        <div className="flex items-center gap-1 shrink-0" onPointerDown={stopCanvasPropagation}>
          <button
            type="button"
            {...interactiveProps}
            onClick={handleGoBack}
            disabled={!activeTab || activeTab.historyIndex <= 0}
            className="p-1 rounded-md text-zinc-400 hover:text-white disabled:opacity-30 hover:bg-white/10 transition-colors cursor-pointer"
            title="Back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            {...interactiveProps}
            onClick={handleGoForward}
            disabled={!activeTab || activeTab.historyIndex >= activeTab.history.length - 1}
            className="p-1 rounded-md text-zinc-400 hover:text-white disabled:opacity-30 hover:bg-white/10 transition-colors cursor-pointer"
            title="Forward"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            {...interactiveProps}
            onClick={handleGoHome}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Home / Quick Search"
          >
            <Home className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tab Strip */}
        <div
          className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none px-1"
          onPointerDown={stopCanvasPropagation}
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={twMerge(
                  'group flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all max-w-[170px] min-w-[95px] border select-none',
                  isActive
                    ? 'bg-zinc-800 text-white border-zinc-700 shadow-xs'
                    : 'bg-zinc-900/60 hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 border-transparent'
                )}
              >
                <Globe className="w-3 h-3 text-sky-400 shrink-0" />
                <span className="truncate flex-1 text-[11px]">
                  {tab.title || (tab.searchQuery ? `${tab.searchQuery} — Search` : 'New Tab')}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleCloseTab(e, tab.id)}
                  className="opacity-0 group-hover:opacity-100 hover:bg-zinc-700 p-0.5 rounded transition-opacity"
                >
                  <X className="w-2.5 h-2.5 text-zinc-400 hover:text-white" />
                </button>
              </div>
            );
          })}

          <button
            type="button"
            {...interactiveProps}
            onClick={handleAddTab}
            className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
            title="New Tab"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search Quick Bar on Active Non-Home Views */}
        {activeTab.viewMode !== 'home' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchInput.trim()) handlePerformSearch(searchInput);
            }}
            onPointerDown={stopCanvasPropagation}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 max-w-[240px] shrink-0"
          >
            <Search className="w-3 h-3 text-zinc-400 shrink-0" />
            <input
              ref={topInputRef}
              type="text"
              defaultValue={activeTab.searchQuery || activeTab.url}
              onChange={(e) => setSearchInput(e.target.value)}
              {...textInputProps}
              placeholder="Search or URL..."
              className="w-full bg-transparent text-[11px] text-zinc-200 placeholder-zinc-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handlePerformSearch(searchInput || activeTab.searchQuery)}
              className="text-zinc-400 hover:text-white"
            >
              <ArrowRight className="w-3 h-3" />
            </button>
          </form>
        )}
      </div>

      {/* Main Viewport */}
      <div className="flex-1 w-full h-full relative overflow-hidden flex flex-col bg-[#161618]">
        {/* VIEW 1: Clean Command Palette & Home Screen */}
        {activeTab.viewMode === 'home' && (
          <div
            className="flex-1 w-full h-full p-6 flex flex-col items-center justify-center select-none overflow-y-auto"
            onPointerDown={stopCanvasPropagation}
          >
            <div className="w-full max-w-lg rounded-2xl bg-[#1e1e22] border border-zinc-800/90 shadow-2xl overflow-hidden flex flex-col my-auto transition-all">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchInput.trim()) handlePerformSearch(searchInput);
                }}
                className="flex items-center px-4 py-3 gap-3"
              >
                <Search className="w-4 h-4 text-zinc-400 shrink-0" />
                <input
                  ref={homeInputRef}
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (searchInput.trim()) handlePerformSearch(searchInput);
                    }
                  }}
                  {...textInputProps}
                  placeholder="Search..."
                  className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none tracking-tight font-sans"
                  autoFocus
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>

              <div className="h-px w-full bg-zinc-800/90" />

              <div className="p-2 flex flex-col gap-0.5 max-h-[320px] overflow-y-auto">
                {searchInput.trim() ? (
                  <div
                    onClick={() => handlePerformSearch(searchInput)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/10 text-xs text-white cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <GoogleIcon className="w-4 h-4 shrink-0" />
                      <span className="font-medium text-sky-400">
                        Search for <strong className="text-white">"{searchInput}"</strong>
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-400 group-hover:text-white flex items-center gap-1">
                      Press Enter <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Recent Searches */}
                    {recentHistory.length > 0 && (
                      <div className="mb-2">
                        <div className="flex items-center justify-between px-3 py-1 text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                          <div className="flex items-center gap-1.5">
                            <History className="w-3 h-3 text-zinc-500" />
                            <span>Recent Searches</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleClearAllHistory}
                            className="text-zinc-500 hover:text-red-400 normal-case tracking-normal hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                            <span>Clear</span>
                          </button>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          {recentHistory.slice(0, 4).map((hist) => (
                            <div
                              key={hist}
                              onClick={() => handlePerformSearch(hist)}
                              className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-white/5 text-xs text-zinc-300 hover:text-white cursor-pointer group transition-colors"
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <History className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                                <span className="truncate">{hist}</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => handleRemoveHistoryItem(e, hist)}
                                className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 transition-opacity"
                                title="Remove from history"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Presets */}
                    <div className="flex items-center px-3 py-1 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                      Quick Links
                    </div>
                    {quickPresets.map((item) => (
                      <div
                        key={item.id}
                        onClick={item.action}
                        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 text-xs text-zinc-200 cursor-pointer group transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {item.icon}
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-medium text-zinc-100">{item.name}</span>
                            <span className="text-zinc-500">—</span>
                            <span className="text-zinc-400 truncate">{item.displayUrl}</span>
                          </div>
                        </div>

                        {item.id === 'facebook' || item.id === 'translate' ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-lg shrink-0 group-hover:text-white group-hover:bg-zinc-700 transition-colors">
                            <span>Switch to Tab</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: In-App Search Engine Results Page (SERP) */}
        {activeTab.viewMode === 'search' && (
          <div
            className="flex-1 w-full h-full flex flex-col overflow-y-auto bg-[#161618] text-zinc-100"
            onPointerDown={stopCanvasPropagation}
          >
            {/* Top Bar */}
            <div className="sticky top-0 z-10 px-6 py-3 bg-[#161618]/95 backdrop-blur-md border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <GoogleIcon className="w-5 h-5" />
                  <h1 className="text-sm font-semibold text-white">
                    Results for <span className="text-sky-400">"{activeTab.searchQuery}"</span>
                  </h1>
                </div>

                {activeTab.searchResults && (
                  <span className="text-xs text-zinc-500 hidden md:inline">
                    About {activeTab.searchResults.totalHits.toLocaleString()} results (
                    {activeTab.searchResults.timeSeconds}s)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      `https://www.google.com/search?q=${encodeURIComponent(activeTab.searchQuery)}`,
                      '_blank',
                      'noopener,noreferrer'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Google.com</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Results Area */}
            <div className="p-6 max-w-4xl mx-auto w-full flex flex-col gap-6">
              {activeTab.isSearching && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                  <p className="text-sm text-zinc-400">Searching web and knowledge bases...</p>
                </div>
              )}

              {!activeTab.isSearching && activeTab.searchResults && (
                <>
                  {/* Knowledge Card Panel (e.g. Potato) */}
                  {activeTab.searchResults.knowledge && (
                    <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 shadow-xl flex flex-col md:flex-row gap-5 items-start">
                      {activeTab.searchResults.knowledge.imageUrl && (
                        <div className="w-full md:w-36 h-36 rounded-xl overflow-hidden bg-zinc-800 shrink-0 border border-zinc-700/60 shadow-md">
                          <img
                            src={activeTab.searchResults.knowledge.imageUrl}
                            alt={activeTab.searchResults.knowledge.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex-1 flex flex-col gap-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider">
                              {activeTab.searchResults.knowledge.subtitle || 'Knowledge Card'}
                            </span>
                            <h2 className="text-xl font-bold text-white tracking-tight">
                              {activeTab.searchResults.knowledge.title}
                            </h2>
                          </div>
                          <span className="text-xs text-zinc-500 font-mono">
                            {activeTab.searchResults.knowledge.sourceName}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-300 leading-relaxed">
                          {activeTab.searchResults.knowledge.description}
                        </p>

                        <div className="flex items-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenArticle(activeTab.searchResults?.knowledge?.title || activeTab.searchQuery)
                            }
                            className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Read Full Article in App</span>
                          </button>

                          <a
                            href={activeTab.searchResults.knowledge.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <span>Open Web Source</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Organic Results List */}
                  <div className="flex flex-col gap-5">
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Web & Knowledge Results
                    </h3>

                    {activeTab.searchResults.items.length === 0 ? (
                      <div className="text-center py-12 flex flex-col items-center gap-2">
                        <SearchX className="w-8 h-8 text-zinc-600" />
                        <p className="text-sm text-zinc-400">No results found for "{activeTab.searchQuery}"</p>
                      </div>
                    ) : (
                      activeTab.searchResults.items.map((item) => (
                        <div
                          key={item.id}
                          className="group flex flex-col gap-1.5 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-zinc-800"
                        >
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 truncate">
                            <span className="font-semibold text-sky-400/90">{item.source}</span>
                            <span>›</span>
                            <span className="truncate text-zinc-500">{item.url}</span>
                            {item.timestamp && (
                              <span className="text-zinc-600 ml-auto shrink-0 text-[10px]">{item.timestamp}</span>
                            )}
                          </div>

                          <h4
                            onClick={() => handleOpenArticle(item.title)}
                            className="text-base font-semibold text-sky-400 group-hover:underline cursor-pointer tracking-tight"
                          >
                            {item.title}
                          </h4>

                          <div
                            dangerouslySetInnerHTML={{ __html: item.snippet }}
                            className="text-xs text-zinc-300 leading-relaxed [&_.searchmatch]:font-bold [&_.searchmatch]:text-white [&_.searchmatch]:underline [&_.searchmatch]:decoration-sky-500"
                          />

                          <div className="flex items-center gap-3 pt-1">
                            <button
                              type="button"
                              onClick={() => handleOpenArticle(item.title)}
                              className="text-[11px] text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 cursor-pointer"
                            >
                              <BookOpen className="w-3 h-3" />
                              <span>Read in App</span>
                            </button>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
                            >
                              <span>Open External</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Related Searches Chips */}
                  {activeTab.searchResults.related.length > 0 && (
                    <div className="pt-4 border-t border-zinc-800 flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Searches related to "{activeTab.searchQuery}"</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {activeTab.searchResults.related.map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => handlePerformSearch(sug)}
                            className="px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                          >
                            <Search className="w-3 h-3 text-zinc-500" />
                            <span>{sug}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: In-App Article Reader View */}
        {activeTab.viewMode === 'reader' && (
          <div
            className="flex-1 w-full h-full flex flex-col overflow-y-auto bg-[#161618] text-zinc-100"
            onPointerDown={stopCanvasPropagation}
          >
            <div className="sticky top-0 z-10 px-6 py-3 bg-[#161618]/95 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleGoBack}
                className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to results</span>
              </button>

              <div className="flex items-center gap-2">
                {activeTab.readerArticle?.sourceUrl && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(activeTab.readerArticle!.sourceUrl)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                    <a
                      href={activeTab.readerArticle.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-medium text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <span>Open in Browser</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </>
                )}
              </div>
            </div>

            <div className="p-6 max-w-3xl mx-auto w-full flex flex-col gap-6">
              {activeTab.isReading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                  <p className="text-sm text-zinc-400">Loading article...</p>
                </div>
              ) : activeTab.readerArticle ? (
                <article className="flex flex-col gap-5">
                  <div>
                    {activeTab.readerArticle.description && (
                      <p className="text-xs font-medium text-sky-400 uppercase tracking-wider mb-1">
                        {activeTab.readerArticle.description}
                      </p>
                    )}
                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                      {activeTab.readerArticle.title}
                    </h1>
                  </div>

                  {activeTab.readerArticle.imageUrl && (
                    <div className="w-full max-h-80 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-xl">
                      <img
                        src={activeTab.readerArticle.imageUrl}
                        alt={activeTab.readerArticle.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {activeTab.readerArticle.extract && (
                    <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 leading-relaxed font-serif">
                      {activeTab.readerArticle.extract}
                    </div>
                  )}

                  {activeTab.readerArticle.htmlContent && (
                    <div
                      dangerouslySetInnerHTML={{ __html: activeTab.readerArticle.htmlContent }}
                      className="text-xs leading-relaxed text-zinc-300 space-y-4 font-sans [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-white [&_h2]:pt-4 [&_h2]:border-b [&_h2]:border-zinc-800 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-zinc-200 [&_p]:text-zinc-300 [&_p]:leading-relaxed [&_a]:text-sky-400 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_img]:rounded-xl [&_img]:max-w-full [&_table]:border [&_table]:border-zinc-800 [&_table]:rounded-lg [&_table]:p-2"
                    />
                  )}
                </article>
              ) : null}
            </div>
          </div>
        )}

        {/* VIEW 4: Iframe View for direct Web URLs */}
        {activeTab.viewMode === 'iframe' && (
          <div className="flex-1 w-full h-full relative bg-[#161618]">
            <iframe
              src={activeTab.url}
              title={activeTab.title}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
              className="w-full h-full border-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default BrowserView;
