/**
 * Claude Adapter
 * Converts Claude API requests to unified internal format
 */

import type {
  ClaudeRequest,
  ClaudeResponse,
  ClaudeMessage,
  ClaudeContentBlock,
  ClaudeTool,
  ClaudeToolChoice,
  UnifiedRequest,
  UnifiedResponse,
  UnifiedMessage,
  UnifiedContentBlock,
  UnifiedTool,
} from './types';

/**
 * Generate a unique ID for responses
 */
function generateId(): string {
  return 'msg_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

/**
 * Convert Claude message to unified format
 */
function convertClaudeMessage(message: ClaudeMessage): UnifiedMessage {
  // Handle string content
  if (typeof message.content === 'string') {
    return {
      role: message.role,
      content: message.content,
    };
  }

  // Handle content blocks
  const contentBlocks: UnifiedContentBlock[] = message.content.map((block) => {
    switch (block.type) {
      case 'text':
        return {
          type: 'text' as const,
          text: block.text,
        };

      case 'image':
        return {
          type: 'image' as const,
          image: block.source ? {
            data: block.source.data,
            mimeType: block.source.media_type,
          } : undefined,
        };

      case 'tool_use':
        return {
          type: 'tool_call' as const,
          toolCall: {
            id: block.id || generateId(),
            name: block.name || '',
            arguments: block.input || {},
          },
        };

      case 'tool_result':
        return {
          type: 'tool_result' as const,
          toolResult: {
            id: block.tool_use_id || '',
            content: typeof block.content === 'string' 
              ? block.content 
              : JSON.stringify(block.content),
            isError: block.is_error,
          },
        };

      default:
        return {
          type: 'text' as const,
          text: '',
        };
    }
  });

  return {
    role: message.role,
    content: contentBlocks,
  };
}

/**
 * Convert Claude tool to unified format
 */
function convertClaudeTool(tool: ClaudeTool): UnifiedTool {
  return {
    name: tool.name,
    description: tool.description,
    parameters: {
      type: 'object',
      properties: tool.input_schema.properties,
      required: tool.input_schema.required,
    },
  };
}

/**
 * Convert Claude tool choice to unified format
 */
function convertToolChoice(choice?: ClaudeToolChoice): 'auto' | 'any' | 'none' | { name: string } {
  if (!choice) return 'auto';

  switch (choice.type) {
    case 'auto':
      return 'auto';
    case 'any':
      return 'any';
    case 'none':
      return 'none';
    case 'tool':
      return { name: choice.name };
    default:
      return 'auto';
  }
}

/**
 * Convert Claude API request to unified internal format
 */
export function claudeToUnified(request: ClaudeRequest): UnifiedRequest {
  const messages: UnifiedMessage[] = [];

  // Add system message if present
  if (request.system) {
    messages.push({
      role: 'system',
      content: request.system,
    });
  }

  // Convert all messages
  for (const message of request.messages) {
    messages.push(convertClaudeMessage(message));
  }

  // Convert tools
  const tools: UnifiedTool[] = request.tools?.map(convertClaudeTool) || [];

  return {
    messages,
    systemPrompt: request.system,
    tools,
    toolChoice: convertToolChoice(request.tool_choice),
    maxTokens: request.max_tokens,
    temperature: request.temperature,
    topP: request.top_p,
    topK: request.top_k,
    stopSequences: request.stop_sequences,
    stream: request.stream,
  };
}

/**
 * Convert unified content block to Claude format
 */
function convertToClaudeContentBlock(block: UnifiedContentBlock): ClaudeContentBlock {
  switch (block.type) {
    case 'text':
      return {
        type: 'text',
        text: block.text || '',
      };

    case 'image':
      return {
        type: 'image',
        source: block.image ? {
          type: 'base64',
          media_type: block.image.mimeType,
          data: block.image.data,
        } : undefined,
      };

    case 'tool_call':
      return {
        type: 'tool_use',
        id: block.toolCall?.id || generateId(),
        name: block.toolCall?.name || '',
        input: block.toolCall?.arguments || {},
      };

    case 'tool_result':
      return {
        type: 'tool_result',
        tool_use_id: block.toolResult?.id || '',
        content: block.toolResult?.content || '',
        is_error: block.toolResult?.isError,
      };

    default:
      return {
        type: 'text',
        text: '',
      };
  }
}

/**
 * Convert unified response to Claude API format
 */
export function unifiedToClaude(response: UnifiedResponse, model: string): ClaudeResponse {
  const content: ClaudeContentBlock[] = response.content.map(convertToClaudeContentBlock);

  // Map stop reason
  let stopReason: ClaudeResponse['stop_reason'];
  switch (response.stopReason) {
    case 'end_turn':
      stopReason = 'end_turn';
      break;
    case 'tool_use':
      stopReason = 'tool_use';
      break;
    case 'max_tokens':
      stopReason = 'max_tokens';
      break;
    case 'stop_sequence':
      stopReason = 'stop_sequence';
      break;
    default:
      stopReason = 'end_turn';
  }

  return {
    id: response.id,
    type: 'message',
    role: 'assistant',
    content,
    model,
    stop_reason: stopReason,
    usage: {
      input_tokens: response.usage.inputTokens,
      output_tokens: response.usage.outputTokens,
    },
  };
}

/**
 * Parse Claude request from raw JSON
 */
export function parseClaudeRequest(body: unknown): ClaudeRequest {
  const data = body as Record<string, unknown>;

  if (!data.messages || !Array.isArray(data.messages)) {
    throw new Error('Invalid request: messages array is required');
  }

  if (!data.max_tokens || typeof data.max_tokens !== 'number') {
    throw new Error('Invalid request: max_tokens is required');
  }

  return {
    model: (data.model as string) || 'claude-3-opus-20240229',
    messages: data.messages as ClaudeMessage[],
    system: data.system as string | undefined,
    max_tokens: data.max_tokens as number,
    temperature: data.temperature as number | undefined,
    top_p: data.top_p as number | undefined,
    top_k: data.top_k as number | undefined,
    tools: data.tools as ClaudeTool[] | undefined,
    tool_choice: data.tool_choice as ClaudeToolChoice | undefined,
    stream: data.stream as boolean | undefined,
    stop_sequences: data.stop_sequences as string[] | undefined,
    metadata: data.metadata as { user_id?: string } | undefined,
  };
}

/**
 * Create error response in Claude format
 */
export function createClaudeErrorResponse(error: string, model: string): ClaudeResponse {
  return {
    id: generateId(),
    type: 'message',
    role: 'assistant',
    content: [{
      type: 'text',
      text: `Error: ${error}`,
    }],
    model,
    stop_reason: 'end_turn',
    usage: {
      input_tokens: 0,
      output_tokens: 0,
    },
  };
}
