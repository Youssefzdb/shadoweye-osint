/**
 * Gemini Service - AI SDK Integration
 * Uses Vercel AI Gateway for reliable Gemini access
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

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

// Vercel AI Gateway provider (zero config, works in v0)
const gateway = createOpenAI({
  baseURL: 'https://api.vercel.ai/v1',
  apiKey: 'dummy', // AI Gateway handles auth
});

// List of models to try in order (fallback chain)
const GEMINI_MODELS = [
  'google/gemini-2.0-flash-001',
  'google/gemini-1.5-flash',
  'google/gemini-pro',
] as const;

class GeminiService {
  private conversationHistory: ConversationContext = {
    history: [],
    conversationId: undefined,
  };

  /**
   * Try to generate text with model fallback
   */
  private async tryGenerateText(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    systemPrompt: string
  ): Promise<string> {
    let lastError: Error | null = null;

    for (const modelId of GEMINI_MODELS) {
      try {
        console.log(`[v0] [GeminiService] Trying model: ${modelId}`);
        const result = await generateText({
          model: gateway(modelId),
          system: systemPrompt,
          messages,
        });

        if (result.text) {
          console.log(`[v0] [GeminiService] Success with model: ${modelId}`);
          return result.text;
        }
      } catch (error) {
        console.log(`[v0] [GeminiService] Model ${modelId} failed:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        // Continue to next model
      }
    }

    throw lastError || new Error('All Gemini models failed');
  }

  /**
   * Ask Gemini a question using AI SDK
   */
  async ask(prompt: string, systemPrompt?: string): Promise<GeminiResponse> {
    try {
      // Add to history
      this.conversationHistory.history.push({
        role: 'user',
        content: prompt,
      });

      // Build messages from history
      const messages = this.conversationHistory.history.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

      // Use Vercel AI Gateway with Gemini (with fallback)
      const text = await this.tryGenerateText(
        messages,
        systemPrompt || 'You are a helpful AI assistant. Be concise and accurate.'
      );

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
      console.error('[GeminiService] Error:', errorMessage);

      return {
        success: false,
        text: '',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Ask with streaming support
   */
  async askStream(
    prompt: string,
    onChunk: (chunk: string) => void,
    systemPrompt?: string
  ): Promise<GeminiResponse> {
    try {
      this.conversationHistory.history.push({
        role: 'user',
        content: prompt,
      });

      const messages = this.conversationHistory.history.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

      // Use fallback chain
      const text = await this.tryGenerateText(
        messages,
        systemPrompt || 'You are a helpful AI assistant. Be concise and accurate.'
      );
      
      onChunk(text);

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
