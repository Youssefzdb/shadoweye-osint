/**
 * API Route for model management
 * Endpoint: GET /api/source-map/models
 */

import { models } from '@/src/index';

export async function GET() {
  try {
    const allModels = models.getAll();
    return Response.json({
      status: 'ok',
      count: allModels.length,
      models: allModels.map(m => ({
        id: m.id,
        name: m.name,
        version: m.version,
        type: m.type,
      })),
    });
  } catch (error) {
    return Response.json(
      { error: String(error), status: 'error' },
      { status: 500 }
    );
  }
}
