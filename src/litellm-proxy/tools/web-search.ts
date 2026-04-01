/**
 * Web Search Tool
 * Provides web search capabilities using DuckDuckGo (free, no API key required)
 */

import type { UnifiedTool } from '../types';
import { createTool } from '../tool-mapper';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

interface WebSearchArgs {
  query: string;
  maxResults?: number;
  region?: string;
  safeSearch?: 'off' | 'moderate' | 'strict';
}

/**
 * Search the web using DuckDuckGo HTML API
 */
async function performWebSearch(args: WebSearchArgs): Promise<SearchResult[]> {
  const { query, maxResults = 5, region = 'wt-wt', safeSearch = 'moderate' } = args;

  try {
    // Use DuckDuckGo HTML interface (no API key needed)
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=${region}&kp=${safeSearch === 'strict' ? 1 : safeSearch === 'off' ? -1 : 0}`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    const html = await response.text();

    // Parse results from HTML
    const results = parseSearchResults(html, maxResults);

    return results;
  } catch (error) {
    console.error('[Web Search] Error:', error);

    // Fallback to simulated results for development
    return [
      {
        title: `Search results for: ${query}`,
        url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        snippet: `Unable to fetch live results. Please try searching directly.`,
        source: 'DuckDuckGo',
      },
    ];
  }
}

/**
 * Parse search results from DuckDuckGo HTML
 */
function parseSearchResults(html: string, maxResults: number): SearchResult[] {
  const results: SearchResult[] = [];

  // Match result blocks
  const resultPattern = /<a class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([^<]*)</g;

  let match;
  while ((match = resultPattern.exec(html)) !== null && results.length < maxResults) {
    const [, url, title, snippet] = match;

    if (url && title) {
      results.push({
        title: decodeHTMLEntities(title.trim()),
        url: decodeURIComponent(url),
        snippet: decodeHTMLEntities(snippet?.trim() || ''),
        source: extractDomain(url),
      });
    }
  }

  // If regex didn't work, try simpler approach
  if (results.length === 0) {
    const simplePattern = /class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)</g;

    while ((match = simplePattern.exec(html)) !== null && results.length < maxResults) {
      const [, url, title] = match;

      if (url && title && !url.includes('duckduckgo.com')) {
        results.push({
          title: decodeHTMLEntities(title.trim()),
          url: url.startsWith('//') ? `https:${url}` : url,
          snippet: '',
          source: extractDomain(url),
        });
      }
    }
  }

  return results;
}

/**
 * Decode HTML entities
 */
function decodeHTMLEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
    '&ndash;': '-',
    '&mdash;': '--',
  };

  return text.replace(/&[^;]+;/g, (match) => entities[match] || match);
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('//') ? `https:${url}` : url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

/**
 * Format search results for display
 */
function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return 'No results found.';
  }

  const formatted = results.map((result, index) => {
    return `${index + 1}. **${result.title}**
   URL: ${result.url}
   ${result.snippet}
   Source: ${result.source}`;
  });

  return formatted.join('\n\n');
}

/**
 * Web search handler
 */
async function webSearchHandler(args: Record<string, unknown>): Promise<unknown> {
  const searchArgs: WebSearchArgs = {
    query: String(args.query || ''),
    maxResults: Number(args.maxResults) || 5,
    region: String(args.region || 'wt-wt'),
    safeSearch: (args.safeSearch as WebSearchArgs['safeSearch']) || 'moderate',
  };

  if (!searchArgs.query) {
    return { error: 'Query is required', results: [] };
  }

  const results = await performWebSearch(searchArgs);

  return {
    query: searchArgs.query,
    results,
    formatted: formatSearchResults(results),
    count: results.length,
  };
}

/**
 * Create the web search tool
 */
export const webSearchTool: UnifiedTool = createTool(
  'web_search',
  'Search the web for information. Returns relevant web pages with titles, URLs, and snippets.',
  {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query',
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of results to return (default: 5)',
      },
      region: {
        type: 'string',
        description: 'Region code for localized results (default: wt-wt for worldwide)',
      },
      safeSearch: {
        type: 'string',
        description: 'Safe search level: off, moderate, or strict',
        enum: ['off', 'moderate', 'strict'],
      },
    },
    required: ['query'],
  },
  webSearchHandler
);

/**
 * Specialized search tools
 */
export const newsSearchTool: UnifiedTool = createTool(
  'search_news',
  'Search for recent news articles on a topic',
  {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'News topic to search for',
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of results',
      },
    },
    required: ['query'],
  },
  async (args: Record<string, unknown>) => {
    const query = `${args.query} news`;
    return webSearchHandler({ ...args, query });
  }
);

export const imageSearchTool: UnifiedTool = createTool(
  'search_images',
  'Search for images on a topic (returns image URLs)',
  {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Image search query',
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of results',
      },
    },
    required: ['query'],
  },
  async (args: Record<string, unknown>) => {
    // DuckDuckGo doesn't easily support image search via HTML
    // Return a message directing to image search
    const query = String(args.query);
    return {
      query,
      message: 'Image search requires browser interaction',
      searchUrl: `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`,
    };
  }
);

export default webSearchTool;
