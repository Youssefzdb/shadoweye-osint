/**
 * CloudGemini API Route
 * Endpoint: POST/GET /api/cloud-gemini
 * Direct access to Gemini with full Cloud power (tools, commands, models)
 * Uses native Gemini connection (no tokens, no rate limiting)
 */

import { engine } from '@/src/index';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, messages, includeStatus = false } = body;

    // Get the message to send
    let messageText: string | undefined;

    if (message && typeof message === 'string') {
      messageText = message.trim();
    } else if (messages && Array.isArray(messages) && messages.length > 0) {
      const lastMessage = messages.find((m: any) => m.role === 'user');
      messageText = lastMessage?.content;
    }

    if (!messageText || messageText.length === 0) {
      return Response.json(
        { error: 'Either "message" or "messages" array is required' },
        { status: 400 }
      );
    }

    // Query with CloudGemini (uses native Gemini connection)
    const result = await engine.query(messageText);

    const response: any = {
      success: true,
      message: result.output,
      timestamp: result.metadata.timestamp,
      source: 'gemini-native',
    };

    // Include system status if requested
    if (includeStatus) {
      const status = engine.getCloudGeminiStatus();
      response.status = {
        models: status.models,
        tools: status.tools,
        commands: status.commands,
        conversationLength: status.conversationLength,
      };
    }

    return Response.json(response, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[CloudGemini API Error]', error);
    return Response.json(
      { 
        success: false,
        error: String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET endpoint for system info
export async function GET() {
  try {
    const status = engine.getCloudGeminiStatus();

    return Response.json(
      {
        status: 'active',
        timestamp: new Date().toISOString(),
        systems: status,
        features: {
          tools: status.tools.count > 0,
          commands: status.commands.count > 0,
          models: status.models.count > 0,
          gemini: true,
        },
        connectionInfo: {
          type: 'direct-native',
          service: 'gemini-native',
          rateLimit: 'none',
          requiresAuth: false,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { 
        status: 'error',
        error: String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
