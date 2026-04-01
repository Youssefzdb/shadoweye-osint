'use client';
// Force rebuild - cache cleared
import { useState, useEffect } from 'react';
import { SourceMapDashboard } from '@/components/source-map-dashboard';
import { QueryInput } from '@/components/query-input';
import { MessageDisplay } from '@/components/message-display';
import type { Message } from '@/src/types';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/source-map/history');
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const handleQuery = async (query: string) => {
    try {
      setLoading(true);

      // Add user message
      const userMessage: Message = {
        role: 'user',
        content: query,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Get response from API
      const response = await fetch('/api/source-map/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: query, modelId: 'gemini-pro' }),
      });

      const result = await response.json();

      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: result.output || 'No response received',
        timestamp: new Date(),
        metadata: {
          confidence: result.confidence,
          toolsUsed: result.toolsUsed,
        },
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Query failed:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${String(error)}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Source Map Cloud
          </h1>
          <p className="text-gray-600">
            Integrated AI Query Engine with Gemini Models
          </p>
        </div>

        {/* Dashboard Stats */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">System Status</h2>
          <SourceMapDashboard />
        </div>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Chat Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Query Engine
              </h2>
              <div className="space-y-6">
                <QueryInput
                  onSubmit={handleQuery}
                  disabled={loading}
                />
                <MessageDisplay
                  messages={messages}
                  loading={loading}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Quick Info
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div>
                  <p className="font-semibold text-gray-900">Available Commands:</p>
                  <ul className="mt-2 space-y-1 text-xs">
                    <li>• answer_question</li>
                    <li>• analyze_code</li>
                    <li>• query_data</li>
                    <li>• research_topic</li>
                  </ul>
                </div>
                <div className="pt-3 border-t">
                  <p className="font-semibold text-gray-900">Available Tools:</p>
                  <ul className="mt-2 space-y-1 text-xs">
                    <li>• search_web</li>
                    <li>• calculate</li>
                    <li>• execute_code</li>
                    <li>• query_database</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                System Info
              </h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="font-semibold text-gray-900">Version</dt>
                  <dd className="text-gray-600">1.0.0</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-900">Status</dt>
                  <dd className="text-green-600">Active</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-900">Model</dt>
                  <dd className="text-gray-600">Gemini Pro</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
