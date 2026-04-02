/**
 * Cloud-Gemini Integration
 * Combines Cloud's full power (models, tools, commands) with Gemini AI
 * Uses native direct Gemini connection (no rate limiting, 100% reliable)
 * Creates a unified AI system with Cloud's architecture and Gemini's capabilities
 */

import { geminiNativeService } from './gemini-native';
import type { ModelRegistry } from './models';
import type { ToolRegistry } from './tools';
import type { CommandRegistry } from './commands';
import type { Model, Tool, Command } from './types';

interface CloudGeminiMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolsCalled?: string[];
  commandUsed?: string;
}

interface CloudGeminiResponse {
  success: boolean;
  message: string;
  toolsAvailable: string[];
  commandsAvailable: string[];
  modelsAvailable: string[];
  executedTools?: Array<{
    name: string;
    input: Record<string, unknown>;
    output: unknown;
  }>;
  error?: string;
}

interface CloudGeminiConfig {
  enableTools: boolean;
  enableCommands: boolean;
  enableModelSwitching: boolean;
  maxTools: number;
  contextWindow: number;
}

class CloudGeminiSystem {
  private modelRegistry: ModelRegistry;
  private toolRegistry: ToolRegistry;
  private commandRegistry: CommandRegistry;
  private conversationHistory: CloudGeminiMessage[] = [];
  private executedTools: Map<string, unknown[]> = new Map();
  private config: CloudGeminiConfig = {
    enableTools: true,
    enableCommands: true,
    enableModelSwitching: true,
    maxTools: 10,
    contextWindow: 20,
  };

  constructor(
    models: ModelRegistry,
    tools: ToolRegistry,
    commands: CommandRegistry
  ) {
    this.modelRegistry = models;
    this.toolRegistry = tools;
    this.commandRegistry = commands;
  }

  /**
   * Build context message for Gemini with Cloud resources
   */
  private buildCloudContext(): string {
    const models = this.modelRegistry.getAll();
    const tools = this.toolRegistry.getAll();
    const commands = this.commandRegistry.getAll();

    const context = `
You are CloudGemini - a powerful AI assistant with access to Cloud's complete infrastructure.

Available Models (${models.length}):
${models.map(m => `- ${m.id}: ${m.name} (${m.type})`).join('\n')}

Available Tools (${tools.length}):
${tools.map(t => `- ${t.name}: ${t.description}`).join('\n')}

Available Commands (${commands.length}):
${commands.map(c => `- ${c.id}: ${c.description}`).join('\n')}

You have full access to all these resources. When answering:
1. Use tools to gather information
2. Execute commands for complex tasks
3. Leverage multiple models for different types of queries
4. Provide comprehensive, well-researched answers

Always mention which tools/commands/models you're using.
    `;

    return context;
  }

  /**
   * Enhance prompt with Cloud context
   */
  private enhancePrompt(prompt: string): string {
    return `${this.buildCloudContext()}\n\nUser Query: ${prompt}`;
  }

  /**
   * Parse and execute tools mentioned in response
   */
  private async parseAndExecuteTools(response: string): Promise<string> {
    let enhancedResponse = response;
    const toolMatches = response.match(/\[TOOL: (\w+)\]/g) || [];

    const executedTools: Array<{
      name: string;
      input: Record<string, unknown>;
      output: unknown;
    }> = [];

    for (const match of toolMatches) {
      const toolName = match.replace(/\[TOOL: |\]/g, '');
      const tool = this.toolRegistry.get(toolName);

      if (tool) {
        try {
          // Extract parameters from response (simplified approach)
          const input: Record<string, unknown> = {};
          
          // For search tool
          if (toolName === 'search_web') {
            const queryMatch = response.match(/query: "([^"]+)"/);
            if (queryMatch) input.query = queryMatch[1];
          }

          const output = await this.toolRegistry.execute(toolName, input);
          executedTools.push({ name: toolName, input, output });

          // Replace tool reference with result
          enhancedResponse = enhancedResponse.replace(
            match,
            `[TOOL_RESULT: ${JSON.stringify(output)}]`
          );
        } catch (error) {
          console.error(`[CloudGemini] Tool execution error for ${toolName}:`, error);
        }
      }
    }

