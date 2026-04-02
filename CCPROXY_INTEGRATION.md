# CCProxy Integration Guide

## Overview

CCProxy is a unified proxy service that translates Gemini API requests into Claude-compatible format and ensures all responses follow Claude's API specifications. This integration replaces the direct litellm proxy approach with a more robust, proprietary solution.

## What is CCProxy?

**CCProxy** (Claude-Compatible Proxy) is a service layer that:

1. **Translates Requests**: Converts Claude-format requests to Gemini-compatible prompts
2. **Normalizes Responses**: Formats Gemini responses as Claude API responses
3. **Maintains Compatibility**: Ensures client code treats Gemini responses exactly like Claude responses
4. **Preserves Context**: Manages conversation history in Claude message format
5. **Validates Input**: Enforces Claude API request validation

## Architecture

```
Client Request (Claude Format)
        ↓
    CCProxy Service
        ↓
   Request Translation
        ↓
   Gemini Service
        ↓
   Response Translation
        ↓
  Claude-Format Response
        ↓
  Client Response
```

## Files Modified

### New Files
- `/src/cc-proxy.ts` - Main CCProxy service implementation

### Updated Files
- `/app/api/gemini/route.ts` - Now uses CCProxy for request translation
- `/app/api/cloud-gemini/route.ts` - Integrated CCProxy for Cloud-Gemini operations
- `/src/cloud-gemini.ts` - Updated to use CCProxy for response translation
- `/src/index.ts` - Exported CCProxy types and service

## API Usage

### POST /api/gemini

The Gemini API endpoint now accepts both legacy and Claude-format requests.

#### Legacy Format (Single Message)
```javascript
const response = await fetch('/api/gemini', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'What is machine learning?'
  })
});

const result = await response.json();
console.log(result.data); // Claude-format response
```

#### Claude Format (Messages Array)
```javascript
const response = await fetch('/api/gemini', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'What is machine learning?' }
    ],
    model: 'gemini-pro',
    maxTokens: 2000,
    temperature: 0.7
  })
});

const result = await response.json();
console.log(result.data); // Claude-format response
```

### Response Format

All responses are returned in Claude-compatible format:

```javascript
{
  success: true,
  data: {
    id: "msg_1234567890",
    type: "message",
    role: "assistant",
    content: [
      {
        type: "text",
        text: "Machine learning is..."
      }
    ],
    model: "gemini-pro",
    stop_reason: "end_turn",
    usage: {
      input_tokens: 42,
      output_tokens: 156
    },
    timestamp: "2024-04-02T10:30:00Z",
    originalSource: "gemini"
  },
  source: "gemini",
  timestamp: "2024-04-02T10:30:00Z",
  contextLength: 2
}
```

## CCProxy Features

### 1. Request Translation

The CCProxy translates Claude-format requests to Gemini:

- Converts message array to single prompt
- Includes conversation context
- Preserves system instructions
- Handles temperature and token limits

### 2. Response Translation

Converts Gemini responses to Claude format:

- Wraps text in Claude content structure
- Generates unique message IDs
- Estimates token usage
- Preserves response metadata

### 3. Context Management

Maintains conversation history:

```javascript
// Get conversation history
const history = await ccProxyService.getHistory();

// Clear conversation
await ccProxyService.clearHistory();

// Get history length
const length = ccProxyService.getHistoryLength();
```

### 4. Request Validation

Validates Claude-format requests:

```javascript
const validation = ccProxyService.validateRequest(request);
if (!validation.valid) {
  console.error(validation.error);
}
```

Validation checks:
- Messages array exists and is not empty
- Each message has valid role ('user' or 'assistant')
- Content is string type
- Temperature is between 0 and 1
- maxTokens is positive

## Cloud-Gemini Integration

The Cloud-Gemini system now uses CCProxy for all Gemini interactions:

```javascript
const response = await fetch('/api/cloud-gemini', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Analyze this data' }
    ],
    includeStatus: true
  })
});

const result = await response.json();
console.log(result.claudeFormat); // Claude-format response
console.log(result.message);      // Cloud-Gemini response with tools/commands
```

## Request Parameters

### Common Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `message` | string | No* | Single message (legacy format) |
| `messages` | array | No* | Claude-format messages array |
| `model` | string | No | Model identifier (default: 'gemini-pro') |
| `maxTokens` | number | No | Maximum response tokens |
| `temperature` | number | No | Response temperature (0-1) |
| `systemPrompt` | string | No | System instructions for the model |

