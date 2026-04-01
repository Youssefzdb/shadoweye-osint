/**
 * Claude Tools Index
 * Complete collection of tools available for Claude-like AI agent
 */

import type { UnifiedTool } from '../types';
import { toolHandlerRegistry } from '../tool-mapper';

// Import all tools
import { webSearchTool, newsSearchTool, imageSearchTool } from './web-search';
import { codeExecutionTool, calculatorTool, jsonParserTool } from './code-execution';
import {
  readFileTool,
  writeFileTool,
  deleteFileTool,
  listDirectoryTool,
  createDirectoryTool,
  copyFileTool,
  moveFileTool,
  searchFilesTool,
  fileTools,
} from './file-operations';

/**
 * All available tools organized by category
 */
export const toolCategories = {
  search: {
    name: 'Web Search',
    description: 'Search the web for information',
    tools: [webSearchTool, newsSearchTool, imageSearchTool],
  },
  code: {
    name: 'Code Execution',
    description: 'Execute and analyze code',
    tools: [codeExecutionTool, calculatorTool, jsonParserTool],
  },
  files: {
    name: 'File Operations',
    description: 'Read, write, and manage files',
    tools: fileTools,
  },
};

/**
 * All tools as a flat array
 */
export const allTools: UnifiedTool[] = [
  // Search tools
  webSearchTool,
  newsSearchTool,
  imageSearchTool,

  // Code tools
  codeExecutionTool,
  calculatorTool,
  jsonParserTool,

  // File tools
  ...fileTools,
];

/**
 * Default tools to enable (commonly used subset)
 */
export const defaultTools: UnifiedTool[] = [
  webSearchTool,
  codeExecutionTool,
  calculatorTool,
  readFileTool,
  writeFileTool,
  listDirectoryTool,
];

/**
 * Tool name to tool mapping
 */
export const toolMap: Map<string, UnifiedTool> = new Map(
  allTools.map((tool) => [tool.name, tool])
);

/**
 * Get tool by name
 */
export function getTool(name: string): UnifiedTool | undefined {
  return toolMap.get(name);
}

/**
 * Get tools by category
 */
export function getToolsByCategory(category: keyof typeof toolCategories): UnifiedTool[] {
  return toolCategories[category]?.tools || [];
}

/**
 * Get tool names by category
 */
export function getToolNames(category?: keyof typeof toolCategories): string[] {
  if (category) {
    return getToolsByCategory(category).map((t) => t.name);
  }
  return allTools.map((t) => t.name);
}

/**
 * Register additional custom tool
 */
export function registerTool(tool: UnifiedTool): void {
  if (tool.handler) {
    toolHandlerRegistry.register(tool.name, tool.handler);
  }
  toolMap.set(tool.name, tool);
  allTools.push(tool);
}

/**
 * Create a tool subset for specific use case
 */
export function createToolset(toolNames: string[]): UnifiedTool[] {
  return toolNames
    .map((name) => toolMap.get(name))
    .filter((tool): tool is UnifiedTool => tool !== undefined);
}

/**
 * Get tools formatted for Claude API
 */
export function getClaudeToolDefinitions(tools: UnifiedTool[]): Array<{
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}> {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: {
      type: 'object' as const,
      properties: tool.parameters.properties,
      required: tool.parameters.required,
    },
  }));
}

/**
 * Get tools formatted for Gemini API
 */
export function getGeminiToolDefinitions(tools: UnifiedTool[]): Array<{
  functionDeclarations: Array<{
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, unknown>;
      required?: string[];
    };
  }>;
}> {
  return [{
    functionDeclarations: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: tool.parameters.properties,
        required: tool.parameters.required,
      },
    })),
  }];
}

/**
 * Describe available tools in natural language
 */
export function describeTools(tools: UnifiedTool[]): string {
  const lines: string[] = ['Available Tools:', ''];

  for (const tool of tools) {
    lines.push(`**${tool.name}**`);
    lines.push(`  ${tool.description}`);

    if (tool.parameters.required && tool.parameters.required.length > 0) {
      lines.push(`  Required: ${tool.parameters.required.join(', ')}`);
    }

    lines.push('');
  }

  return lines.join('\n');
}

// Re-export individual tools
export {
  webSearchTool,
  newsSearchTool,
  imageSearchTool,
  codeExecutionTool,
  calculatorTool,
  jsonParserTool,
  readFileTool,
  writeFileTool,
  deleteFileTool,
  listDirectoryTool,
  createDirectoryTool,
  copyFileTool,
  moveFileTool,
  searchFilesTool,
};

// Export tool handler registry
export { toolHandlerRegistry };
