/**
 * Tool Mapper
 * Translates between Claude tools and Gemini function declarations
 * Handles tool execution and result formatting
 */

import type {
  ClaudeTool,
  GeminiFunctionDeclaration,
  UnifiedTool,
  ToolExecutionRequest,
  ToolExecutionResult,
} from './types';

/**
 * Registry for tool handlers
 */
class ToolHandlerRegistry {
  private handlers: Map<string, (args: Record<string, unknown>) => Promise<unknown>> = new Map();

  /**
   * Register a tool handler
   */
  register(name: string, handler: (args: Record<string, unknown>) => Promise<unknown>): void {
    this.handlers.set(name, handler);
  }

  /**
   * Get a tool handler
   */
  get(name: string): ((args: Record<string, unknown>) => Promise<unknown>) | undefined {
    return this.handlers.get(name);
  }

  /**
   * Check if a tool exists
   */
  has(name: string): boolean {
    return this.handlers.has(name);
  }

  /**
   * Get all registered tool names
   */
  getNames(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Remove a tool
   */
  remove(name: string): boolean {
    return this.handlers.delete(name);
  }
}

// Global tool handler registry
export const toolHandlerRegistry = new ToolHandlerRegistry();

/**
 * Convert Claude tool to unified format
 */
export function claudeToolToUnified(tool: ClaudeTool): UnifiedTool {
  return {
    name: tool.name,
    description: tool.description,
    parameters: {
      type: 'object',
      properties: tool.input_schema.properties,
      required: tool.input_schema.required,
    },
    handler: toolHandlerRegistry.get(tool.name),
  };
}

/**
 * Convert unified tool to Claude format
 */
export function unifiedToolToClaude(tool: UnifiedTool): ClaudeTool {
  return {
    name: tool.name,
    description: tool.description,
    input_schema: {
      type: 'object',
      properties: tool.parameters.properties,
      required: tool.parameters.required,
    },
  };
}

/**
 * Convert unified tool to Gemini function declaration
 */
export function unifiedToolToGemini(tool: UnifiedTool): GeminiFunctionDeclaration {
  return {
    name: tool.name,
    description: tool.description,
    parameters: {
      type: 'object',
      properties: tool.parameters.properties,
      required: tool.parameters.required,
    },
  };
}

/**
 * Convert Claude tools array to unified format
 */
export function convertClaudeTools(tools: ClaudeTool[]): UnifiedTool[] {
  return tools.map(claudeToolToUnified);
}

/**
 * Convert unified tools array to Claude format
 */
export function convertToClaudeTools(tools: UnifiedTool[]): ClaudeTool[] {
  return tools.map(unifiedToolToClaude);
}

/**
 * Convert unified tools array to Gemini format
 */
export function convertToGeminiTools(tools: UnifiedTool[]): GeminiFunctionDeclaration[] {
  return tools.map(unifiedToolToGemini);
}

/**
 * Execute a tool by name with given arguments
 */
export async function executeTool(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
  const startTime = Date.now();

  try {
    const handler = toolHandlerRegistry.get(request.toolName);

    if (!handler) {
      return {
        success: false,
        result: null,
        error: `Tool not found: ${request.toolName}`,
        executionTime: Date.now() - startTime,
      };
    }

    const result = await handler(request.arguments);

    return {
      success: true,
      result,
      executionTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      result: null,
      error: error instanceof Error ? error.message : String(error),
      executionTime: Date.now() - startTime,
    };
  }
}

/**
 * Execute multiple tools in parallel
 */
export async function executeToolsParallel(
  requests: ToolExecutionRequest[]
): Promise<ToolExecutionResult[]> {
  return Promise.all(requests.map(executeTool));
}

/**
 * Execute multiple tools in sequence
 */
export async function executeToolsSequential(
  requests: ToolExecutionRequest[]
): Promise<ToolExecutionResult[]> {
  const results: ToolExecutionResult[] = [];

  for (const request of requests) {
    const result = await executeTool(request);
    results.push(result);

    // Stop on first error if needed
    if (!result.success) {
      break;
    }
  }

  return results;
}

/**
 * Format tool result for response
 */
export function formatToolResult(result: ToolExecutionResult): string {
  if (result.success) {
    if (typeof result.result === 'string') {
      return result.result;
    }
    return JSON.stringify(result.result, null, 2);
  }

  return `Error: ${result.error}`;
}

/**
 * Validate tool arguments against schema
 */
export function validateToolArguments(
  tool: UnifiedTool,
  args: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required fields
  if (tool.parameters.required) {
    for (const required of tool.parameters.required) {
      if (!(required in args)) {
        errors.push(`Missing required argument: ${required}`);
      }
    }
  }

  // Check types
  for (const [key, value] of Object.entries(args)) {
    const schema = tool.parameters.properties[key];
    if (!schema) {
      errors.push(`Unknown argument: ${key}`);
      continue;
    }

    const actualType = Array.isArray(value) ? 'array' : typeof value;
    const expectedType = schema.type;

    if (actualType !== expectedType) {
      errors.push(`Argument '${key}' should be ${expectedType}, got ${actualType}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create a tool definition with handler
 */
export function createTool(
  name: string,
  description: string,
  parameters: UnifiedTool['parameters'],
  handler: (args: Record<string, unknown>) => Promise<unknown>
): UnifiedTool {
  // Register the handler
  toolHandlerRegistry.register(name, handler);

  return {
    name,
    description,
    parameters,
    handler,
  };
}

/**
 * Build tool prompt for LLM that doesn't support function calling
 */
export function buildToolPrompt(tools: UnifiedTool[]): string {
  const lines: string[] = [
    'You have access to the following tools:',
    '',
  ];

  for (const tool of tools) {
    lines.push(`## ${tool.name}`);
    lines.push(`Description: ${tool.description}`);
    lines.push('Parameters:');

    for (const [name, schema] of Object.entries(tool.parameters.properties)) {
      const required = tool.parameters.required?.includes(name) ? ' (required)' : ' (optional)';
      lines.push(`  - ${name}: ${schema.type}${required}`);
      if (schema.description) {
        lines.push(`    ${schema.description}`);
      }
    }
    lines.push('');
  }

  lines.push('To use a tool, respond with JSON in this exact format:');
  lines.push('```json');
  lines.push('{"tool": "tool_name", "arguments": {"arg1": "value1", "arg2": "value2"}}');
  lines.push('```');
  lines.push('');
  lines.push('You can use multiple tools by returning multiple JSON objects.');

  return lines.join('\n');
}
