/**
 * CCProxy Service - AI Request Translator
 * Translates Gemini requests to Claude format and ensures Claude-compatible responses
 * Acts as a unified proxy layer for AI model responses
 */

import { geminiService, type GeminiResponse } from './gemini';

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  timestamp: string;
  originalSource: 'gemini';
}

interface CCProxyRequest {
  messages: ClaudeMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

interface CCProxyResponse {
  success: boolean;
  data?: ClaudeResponse;
  error?: string;
  timestamp: string;
  source: 'gemini';
}

class CCProxyService {
  private conversationHistory: ClaudeMessage[] = [];
  private defaultModel = 'gemini-pro';

  /**
   * Translate Claude-format request to Gemini-compatible format
   */
  private translateRequestToGemini(request: CCProxyRequest): string {
    // Build context from conversation history
    let context = '';

    if (request.systemPrompt) {
      context += `System Instructions: ${request.systemPrompt}\n\n`;
    }

    // Add conversation context
    if (request.messages && request.messages.length > 0) {
      context += 'Conversation History:\n';
      for (const msg of request.messages.slice(0, -1)) {
        context += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      }
    }

    // Get the final user message
    const userMessage =
      request.messages && request.messages.length > 0
        ? request.messages[request.messages.length - 1].content
        : '';

    return `${context}\nUser: ${userMessage}\n\nProvide a helpful, detailed response.`;
  }

  /**
   * Format temperature parameter (Claude uses 0-1, ensure compatibility)
   */
  private normalizeTemperature(temp?: number): number {
    if (temp === undefined) return 0.7;
    return Math.min(Math.max(temp, 0), 1);
  }

  /**
   * Estimate token count (simplified approximation)
   * Real implementation would use proper tokenizer
   */
  private estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token on average
    return Math.ceil(text.length / 4);
  }

  /**
   * Format Gemini response as Claude-compatible response
   */
  private translateResponseToClaudeFormat(
    geminiResponse: GeminiResponse,
    requestTokens: number,
    model: string
  ): ClaudeResponse {
    const responseTokens = this.estimateTokens(geminiResponse.text);

    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: geminiResponse.text,
        },
      ],
      model: model || this.defaultModel,
      stop_reason: 'end_turn',
      usage: {
        input_tokens: requestTokens,
        output_tokens: responseTokens,
      },
      timestamp: geminiResponse.timestamp,
      originalSource: 'gemini',
    };
  }

  /**
   * Send request through CCProxy (translates and sends to Gemini)
   */
  async sendRequest(request: CCProxyRequest): Promise<CCProxyResponse> {
    try {
      // Validate request
      if (!request.messages || request.messages.length === 0) {
        return {
          success: false,
          error: 'No messages provided in request',
          timestamp: new Date().toISOString(),
          source: 'gemini',
        };
      }

      // Update conversation history with new messages
      this.conversationHistory.push(...request.messages);

      // Translate request to Gemini format
      const geminiPrompt = this.translateRequestToGemini(request);
      const requestTokens = this.estimateTokens(geminiPrompt);

      // Send to Gemini
      const geminiResponse = await geminiService.ask(geminiPrompt);

      if (!geminiResponse.success) {
        return {
          success: false,
          error: geminiResponse.error || 'Gemini request failed',
          timestamp: new Date().toISOString(),
          source: 'gemini',
        };
      }

      // Transform response to Claude format
      const claudeResponse = this.translateResponseToClaudeFormat(
        geminiResponse,
        requestTokens,
        request.model || this.defaultModel
      );

      // Add response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: geminiResponse.text,
      });

      return {
        success: true,
        data: claudeResponse,
        timestamp: new Date().toISOString(),
        source: 'gemini',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        source: 'gemini',
      };
    }
  }

  /**
   * Get current conversation history in Claude format
   */
  getHistory(): ClaudeMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Set model for responses
   */
  setModel(model: string): void {
    this.defaultModel = model;
  }

  /**
   * Get current model
   */
  getModel(): string {
    return this.defaultModel;
  }

  /**
   * Get conversation length
   */
  getHistoryLength(): number {
    return this.conversationHistory.length;
  }

  /**
   * Validate request format (Claude-compatible)
   */
  validateRequest(request: CCProxyRequest): { valid: boolean; error?: string } {
    if (!request.messages) {
      return { valid: false, error: 'Messages array is required' };
    }

    if (!Array.isArray(request.messages)) {
      return { valid: false, error: 'Messages must be an array' };
    }

    if (request.messages.length === 0) {
      return { valid: false, error: 'At least one message is required' };
    }

    for (const msg of request.messages) {
      if (!msg.role || !['user', 'assistant'].includes(msg.role)) {
        return { valid: false, error: 'Invalid message role' };
      }
      if (!msg.content || typeof msg.content !== 'string') {
        return { valid: false, error: 'Message content must be a string' };
      }
    }

    if (request.maxTokens && request.maxTokens < 1) {
      return { valid: false, error: 'maxTokens must be greater than 0' };
    }

    if (request.temperature !== undefined) {
      if (request.temperature < 0 || request.temperature > 1) {
        return { valid: false, error: 'Temperature must be between 0 and 1' };
      }
    }

    return { valid: true };
  }
}

// Export singleton instance
export const ccProxyService = new CCProxyService();
export type { CCProxyRequest, CCProxyResponse, ClaudeResponse, ClaudeMessage };
