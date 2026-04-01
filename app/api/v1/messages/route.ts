/**
 * Claude-Compatible Messages API Endpoint
 * /api/v1/messages
 *
 * This endpoint accepts requests in Claude API format and processes them
 * using Gemini as the backend through the LiteLLM proxy layer.
 */

import { NextRequest, NextResponse } from 'next/server';
import { LiteLLMProxy } from '@/src/litellm-proxy';

// Create proxy instance with default tools enabled
const proxy = new LiteLLMProxy({
  enableDefaultTools: true,
  config: {
    debug: process.env.NODE_ENV === 'development',
    enableToolExecution: true,
    enableStreaming: true,
  },
});

/**
 * Handle POST requests (main messages endpoint)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if streaming is requested
    const isStreaming = body.stream === true;

    if (isStreaming) {
      // Handle streaming response
      const stream = await proxy.handleRequestStreaming(body);

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    }

    // Handle non-streaming response
    const response = await proxy.handleRequest(body);

    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': response.id,
      },
    });
  } catch (error) {
    console.error('[API /v1/messages] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const statusCode = errorMessage.includes('required') ? 400 : 500;

    return NextResponse.json(
      {
        type: 'error',
        error: {
          type: statusCode === 400 ? 'invalid_request_error' : 'api_error',
          message: errorMessage,
        },
      },
      { status: statusCode }
    );
  }
}

/**
 * Handle OPTIONS requests (CORS preflight)
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, Anthropic-Version',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Handle GET requests (API info)
 */
export async function GET() {
  return NextResponse.json({
    name: 'Claude-Compatible Messages API',
    version: '1.0.0',
    description: 'Claude API endpoint powered by Gemini through LiteLLM proxy',
    endpoints: {
      messages: {
        method: 'POST',
        path: '/api/v1/messages',
        description: 'Create a message (Claude Messages API compatible)',
      },
    },
    supported_models: [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-3-5-sonnet-20241022',
    ],
    features: {
      streaming: true,
      tool_use: true,
      vision: false, // Not yet supported
    },
    tools: proxy.getTools().map((t) => ({
      name: t.name,
      description: t.description,
    })),
    backend: 'gemini-pro',
  });
}
