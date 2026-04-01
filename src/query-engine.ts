/**
 * Query Engine for Source Map
 * Orchestrates model, tools, and commands to process queries
 */

import type {
  QueryContext,
  QueryResult,
  SourceMap,
  Message,
  Tool,
} from './types';
import type { ModelRegistry } from './models';
import type { ToolRegistry } from './tools';
import type { CommandRegistry } from './commands';

class QueryEngine {
  private modelRegistry: ModelRegistry;
  private toolRegistry: ToolRegistry;
  private commandRegistry: CommandRegistry;
  private conversationHistory: Message[] = [];
  private maxHistoryLength: number = 50;

  constructor(
    modelRegistry: ModelRegistry,
    toolRegistry: ToolRegistry,
    commandRegistry: CommandRegistry
  ) {
    this.modelRegistry = modelRegistry;
    this.toolRegistry = toolRegistry;
    this.commandRegistry = commandRegistry;
  }

  /**
   * Process a query with context
   */
  async query(
    input: string,
    modelId: string = 'gemini-pro'
  ): Promise<QueryResult> {
    const model = this.modelRegistry.get(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    const context: QueryContext = {
      input,
      tools: this.toolRegistry.getAll(),
      model,
      history: this.getRecentHistory(),
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };

    try {
      // Add user message to history
      this.addMessage({
        role: 'user',
        content: input,
        timestamp: new Date(),
      });

      // Process the query (will be enhanced with Gemini)
      const output = await this.processQuery(context);

      // Add assistant response to history
      this.addMessage({
        role: 'assistant',
        content: output,
        timestamp: new Date(),
      });

      return {
        output,
        confidence: 0.8,
        toolsUsed: [],
        metadata: {
          modelId,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        output: `Error processing query: ${String(error)}`,
        confidence: 0,
        metadata: {
          error: String(error),
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Process query with available tools and commands
   */
  private async processQuery(context: QueryContext): Promise<string> {
    const { input } = context;

    // Detect command intent from input
    const command = this.detectCommand(input);
    if (command) {
      return this.commandRegistry.execute(command.id, input);
    }

    // Use Gemini for advanced processing
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          context: this.getRecentHistory(5).map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.message) {
        return result.message;
      }

      throw new Error(result.error || 'Unknown error');
    } catch (error) {
      console.error('[Query Engine] Gemini error:', error);
      return `Error connecting to AI: ${String(error)}`;
    }
  }

  /**
   * Detect command from input
   */
  private detectCommand(
    input: string
  ): { id: string; name: string } | null {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('search') || lowerInput.includes('research')) {
      return { id: 'research_topic', name: 'Research Topic' };
    }
    if (lowerInput.includes('code') || lowerInput.includes('analyze')) {
      return { id: 'analyze_code', name: 'Analyze Code' };
    }
    if (lowerInput.includes('query') || lowerInput.includes('data')) {
      return { id: 'query_data', name: 'Query Data' };
    }

    return null;
  }

  /**
   * Add message to conversation history
   */
  private addMessage(message: Message): void {
    this.conversationHistory.push(message);

    // Keep history within limits
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
    }
  }

  /**
   * Get recent conversation history
   */
  private getRecentHistory(count: number = 10): Message[] {
    return this.conversationHistory.slice(-count);
  }

  /**
   * Get full conversation history
   */
  getConversationHistory(): Message[] {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Get engine state as SourceMap
   */
  getSourceMap(): SourceMap {
    return {
      version: '1.0.0',
      models: this.modelRegistry.toMap(),
      tools: this.toolRegistry.toMap(),
      commands: this.commandRegistry.getAll().reduce(
        (acc, cmd) => {
          acc.set(cmd.id, cmd);
          return acc;
        },
        new Map()
      ),
      config: {
        maxHistoryLength: this.maxHistoryLength,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export { QueryEngine };
