/**
 * Spatial Browser Web Search & Knowledge Service
 * Provides zero-CORS web search, knowledge graph panels, Wikipedia article readers,
 * and persistent search history management.
 */

export interface KnowledgeCardData {
  title: string;
  subtitle?: string;
  description: string;
  imageUrl?: string;
  sourceUrl: string;
  sourceName: string;
}

export interface SearchResultItem {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
  timestamp?: string;
}

export interface SearchResultsData {
  query: string;
  totalHits: number;
  timeSeconds: number;
  knowledge?: KnowledgeCardData;
  items: SearchResultItem[];
  related: string[];
}

export interface ReaderArticleData {
  title: string;
  description?: string;
  imageUrl?: string;
  htmlContent?: string;
  extract?: string;
  sourceUrl: string;
}

const SEARCH_HISTORY_KEY = 'spatial_browser_search_history';

// --- Search History Management ---

export function getSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addToSearchHistory(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return getSearchHistory();
  try {
    const current = getSearchHistory();
    // Move to front, remove duplicates, cap at 25
    const filtered = current.filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
    const next = [trimmed, ...filtered].slice(0, 25);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

export function removeFromSearchHistory(query: string): string[] {
  try {
    const current = getSearchHistory();
    const next = current.filter((q) => q.toLowerCase() !== query.toLowerCase());
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch {
    // Ignore error
  }
}

// --- Web Search Execution ---

export async function executeWebSearch(query: string): Promise<SearchResultsData> {
  const startTime = performance.now();
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      query: '',
      totalHits: 0,
      timeSeconds: 0,
      items: [],
      related: [],
    };
  }

  // Save to search history
  addToSearchHistory(trimmed);

  // Parallel API queries
  const wikiSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
    trimmed
  )}&utf8=&format=json&origin=*`;

  const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(trimmed)}&format=json`;

  const wikiSuggestUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
    trimmed
  )}&limit=8&namespace=0&format=json&origin=*`;

  const [wikiRes, ddgRes, suggestRes] = await Promise.all([
    fetch(wikiSearchUrl)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    fetch(ddgUrl)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    fetch(wikiSuggestUrl)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
  ]);

  let totalHits = wikiRes?.query?.searchinfo?.totalhits || 0;
  const items: SearchResultItem[] = [];
  const related: string[] = [];

  // 1. Process Wikipedia Search Hits
  if (wikiRes?.query?.search && Array.isArray(wikiRes.query.search)) {
    for (const hit of wikiRes.query.search) {
      items.push({
        id: `wiki-${hit.pageid}`,
        title: hit.title,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(hit.title.replace(/ /g, '_'))}`,
        snippet: hit.snippet ? hit.snippet.replace(/&quot;/g, '"') : '',
        source: 'Wikipedia',
        timestamp: hit.timestamp ? new Date(hit.timestamp).toLocaleDateString() : undefined,
      });
    }
  }

  // 2. Process DuckDuckGo Related Topics & Web Results
  if (ddgRes?.RelatedTopics && Array.isArray(ddgRes.RelatedTopics)) {
    for (const topic of ddgRes.RelatedTopics) {
      if (topic.Text && topic.FirstURL) {
        const parts = topic.Text.split(' - ');
        const itemTitle = parts[0] || topic.Text;
        const snippet = parts.length > 1 ? parts.slice(1).join(' - ') : topic.Text;
        items.push({
          id: `ddg-${topic.FirstURL}`,
          title: itemTitle,
          url: topic.FirstURL,
          snippet,
          source: 'DuckDuckGo',
        });
      } else if (topic.Topics && Array.isArray(topic.Topics)) {
        // Nested subcategories
        for (const sub of topic.Topics) {
          if (sub.Text && sub.FirstURL) {
            items.push({
              id: `ddg-${sub.FirstURL}`,
              title: sub.Text.split(' - ')[0] || sub.Text,
              url: sub.FirstURL,
              snippet: sub.Text,
              source: 'DuckDuckGo',
            });
          }
        }
      }
    }
  }

  // 3. Process Suggestions / Related Searches
  if (suggestRes && Array.isArray(suggestRes) && Array.isArray(suggestRes[1])) {
    for (const sug of suggestRes[1]) {
      if (typeof sug === 'string' && sug.toLowerCase() !== trimmed.toLowerCase()) {
        related.push(sug);
      }
    }
  }
  if (wikiRes?.query?.searchinfo?.suggestion) {
    related.unshift(wikiRes.query.searchinfo.suggestion);
  }

  // 4. Extract or Fetch Knowledge Card
  let knowledge: KnowledgeCardData | undefined;

  // A. Check DuckDuckGo instant answer
  if (ddgRes?.Heading && (ddgRes.AbstractText || ddgRes.Abstract)) {
    let img = ddgRes.Image;
    if (img && img.startsWith('/')) {
      img = `https://duckduckgo.com${img}`;
    }
    knowledge = {
      title: ddgRes.Heading,
      subtitle: ddgRes.Entity || ddgRes.AnswerType || 'Knowledge Graph',
      description: ddgRes.AbstractText || ddgRes.Abstract,
      imageUrl: img || undefined,
      sourceUrl: ddgRes.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`,
      sourceName: ddgRes.AbstractSource || 'DuckDuckGo',
    };
  }

  // B. If no DDG knowledge card, fetch Wikipedia summary for top hit
  if (!knowledge && items.length > 0) {
    const topItem = items.find((it) => it.source === 'Wikipedia') || items[0];
    try {
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
        topItem.title.replace(/ /g, '_')
      )}`;
      const summaryRes = await fetch(summaryUrl).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      if (summaryRes && summaryRes.extract) {
        knowledge = {
          title: summaryRes.title,
          subtitle: summaryRes.description || 'Topic Overview',
          description: summaryRes.extract,
          imageUrl: summaryRes.thumbnail?.source,
          sourceUrl: summaryRes.content_urls?.desktop?.page || topItem.url,
          sourceName: 'Wikipedia',
        };
      }
    } catch {
      // safe fallback
    }
  }

  const duration = Math.round((performance.now() - startTime) / 10) / 100;

  return {
    query: trimmed,
    totalHits: Math.max(totalHits, items.length),
    timeSeconds: duration,
    knowledge,
    items,
    related: Array.from(new Set(related)).slice(0, 8),
  };
}

// --- Fetch Full Article for In-App Reader ---

export async function fetchArticleContent(title: string): Promise<ReaderArticleData> {
  const cleanTitle = title.replace(/ /g, '_');
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanTitle)}`;
  const parseUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(
    cleanTitle
  )}&format=json&prop=text|images&origin=*`;

  const [summaryData, parseData] = await Promise.all([
    fetch(summaryUrl)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    fetch(parseUrl)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
  ]);

  let html = parseData?.parse?.text?.['*'] || '';

  // Clean HTML from Wikipedia clutter (styles, navboxes, edit tags)
  if (html) {
    html = html
      .replace(/<link\b[^>]*>/gi, '')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<span class="mw-editsection">[\s\S]*?<\/span>/gi, '')
      .replace(/<table class="navbox[\s\S]*?<\/table>/gi, '')
      .replace(/href="\/wiki\//gi, 'href="#wiki/');
  }

  return {
    title: summaryData?.title || title,
    description: summaryData?.description,
    imageUrl: summaryData?.thumbnail?.source,
    extract: summaryData?.extract,
    htmlContent: html,
    sourceUrl: summaryData?.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(cleanTitle)}`,
  };
}
