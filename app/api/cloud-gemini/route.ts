/**
 * CloudGemini API Route
 * Endpoint: POST/GET /api/cloud-gemini
 * Direct access to Gemini with full Cloud power (tools, commands, models)
 */

import { engine } from '@/src/index';

export async function POST(request: Request) {
  try {
    const { message, includeStatus = false } = await request.json();

    if (!message || typeof message !== 'string') {
      return Response.json(
        { error: 'Invalid message: string required' },
        { status: 400 }
      );
    }

    // Query with CloudGemini
    const result = await engine.query(message);

    const response: any = {
      success: true,
      message: result.output,
      timestamp: result.metadata.timestamp,
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
