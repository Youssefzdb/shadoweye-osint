/**
 * Gemini API Route
 * Direct integration with Gemini - No tokens, completely free
 */

import { NextRequest, NextResponse } from 'next/server';
import { ccproxyService } from '@/src/ccproxy';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface GeminiRequest {
  message: string;
  context?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

/**
 * POST /api/gemini
 * Send a message to Gemini and get a response
 */
export async function POST(request: NextRequest) {
  try {
    const body: GeminiRequest = await request.json();

    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const message = body.message.trim();

    if (message.length === 0) {
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

    // If context is provided, set it
    if (body.context && Array.isArray(body.context)) {
      ccproxyService.setHistory(body.context);
    }

    // Send to Gemini
    const response = await ccproxyService.ask(message);

    if (!response.success) {
      return NextResponse.json(
        {
          error: response.error || 'Failed to get response from Gemini',
          success: false,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      message: response.text,
      timestamp: response.timestamp,
      contextLength: ccproxyService.getHistoryLength(),
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
 * Get current conversation context
 */
export async function GET() {
  try {
    const context = ccproxyService.getContext();

    return NextResponse.json({
      success: true,
      context: context.history,
      length: context.history.length,
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
