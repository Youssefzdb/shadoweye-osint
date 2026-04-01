/**
 * API Route for command management
 * Endpoint: GET /api/source-map/commands
 */

import { commands } from '@/src/index';

export async function GET() {
  try {
    const allCommands = commands.getAll();
    return Response.json({
      status: 'ok',
      count: allCommands.length,
      commands: allCommands.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        toolsCount: c.tools?.length || 0,
      })),
    });
  } catch (error) {
    return Response.json(
      { error: String(error), status: 'error' },
      { status: 500 }
    );
  }
}
