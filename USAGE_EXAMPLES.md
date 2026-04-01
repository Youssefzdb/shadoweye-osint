# Source Map Cloud - Usage Examples

## 1. Basic Query via API

### Using cURL
```bash
curl -X POST http://localhost:3000/api/source-map/query \
  -H "Content-Type: application/json" \
  -d '{"input": "What is the capital of France?", "modelId": "gemini-pro"}'
```

### Using JavaScript/Fetch
```javascript
const response = await fetch('/api/source-map/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    input: 'What is the capital of France?',
    modelId: 'gemini-pro'
  })
});

const result = await response.json();
console.log(result.output);
```

### Using React Hook
```typescript
const [result, setResult] = useState(null);

async function handleQuery(query: string) {
  const response = await fetch('/api/source-map/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: query })
  });
  const data = await response.json();
  setResult(data);
}
```

## 2. Check System Status

### Get Health Status
```bash
curl http://localhost:3000/api/source-map/query
```

Response:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "modelsCount": 3,
  "toolsCount": 4,
  "commandsCount": 4
}
```

## 3. Retrieve Conversation History

### Get All Messages
```bash
curl http://localhost:3000/api/source-map/history
```

### Clear History
```bash
curl -X DELETE http://localhost:3000/api/source-map/history
```

## 4. List Available Resources

### Get Models
```bash
curl http://localhost:3000/api/source-map/models
```

Response:
```json
{
  "status": "ok",
  "count": 3,
  "models": [
    {
      "id": "gemini-pro",
      "name": "Google Gemini Pro",
      "version": "1.0",
      "type": "llm"
    }
  ]
}
```

### Get Tools
```bash
curl http://localhost:3000/api/source-map/tools
```

Response:
```json
{
  "status": "ok",
  "count": 4,
  "tools": [
    {
      "name": "search_web",
      "description": "Search the web for information",
      "parameters": {
        "query": { "type": "string" },
        "maxResults": { "type": "number" }
      }
    }
  ]
}
```

### Get Commands
```bash
curl http://localhost:3000/api/source-map/commands
```

## 5. Using in Server Components

### Example Server Component
```typescript
// app/components/source-map-display.tsx
import { engine } from '@/src/index';

export async function SourceMapDisplay() {
  const sourceMap = engine.getSourceMap();
  
  return (
    <div>
      <h1>Source Map Version: {sourceMap.version}</h1>
      <p>Models: {sourceMap.models.size}</p>
      <p>Tools: {sourceMap.tools.size}</p>
    </div>
  );
}
```

## 6. Advanced: Custom Query with Tool Selection

Once Gemini integration is added, you can specify tools:

```javascript
const response = await fetch('/api/source-map/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    input: 'Search for latest AI news and summarize',
    modelId: 'gemini-pro',
    tools: ['search_web'],
    systemPrompt: 'You are a helpful AI assistant'
  })
});
```

## 7. Streaming Responses (Future)

```javascript
const response = await fetch('/api/source-map/query/stream', {
  method: 'POST',
  body: JSON.stringify({ input: 'Explain quantum computing' })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  console.log(chunk);
}
```

## 8. Error Handling Examples

### Missing Query
```javascript
const response = await fetch('/api/source-map/query', {
  method: 'POST',
  body: JSON.stringify({ input: '' })
});

// Returns 400
// { "error": "Invalid input: query string required" }
```

### Invalid Model
```javascript
const result = await engine.query(input, 'invalid-model');

// Returns
// {
//   "output": "Error processing query: Model not found: invalid-model",
//   "confidence": 0,
//   "metadata": { "error": "..." }
// }
```

## 9. Integration with Next.js Form Actions

```typescript
// app/actions/query.ts
'use server'

import { engine } from '@/src/index';

export async function submitQuery(input: string) {
  try {
    const result = await engine.query(input, 'gemini-pro');
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
```

```typescript
// app/components/query-form.tsx
'use client'

import { submitQuery } from '@/app/actions/query';
import { useFormStatus } from 'react-dom';

export function QueryForm() {
  const { pending } = useFormStatus();

  return (
    <form action={async (formData) => {
      await submitQuery(formData.get('query') as string);
    }}>
      <input name="query" required />
      <button disabled={pending}>
        {pending ? 'Loading...' : 'Submit'}
      </button>
    </form>
  );
}
```

## 10. Real-time Updates with WebSocket (Future)

```javascript
const ws = new WebSocket('ws://localhost:3000/api/source-map/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'query',
    input: 'Real-time response test'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Streamed response:', data);
};
```

## 11. Batch Queries

```javascript
const queries = [
  'What is 2+2?',
  'What is the capital of France?',
  'Explain quantum computing'
];

const results = await Promise.all(
  queries.map(query =>
    fetch('/api/source-map/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: query })
    }).then(r => r.json())
  )
);
```

## 12. Custom Tool Extension (After Setup)

```typescript
// src/tools.ts - Add new tool
registry.register({
  name: 'sentiment_analysis',
  description: 'Analyze sentiment of text',
  parameters: {
    text: { type: 'string', description: 'Text to analyze' }
  },
  handler: async (args) => {
    // Custom implementation
    return {
      sentiment: 'positive',
      score: 0.85
    };
  }
});
```

Then use it:
```javascript
const result = await fetch('/api/source-map/query', {
  method: 'POST',
  body: JSON.stringify({
    input: 'Analyze the sentiment: "I love this product!"',
    tools: ['sentiment_analysis']
  })
});
```

## Performance Tips

1. **Cache Repeated Queries:** Store results of common queries
2. **Batch Processing:** Combine multiple queries when possible
3. **Model Selection:** Use vision model only when needed (slower)
4. **Tool Selection:** Only enable tools needed for specific queries
5. **History Management:** Clear old history periodically

## Debugging

```javascript
// Enable verbose logging
const engine = new QueryEngine(models, tools, commands);
const result = await engine.query('Test query');

// Check conversation history
const history = engine.getConversationHistory();
console.log('Full history:', history);

// Check system state
const sourceMap = engine.getSourceMap();
console.log('Models:', sourceMap.models);
console.log('Tools:', sourceMap.tools);
```

## Troubleshooting

### Q: Why is my query returning generic response?
**A:** Gemini integration not yet configured. Upload your Gemini config file.

### Q: How do I add more tools?
**A:** Register new tools in `src/tools.ts` using the `registry.register()` method.

### Q: Can I modify the conversation history limit?
**A:** Yes, edit `maxHistoryLength` in `src/query-engine.ts`.

### Q: How do I add custom commands?
**A:** Register in `src/commands.ts` with a handler function that uses available tools.
