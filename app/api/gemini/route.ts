/**
 * Gemini API Route
 * Direct connection to Gemini (no tokens, no cookies, no rate limiting)
 * Based on proven working method from config.yaml
 */

import { NextRequest, NextResponse } from 'next/server';
import { geminiNativeService } from '@/src/gemini-native';

export const runtime = 'nodejs';
export const maxDuration = 60; // Allow longer for direct connections

interface GeminiAPIRequest {
  message?: string;
  messages?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

/**
 * POST /api/gemini
 * Send a message to Gemini (direct connection, no rate limiting)
 */
export async function POST(request: NextRequest) {
  try {
    const body: GeminiAPIRequest = await request.json();

    // Get the message to send
    let message: string | undefined;

    if (body.message) {
      message = body.message.trim();
    } else if (body.messages && Array.isArray(body.messages) && body.messages.length > 0) {
      // Get the last user message
      const lastMessage = body.messages.find((m) => m.role === 'user');
      message = lastMessage?.content;
    }

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

    // Send directly to Gemini (no intermediate layer, no rate limiting)
    const response = await geminiNativeService.ask(message);

    if (!response.success) {
      return NextResponse.json(
        {
          error: response.error || 'Failed to get response from Gemini',
          success: false,
        },
        { status: 503 }
      );
    }

    // Return response
    return NextResponse.json({
      success: true,
      message: response.text,
      timestamp: new Date().toISOString(),
      source: 'gemini-native',
      contextLength: geminiNativeService.getHistoryLength(),
    });
  } catch (error) {
    console.error('[Gemini API Error]', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
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
    const history = geminiNativeService.getHistory();

    return NextResponse.json({
      success: true,
      context: history,
      length: history.length,
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
