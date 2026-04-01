'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Model {
  id: string;
  name: string;
  version: string;
  type: string;
}

interface Tool {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
}

interface Command {
  id: string;
  name: string;
  description: string;
  toolsCount: number;
}

export default function DetailsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [commands, setCommands] = useState<Command[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/source-map/models').then(r => r.json()),
      fetch('/api/source-map/tools').then(r => r.json()),
      fetch('/api/source-map/commands').then(r => r.json()),
    ]).then(([modelsData, toolsData, commandsData]) => {
      setModels(modelsData.models || []);
      setTools(toolsData.tools || []);
      setCommands(commandsData.commands || []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Loading details...</div>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            System Details
          </h1>
          <p className="text-gray-600">
            Complete overview of all models, tools, and commands
          </p>
        </div>

        {/* Models Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Available Models ({models.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {models.map((model) => (
              <Card key={model.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-lg">{model.name}</CardTitle>
                    <Badge variant="secondary">{model.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="font-semibold text-gray-700">ID</dt>
                      <dd className="text-gray-600 break-all">{model.id}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-gray-700">Version</dt>
                      <dd className="text-gray-600">{model.version}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Tools Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Registered Tools ({tools.length})
          </h2>
          <div className="grid gap-4">
            {tools.map((tool) => (
              <Card key={tool.name}>
                <CardHeader>
                  <CardTitle className="text-lg">{tool.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{tool.description}</p>
                  {tool.parameters && Object.keys(tool.parameters).length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Parameters:</h4>
                      <div className="bg-gray-50 rounded p-3 text-sm">
                        <pre className="overflow-x-auto">
                          {JSON.stringify(tool.parameters, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Commands Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Available Commands ({commands.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {commands.map((command) => (
              <Card key={command.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{command.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{command.description}</p>
                  <div className="text-sm">
                    <span className="font-semibold text-gray-700">ID: </span>
                    <span className="text-gray-600 break-all">{command.id}</span>
                  </div>
                  <div className="mt-2 text-sm">
                    <Badge variant="outline">
                      {command.toolsCount} tool{command.toolsCount !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
