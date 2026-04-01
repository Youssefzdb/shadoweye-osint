import { NextRequest, NextResponse } from 'next/server';
import { getSourceMapEngine } from '@/src/index';

export const maxDuration = 60;

let autonomousAgentInstance: ReturnType<typeof getSourceMapEngine>['queryEngine'] | null =
  null;

async function getAgent() {
  if (!autonomousAgentInstance) {
    const engine = getSourceMapEngine();
    autonomousAgentInstance = engine.queryEngine;
  }
  return autonomousAgentInstance;
}

/**
 * POST /api/autonomous
 * Execute query with full autonomous agent behavior
 * No confirmation needed - just does it!
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, includeMetrics = false } = body as {
      message: string;
      includeMetrics?: boolean;
    };

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const agent = await getAgent();

    // Execute autonomously - no waiting, no confirmation
    console.log('[API] Autonomous execution started:', message);
    const result = await agent.query(message, 'gemini-pro');

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Execution failed',
        },
        { status: 500 }
      );
    }

    const response: Record<string, unknown> = {
      success: true,
      message: result.output,
      timestamp: new Date().toISOString(),
    };

    if (includeMetrics) {
      response.metrics = {
        processingTime: 'calculated',
        model: 'gemini-pro + autonomous-agent',
        autonomy: 'full-autonomous',
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] Autonomous error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Autonomous execution error: ${String(error)}`,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/autonomous
 * Get agent status and metrics
 */
export async function GET() {
  try {
    const agent = await getAgent();

    return NextResponse.json({
      status: 'active',
      autonomyLevel: 'full-autonomous',
      mode: 'true-agentic-behavior',
      features: [
        'instant-execution',
        'no-confirmation-needed',
        'self-correction',
        'auto-recovery',
        'plan-and-execute',
        'error-handling',
      ],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error), status: 'error' },
      { status: 500 }
    );
  }
}
