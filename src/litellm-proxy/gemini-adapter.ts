/**
 * Gemini Adapter
 * Converts unified format to Gemini API and handles responses
 */

import type {
  UnifiedRequest,
  UnifiedResponse,
  UnifiedMessage,
  UnifiedContentBlock,
  UnifiedTool,
  GeminiRequest,
  GeminiResponse,
  GeminiContent,
  GeminiPart,
  GeminiFunctionDeclaration,
} from './types';
import { geminiService } from '../gemini';

/**
 * Generate a unique ID
 */
function generateId(): string {
  return 'msg_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

/**
 * Convert unified message to Gemini content
 */
function convertToGeminiContent(message: UnifiedMessage): GeminiContent | null {
  // Skip system messages (handled separately)
  if (message.role === 'system') {
    return null;
  }

  // Map roles
  const role = message.role === 'assistant' ? 'model' : 'user';

  // Handle string content
  if (typeof message.content === 'string') {
    return {
      role,
      parts: [{ text: message.content }],
    };
  }

  // Handle content blocks
  const parts: GeminiPart[] = [];

  for (const block of message.content) {
    switch (block.type) {
      case 'text':
        if (block.text) {
          parts.push({ text: block.text });
        }
        break;

      case 'image':
        if (block.image) {
          parts.push({
            inlineData: {
              mimeType: block.image.mimeType,
              data: block.image.data,
            },
          });
        }
        break;

      case 'tool_call':
        if (block.toolCall) {
          parts.push({
            functionCall: {
              name: block.toolCall.name,
              args: block.toolCall.arguments,
            },
          });
        }
        break;

      case 'tool_result':
        if (block.toolResult) {
          parts.push({
            functionResponse: {
              name: block.toolResult.id,
              response: {
                result: block.toolResult.content,
                error: block.toolResult.isError,
              },
            },
          });
        }
        break;
    }
  }

  if (parts.length === 0) {
    return null;
  }

  return { role, parts };
}

/**
 * Convert unified tool to Gemini function declaration
 */
function convertToGeminiFunctionDeclaration(tool: UnifiedTool): GeminiFunctionDeclaration {
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
 * Convert unified request to Gemini format
 */
export function unifiedToGemini(request: UnifiedRequest): GeminiRequest {
  const contents: GeminiContent[] = [];

  // Convert messages
  for (const message of request.messages) {
    const content = convertToGeminiContent(message);
    if (content) {
      contents.push(content);
    }
  }

  const geminiRequest: GeminiRequest = {
    contents,
  };

  // Add system instruction
  if (request.systemPrompt) {
    geminiRequest.systemInstruction = {
      parts: [{ text: request.systemPrompt }],
    };
  }

  // Add tools
  if (request.tools && request.tools.length > 0) {
    geminiRequest.tools = [{
      functionDeclarations: request.tools.map(convertToGeminiFunctionDeclaration),
    }];

    // Add tool config
    let mode: 'AUTO' | 'ANY' | 'NONE' = 'AUTO';
    let allowedFunctionNames: string[] | undefined;

    if (request.toolChoice === 'none') {
      mode = 'NONE';
    } else if (request.toolChoice === 'any') {
      mode = 'ANY';
    } else if (typeof request.toolChoice === 'object' && request.toolChoice.name) {
      mode = 'ANY';
      allowedFunctionNames = [request.toolChoice.name];
    }

    geminiRequest.toolConfig = {
      functionCallingConfig: {
        mode,
        allowedFunctionNames,
      },
    };
  }

  // Add generation config
  geminiRequest.generationConfig = {
    temperature: request.temperature,
    topP: request.topP,
    topK: request.topK,
    maxOutputTokens: request.maxTokens,
    stopSequences: request.stopSequences,
  };

  return geminiRequest;
}

/**
 * Parse Gemini response to unified format
 */
export function geminiToUnified(response: GeminiResponse): UnifiedResponse {
  const content: UnifiedContentBlock[] = [];
  let stopReason: 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence' = 'end_turn';
  let hasToolCalls = false;

  if (response.candidates && response.candidates.length > 0) {
    const candidate = response.candidates[0];

    // Map finish reason
    switch (candidate.finishReason) {
      case 'STOP':
        stopReason = 'end_turn';
        break;
      case 'MAX_TOKENS':
        stopReason = 'max_tokens';
        break;
      default:
        stopReason = 'end_turn';
    }

    // Parse content parts
    if (candidate.content && candidate.content.parts) {
      for (const part of candidate.content.parts) {
        if (part.text) {
          content.push({
            type: 'text',
            text: part.text,
          });
        }

        if (part.functionCall) {
          hasToolCalls = true;
          content.push({
            type: 'tool_call',
            toolCall: {
              id: 'call_' + Math.random().toString(36).substring(2, 10),
              name: part.functionCall.name,
              arguments: part.functionCall.args,
            },
          });
        }
      }
    }
  }

  // If we have tool calls, override stop reason
  if (hasToolCalls) {
    stopReason = 'tool_use';
  }

  return {
    id: generateId(),
    content,
    stopReason,
    usage: {
      inputTokens: response.usageMetadata?.promptTokenCount || 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
    },
  };
}

/**
 * Build prompt for Gemini from unified request (for free API)
 */
export function buildGeminiPrompt(request: UnifiedRequest): string {
  const parts: string[] = [];

  // Add system prompt
  if (request.systemPrompt) {
    parts.push(`[System Instructions]\n${request.systemPrompt}\n`);
  }

  // Add tools description
  if (request.tools && request.tools.length > 0) {
    parts.push('[Available Tools]');
    for (const tool of request.tools) {
      parts.push(`- ${tool.name}: ${tool.description}`);
      parts.push(`  Parameters: ${JSON.stringify(tool.parameters.properties, null, 2)}`);
    }
    parts.push('');
    parts.push('To use a tool, respond with JSON in this format:');
    parts.push('{"tool": "tool_name", "arguments": {...}}');
    parts.push('');
  }

  // Add conversation history
  parts.push('[Conversation]');
  for (const message of request.messages) {
    if (message.role === 'system') continue;

    const roleLabel = message.role === 'user' ? 'Human' : 'Assistant';

    if (typeof message.content === 'string') {
      parts.push(`${roleLabel}: ${message.content}`);
    } else {
      for (const block of message.content) {
        if (block.type === 'text' && block.text) {
          parts.push(`${roleLabel}: ${block.text}`);
        } else if (block.type === 'tool_call' && block.toolCall) {
          parts.push(`${roleLabel}: [Using tool: ${block.toolCall.name}]`);
          parts.push(`Arguments: ${JSON.stringify(block.toolCall.arguments)}`);
        } else if (block.type === 'tool_result' && block.toolResult) {
          parts.push(`[Tool Result]: ${block.toolResult.content}`);
        }
      }
    }
  }

  parts.push('Assistant:');

  return parts.join('\n');
}

/**
 * Parse tool call from Gemini text response
 */
export function parseToolCallFromText(text: string): UnifiedContentBlock | null {
  // Try to find JSON tool call in response
  const jsonMatch = text.match(/\{[\s\S]*?"tool"[\s\S]*?\}/);

  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.tool && parsed.arguments) {
        return {
          type: 'tool_call',
          toolCall: {
            id: 'call_' + Math.random().toString(36).substring(2, 10),
            name: parsed.tool,
            arguments: parsed.arguments,
          },
        };
      }
    } catch {
      // Not valid JSON, ignore
    }
  }

  return null;
}

/**
 * Send request to Gemini using the free service
 */
export async function sendToGemini(request: UnifiedRequest): Promise<UnifiedResponse> {
  // Build prompt for Gemini
  const prompt = buildGeminiPrompt(request);

  // Send to Gemini
  const response = await geminiService.ask(prompt);

  if (!response.success) {
    throw new Error(response.error || 'Gemini request failed');
  }

  // Parse response
  const content: UnifiedContentBlock[] = [];
  let stopReason: 'end_turn' | 'tool_use' | 'max_tokens' = 'end_turn';

  // Check for tool calls in response
  const toolCall = parseToolCallFromText(response.text);

  if (toolCall) {
    content.push(toolCall);
    stopReason = 'tool_use';

    // Also include any text before the tool call
    const textBefore = response.text.split('{')[0].trim();
    if (textBefore) {
      content.unshift({
        type: 'text',
        text: textBefore,
      });
    }
  } else {
    content.push({
      type: 'text',
      text: response.text,
    });
  }

  return {
    id: generateId(),
    content,
    stopReason,
    usage: {
      inputTokens: Math.ceil(prompt.length / 4), // Rough estimate
      outputTokens: Math.ceil(response.text.length / 4),
    },
  };
}
