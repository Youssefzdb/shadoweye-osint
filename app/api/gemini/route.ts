/**
 * Gemini API Route with CCProxy
 * Uses CCProxy to translate requests and ensure Claude-compatible responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { ccProxyService, type CCProxyRequest } from '@/src/cc-proxy';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface GeminiAPIRequest {
  message?: string;
  messages?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  context?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

/**
 * POST /api/gemini
 * Send a message to Gemini via CCProxy and get Claude-formatted response
 */
export async function POST(request: NextRequest) {
  try {
    const body: GeminiAPIRequest = await request.json();

    // Support both single message and messages array format
    let messages: Array<{ role: 'user' | 'assistant'; content: string }>;

    if (body.message) {
      // Legacy single message format
      const message = body.message.trim();

      if (!message || message.length === 0) {
        return NextResponse.json(
          { error: 'Message cannot be empty' },
          { status: 400 }
        );
      }

      if (message.length > 10000) {
        return NextResponse.json(
          { error: 'Message is too long (max 10000 characters)' },
          { status: 400 }
        );
      }

      messages = [{ role: 'user', content: message }];
    } else if (body.messages && Array.isArray(body.messages) && body.messages.length > 0) {
      // Claude-format messages array
      messages = body.messages;
    } else {
      return NextResponse.json(
        { error: 'Either "message" or "messages" array is required' },
        { status: 400 }
      );
    }

    // Build CCProxy request
    const ccProxyRequest: CCProxyRequest = {
      messages,
      model: body.model,
      maxTokens: body.maxTokens,
      temperature: body.temperature,
      systemPrompt: body.systemPrompt,
    };

    // Validate request
    const validation = ccProxyService.validateRequest(ccProxyRequest);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid request' },
        { status: 400 }
      );
    }

    // Send through CCProxy (translates to Gemini and back to Claude format)
    const response = await ccProxyService.sendRequest(ccProxyRequest);

    if (!response.success) {
      return NextResponse.json(
        {
          error: response.error || 'Failed to get response from Gemini',
          success: false,
        },
        { status: 503 }
      );
    }

    // Return Claude-formatted response
    return NextResponse.json({
      success: true,
      data: response.data,
      source: response.source,
      timestamp: response.timestamp,
      contextLength: ccProxyService.getHistoryLength(),
    });
  } catch (error) {
    console.error('[Gemini API Error]', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Internal server error',
        success: false,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/gemini/context
 * Get current conversation context in Claude format
 */
export async function GET() {
  try {
    const history = ccProxyService.getHistory();

    return NextResponse.json({
      success: true,
      context: history,
      length: history.length,
      model: ccProxyService.getModel(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Gemini Context Error]', error);

    return NextResponse.json(
      {
        error: 'Failed to get context',
        success: false,
      },
      { status: 500 }
    );
  }
}
