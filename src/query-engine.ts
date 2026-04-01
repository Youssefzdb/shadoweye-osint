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
import { CloudGeminiSystem } from './cloud-gemini';

class QueryEngine {
  private modelRegistry: ModelRegistry;
  private toolRegistry: ToolRegistry;
  private commandRegistry: CommandRegistry;
  private conversationHistory: Message[] = [];
  private maxHistoryLength: number = 50;
  private cloudGemini: CloudGeminiSystem;

  constructor(
    modelRegistry: ModelRegistry,
    toolRegistry: ToolRegistry,
    commandRegistry: CommandRegistry
  ) {
    this.modelRegistry = modelRegistry;
    this.toolRegistry = toolRegistry;
    this.commandRegistry = commandRegistry;
    // Initialize CloudGemini with full Cloud power
    this.cloudGemini = new CloudGeminiSystem(
      modelRegistry,
      toolRegistry,
      commandRegistry
    );
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

    // Use CloudGemini with full Cloud power
    try {
      const result = await this.cloudGemini.query(input);

      if (!result.success) {
        throw new Error(result.error || 'Failed to process with CloudGemini');
      }

      return result.message;
    } catch (error) {
      console.error('[Query Engine] CloudGemini error:', error);
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

  /**
   * Get CloudGemini system status
   */
  getCloudGeminiStatus() {
    return this.cloudGemini.getStatus();
  }

  /**
   * Get all available tools
   */
  getTools() {
    return this.cloudGemini.getTools();
  }

  /**
   * Get all available commands
   */
  getCommands() {
    return this.cloudGemini.getCommands();
  }

  /**
   * Get all available models
   */
  getModels() {
    return this.cloudGemini.getModels();
  }
}

export { QueryEngine };
