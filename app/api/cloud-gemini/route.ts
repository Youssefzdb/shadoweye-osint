/**
 * CloudGemini API Route with CCProxy
 * Endpoint: POST/GET /api/cloud-gemini
 * Direct access to Gemini with full Cloud power (tools, commands, models)
 * Uses CCProxy to ensure Claude-compatible request/response format
 */

import { engine } from '@/src/index';
import { ccProxyService, type CCProxyRequest } from '@/src/cc-proxy';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, messages, includeStatus = false, model, maxTokens, temperature, systemPrompt } = body;

    // Support both single message and messages array format
    let messageArray: Array<{ role: 'user' | 'assistant'; content: string }>;

    if (message && typeof message === 'string') {
      messageArray = [{ role: 'user', content: message }];
    } else if (messages && Array.isArray(messages) && messages.length > 0) {
      messageArray = messages;
    } else {
      return Response.json(
        { error: 'Either "message" or "messages" array is required' },
        { status: 400 }
      );
    }

    // Build CCProxy request for translation
    const ccProxyRequest: CCProxyRequest = {
      messages: messageArray,
      model: model || 'gemini-pro',
      maxTokens,
      temperature,
      systemPrompt,
    };

    // Validate request through CCProxy
    const validation = ccProxyService.validateRequest(ccProxyRequest);
    if (!validation.valid) {
      return Response.json(
        { error: validation.error || 'Invalid request' },
        { status: 400 }
      );
    }

    // Query with CloudGemini using CCProxy-translated format
    const result = await engine.query(messageArray[messageArray.length - 1].content);

    // Transform response through CCProxy for Claude-compatible format
    const ccProxyResponse = await ccProxyService.sendRequest(ccProxyRequest);

    const response: any = {
      success: true,
      message: result.output,
      claudeFormat: ccProxyResponse.data,
      timestamp: result.metadata.timestamp,
      source: 'gemini',
      proxyTranslation: {
        originalFormat: 'claude',
        translatedVia: 'ccproxy',
        responseFormat: 'claude-compatible',
      },
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
          ccProxy: true,
        },
        proxyInfo: {
          service: 'ccproxy',
          functionality: 'claude-compatible-proxy',
          sourceModel: 'gemini',
          responseFormat: 'claude-api-compatible',
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
