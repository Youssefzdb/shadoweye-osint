/**
 * CCProxy Service - Claude Code Proxy Integration
 * Direct connection to Claude models via CCProxy
 */

interface CCProxyResponse {
  success: boolean;
  text: string;
  error?: string;
  timestamp: string;
  model?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ConversationContext {
  history: ConversationMessage[];
  conversationId?: string;
}

interface CCProxyConfig {
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

class CCProxyService {
  private config: CCProxyConfig = {
    baseUrl: 'https://api.ccproxy.app/v1',
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 8192,
    temperature: 0.7,
  };

  private conversationHistory: ConversationContext = {
    history: [],
    conversationId: undefined,
  };

  private systemPrompt = `You are Claude, an AI assistant created by Anthropic. You are helpful, harmless, and honest.

Your key traits:
- You think step by step before answering
- You use tools when appropriate
- You are direct and concise
- You admit when you don't know something
- You are friendly but professional

When handling tasks:
1. Analyze the request carefully
2. Plan your approach
3. Execute step by step
4. Verify your work
5. Provide clear results`;

  /**
   * Update configuration
   */
  configure(config: Partial<CCProxyConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Set custom system prompt
   */
  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
  }

  /**
   * Build request payload for CCProxy
   */
  private buildPayload(prompt: string): object {
    const messages: ConversationMessage[] = [
      { role: 'system', content: this.systemPrompt },
      ...this.conversationHistory.history,
      { role: 'user', content: prompt },
    ];

    return {
      model: this.config.model,
      messages,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      stream: false,
    };
  }

  /**
   * Send request to CCProxy with retry logic
   */
  private async sendRequest(payload: object): Promise<any> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

        const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal as AbortSignal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Wait before retry with exponential backoff
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, attempt))
          );
        }
      }
    }

    throw lastError || new Error('Failed to connect to CCProxy');
  }

  /**
   * Ask CCProxy a question
   */
  async ask(prompt: string): Promise<CCProxyResponse> {
    try {
      // Add to history
      this.conversationHistory.history.push({
        role: 'user',
        content: prompt,
      });

      // Build and send request
      const payload = this.buildPayload(prompt);
      const response = await this.sendRequest(payload);

      // Extract text from response
      const text = response.choices?.[0]?.message?.content || '';

      if (!text) {
        throw new Error('Empty response from CCProxy');
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
        model: response.model || this.config.model,
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens || 0,
          completionTokens: response.usage.completion_tokens || 0,
          totalTokens: response.usage.total_tokens || 0,
        } : undefined,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Remove the failed user message from history
      this.conversationHistory.history.pop();

      return {
        success: false,
        text: '',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Stream response from CCProxy
   */
  async *stream(prompt: string): AsyncGenerator<string, void, unknown> {
    try {
      this.conversationHistory.history.push({
        role: 'user',
        content: prompt,
      });

      const messages: ConversationMessage[] = [
        { role: 'system', content: this.systemPrompt },
        ...this.conversationHistory.history,
      ];

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                fullText += content;
                yield content;
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      // Add complete response to history
      this.conversationHistory.history.push({
        role: 'assistant',
        content: fullText,
      });
    } catch (error) {
      this.conversationHistory.history.pop();
      throw error;
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
  setHistory(history: ConversationMessage[]): void {
    this.conversationHistory.history = history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
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

  /**
   * Get current model
   */
  getModel(): string {
    return this.config.model;
  }

  /**
   * Set model
   */
  setModel(model: string): void {
    this.config.model = model;
  }

  /**
   * Available models
   */
  getAvailableModels(): string[] {
    return [
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-2.1',
      'claude-2.0',
      'claude-instant-1.2',
    ];
  }
}

// Export singleton instance
export const ccproxyService = new CCProxyService();
export type { CCProxyResponse, ConversationContext, ConversationMessage, CCProxyConfig };
