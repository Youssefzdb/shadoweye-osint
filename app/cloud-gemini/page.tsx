import { Metadata } from 'next';
import { CloudGeminiShowcase } from '@/components/cloud-gemini-showcase';
import { engine } from '@/src/index';

export const metadata: Metadata = {
  title: 'CloudGemini - Unified AI System',
  description: 'Gemini AI with full Cloud power - tools, commands, and models',
};

export default function CloudGeminiPage() {
  // Get system info
  const status = engine.getCloudGeminiStatus();
  const models = engine.getModels();
  const tools = engine.getTools();
  const commands = engine.getCommands();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                CloudGemini
              </h1>
              <p className="text-xl text-gray-600">
                Unified AI System: Gemini + Cloud Power
              </p>
            </div>
            <div className="bg-green-500 px-4 py-2 rounded-lg text-white font-semibold">
              {status.geminiStatus === 'active' ? 'Active' : 'Offline'}
            </div>
          </div>
          <p className="text-gray-700 text-lg max-w-2xl">
            Experience Gemini AI with full access to Cloud's architecture: all models, tools, and commands.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="text-3xl font-bold text-blue-600">{status.models.count}</div>
            <div className="text-gray-600 text-sm mt-2">Available Models</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="text-3xl font-bold text-purple-600">{status.tools.count}</div>
            <div className="text-gray-600 text-sm mt-2">Available Tools</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="text-3xl font-bold text-green-600">{status.commands.count}</div>
            <div className="text-gray-600 text-sm mt-2">Available Commands</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="text-3xl font-bold text-amber-600">{status.conversationLength}</div>
            <div className="text-gray-600 text-sm mt-2">Conversation Messages</div>
          </div>
        </div>

        {/* Chat Component */}
        <div className="mb-12">
          <CloudGeminiShowcase />
        </div>

        {/* Resources Info */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Models */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-blue-600 mb-4">Models ({models.length})</h2>
            <div className="space-y-2">
              {models.map((model) => (
                <div key={model.id} className="p-3 bg-blue-50 rounded text-sm">
                  <div className="font-semibold text-gray-900">{model.name}</div>
                  <div className="text-gray-600 text-xs">{model.type}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tools */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-purple-600 mb-4">Tools ({tools.length})</h2>
            <div className="space-y-2">
              {tools.map((tool) => (
                <div key={tool.name} className="p-3 bg-purple-50 rounded text-sm">
                  <div className="font-semibold text-gray-900">{tool.name}</div>
                  <div className="text-gray-600 text-xs">{tool.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Commands */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-green-600 mb-4">Commands ({commands.length})</h2>
            <div className="space-y-2">
              {commands.map((cmd) => (
                <div key={cmd.id} className="p-3 bg-green-50 rounded text-sm">
                  <div className="font-semibold text-gray-900">{cmd.name}</div>
                  <div className="text-gray-600 text-xs">{cmd.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 bg-white rounded-lg p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">How CloudGemini Works</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">1. Unified Interface</h4>
              <p className="text-gray-600 text-sm">Chat with Gemini while having full access to Cloud&apos;s tools and models.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">2. Intelligent Integration</h4>
              <p className="text-gray-600 text-sm">Gemini automatically uses available tools and commands to provide better answers.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">3. Full Power</h4>
              <p className="text-gray-600 text-sm">Get the power of Gemini combined with Cloud&apos;s complete infrastructure.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
