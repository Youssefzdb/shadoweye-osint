# Source Map Cloud - Complete Integration Guide

## Overview

Source Map Cloud is a comprehensive AI query engine system that integrates Google Gemini models with a powerful tool and command orchestration framework. This is based on the claw-code architecture with full TypeScript implementation.

## Project Structure

```
src/
├── index.ts              # Main entry point
├── types.ts              # TypeScript type definitions
├── models.ts             # Model registry and management
├── tools.ts              # Tool registry and management
├── commands.ts           # Command registry and management
└── query-engine.ts       # Core query processing engine

app/
├── page.tsx              # Main dashboard page
├── api/
│   └── source-map/
│       ├── query/        # POST query endpoint
│       ├── history/      # Conversation history endpoint
│       ├── models/       # Available models endpoint
│       ├── tools/        # Registered tools endpoint
│       └── commands/     # Available commands endpoint

components/
├── source-map-dashboard.tsx  # System statistics dashboard
├── query-input.tsx           # Query input component
└── message-display.tsx       # Message display component
```

## Core Components

### 1. **Type System** (`types.ts`)
Defines all TypeScript interfaces:
- `Tool` - Individual tool definition with handler
- `Model` - AI model configuration
- `Command` - High-level command interface
- `QueryContext` - Context for query processing
- `Message` - Conversation message
- `QueryResult` - Result of query execution
- `SourceMap` - Complete system state

### 2. **Model Registry** (`models.ts`)
Manages available AI models:
- Gemini Pro (LLM)
- Gemini Vision (Vision model)
- Text Embedding Model
- Easy to add more models

**Usage:**
```typescript
const models = initializeModels();
const geminiModel = models.get('gemini-pro');
```

### 3. **Tool Registry** (`tools.ts`)
Handles tool registration and execution:
- `search_web` - Web search functionality
- `calculate` - Mathematical calculations
- `execute_code` - Safe code execution
- `query_database` - Database queries

**Usage:**
```typescript
const tools = initializeTools();
const result = await tools.execute('calculate', { expression: '2 + 2' });
```

### 4. **Command Registry** (`commands.ts`)
Manages high-level commands:
- `answer_question` - General question answering
- `analyze_code` - Code analysis
- `query_data` - Data querying
- `research_topic` - Topic research

**Usage:**
```typescript
const commands = initializeCommands(tools);
const result = await commands.execute('answer_question', input);
```

### 5. **Query Engine** (`query-engine.ts`)
Orchestrates models, tools, and commands:
- Processes queries with context
- Maintains conversation history
- Automatically detects command intent
- Returns structured results

**Usage:**
```typescript
const engine = new QueryEngine(models, tools, commands);
const result = await engine.query('What is the capital of France?');
```

## API Endpoints

### `POST /api/source-map/query`
Execute a query with the Source Map engine.

**Request:**
```json
{
  "input": "What is 2 + 2?",
  "modelId": "gemini-pro"
}
```

**Response:**
```json
{
  "output": "Processing: What is 2 + 2?",
  "confidence": 0.8,
  "toolsUsed": [],
  "metadata": {
    "modelId": "gemini-pro",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### `GET /api/source-map/query`
Check health status of Source Map.

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "modelsCount": 3,
  "toolsCount": 4,
  "commandsCount": 4
}
```

### `GET /api/source-map/history`
Retrieve conversation history.

**Response:**
```json
{
  "status": "ok",
  "count": 5,
  "messages": [
    {
      "role": "user",
      "content": "Hello",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### `DELETE /api/source-map/history`
Clear conversation history.

### `GET /api/source-map/models`
List all available models.

### `GET /api/source-map/tools`
List all registered tools.

### `GET /api/source-map/commands`
List all available commands.

## Integration with Gemini

When you provide your Gemini integration file, the following will be updated:

1. **Environment Variables:**
   - `GEMINI_API_KEY` - Your Gemini API key
   - `GEMINI_PROJECT_ID` - Google Cloud project ID (if using Vertex AI)

2. **API Route Enhancement:**
   - Update `/api/source-map/query` to use actual Gemini API
   - Implement tool calling with Gemini models
   - Add streaming responses for long queries

3. **Model Configuration:**
   - Replace placeholder model configs with actual Gemini settings
   - Add support for different Gemini model versions
   - Implement model-specific parameters

## Adding New Tools

```typescript
// In tools.ts
registry.register({
  name: 'my_custom_tool',
  description: 'Does something custom',
  parameters: {
    param1: { type: 'string', description: 'First parameter' },
  },
  handler: async (args: Record<string, unknown>) => {
    // Implementation
    return { result: 'custom result' };
  },
});
```

## Adding New Commands

```typescript
// In commands.ts
registry.register({
  id: 'my_command',
  name: 'My Command',
  description: 'Description of what it does',
  handler: async (input: string) => {
    // Use tools and models as needed
    return 'Command result';
  },
  tools: [/* relevant tools */],
});
```

## Conversation History

The Query Engine maintains conversation history automatically:
- Stores up to 50 messages
- Accessible via API endpoints
- Can be cleared when needed
- Includes timestamps and metadata

## Next Steps

1. **Upload Gemini Integration File** - Add your Gemini configuration
2. **Configure Environment Variables** - Set API keys in project settings
3. **Test API Endpoints** - Use the dashboard to test queries
4. **Customize Commands** - Add domain-specific commands
5. **Deploy** - Deploy to production with proper error handling

## Configuration

### Max History Length
Default: 50 messages. Modify in `QueryEngine.constructor()`:
```typescript
this.maxHistoryLength = 100; // or any value
```

### Model Defaults
Default query model: 'gemini-pro'. Customize by:
```typescript
const result = await engine.query(input, 'gemini-vision');
```

### Tool Timeout
Configure tool execution timeouts in respective API handlers.

## Error Handling

All queries return structured error responses:
```json
{
  "output": "Error processing query: ...",
  "confidence": 0,
  "metadata": {
    "error": "error message",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

## Performance Considerations

1. **Tool Execution** - Tools run sequentially; consider async improvements for parallel execution
2. **Conversation History** - Limited to 50 messages to prevent memory issues
3. **Model Requests** - Implement caching for repeated queries
4. **Database Queries** - Use connection pooling for database tools

## Security Notes

- Never expose API keys in client-side code
- Use environment variables for sensitive configuration
- Validate all user input before tool execution
- Implement rate limiting on API endpoints
- Sanitize user queries before processing

## Future Enhancements

- [ ] Streaming responses
- [ ] Custom tool schemas
- [ ] Model fine-tuning
- [ ] Advanced error recovery
- [ ] Query caching
- [ ] Batch processing
- [ ] WebSocket support for real-time updates
- [ ] Multi-user support