*Either `message` or `messages` is required

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Request success status |
| `data` | ClaudeResponse | Claude-format response (if successful) |
| `error` | string | Error message (if unsuccessful) |
| `source` | string | Source model ('gemini') |
| `timestamp` | string | Response timestamp |
| `contextLength` | number | Current conversation history length |

## Error Handling

```javascript
const response = await fetch('/api/gemini', {
  method: 'POST',
  body: JSON.stringify({ messages: [...] })
});

if (!response.ok) {
  console.error('HTTP Error:', response.status);
  return;
}

const result = await response.json();

if (!result.success) {
  console.error('API Error:', result.error);
  // Handle error
  return;
}

// Use result.data
```

## Token Estimation

CCProxy estimates token counts for responses since Gemini doesn't provide official token counts:

```javascript
// Estimation is approximate: ~4 characters per token
const tokens = estimateTokens(text);
```

**Note**: Token counts are estimates. For precise token counting, integrate a proper tokenizer.

## Differences from litellm

### Previous Approach (litellm)
- Direct proxy to Gemini
- Inconsistent response formats
- Required response format conversion in client code
- No request validation
- Limited context management

### Current Approach (CCProxy)
- ✅ Unified request/response format (Claude-compatible)
- ✅ Automatic request validation
- ✅ Built-in context management
- ✅ Consistent error handling
- ✅ Type-safe TypeScript interfaces
- ✅ Token usage estimation
- ✅ Conversation history tracking

## Type Definitions

```typescript
interface CCProxyRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

interface ClaudeResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  timestamp: string;
  originalSource: 'gemini';
}

interface CCProxyResponse {
  success: boolean;
  data?: ClaudeResponse;
  error?: string;
  timestamp: string;
  source: 'gemini';
}
```

## Migration Guide

### From Direct Gemini Calls

**Before (Direct Gemini)**:
```javascript
const response = await geminiService.ask(prompt);
const text = response.text;
```

**After (CCProxy)**:
```javascript
const response = await ccProxyService.sendRequest({
  messages: [{ role: 'user', content: prompt }]
});
const text = response.data.content[0].text;
```

### From API Endpoint

**Before (Legacy)**:
```javascript
const res = await fetch('/api/gemini', {
  method: 'POST',
  body: JSON.stringify({ message: 'Hello' })
});
const result = await res.json();
console.log(result.message);
```

**After (CCProxy)**:
```javascript
const res = await fetch('/api/gemini', {
  method: 'POST',
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hello' }]
  })
});
const result = await res.json();
console.log(result.data.content[0].text);
```

## Troubleshooting

### Issue: "Messages array is required"
- Ensure request has either `message` or `messages` parameter
- `messages` should be a non-empty array

### Issue: "Invalid message role"
- Role must be exactly 'user' or 'assistant'
- Check for typos in role strings

### Issue: "Temperature must be between 0 and 1"
- Temperature value out of range
- Use values between 0 (deterministic) and 1 (creative)

### Issue: Empty response
- Check network connection to Gemini
- Verify message content is not empty
- Check response.data.content array exists

## Performance Considerations

1. **Token Estimation**: Token counts are estimates for UI display only
2. **Context Window**: Default 20-message context window (configurable)
3. **Request Validation**: Performed on every request (minimal overhead)
4. **Response Translation**: Automatic, adds minimal latency

## Future Enhancements

Potential improvements to CCProxy:

- [ ] Integrate actual tokenizer (tiktoken or similar)
- [ ] Support for streaming responses
- [ ] Request rate limiting
- [ ] Response caching
- [ ] Multiple model support
- [ ] Custom system prompts per request
- [ ] Message filtering and sanitization
- [ ] Analytics and logging

## Support

For issues with CCProxy:

1. Check the TypeScript types in `/src/cc-proxy.ts`
2. Review error messages in API responses
3. Verify request format matches Claude API spec
4. Check conversation history with GET /api/gemini/context

## References

- Claude API: https://docs.anthropic.com/claude/reference/
- Gemini API: https://ai.google.dev/docs
- CCProxy Source: `/src/cc-proxy.ts`
- API Routes: `/app/api/gemini/route.ts`, `/app/api/cloud-gemini/route.ts`
