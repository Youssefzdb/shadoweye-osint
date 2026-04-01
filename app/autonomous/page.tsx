import React from 'react';

export default function AutonomousAgentPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-purple-500/20 rounded-full mb-4 border border-purple-500/50">
            <span className="text-purple-300 text-sm font-medium">
              True Agentic Behavior
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Autonomous Agent
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            No confirmation needed. Just tell it what to do and it does it instantly.
            Like Claude Code but powered by Gemini.
          </p>
        </div>

        {/* Key Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-6 hover:border-purple-500/50 transition">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-xl font-bold text-white mb-2">Instant Execution</h3>
            <p className="text-gray-300">
              No waiting for confirmation. Agent executes immediately upon request.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-6 hover:border-purple-500/50 transition">
            <div className="text-3xl mb-3">🧠</div>
            <h3 className="text-xl font-bold text-white mb-2">Smart Planning</h3>
            <p className="text-gray-300">
              Creates and executes detailed plans. Breaks complex tasks into steps.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-6 hover:border-purple-500/50 transition">
            <div className="text-3xl mb-3">🔄</div>
            <h3 className="text-xl font-bold text-white mb-2">Self-Correction</h3>
            <p className="text-gray-300">
              Detects errors and fixes them automatically. No manual intervention.
            </p>
          </div>
        </div>

        {/* Comparison */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-purple-400 mb-3">1</div>
              <h3 className="text-white font-bold mb-2">You Request</h3>
              <p className="text-gray-300 text-sm">
                Tell the agent what you need. Just a simple request.
              </p>
            </div>

            <div>
              <div className="text-5xl font-bold text-purple-400 mb-3">2</div>
              <h3 className="text-white font-bold mb-2">Agent Plans</h3>
              <p className="text-gray-300 text-sm">
                Creates execution plan with multiple steps and strategies.
              </p>
            </div>

            <div>
              <div className="text-5xl font-bold text-purple-400 mb-3">3</div>
              <h3 className="text-white font-bold mb-2">Instant Execute</h3>
              <p className="text-gray-300 text-sm">
                Executes plan immediately. No confirmation. Uses all tools.
              </p>
            </div>
          </div>
        </div>

        {/* Capabilities */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Capabilities</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-purple-400 text-xl mt-1">✓</span>
                <div>
                  <h4 className="text-white font-bold">Multiple Tools</h4>
                  <p className="text-gray-400 text-sm">
                    Execute search, calculate, code, and database tools automatically
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-purple-400 text-xl mt-1">✓</span>
                <div>
                  <h4 className="text-white font-bold">Complex Commands</h4>
                  <p className="text-gray-400 text-sm">
                    Execute answer_question, analyze_code, query_data, research_topic
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-purple-400 text-xl mt-1">✓</span>
                <div>
                  <h4 className="text-white font-bold">Model Switching</h4>
                  <p className="text-gray-400 text-sm">
                    Use gemini-pro, vision, or embeddings as needed
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-purple-400 text-xl mt-1">✓</span>
                <div>
                  <h4 className="text-white font-bold">Error Recovery</h4>
                  <p className="text-gray-400 text-sm">
                    Automatically detects and recovers from failures
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-purple-400 text-xl mt-1">✓</span>
                <div>
                  <h4 className="text-white font-bold">Conversation Memory</h4>
                  <p className="text-gray-400 text-sm">
                    Remembers full conversation history for context
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-purple-400 text-xl mt-1">✓</span>
                <div>
                  <h4 className="text-white font-bold">Performance Metrics</h4>
                  <p className="text-gray-400 text-sm">
                    Track success rate, execution time, and efficiency
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* API Examples */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">API Usage</h2>

          <div className="space-y-4">
            <div className="bg-slate-900/50 rounded p-4">
              <p className="text-gray-400 text-sm mb-2">POST /api/autonomous</p>
              <pre className="text-green-400 text-xs overflow-auto">
                {`{
  "message": "Search for AI trends and summarize them",
  "includeMetrics": true
}

Response:
{
  "success": true,
  "message": "Execution completed with full results...",
  "metrics": {
    "autonomy": "full-autonomous",
    "model": "gemini-pro + autonomous-agent"
  }
}`}
              </pre>
            </div>

            <div className="bg-slate-900/50 rounded p-4">
              <p className="text-gray-400 text-sm mb-2">GET /api/autonomous</p>
              <pre className="text-green-400 text-xs overflow-auto">
                {`Response:
{
  "status": "active",
  "autonomyLevel": "full-autonomous",
  "mode": "true-agentic-behavior",
  "features": [
    "instant-execution",
    "no-confirmation-needed",
    "self-correction",
    "auto-recovery"
  ]
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