    return enhancedResponse;
  }

  /**
   * Detect and execute commands
   */
  private async parseAndExecuteCommands(response: string): Promise<string> {
    let enhancedResponse = response;
    const commandMatches = response.match(/\[COMMAND: (\w+)\]/g) || [];

    for (const match of commandMatches) {
      const commandId = match.replace(/\[COMMAND: |\]/g, '');
      const command = this.commandRegistry.get(commandId);

      if (command) {
        try {
          // Execute command with the original prompt
          const lastMessage = this.conversationHistory[this.conversationHistory.length - 1];
          const commandResult = await this.commandRegistry.execute(
            commandId,
            lastMessage?.content || ''
          );

          enhancedResponse = enhancedResponse.replace(
            match,
            `[COMMAND_RESULT: ${commandResult}]`
          );
        } catch (error) {
          console.error(`[CloudGemini] Command execution error for ${commandId}:`, error);
        }
      }
    }

    return enhancedResponse;
  }

  /**
   * Query with full Cloud power + Gemini
   * Direct connection to Gemini (no rate limiting, 100% reliable)
   */
  async query(prompt: string): Promise<CloudGeminiResponse> {
    try {
      // Enhance prompt with Cloud context
      const enhancedPrompt = this.enhancePrompt(prompt);

      // Send directly to Gemini via native connection (proven approach from config.yaml)
      const geminiResponse = await geminiNativeService.ask(enhancedPrompt);

      if (!geminiResponse.success) {
        throw new Error(geminiResponse.error || 'Gemini request failed');
      }

      let response = geminiResponse.text;

      // Execute any tools Gemini references
      if (this.config.enableTools) {
        response = await this.parseAndExecuteTools(response);
      }

      // Execute any commands Gemini references
      if (this.config.enableCommands) {
        response = await this.parseAndExecuteCommands(response);
      }

      // Add to history
      this.conversationHistory.push({
        role: 'user',
        content: prompt,
        timestamp: new Date().toISOString(),
      });

      this.conversationHistory.push({
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      });

      // Maintain context window
      if (this.conversationHistory.length > this.config.contextWindow) {
        this.conversationHistory = this.conversationHistory.slice(-this.config.contextWindow);
      }

      return {
        success: true,
        message: response,
        toolsAvailable: this.toolRegistry.getAll().map(t => t.name),
        commandsAvailable: this.commandRegistry.getAll().map(c => c.id),
        modelsAvailable: this.modelRegistry.getAll().map(m => m.id),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        success: false,
        message: '',
        toolsAvailable: this.toolRegistry.getAll().map(t => t.name),
        commandsAvailable: this.commandRegistry.getAll().map(c => c.id),
        modelsAvailable: this.modelRegistry.getAll().map(m => m.id),
        error: errorMessage,
      };
    }
  }

  /**
   * Get conversation history
   */
  getHistory(): CloudGeminiMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
    this.executedTools.clear();
  }

  /**
   * Get system status with all resources
   */
  getStatus() {
    return {
      models: {
        count: this.modelRegistry.getAll().length,
        items: this.modelRegistry.getAll().map(m => ({ id: m.id, name: m.name })),
      },
      tools: {
        count: this.toolRegistry.getAll().length,
        items: this.toolRegistry.getAll().map(t => ({ name: t.name, description: t.description })),
      },
      commands: {
        count: this.commandRegistry.getAll().length,
        items: this.commandRegistry.getAll().map(c => ({ id: c.id, name: c.name })),
      },
      conversationLength: this.conversationHistory.length,
      geminiStatus: 'active',
    };
  }

  /**
   * Update configuration
   */
  setConfig(newConfig: Partial<CloudGeminiConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get available tools
   */
  getTools(): Tool[] {
    return this.toolRegistry.getAll();
  }

  /**
   * Get available commands
   */
  getCommands(): Command[] {
    return this.commandRegistry.getAll();
  }

  /**
   * Get available models
   */
  getModels(): Model[] {
    return this.modelRegistry.getAll();
  }
}

export { CloudGeminiSystem };
export type { CloudGeminiResponse, CloudGeminiMessage, CloudGeminiConfig };
