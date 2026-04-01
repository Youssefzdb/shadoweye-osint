/**
 * LiteLLM Proxy - Main Entry Point
 * Claude-compatible API layer that uses Gemini as backend
 */

import type {
  ClaudeRequest,
  ClaudeResponse,
  UnifiedRequest,
  UnifiedResponse,
  UnifiedTool,
  LiteLLMProxyConfig,
  DEFAULT_PROXY_CONFIG,
} from './types';

import { claudeToUnified, unifiedToClaude, parseClaudeRequest, createClaudeErrorResponse } from './claude-adapter';
import { sendToGemini } from './gemini-adapter';
import { transformToClaudeResponse, createSSEStream, hasToolCalls, extractToolCalls, createErrorResponse } from './response-transformer';
import { executeTool, formatToolResult, toolHandlerRegistry } from './tool-mapper';
import { allTools, defaultTools, getTool, registerTool } from './tools';

export interface ProxyOptions {
  config?: Partial<LiteLLMProxyConfig>;
  customTools?: UnifiedTool[];
  enableDefaultTools?: boolean;
}

/**
 * LiteLLM Proxy Class
 * Main interface for translating Claude requests to Gemini
 */
export class LiteLLMProxy {
  private config: LiteLLMProxyConfig;
  private tools: UnifiedTool[];
  private maxToolIterations: number = 10;

  constructor(options: ProxyOptions = {}) {
    this.config = {
      defaultModel: 'gemini-pro',
      maxRetries: 3,
      timeout: 30000,
      enableStreaming: true,
      enableToolExecution: true,
      debug: false,
      ...options.config,
    };

    // Initialize tools
    this.tools = options.enableDefaultTools !== false ? [...defaultTools] : [];

    if (options.customTools) {
      for (const tool of options.customTools) {
        this.registerTool(tool);
      }
    }
  }

  /**
   * Register a custom tool
   */
  registerTool(tool: UnifiedTool): void {
    if (tool.handler) {
      toolHandlerRegistry.register(tool.name, tool.handler);
    }
    this.tools.push(tool);
  }

  /**
   * Get all registered tools
   */
  getTools(): UnifiedTool[] {
    return [...this.tools];
  }

  /**
   * Process a Claude API request
   */
  async processRequest(request: ClaudeRequest): Promise<ClaudeResponse> {
    try {
      if (this.config.debug) {
        console.log('[LiteLLM Proxy] Processing request:', JSON.stringify(request, null, 2));
      }

      // Convert Claude request to unified format
      const unifiedRequest = claudeToUnified(request);

      // Merge tools from request with registered tools
      if (request.tools) {
        for (const tool of request.tools) {
          const existingTool = this.tools.find((t) => t.name === tool.name);
          if (!existingTool) {
            unifiedRequest.tools?.push({
              name: tool.name,
              description: tool.description,
              parameters: {
                type: 'object',
                properties: tool.input_schema.properties,
                required: tool.input_schema.required,
              },
            });
          }
        }
      }

      // Add registered tools to request
      unifiedRequest.tools = [...(unifiedRequest.tools || []), ...this.tools];

      // Process with tool execution loop
      let response = await this.executeWithTools(unifiedRequest);

      // Convert back to Claude format
      return unifiedToClaude(response, request.model);
    } catch (error) {
      console.error('[LiteLLM Proxy] Error:', error);
      return createClaudeErrorResponse(
        error instanceof Error ? error.message : String(error),
        request.model
      );
    }
  }

  /**
   * Execute request with automatic tool handling
   */
  private async executeWithTools(request: UnifiedRequest): Promise<UnifiedResponse> {
    let currentRequest = { ...request };
    let iterations = 0;

    while (iterations < this.maxToolIterations) {
      iterations++;

      // Send to Gemini
      const response = await sendToGemini(currentRequest);

      if (this.config.debug) {
        console.log(`[LiteLLM Proxy] Iteration ${iterations}:`, response);
      }

      // Check if we have tool calls to execute
      if (hasToolCalls(response) && this.config.enableToolExecution) {
        const toolCalls = extractToolCalls(response);
        const toolResults: Array<{ id: string; content: string; isError?: boolean }> = [];

        // Execute each tool
        for (const toolCall of toolCalls) {
          const result = await executeTool({
            toolName: toolCall.name,
            arguments: toolCall.arguments,
          });

          toolResults.push({
            id: toolCall.id,
            content: formatToolResult(result),
            isError: !result.success,
          });
        }

        // Add tool results to messages and continue loop
        const assistantContent = response.content;
        const toolResultContent = toolResults.map((r) => ({
          type: 'tool_result' as const,
          toolResult: r,
        }));

        currentRequest = {
          ...currentRequest,
          messages: [
            ...currentRequest.messages,
            {
              role: 'assistant' as const,
              content: assistantContent,
            },
            {
              role: 'user' as const,
              content: toolResultContent,
            },
          ],
        };

        continue;
      }

      // No more tool calls, return final response
      return response;
    }

    // Max iterations reached
    return createErrorResponse('Maximum tool iterations reached');
  }

  /**
   * Process request and return streaming response
   */
  async processRequestStreaming(request: ClaudeRequest): Promise<ReadableStream<Uint8Array>> {
    const response = await this.processRequest(request);

    // Convert to streaming format
    return createSSEStream(
      {
        id: response.id,
        content: response.content.map((block) => {
          if (block.type === 'text') {
            return { type: 'text' as const, text: block.text };
          }
          if (block.type === 'tool_use') {
            return {
              type: 'tool_call' as const,
              toolCall: {
                id: block.id || '',
                name: block.name || '',
                arguments: block.input || {},
              },
            };
          }
          return { type: 'text' as const, text: '' };
        }),
        stopReason: response.stop_reason,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      },
      request.model
    );
  }

  /**
   * Handle raw request body (for API routes)
   */
  async handleRequest(body: unknown): Promise<ClaudeResponse> {
    const request = parseClaudeRequest(body);
    return this.processRequest(request);
  }

  /**
   * Handle raw request body with streaming
   */
  async handleRequestStreaming(body: unknown): Promise<ReadableStream<Uint8Array>> {
    const request = parseClaudeRequest(body);
    return this.processRequestStreaming(request);
  }

  /**
   * Simple chat method (convenience)
   */
  async chat(
    message: string,
    options: {
      system?: string;
      maxTokens?: number;
      tools?: boolean;
    } = {}
  ): Promise<string> {
    const response = await this.processRequest({
      model: this.config.defaultModel,
      max_tokens: options.maxTokens || 4096,
      system: options.system,
      messages: [{ role: 'user', content: message }],
      tools: options.tools !== false ? this.tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: {
          type: 'object' as const,
          properties: t.parameters.properties,
          required: t.parameters.required,
        },
      })) : undefined,
    });

    // Extract text from response
    return response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('');
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<LiteLLMProxyConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): LiteLLMProxyConfig {
    return { ...this.config };
  }
}

// Create default proxy instance
export const litellmProxy = new LiteLLMProxy();

// Re-export types and utilities
export * from './types';
export * from './claude-adapter';
export * from './gemini-adapter';
export * from './tool-mapper';
export * from './response-transformer';
export { allTools, defaultTools, getTool, registerTool } from './tools';
