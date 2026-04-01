/**
 * Core types for the Source Map and Cloud integration
 */

export interface Tool {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

export interface Model {
  id: string;
  name: string;
  version: string;
  type: 'llm' | 'vision' | 'embeddings';
  config?: Record<string, unknown>;
}

export interface Command {
  id: string;
  name: string;
  description: string;
  handler: (input: string) => Promise<string>;
  tools?: Tool[];
}

export interface QueryContext {
  input: string;
  tools: Tool[];
  model: Model;
  history?: Message[];
  metadata?: Record<string, unknown>;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  metadata?: Record<string, unknown>;
}

export interface QueryResult {
  output: string;
  confidence?: number;
  toolsUsed?: string[];
  metadata?: Record<string, unknown>;
}

export interface SourceMap {
  version: string;
  models: Map<string, Model>;
  tools: Map<string, Tool>;
  commands: Map<string, Command>;
  config: Record<string, unknown>;
}
