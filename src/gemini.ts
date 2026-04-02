/**
 * Gemini Service - Direct API Integration
 * No token, no API key, completely free and unlimited
 */

import * as crypto from 'crypto';
import * as querystring from 'querystring';

interface GeminiResponse {
  success: boolean;
  text: string;
  error?: string;
  timestamp: string;
}

interface ConversationContext {
  history: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  conversationId?: string;
}

class GeminiService {
  private baseUrl = 'https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate';
  private conversationHistory: ConversationContext = {
    history: [],
    conversationId: undefined,
  };

  /**
   * Build request payload for Gemini API
   */
  private buildPayload(prompt: string): string {
    const inner = [
      [prompt, 0, null, null, null, null, 0],
      ['en-US'],
      ['', '', '', null, null, null, null, null, null, ''],
      '',
      '',
      null,
      [0],
      1,
      null,
      null,
      1,
      0,
      null,
      null,
      null,
      null,
      null,
      [[0]],
      0,
    ];

    const outer = [null, JSON.stringify(inner)];

    const params = querystring.stringify({
      'f.req': JSON.stringify(outer),
    });

    return params + '&';
  }

  /**
   * Parse Gemini response stream
   */
  private parseResponse(text: string): string {
    text = text.replace(/\)\]'/, '');
    let best = '';

    for (const line of text.split('\n')) {
      if (!line.includes('wrb.fr')) {
        continue;
      }

      try {
        const data = JSON.parse(line);
        const entries: any[] = [];

        if (Array.isArray(data)) {
          if (data[0] === 'wrb.fr') {
            entries.push(data);
          } else {
            const filtered = data.filter(
              (i: any) =>
                Array.isArray(i) && i[0] === 'wrb.fr'
            );
            entries.push(...filtered);
          }
        }

        for (const entry of entries) {
          try {
            const inner = JSON.parse(entry[2]);

            if (
              Array.isArray(inner) &&
              Array.isArray(inner[4])
            ) {
              for (const c of inner[4]) {
                if (Array.isArray(c) && Array.isArray(c[1])) {
                  const txt = c[1]
                    .filter((t: any) => typeof t === 'string')
                    .join('');

                  if (txt.length > best.length) {
                    best = txt;
                  }
                }
              }
            }
          } catch {
            // Continue parsing other entries
          }
        }
      } catch {
        // Continue to next line
      }
    }

    return best.trim();
  }

  /**
   * Send request to Gemini with retry logic and rate limit handling
   */
  private async sendRequest(payload: string): Promise<string> {
    const maxRetries = 5;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout

        // Randomize user agent to avoid detection
        const userAgents = [
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ];
        const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9',
            'accept-encoding': 'gzip, deflate, br',
            'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
            'origin': 'https://gemini.google.com',
            'referer': 'https://gemini.google.com/',
            'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'x-same-domain': '1',
            'x-requested-with': 'XMLHttpRequest',
            'user-agent': userAgent,
          },
          body: payload,
          signal: controller.signal as AbortSignal,
        });

        clearTimeout(timeout);

        // Handle rate limiting (429) with exponential backoff
        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 2000;
          console.warn(`[Gemini] Rate limited (429). Retrying in ${waitTime}ms...`);
          
          if (attempt < maxRetries - 1) {
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            continue;
          }
          throw new Error(`HTTP 429 - Rate limited by Gemini`);
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} - ${response.statusText}`);
        }

        return await response.text();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Only retry on specific errors
        const shouldRetry = 
          lastError.message.includes('429') ||
          lastError.message.includes('timeout') ||
          lastError.message.includes('ECONNRESET') ||
          lastError.message.includes('ETIMEDOUT');

        if (!shouldRetry || attempt === maxRetries - 1) {
          break;
        }

        // Exponential backoff with jitter
        const baseWait = Math.pow(2, attempt) * 1000;
        const jitter = Math.random() * 1000;
        const waitTime = baseWait + jitter;
        
        console.warn(`[Gemini] Attempt ${attempt + 1} failed. Retrying in ${Math.round(waitTime)}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    throw lastError || new Error('Failed to connect to Gemini after maximum retries');
  }

  /**
   * Ask Gemini a question
   */
  async ask(prompt: string): Promise<GeminiResponse> {
    try {
      // Add to history
      this.conversationHistory.history.push({
        role: 'user',
        content: prompt,
      });

      // Build and send request
      const payload = this.buildPayload(prompt);
      const responseText = await this.sendRequest(payload);
      const text = this.parseResponse(responseText);

      if (!text) {
        throw new Error('Empty response from Gemini');
      }

      // Add response to history
      this.conversationHistory.history.push({
        role: 'assistant',
        content: text,
      });

      return {
        success: true,
        text,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      return {
        success: false,
        text: '',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get conversation context with optional summary
   */
  getContext(): ConversationContext {
    return {
      history: [...this.conversationHistory.history],
      conversationId: this.conversationHistory.conversationId,
    };
  }

  /**
   * Set conversation history
   */
  setHistory(history: Array<{ role: 'user' | 'assistant'; content: string }>): void {
    this.conversationHistory.history = history;
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = {
      history: [],
      conversationId: undefined,
    };
  }

  /**
   * Get history length
   */
  getHistoryLength(): number {
    return this.conversationHistory.history.length;
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
export type { GeminiResponse, ConversationContext };
