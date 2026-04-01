/**
 * API Route for conversation history
 * Endpoint: GET /api/source-map/history
 */

import { engine } from '@/src/index';

export async function GET() {
  try {
    const history = engine.getConversationHistory();
    return Response.json({
      status: 'ok',
      count: history.length,
      messages: history,
    });
  } catch (error) {
    return Response.json(
      { error: String(error), status: 'error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to clear history
export async function DELETE() {
  try {
    engine.clearHistory();
    return Response.json({
      status: 'ok',
      message: 'Conversation history cleared',
    });
  } catch (error) {
    return Response.json(
      { error: String(error), status: 'error' },
      { status: 500 }
    );
  }
}
