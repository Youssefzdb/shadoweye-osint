/**
 * Tools management for Source Map
 * Handles registration and execution of tools used by AI models
 */

import type { Tool } from './types';

class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  /**
   * Register a new tool
   */
  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Get a tool by name
   */
  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all tools
   */
  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Execute a tool
   */
  async execute(name: string, args: Record<string, unknown>): Promise<unknown> {
    const tool = this.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    return tool.handler(args);
  }

  /**
   * Remove a tool
   */
  remove(name: string): boolean {
    return this.tools.delete(name);
  }

  /**
   * Get tools as map
   */
  toMap(): Map<string, Tool> {
    return new Map(this.tools);
  }
}

// Initialize default tools
export function initializeTools(): ToolRegistry {
  const registry = new ToolRegistry();

  // Web search tool
  registry.register({
    name: 'search_web',
    description: 'Search the web for information',
    parameters: {
      query: { type: 'string', description: 'Search query' },
      maxResults: { type: 'number', description: 'Maximum results to return' },
    },
    handler: async (args: Record<string, unknown>) => {
      // Implementation will be provided in API
      return { results: [], query: args.query };
    },
  });

  // Calculator tool
  registry.register({
    name: 'calculate',
    description: 'Perform mathematical calculations',
    parameters: {
      expression: { type: 'string', description: 'Mathematical expression' },
    },
    handler: async (args: Record<string, unknown>) => {
      try {
        // Simple expression evaluation (be careful with eval in production)
        const result = Function('"use strict"; return (' + args.expression + ')')();
        return { result, expression: args.expression };
      } catch (error) {
        return { error: String(error), expression: args.expression };
      }
    },
  });

  // Code execution tool
  registry.register({
    name: 'execute_code',
    description: 'Execute JavaScript code safely',
    parameters: {
      code: { type: 'string', description: 'JavaScript code to execute' },
    },
    handler: async (args: Record<string, unknown>) => {
      // Implementation will be provided in API for safety
      return { code: args.code, status: 'executed' };
    },
  });

  // Database query tool
  registry.register({
    name: 'query_database',
    description: 'Execute database queries',
    parameters: {
      query: { type: 'string', description: 'SQL query' },
      database: { type: 'string', description: 'Database name' },
    },
    handler: async (args: Record<string, unknown>) => {
      // Implementation will connect to actual database
      return { query: args.query, results: [] };
    },
  });

  return registry;
}

export { ToolRegistry };
