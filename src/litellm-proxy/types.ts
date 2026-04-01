/**
 * LiteLLM Proxy Types
 * Complete Claude API type definitions for translation layer
 */

// ============ Claude API Types ============

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | ClaudeContentBlock[];
}

export interface ClaudeContentBlock {
  type: 'text' | 'image' | 'tool_use' | 'tool_result';
  text?: string;
  source?: {
    type: 'base64';
    media_type: string;
    data: string;
  };
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: string | ClaudeContentBlock[];
  is_error?: boolean;
}

export interface ClaudeTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, ClaudeToolProperty>;
    required?: string[];
  };
}

export interface ClaudeToolProperty {
  type: string;
  description?: string;
  enum?: string[];
  items?: ClaudeToolProperty;
  properties?: Record<string, ClaudeToolProperty>;
  required?: string[];
}

export interface ClaudeRequest {
  model: string;
  messages: ClaudeMessage[];
  system?: string;
  max_tokens: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  tools?: ClaudeTool[];
  tool_choice?: ClaudeToolChoice;
  stream?: boolean;
  stop_sequences?: string[];
  metadata?: {
    user_id?: string;
  };
}

export type ClaudeToolChoice =
  | { type: 'auto' }
  | { type: 'any' }
  | { type: 'none' }
  | { type: 'tool'; name: string };

export interface ClaudeResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: ClaudeContentBlock[];
  model: string;
  stop_reason: 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence';
  stop_sequence?: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface ClaudeStreamEvent {
  type: 'message_start' | 'content_block_start' | 'content_block_delta' | 'content_block_stop' | 'message_delta' | 'message_stop' | 'ping' | 'error';
  message?: Partial<ClaudeResponse>;
  index?: number;
  content_block?: ClaudeContentBlock;
  delta?: {
    type: 'text_delta' | 'input_json_delta';
    text?: string;
    partial_json?: string;
    stop_reason?: string;
    stop_sequence?: string;
  };
  usage?: {
    output_tokens: number;
  };
  error?: {
    type: string;
    message: string;
  };
}

// ============ Gemini API Types ============

export interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

export interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
  };
  functionResponse?: {
    name: string;
    response: Record<string, unknown>;
  };
}

export interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, GeminiParameter>;
    required?: string[];
  };
}

export interface GeminiParameter {
  type: string;
  description?: string;
  enum?: string[];
  items?: GeminiParameter;
  properties?: Record<string, GeminiParameter>;
  required?: string[];
}

export interface GeminiRequest {
  contents: GeminiContent[];
  systemInstruction?: {
    parts: GeminiPart[];
  };
  tools?: Array<{
    functionDeclarations: GeminiFunctionDeclaration[];
  }>;
  toolConfig?: {
    functionCallingConfig: {
      mode: 'AUTO' | 'ANY' | 'NONE';
      allowedFunctionNames?: string[];
    };
  };
  generationConfig?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
  };
}

export interface GeminiCandidate {
  content: GeminiContent;
  finishReason: 'STOP' | 'MAX_TOKENS' | 'SAFETY' | 'RECITATION' | 'OTHER';
  safetyRatings?: Array<{
    category: string;
    probability: string;
  }>;
}

export interface GeminiResponse {
  candidates: GeminiCandidate[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

// ============ Internal Unified Types ============

export interface UnifiedMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | UnifiedContentBlock[];
  name?: string;
  tool_call_id?: string;
}

export interface UnifiedContentBlock {
  type: 'text' | 'image' | 'tool_call' | 'tool_result';
  text?: string;
  image?: {
    data: string;
    mimeType: string;
  };
  toolCall?: {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  };
  toolResult?: {
    id: string;
    content: string;
    isError?: boolean;
  };
}

export interface UnifiedTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, UnifiedParameter>;
    required?: string[];
  };
  handler?: (args: Record<string, unknown>) => Promise<unknown>;
}

export interface UnifiedParameter {
  type: string;
  description?: string;
  enum?: string[];
  items?: UnifiedParameter;
  properties?: Record<string, UnifiedParameter>;
  required?: string[];
}

export interface UnifiedRequest {
  messages: UnifiedMessage[];
  systemPrompt?: string;
  tools?: UnifiedTool[];
  toolChoice?: 'auto' | 'any' | 'none' | { name: string };
  maxTokens: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
  stream?: boolean;
}

export interface UnifiedResponse {
  id: string;
  content: UnifiedContentBlock[];
  stopReason: 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence';
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

// ============ Tool Execution Types ============

export interface ToolExecutionRequest {
  toolName: string;
  arguments: Record<string, unknown>;
  context?: {
    conversationId?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  };
}

export interface ToolExecutionResult {
  success: boolean;
  result: unknown;
  error?: string;
  executionTime: number;
}

// ============ Proxy Configuration ============

export interface LiteLLMProxyConfig {
  defaultModel: string;
  maxRetries: number;
  timeout: number;
  enableStreaming: boolean;
  enableToolExecution: boolean;
  debug: boolean;
}

export const DEFAULT_PROXY_CONFIG: LiteLLMProxyConfig = {
  defaultModel: 'gemini-pro',
  maxRetries: 3,
  timeout: 30000,
  enableStreaming: true,
  enableToolExecution: true,
  debug: false,
};
