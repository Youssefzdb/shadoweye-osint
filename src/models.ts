/**
 * Models management for Source Map
 * Handles initialization and configuration of different AI models
 */

import type { Model, SourceMap } from './types';

class ModelRegistry {
  private models: Map<string, Model> = new Map();

  /**
   * Register a new model
   */
  register(model: Model): void {
    this.models.set(model.id, model);
  }

  /**
   * Get a model by ID
   */
  get(id: string): Model | undefined {
    return this.models.get(id);
  }

  /**
   * Get all models
   */
  getAll(): Model[] {
    return Array.from(this.models.values());
  }

  /**
   * Get models by type
   */
  getByType(type: 'llm' | 'vision' | 'embeddings'): Model[] {
    return Array.from(this.models.values()).filter(m => m.type === type);
  }

  /**
   * Remove a model
   */
  remove(id: string): boolean {
    return this.models.delete(id);
  }

  /**
   * Get registry as map
   */
  toMap(): Map<string, Model> {
    return new Map(this.models);
  }
}

// Initialize default models
export function initializeModels(): ModelRegistry {
  const registry = new ModelRegistry();

  // Gemini model (will be configured with API key later)
  registry.register({
    id: 'gemini-pro',
    name: 'Google Gemini Pro',
    version: '1.0',
    type: 'llm',
    config: {
      provider: 'google',
      maxTokens: 8192,
      temperature: 0.7,
    },
  });

  // Vision model
  registry.register({
    id: 'gemini-vision',
    name: 'Google Gemini Vision',
    version: '1.0',
    type: 'vision',
    config: {
      provider: 'google',
      maxTokens: 4096,
    },
  });

  // Embeddings model
  registry.register({
    id: 'text-embedding',
    name: 'Text Embedding Model',
    version: '1.0',
    type: 'embeddings',
    config: {
      provider: 'google',
      dimensions: 768,
    },
  });

  return registry;
}

export { ModelRegistry };
