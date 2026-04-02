/**
 * Official Gemini API Service
 * Uses Google's official Gemini API (requires API key)
 * More reliable than web scraping and no rate limiting issues
 */

interface GeminiAPIResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

interface GeminiAPIRequest {
  contents: Array<{
    role: 'user' | 'model';
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
  systemInstruction?: {
    parts: Array<{
      text: string;
    }>;
  };
}

class GeminiAPIService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  private model = 'gemini-2.0-flash';
  private conversationHistory: Array<{
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
  }> = [];

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_API_KEY || '';
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Send request to official Gemini API
   */
  private async sendRequest(request: GeminiAPIRequest): Promise<GeminiAPIResponse> {
    if (!this.apiKey) {
      throw new Error(
        'Google API key not configured. Set GOOGLE_API_KEY environment variable.'
      );
    }

    const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          `API Error ${response.status}: ${error.error?.message || response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      throw new Error(
        `Failed to call Gemini API: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Ask Gemini a question
   */
  async ask(
    prompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    }
  ): Promise<{
    success: boolean;
    text: string;
    error?: string;
    tokens?: {
      prompt: number;
      completion: number;
      total: number;
    };
  }> {
    try {
      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        parts: [{ text: prompt }],
      });

      // Build request
      const request: GeminiAPIRequest = {
        contents: this.conversationHistory,
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 2048,
        },
      };

      if (options?.systemPrompt) {
        request.systemInstruction = {
          parts: [{ text: options.systemPrompt }],
        };
      }

      // Send request
      const response = await this.sendRequest(request);

      // Extract text response
      if (
        !response.candidates ||
        response.candidates.length === 0 ||
        !response.candidates[0].content
      ) {
        throw new Error('No response from Gemini API');
      }

      const text = response.candidates[0].content.parts
        .map((part) => part.text)
        .join('');

      // Add to conversation history
      this.conversationHistory.push({
        role: 'model',
        parts: [{ text }],
      });

      return {
        success: true,
        text,
        tokens: {
          prompt: response.usageMetadata.promptTokenCount,
          completion: response.usageMetadata.candidatesTokenCount,
          total: response.usageMetadata.totalTokenCount,
        },
      };
    } catch (error) {
      return {
        success: false,
        text: '',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Get conversation history
   */
  getHistory(): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
    return [...this.conversationHistory];
  }

  /**
   * Set model to use
   */
  setModel(model: string): void {
    this.model = model;
  }

  /**
   * Get current model
   */
  getModel(): string {
    return this.model;
  }
}

export const geminiAPIService = new GeminiAPIService();
export type { GeminiAPIRequest, GeminiAPIResponse };
