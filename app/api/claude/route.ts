/**
 * Claude Agent API Route
 * True Claude-like behavior endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { getQueryEngine } from '@/src/index';

export const runtime = 'nodejs';

interface ClaudeRequest {
  message: string;
  includeThinking?: boolean;
  includeMetrics?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: ClaudeRequest = await request.json();
    const { message, includeThinking = true, includeMetrics = true } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get Claude Agent from query engine
    const engine = getQueryEngine();
    const claudeAgent = engine.getClaudeAgent?.();

    if (!claudeAgent) {
      return NextResponse.json(
        { error: 'Claude Agent not available' },
        { status: 503 }
      );
    }

    // Execute with Claude-like behavior
    const response = await claudeAgent.execute(message);

    // Format response
    const result: any = {
      success: response.success,
      message: response.message,
    };

    if (includeThinking && response.thinking) {
      result.thinking = response.thinking;
    }

    if (includeMetrics && response.metadata) {
      result.metrics = {
        executionTime: response.executionTime,
        toolsUsed: response.toolsUsed,
        model: response.metadata.model,
        iterationCount: response.metadata.iterationCount,
        selfCorrected: response.metadata.selfCorrected,
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Claude API] Error:', error);
    return NextResponse.json(
      { error: `Internal error: ${String(error)}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const engine = getQueryEngine();
    const claudeAgent = engine.getClaudeAgent?.();

    if (!claudeAgent) {
      return NextResponse.json({
        status: 'claude-agent-unavailable',
        message: 'Claude Agent not initialized',
      });
    }

    return NextResponse.json({
      status: 'active',
      name: 'Claude Agent',
      description: 'Claude-like AI agent with ReAct pattern and intelligent tool usage',
      capabilities: [
        'Intelligent reasoning with structured thinking',
        'Multi-tool orchestration',
        'Self-correction and iteration',
        'Conversation history management',
        'Real-time execution metrics',
      ],
      endpoint: '/api/claude',
      method: 'POST',
      example: {
        request: {
          message: 'What is the capital of France?',
          includeThinking: true,
          includeMetrics: true,
        },
        response: {
          success: true,
          message: 'The capital of France is Paris...',
          thinking: {
            initialAnalysis: '...',
            steps: [],
          },
          metrics: {
            executionTime: 1234,
            toolsUsed: [],
            iterationCount: 1,
          },
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
