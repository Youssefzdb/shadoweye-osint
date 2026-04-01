/**
 * Response Transformer
 * Transforms responses between different formats and handles streaming
 */

import type {
  ClaudeResponse,
  ClaudeStreamEvent,
  ClaudeContentBlock,
  UnifiedResponse,
  UnifiedContentBlock,
} from './types';

/**
 * Generate unique IDs
 */
function generateMessageId(): string {
  return 'msg_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

/**
 * Transform unified response to Claude format
 */
export function transformToClaudeResponse(
  response: UnifiedResponse,
  model: string
): ClaudeResponse {
  const content: ClaudeContentBlock[] = response.content.map(transformContentBlock);

  return {
    id: response.id || generateMessageId(),
    type: 'message',
    role: 'assistant',
    content,
    model,
    stop_reason: response.stopReason,
    usage: {
      input_tokens: response.usage.inputTokens,
      output_tokens: response.usage.outputTokens,
    },
  };
}

/**
 * Transform content block to Claude format
 */
function transformContentBlock(block: UnifiedContentBlock): ClaudeContentBlock {
  switch (block.type) {
    case 'text':
      return {
        type: 'text',
        text: block.text || '',
      };

    case 'tool_call':
      return {
        type: 'tool_use',
        id: block.toolCall?.id || '',
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

    case 'image':
      return {
        type: 'image',
        source: block.image ? {
          type: 'base64',
          media_type: block.image.mimeType,
          data: block.image.data,
        } : undefined,
      };

    default:
      return {
        type: 'text',
        text: '',
      };
  }
}

/**
 * Create stream events for Claude streaming format
 */
export function* createStreamEvents(
  response: UnifiedResponse,
  model: string
): Generator<ClaudeStreamEvent> {
  const messageId = response.id || generateMessageId();

  // Message start event
  yield {
    type: 'message_start',
    message: {
      id: messageId,
      type: 'message',
      role: 'assistant',
      content: [],
      model,
      stop_reason: undefined,
      usage: {
        input_tokens: response.usage.inputTokens,
        output_tokens: 0,
      },
    },
  };

  // Content blocks
  let blockIndex = 0;
  for (const block of response.content) {
    // Content block start
    yield {
      type: 'content_block_start',
      index: blockIndex,
      content_block: transformContentBlock(block),
    };

    // For text blocks, emit deltas
    if (block.type === 'text' && block.text) {
      // Split text into chunks for realistic streaming
      const chunks = splitTextIntoChunks(block.text, 50);
      for (const chunk of chunks) {
        yield {
          type: 'content_block_delta',
          index: blockIndex,
          delta: {
            type: 'text_delta',
            text: chunk,
          },
        };
      }
    }

    // For tool calls, emit input as delta
    if (block.type === 'tool_call' && block.toolCall) {
      yield {
        type: 'content_block_delta',
        index: blockIndex,
        delta: {
          type: 'input_json_delta',
          partial_json: JSON.stringify(block.toolCall.arguments),
        },
      };
    }

    // Content block stop
    yield {
      type: 'content_block_stop',
      index: blockIndex,
    };

    blockIndex++;
  }

  // Message delta (final usage and stop reason)
  yield {
    type: 'message_delta',
    delta: {
      stop_reason: response.stopReason,
    },
    usage: {
      output_tokens: response.usage.outputTokens,
    },
  };

  // Message stop
  yield {
    type: 'message_stop',
  };
}

/**
 * Split text into chunks for streaming
 */
function splitTextIntoChunks(text: string, maxChunkSize: number): string[] {
  const chunks: string[] = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    // Try to find a good break point (space, newline, punctuation)
    let endIndex = Math.min(currentIndex + maxChunkSize, text.length);

    if (endIndex < text.length) {
      // Look for a break point
      const breakPoints = [' ', '\n', '.', ',', '!', '?', ';', ':'];
      let foundBreak = false;

      for (let i = endIndex; i > currentIndex; i--) {
        if (breakPoints.includes(text[i])) {
          endIndex = i + 1;
          foundBreak = true;
          break;
        }
      }

      // If no break point found, just use maxChunkSize
      if (!foundBreak && endIndex - currentIndex > maxChunkSize) {
        endIndex = currentIndex + maxChunkSize;
      }
    }

    chunks.push(text.substring(currentIndex, endIndex));
    currentIndex = endIndex;
  }

  return chunks;
}

/**
 * Format stream event as SSE
 */
export function formatSSE(event: ClaudeStreamEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

/**
 * Create SSE stream from response
 */
export function createSSEStream(
  response: UnifiedResponse,
  model: string
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const events = createStreamEvents(response, model);

  return new ReadableStream({
    start(controller) {
      // Emit all events
      for (const event of events) {
        controller.enqueue(encoder.encode(formatSSE(event)));
      }
      controller.close();
    },
  });
}

/**
 * Create async iterator for streaming
 */
export async function* streamResponse(
  response: UnifiedResponse,
  model: string,
  delayMs: number = 20
): AsyncGenerator<ClaudeStreamEvent> {
  for (const event of createStreamEvents(response, model)) {
    yield event;

    // Add delay for realistic streaming effect
    if (event.type === 'content_block_delta') {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

/**
 * Merge multiple responses into one
 */
export function mergeResponses(responses: UnifiedResponse[]): UnifiedResponse {
  const content: UnifiedContentBlock[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (const response of responses) {
    content.push(...response.content);
    totalInputTokens += response.usage.inputTokens;
    totalOutputTokens += response.usage.outputTokens;
  }

  // Determine stop reason from last response
  const lastResponse = responses[responses.length - 1];
  const stopReason = lastResponse?.stopReason || 'end_turn';

  return {
    id: generateMessageId(),
    content,
    stopReason,
    usage: {
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
    },
  };
}

/**
 * Extract text from response
 */
export function extractText(response: UnifiedResponse): string {
  return response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text || '')
    .join('');
}

/**
 * Extract tool calls from response
 */
export function extractToolCalls(response: UnifiedResponse): Array<{
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}> {
  return response.content
    .filter((block) => block.type === 'tool_call' && block.toolCall)
    .map((block) => ({
      id: block.toolCall!.id,
      name: block.toolCall!.name,
      arguments: block.toolCall!.arguments,
    }));
}

/**
 * Check if response contains tool calls
 */
export function hasToolCalls(response: UnifiedResponse): boolean {
  return response.content.some((block) => block.type === 'tool_call');
}

/**
 * Create error response
 */
export function createErrorResponse(error: string): UnifiedResponse {
  return {
    id: generateMessageId(),
    content: [{
      type: 'text',
      text: `Error: ${error}`,
    }],
    stopReason: 'end_turn',
    usage: {
      inputTokens: 0,
      outputTokens: 0,
    },
  };
}

/**
 * Sanitize response content (remove sensitive data, fix formatting)
 */
export function sanitizeResponse(response: UnifiedResponse): UnifiedResponse {
  const sanitizedContent = response.content.map((block) => {
    if (block.type === 'text' && block.text) {
      // Remove any accidentally leaked API keys or secrets
      let text = block.text;
      text = text.replace(/([a-zA-Z0-9_-]{20,})/g, (match) => {
        // Check if it looks like a key
        if (match.includes('sk-') || match.includes('key_') || match.includes('api_')) {
          return '[REDACTED]';
        }
        return match;
      });

      return { ...block, text };
    }
    return block;
  });

  return {
    ...response,
    content: sanitizedContent,
  };
}
