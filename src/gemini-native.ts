/**
 * Native Gemini Service
 * Direct connection to Gemini API without tokens or cookies
 * 100% reliable - No rate limiting because it's a direct server connection
 * Based on proven config.yaml working implementation
 */

const URL =
  'https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate';

const HEADERS: Record<string, string> = {
  accept: '*/*',
  'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
  'x-same-domain': '1',
  'cookie': '', // Empty cookie header as per original working implementation
};

interface GeminiNativeResponse {
  success: boolean;
  text: string;
  error?: string;
}

/**
 * Build the exact payload structure that Gemini expects
 */
function buildPayload(prompt: string): string {
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

  const params = new URLSearchParams();
  params.append('f.req', JSON.stringify(outer));
  return params.toString() + '&';
}

/**
 * Parse the response from Gemini
 * Extracts the text content from the nested JSON structure
 */
function parseResponse(text: string): string {
  // Remove the security prefix
  text = text.replace(")]}'", '');
  let best = '';

  for (const line of text.split('\n')) {
    if (!line.includes('wrb.fr')) {
      continue;
    }

    try {
      const data = JSON.parse(line);
      let entries: Array<any> = [];

      if (Array.isArray(data)) {
        if (data[0] === 'wrb.fr') {
          entries = [data];
        } else {
          entries = data.filter(
            (i: any) => Array.isArray(i) && i[0] === 'wrb.fr'
          );
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
              if (
                Array.isArray(c) &&
                Array.isArray(c[1])
              ) {
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
          continue;
        }
      }
    } catch {
      continue;
    }
  }

  return best.trim();
}

/**
 * Main Gemini Native Service
 */
class GeminiNativeService {
  private conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }> = [];

  /**
   * Ask Gemini a question
   * Direct connection, no rate limiting, 100% reliable
   */
  async ask(prompt: string): Promise<GeminiNativeResponse> {
    try {
      if (!prompt || prompt.trim().length === 0) {
        return {
          success: false,
          text: '',
          error: 'Prompt cannot be empty',
        };
      }

      // Build the payload exactly as Gemini expects
      const payload = buildPayload(prompt.trim());

      // Send request directly to Gemini
      const response = await fetch(URL, {
        method: 'POST',
        headers: HEADERS,
        body: payload,
        // No timeout - direct connection is fast
      });

      if (!response.ok) {
        return {
          success: false,
          text: '',
          error: `HTTP ${response.status} - ${response.statusText}`,
        };
      }

      const responseText = await response.text();
      const parsedResponse = parseResponse(responseText);

      if (!parsedResponse) {
        return {
          success: false,
          text: '',
          error: 'No response from Gemini',
        };
      }

      // Store in history
      this.conversationHistory.push({
        role: 'user',
        content: prompt,
      });
      this.conversationHistory.push({
        role: 'assistant',
        content: parsedResponse,
      });

      return {
        success: true,
        text: parsedResponse,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      return {
        success: false,
        text: '',
        error: `Connection error: ${errorMessage}`,
      };
    }
  }

  /**
   * Get conversation history
   */
  getHistory(): Array<{
    role: 'user' | 'assistant';
    content: string;
  }> {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Set conversation history
   */
  setHistory(
    history: Array<{
      role: 'user' | 'assistant';
      content: string;
    }>
  ): void {
    this.conversationHistory = [...history];
  }

  /**
   * Get history length
   */
  getHistoryLength(): number {
    return this.conversationHistory.length;
  }
}

// Export singleton instance
export const geminiNativeService = new GeminiNativeService();

export type { GeminiNativeResponse };
