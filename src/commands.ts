/**
 * Commands management for Source Map
 * Handles registration and execution of high-level commands
 */

import type { Command, Tool } from './types';
import type { ToolRegistry } from './tools';

class CommandRegistry {
  private commands: Map<string, Command> = new Map();

  /**
   * Register a new command
   */
  register(command: Command): void {
    this.commands.set(command.id, command);
  }

  /**
   * Get a command by ID
   */
  get(id: string): Command | undefined {
    return this.commands.get(id);
  }

  /**
   * Get all commands
   */
  getAll(): Command[] {
    return Array.from(this.commands.values());
  }

  /**
   * Execute a command
   */
  async execute(id: string, input: string): Promise<string> {
    const command = this.get(id);
    if (!command) {
      throw new Error(`Command not found: ${id}`);
    }
    return command.handler(input);
  }

  /**
   * Remove a command
   */
  remove(id: string): boolean {
    return this.commands.delete(id);
  }
}

/**
 * Initialize default commands
 */
export function initializeCommands(toolRegistry: ToolRegistry): CommandRegistry {
  const registry = new CommandRegistry();

  // Answer question command
  registry.register({
    id: 'answer_question',
    name: 'Answer Question',
    description: 'Answer a general question using available tools',
    handler: async (input: string) => {
      try {
        // Will be implemented with Gemini integration
        return `Processing: ${input}`;
      } catch (error) {
        return `Error: ${String(error)}`;
      }
    },
    tools: Array.from(toolRegistry.getAll()),
  });

  // Code analysis command
  registry.register({
    id: 'analyze_code',
    name: 'Analyze Code',
    description: 'Analyze code and provide suggestions',
    handler: async (input: string) => {
      try {
        // Will use code execution and analysis tools
        return `Code analysis for: ${input}`;
      } catch (error) {
        return `Error: ${String(error)}`;
      }
    },
    tools: [toolRegistry.get('execute_code')].filter(Boolean) as Tool[],
  });

  // Data query command
  registry.register({
    id: 'query_data',
    name: 'Query Data',
    description: 'Query data from database',
    handler: async (input: string) => {
      try {
        // Will use database query tool
        return `Querying data: ${input}`;
      } catch (error) {
        return `Error: ${String(error)}`;
      }
    },
    tools: [toolRegistry.get('query_database')].filter(Boolean) as Tool[],
  });

  // Research command
  registry.register({
    id: 'research_topic',
    name: 'Research Topic',
    description: 'Research a topic using web search',
    handler: async (input: string) => {
      try {
        // Will use web search tool
        return `Researching: ${input}`;
      } catch (error) {
        return `Error: ${String(error)}`;
      }
    },
    tools: [toolRegistry.get('search_web')].filter(Boolean) as Tool[],
  });

  return registry;
}

export { CommandRegistry };
