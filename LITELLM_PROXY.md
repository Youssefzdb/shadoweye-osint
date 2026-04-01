# LiteLLM Proxy Integration

This document explains the LiteLLM Proxy layer that translates Claude API requests to Gemini backend.

## Overview

The LiteLLM Proxy provides a Claude-compatible API layer that uses Gemini as the backend, enabling full Claude tool capabilities without requiring Anthropic API access.

```
┌─────────────────────────────────────────────────────────────┐
│                    Claude-Compatible API                     │
│                  /api/v1/messages (POST)                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   LiteLLM Proxy Layer                        │
│  src/litellm-proxy/                                          │
│  ├── claude-adapter.ts    (Claude → Unified)                │
│  ├── gemini-adapter.ts    (Unified → Gemini)                │
│  ├── tool-mapper.ts       (Tool Translation)                │
│  └── response-transformer.ts (Response Formatting)          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Gemini Backend                            │
│                   (Free, No API Key)                         │
└─────────────────────────────────────────────────────────────┘
```

## Features

- **Claude API Compatibility**: Full support for Claude Messages API format
- **Tool Calling**: All Claude tools translated to Gemini function calling
- **Streaming**: Server-sent events (SSE) streaming support
- **No API Key Required**: Uses free Gemini access
- **Built-in Tools**: Web search, code execution, file operations

## API Endpoints

### Claude-Compatible Messages API

```
POST /api/v1/messages
```

Accepts Claude API format requests:

```json
{
  "model": "claude-3-opus-20240229",
  "max_tokens": 4096,
  "system": "You are a helpful assistant.",
  "messages": [
    {"role": "user", "content": "Search for AI news"}
  ],
  "tools": [{
    "name": "web_search",
    "description": "Search the web",
    "input_schema": {
      "type": "object",
      "properties": {
        "query": {"type": "string"}
      },
      "required": ["query"]
    }
  }],
  "stream": false
}
```

Returns Claude-format response:

```json
{
  "id": "msg_abc123",
  "type": "message",
  "role": "assistant",
  "content": [
    {"type": "text", "text": "Here are the latest AI news..."}
  ],
  "model": "claude-3-opus-20240229",
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 150,
    "output_tokens": 300
  }
}
```

### Legacy Claude Agent API

```
POST /api/claude
```

Simple chat interface with optional LiteLLM mode:

```json
{
  "message": "What is the capital of France?",
  "useLiteLLM": true,
  "includeThinking": true,
  "includeMetrics": true
}
```

## Built-in Tools

### Search Tools
- `web_search` - Search the web using DuckDuckGo
- `search_news` - Search for recent news articles
- `search_images` - Search for images

### Code Tools
- `execute_code` - Execute JavaScript/Python code safely
- `calculator` - Evaluate mathematical expressions
- `parse_json` - Parse and transform JSON data

### File Tools
- `read_file` - Read file contents
- `write_file` - Write content to files
- `delete_file` - Delete files
- `list_directory` - List directory contents
- `create_directory` - Create directories
- `copy_file` - Copy files
- `move_file` - Move/rename files
- `search_files` - Search files by pattern

## Usage Examples

### JavaScript/TypeScript

```typescript
import { LiteLLMProxy } from '@/src/litellm-proxy';

const proxy = new LiteLLMProxy({
  enableDefaultTools: true,
  config: {
    debug: false,
    enableToolExecution: true,
  },
});

// Simple chat
const response = await proxy.chat('Search for AI news', {
  system: 'You are a helpful assistant.',
  tools: true,
});

console.log(response);

// Full Claude API request
const claudeResponse = await proxy.processRequest({
  model: 'claude-3-opus-20240229',
  max_tokens: 4096,
  messages: [
    { role: 'user', content: 'Calculate 25 * 17' }
  ],
  tools: [{
    name: 'calculator',
    description: 'Evaluate math expressions',
    input_schema: {
      type: 'object',
      properties: {
        expression: { type: 'string' }
      },
      required: ['expression']
    }
  }],
});
```

### cURL

```bash
# Claude-compatible endpoint
curl -X POST http://localhost:3000/api/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3-opus-20240229",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "Hello, who are you?"}
    ]
  }'

# With streaming
curl -X POST http://localhost:3000/api/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3-opus-20240229",
    "max_tokens": 1024,
    "stream": true,
    "messages": [
      {"role": "user", "content": "Tell me a story"}
    ]
  }'

# Legacy endpoint with LiteLLM
curl -X POST http://localhost:3000/api/claude \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Search for the latest news",
    "useLiteLLM": true
  }'
```

