/**
 * Gemini Service - Direct API Integration (Unofficial)
 * No token, no API key, completely free and unlimited
 * Based on reverse-engineered Bard/Gemini web interface
 */

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

    const params = new URLSearchParams();
    params.append('f.req', JSON.stringify(outer));

    return params.toString() + '&';
  }

  /**
   * Parse Gemini response stream
   */
  private parseResponse(text: string): string {
    text = text.replace(/\)\]}'/, '');
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
              (i: any) => Array.isArray(i) && i[0] === 'wrb.fr'
            );
            entries.push(...filtered);
          }
        }

        for (const entry of entries) {
          try {
            const inner = JSON.parse(entry[2]);

            if (Array.isArray(inner) && Array.isArray(inner[4])) {
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
   * Send request to Gemini with retry logic
   */
  private async sendRequest(payload: string): Promise<string> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'accept': '*/*',
            'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
            'x-same-domain': '1',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          body: payload,
          signal: controller.signal as AbortSignal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return await response.text();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    throw lastError || new Error('Failed to connect to Gemini');
  }

  /**
   * Ask Gemini a question
   */
  async ask(prompt: string, systemPrompt?: string): Promise<GeminiResponse> {
    try {
      // Add system prompt if provided
      const fullPrompt = systemPrompt 
        ? `${systemPrompt}\n\nUser: ${prompt}` 
        : prompt;

      // Add to history
      this.conversationHistory.history.push({
        role: 'user',
        content: prompt,
      });

      // Build and send request
      const payload = this.buildPayload(fullPrompt);
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
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        success: false,
        text: '',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Ask with streaming support (simulated - returns full response)
   */
  async askStream(
    prompt: string,
    onChunk: (chunk: string) => void,
    systemPrompt?: string
  ): Promise<GeminiResponse> {
    const response = await this.ask(prompt, systemPrompt);
    if (response.success) {
      onChunk(response.text);
    }
    return response;
  }

  /**
   * Get conversation context
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
