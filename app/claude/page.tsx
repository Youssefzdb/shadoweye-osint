/**
 * Claude Agent Showcase Page
 * Demonstrates true Claude-like behavior with reasoning
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface ThinkingStep {
  type: 'thought' | 'action' | 'observation' | 'final_answer';
  content: string;
  timestamp: string;
  toolUsed?: string;
}

interface ClaudeResponse {
  success: boolean;
  message: string;
  thinking?: {
    initialAnalysis: string;
    steps: ThinkingStep[];
    finalReasoning: string;
    conclusion: string;
  };
  metrics?: {
    executionTime: number;
    toolsUsed: string[];
    iterationCount: number;
    selfCorrected: boolean;
  };
}

export default function ClaudePage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: ClaudeResponse | string }>>([]);
  const [loading, setLoading] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          includeThinking: true,
          includeMetrics: true,
        }),
      });

      const data: ClaudeResponse = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: {
            success: false,
            message: `Error: ${String(error)}`,
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Claude Agent</h1>
          <p className="text-lg text-slate-400">True Claude-like behavior with ReAct reasoning</p>
          <div className="mt-4 flex gap-3">
            <Link href="/" className="text-sm text-blue-400 hover:text-blue-300">
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-2">ReAct Pattern</h3>
            <p className="text-sm text-slate-300">Reasoning + Acting for intelligent problem solving</p>
          </div>
          <div className="bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-2">Self-Correction</h3>
            <p className="text-sm text-slate-300">Automatic iteration and error recovery</p>
          </div>
          <div className="bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-2">Full Transparency</h3>
            <p className="text-sm text-slate-300">See complete reasoning process and metrics</p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden flex flex-col h-[600px]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Welcome to Claude Agent</h2>
                  <p className="text-slate-400 mb-6">Ask me anything. Watch me think, act, and solve problems intelligently.</p>
                  <div className="space-y-2 text-left max-w-md mx-auto">
                    <p className="text-sm text-slate-500">Example questions:</p>
                    <ul className="text-sm text-slate-400 space-y-1">
                      <li>• "What is the capital of France and its population?"</li>
                      <li>• "Analyze this code for performance issues"</li>
                      <li>• "Search for latest AI trends and summarize"</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-2xl rounded-lg p-4 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-100'
                    }`}
                  >
                    {typeof msg.content === 'string' ? (
                      <p>{msg.content}</p>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-white font-semibold">
                          {msg.content.success ? '✓ Claude Agent' : '✗ Error'}
                        </p>
                        <p className="whitespace-pre-wrap">{msg.content.message}</p>

                        {/* Thinking Section */}
                        {msg.content.thinking && (
                          <div className="mt-4 pt-4 border-t border-slate-600">
                            <button
                              onClick={() => setShowThinking(!showThinking)}
                              className="text-sm text-slate-300 hover:text-slate-100 font-semibold"
                            >
                              {showThinking ? '▼ Hide Thinking' : '▶ Show Thinking Process'}
                            </button>

                            {showThinking && (
                              <div className="mt-3 space-y-3 text-sm">
                                <div className="bg-slate-800 p-2 rounded text-slate-200">
                                  <p className="font-semibold text-slate-100 mb-1">Analysis:</p>
                                  <p className="text-xs">{msg.content.thinking.initialAnalysis.substring(0, 200)}...</p>
                                </div>

                                <div className="bg-slate-800 p-2 rounded">
                                  <p className="font-semibold text-slate-100 mb-2">Steps:</p>
                                  <div className="space-y-1">
                                    {msg.content.thinking.steps.map((step, sidx) => (
                                      <div key={sidx} className="text-xs text-slate-300">
                                        <span className="font-semibold text-slate-100 capitalize">{step.type}:</span> {step.content.substring(0, 100)}...
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Metrics */}
                        {msg.content.metrics && (
                          <div className="mt-3 text-xs text-slate-400 space-y-1">
                            <p>⏱️ {msg.content.metrics.executionTime}ms</p>
                            {msg.content.metrics.toolsUsed.length > 0 && (
                              <p>🔧 Tools: {msg.content.metrics.toolsUsed.join(', ')}</p>
                            )}
                            {msg.content.metrics.selfCorrected && (
                              <p>🔄 Self-corrected after {msg.content.metrics.iterationCount} iteration(s)</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="border-t border-slate-700 p-4 bg-slate-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Claude anything..."
                disabled={loading}
                className="flex-1 bg-slate-700 text-white rounded px-4 py-2 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Thinking...' : 'Send'}
              </button>
            </div>
          </form>
        </div>

        {/* Features */}
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <div className="bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">Features</h3>
            <ul className="text-sm text-slate-300 space-y-2">
              <li>{'✓ Structured thinking with <thinking> stages'}</li>
              <li>{'✓ Multi-tool orchestration'}</li>
              <li>{'✓ Automatic self-correction'}</li>
              <li>{'✓ Full conversation history'}</li>
            </ul>
          </div>
          <div className="bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">How It Works</h3>
            <ul className="text-sm text-slate-300 space-y-2">
              <li>1. Analyze your request</li>
              <li>2. Plan approach with tools</li>
              <li>3. Execute intelligently</li>
              <li>4. Iterate if needed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