## Adding Custom Tools

```typescript
import { LiteLLMProxy } from '@/src/litellm-proxy';
import { createTool } from '@/src/litellm-proxy/tool-mapper';

const proxy = new LiteLLMProxy();

// Create a custom tool
const myTool = createTool(
  'my_custom_tool',
  'Description of what the tool does',
  {
    type: 'object',
    properties: {
      param1: { type: 'string', description: 'First parameter' },
      param2: { type: 'number', description: 'Second parameter' },
    },
    required: ['param1'],
  },
  async (args) => {
    // Tool implementation
    const { param1, param2 } = args as { param1: string; param2?: number };
    return { result: `Processed ${param1} with ${param2 || 0}` };
  }
);

// Register the tool
proxy.registerTool(myTool);
```

## Architecture

### File Structure

```
src/litellm-proxy/
├── index.ts              # Main proxy class and exports
├── types.ts              # TypeScript type definitions
├── claude-adapter.ts     # Claude ↔ Unified format conversion
├── gemini-adapter.ts     # Unified ↔ Gemini format conversion
├── tool-mapper.ts        # Tool definition translation
├── response-transformer.ts # Response formatting and streaming
└── tools/
    ├── index.ts          # Tool registry
    ├── web-search.ts     # Web search implementation
    ├── code-execution.ts # Code execution sandbox
    └── file-operations.ts # File system operations
```

### Request Flow

1. **Receive Claude Request** → `/api/v1/messages`
2. **Parse & Validate** → `claude-adapter.ts`
3. **Convert to Unified** → Internal format
4. **Add Tools** → From registry
5. **Convert to Gemini** → `gemini-adapter.ts`
6. **Send to Gemini** → Free API
7. **Parse Tool Calls** → If any
8. **Execute Tools** → Built-in handlers
9. **Continue Loop** → If more tool calls
10. **Transform Response** → `response-transformer.ts`
11. **Return Claude Format** → To client

## Configuration

```typescript
interface LiteLLMProxyConfig {
  defaultModel: string;      // Default: 'gemini-pro'
  maxRetries: number;        // Default: 3
  timeout: number;           // Default: 30000 (30s)
  enableStreaming: boolean;  // Default: true
  enableToolExecution: boolean; // Default: true
  debug: boolean;            // Default: false
}
```

## Differences from Real Claude API

| Feature | LiteLLM Proxy | Real Claude API |
|---------|---------------|-----------------|
| Backend | Gemini (Free) | Anthropic Claude |
| Vision | Not supported | Supported |
| API Key | Not required | Required |
| Tool Calling | Simulated | Native |
| Streaming | SSE format | SSE format |
| Response Quality | Good | Excellent |

## Limitations

- **No Vision Support**: Image inputs not yet supported
- **Tool Call Detection**: Based on text parsing, not native
- **Response Quality**: Depends on Gemini's capabilities
- **Rate Limits**: Subject to Gemini's free tier limits

## Troubleshooting

### Connection Issues
```
Error: Failed to connect to Gemini
```
- Check internet connection
- Verify Gemini service availability
- Try increasing timeout

### Tool Execution Errors
```
Error: Tool not found: tool_name
```
- Verify tool is registered
- Check tool name spelling
- Ensure tool handler is defined

### Empty Responses
```
Response: { content: [] }
```
- Check if prompt is being sent correctly
- Verify Gemini response parsing
- Enable debug mode for details

## Security Notes

- Code execution is sandboxed with limited globals
- File operations are in-memory (localStorage fallback)
- No actual system access from tools
- Input validation on all tool parameters

## Performance Tips

1. **Batch Requests**: Combine multiple queries when possible
2. **Cache Results**: Cache frequent tool outputs
3. **Limit Tools**: Only include needed tools in requests
4. **Use Streaming**: For long responses, enable streaming
5. **Set Timeouts**: Adjust based on expected response time

## Contributing

To add new tools or improve the proxy:

1. Create tool in `src/litellm-proxy/tools/`
2. Register in `tools/index.ts`
3. Add tests for tool functionality
4. Update this documentation

---

**The LiteLLM Proxy enables Claude-like AI capabilities using Gemini for free!**
