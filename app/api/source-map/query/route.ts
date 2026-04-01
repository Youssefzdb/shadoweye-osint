/**
 * API Route for Source Map queries
 * Endpoint: POST /api/source-map/query
 */

import { engine } from '@/src/index';
import type { QueryResult } from '@/src/types';

export async function POST(request: Request) {
  try {
    const { input, modelId = 'gemini-pro' } = await request.json();

    if (!input || typeof input !== 'string') {
      return Response.json(
        { error: 'Invalid input: query string required' },
        { status: 400 }
      );
    }

    const result: QueryResult = await engine.query(input, modelId);

    return Response.json(result, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Source Map API Error]', error);
    return Response.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint to check health
export async function GET() {
  try {
    const sourceMap = engine.getSourceMap();
    return Response.json({
      status: 'ok',
      version: sourceMap.version,
      modelsCount: sourceMap.models.size,
      toolsCount: sourceMap.tools.size,
      commandsCount: sourceMap.commands.size,
    });
  } catch (error) {
    return Response.json(
      { error: String(error), status: 'error' },
      { status: 500 }
    );
  }
}
