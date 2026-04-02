/**
 * Source Map - Cloud Integration Core
 * Main entry point for the source map system
 * Integrated with CCProxy for Claude-compatible request/response format
 */

import { initializeModels, ModelRegistry } from './models';
import { initializeTools, ToolRegistry } from './tools';
import { initializeCommands, CommandRegistry } from './commands';
import { QueryEngine } from './query-engine';
import { ClaudeAgent } from './claude-agent';
import { ccProxyService } from './cc-proxy';
import type {
  Tool,
  Model,
  Command,
  QueryContext,
  QueryResult,
  Message,
  SourceMap,
} from './types';
import type { CCProxyRequest, CCProxyResponse, ClaudeResponse } from './cc-proxy';

/**
 * Initialize the complete Source Map system
 */
function initializeSourceMap() {
  const models = initializeModels();
  const tools = initializeTools();
  const commands = initializeCommands(tools);
  const engine = new QueryEngine(models, tools, commands);
  const claudeAgent = new ClaudeAgent(models, tools, commands);

  return {
    models,
    tools,
    commands,
    engine,
    claudeAgent,
  };
}

// Export everything needed
export {
  // Initializers
  initializeSourceMap,
  initializeModels,
  initializeTools,
  initializeCommands,
  // Classes
  ModelRegistry,
  ToolRegistry,
  CommandRegistry,
  QueryEngine,
  ClaudeAgent,
  // CCProxy for Claude-compatible format
  ccProxyService,
  // Types
  type Tool,
  type Model,
  type Command,
  type QueryContext,
  type QueryResult,
  type Message,
  type SourceMap,
  type CCProxyRequest,
  type CCProxyResponse,
  type ClaudeResponse,
};

// Create default instance
export const sourceMap = initializeSourceMap();
export const { models, tools, commands, engine, claudeAgent } = sourceMap;

// Helper function for API routes to access query engine
export function getQueryEngine() {
  return engine;
}
