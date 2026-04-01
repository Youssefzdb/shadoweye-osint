'use client';

import { useState, useEffect } from 'react';
import { AIChat } from '@/components/ai-chat';
import type { Message } from '@/src/types';

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load conversation history on mount
    const loadHistory = async () => {
      try {
        const response = await fetch('/api/source-map/history');
        const data = await response.json();
        setMessages(data.messages || []);
      } catch (error) {
        console.error('Failed to load history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  const handleClearChat = async () => {
    if (
      window.confirm(
        'Are you sure you want to clear the conversation history?'
      )
    ) {
      setMessages([]);
      try {
        await fetch('/api/source-map/history', {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Failed to clear history:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-3">
              <div className="text-4xl">⏳</div>
              <p className="text-gray-600">Loading conversation...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Gemini AI Chat
              </h1>
              <p className="text-gray-600">
                Direct connection • No API keys • Unlimited requests
              </p>
            </div>
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                Clear Chat
              </button>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Chat Window */}
          <div className="lg:col-span-3">
            <AIChat initialMessages={messages} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                📊 Session Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Messages</span>
                  <span className="font-bold text-gray-900">
                    {messages.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">User Messages</span>
                  <span className="font-bold text-blue-600">
                    {messages.filter((m) => m.role === 'user').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">AI Responses</span>
                  <span className="font-bold text-green-600">
                    {messages.filter((m) => m.role === 'assistant').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                ✨ Features
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>No API keys required</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Unlimited requests</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Context-aware responses</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Message history</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Copy responses</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Full conversation context</span>
                </li>
              </ul>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                💡 Pro Tips
              </h3>
              <ul className="text-sm space-y-2 text-gray-700">
                <li>• Use clear, specific questions</li>
                <li>• The AI remembers your context</li>
                <li>• Ask follow-up questions</li>
                <li>• Request code examples</li>
                <li>• Ask for explanations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
