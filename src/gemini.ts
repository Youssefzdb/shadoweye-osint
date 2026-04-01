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

class GeminiService {
  private conversationHistory: ConversationContext = {
    history: [],
    conversationId: undefined,
  };

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

      // Use Vercel AI Gateway with Gemini
      const result = await generateText({
        model: gateway('google/gemini-2.0-flash-001'),
        system: systemPrompt || 'You are a helpful AI assistant. Be concise and accurate.',
        messages,
      });

      const text = result.text;

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

      const result = await generateText({
        model: gateway('google/gemini-2.0-flash-001'),
        system: systemPrompt || 'You are a helpful AI assistant. Be concise and accurate.',
        messages,
      });

      const text = result.text;
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
