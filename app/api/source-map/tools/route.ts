/**
 * API Route for tool management
 * Endpoint: GET /api/source-map/tools
 */

import { tools } from '@/src/index';

export async function GET() {
  try {
    const allTools = tools.getAll();
    return Response.json({
      status: 'ok',
      count: allTools.length,
      tools: allTools.map(t => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      })),
    });
  } catch (error) {
    return Response.json(
      { error: String(error), status: 'error' },
      { status: 500 }
    );
  }
}
