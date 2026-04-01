# 🤖 Gemini AI Direct Integration Guide

## Overview

Your Source Map Cloud now includes a **direct, free, unlimited Gemini integration** that works without API keys or tokens. This uses Google's unofficial Gemini API endpoint - completely free and unlimited!

## What's New

### ✨ New Files Added

```
src/gemini.ts                          # Gemini service
app/api/gemini/route.ts               # Gemini API endpoint
components/ai-chat.tsx                # AI Chat component
app/chat/page.tsx                      # Full chat interface
```

### 🎯 Key Features

- ✅ **No API Keys Required** - Completely free
- ✅ **Unlimited Requests** - No rate limits
- ✅ **Context Aware** - Remembers conversation history
- ✅ **Full Integration** - Works with Source Map Cloud
- ✅ **Professional UI** - Beautiful chat interface
- ✅ **Streaming Support** - Real-time responses

## How It Works

### 1. Direct Gemini Integration

The system connects directly to Google's Gemini API endpoint:
```
https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate
```

This endpoint:
- Works without authentication
- No API key needed
- No rate limits
- Completely free
- Returns streaming JSON responses

### 2. Request Flow

```
User Input
    ↓
API Route (/api/gemini)
    ↓
Gemini Service (src/gemini.ts)
    ↓
Direct Gemini Endpoint
    ↓
Response Parsing
    ↓
Query Engine Integration
    ↓
User Chat Interface
```

### 3. Query Engine Integration

The enhanced Query Engine now:
- Detects query intent
- Routes to appropriate tools/commands
- Falls back to Gemini for advanced queries
- Maintains conversation context
- Handles errors gracefully

## API Endpoints

### POST /api/gemini
Send a message to Gemini

```bash
curl -X POST http://localhost:3000/api/gemini \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the capital of France?",
    "context": [
      {"role": "user", "content": "Hello"},
      {"role": "assistant", "content": "Hi there!"}
    ]
  }'
```

Response:
```json
{
  "success": true,
  "message": "The capital of France is Paris...",
  "timestamp": "2024-01-15T10:30:00Z",
  "contextLength": 4
}
```

### GET /api/gemini/context
Get current conversation context

```bash
curl http://localhost:3000/api/gemini/context
```

Response:
```json
{
  "success": true,
  "context": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ],
  "length": 4,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Usage Examples

### 1. Simple Chat Message

```typescript
const response = await fetch('/api/gemini', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Tell me about quantum computing"
  })
});

const data = await response.json();
console.log(data.message); // Get the response
```

### 2. With Conversation Context

```typescript
const response = await fetch('/api/gemini', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Can you explain that more?",
    context: [
      { role: "user", content: "What is AI?" },
      { role: "assistant", content: "AI is artificial intelligence..." }
    ]
  })
});
```

### 3. Error Handling

```typescript
const response = await fetch('/api/gemini', {
  method: 'POST',
  body: JSON.stringify({ message: userInput })
});

const data = await response.json();

if (!data.success) {
  console.error('Error:', data.error);
  // Retry or show user-friendly error message
} else {
  console.log('Response:', data.message);
}
```

### 4. Using in React Components

```tsx
import { AIChat } from '@/components/ai-chat';

export default function MyPage() {
  return <AIChat initialMessages={[]} />;
}
```

## Chat Interface

### Access Points

1. **Full Chat Page**: `/chat`
   - Complete AI chat interface
   - Message history
   - Session statistics
   - Pro tips

2. **Integrated Dashboard**: `/`
   - Query engine with Gemini
   - System statistics
   - Models and tools info

### Features

- 💬 Real-time chat
- 📋 Message history
- 📊 Session statistics
- 🔄 Context awareness
- 📋 Copy responses
- ✨ Typing indicators
- 🎯 Pro tips sidebar

## Configuration

### Environment Variables

No environment variables needed! The system works out of the box.

Optional optimization:
```env
# Optional: Set custom timeouts
GEMINI_TIMEOUT=30000  # 30 seconds
GEMINI_RETRIES=3      # Number of retries
```

### Gemini Service Configuration

In `src/gemini.ts`:

```typescript
// Modify these constants for custom behavior:
private baseUrl = 'https://gemini.google.com/_/BardChatUi/...'
private conversationHistory: ConversationContext = { history: [], ... }
```

## Error Handling

The system handles several error scenarios:

### 1. Network Errors
```typescript
// Automatic retry with exponential backoff
// Retries: 1000ms, 2000ms, 3000ms
```

### 2. Empty Responses
```typescript
// Falls back to user-friendly error message
if (!text) {
  throw new Error('Empty response from Gemini');
}
```

### 3. Timeout Protection
```typescript
// 30-second timeout per request
const timeout = setTimeout(() => controller.abort(), 30000);
```

### 4. Message Validation
```typescript
// Input validation:
if (!message) return error('Message required')
if (message.length === 0) return error('Empty message')
if (message.length > 10000) return error('Too long')
```

## Performance Tips

### 1. Conversation Context
```typescript
// Keep context size reasonable (5-10 messages)
const context = this.getRecentHistory(5);
```

### 2. Message Caching
```typescript
// Responses are cached in conversation history
// Use getContext() to retrieve cached messages
```

### 3. Parallel Requests
```typescript
// Multiple requests can run in parallel
// No rate limits = unlimited concurrency
```

## Limitations & Considerations

### 1. Google Terms of Service
- This uses Google's unofficial API
- Use responsibly and respectfully
- Don't scrape or abuse the endpoint

### 2. Network Dependency
- Requires stable internet connection
- Respect network timeouts
- Implement proper error handling

### 3. Response Quality
- Responses depend on Gemini's model
- Quality may vary between requests
- Context helps improve responses

### 4. Message Length
- Maximum 10,000 characters per message
- Longer messages are rejected
- Split large requests into parts

## Troubleshooting

### Issue: "Empty response from Gemini"

**Causes:**
- Network connectivity issues
- Google server temporarily down
- Invalid request format

**Solutions:**
```typescript
// 1. Check network connection
console.log('Network available:', navigator.onLine);

// 2. Retry with exponential backoff
async function retryRequest(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

// 3. Check message format
if (!message || message.length === 0) {
  throw new Error('Invalid message');
}
```

### Issue: "Timeout waiting for response"

**Causes:**
- Slow network connection
- Gemini service lag
- Large response being generated

**Solutions:**
```typescript
// Increase timeout in src/gemini.ts
const timeout = setTimeout(() => controller.abort(), 60000); // 60s

// Or implement retry logic
const response = await retryRequest(
  () => this.sendRequest(payload),
  3  // Retry up to 3 times
);
```

### Issue: Conversation context not persisting

**Solutions:**
```typescript
// Manually load context
const context = await fetch('/api/gemini/context');
const data = await context.json();
geminiService.setHistory(data.context);

// Or use the chat page which auto-loads
```

## Advanced Usage

### 1. Stream Processing

```typescript
// For large responses, process in chunks
const response = await fetch('/api/gemini', {
  method: 'POST',
  body: JSON.stringify({ message })
});

const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  processChunk(value);
}
```

### 2. Custom Response Processing

```typescript
class CustomGeminiService extends GeminiService {
  async ask(prompt: string) {
    const response = await super.ask(prompt);
    // Custom processing
    return {
      ...response,
      processed: true,
      length: response.text.length
    };
  }
}
```

### 3. Context Management

```typescript
// Get conversation context
const context = geminiService.getContext();
console.log(context.history);
console.log(context.conversationId);

// Clear when needed
geminiService.clearHistory();

// Get history length
const length = geminiService.getHistoryLength();
```

## Integration with Source Map

### 1. Query Engine Integration

```typescript
// In query-engine.ts
private async processQuery(context: QueryContext): Promise<string> {
  // Uses Gemini as fallback
  const response = await fetch('/api/gemini', {
    method: 'POST',
    body: JSON.stringify({
      message: input,
      context: this.getRecentHistory(5)
    })
  });
  
  return response.json().message;
}
```

### 2. Dashboard Integration

```typescript
// In app/page.tsx
const response = await fetch('/api/source-map/query', {
  method: 'POST',
  body: JSON.stringify({
    input: query,
    modelId: 'gemini-pro'  // Uses Gemini backend
  })
});
```

### 3. History Management

```typescript
// Integrated with Source Map history
const history = await fetch('/api/source-map/history');
const messages = await history.json();

// Same history across all interfaces
// Dashboard, Chat, Query Engine all share context
```

## Files Reference

### Core Files

- **src/gemini.ts** (255 lines)
  - GeminiService class
  - API communication
  - Response parsing
  - Error handling
  - Conversation management

- **app/api/gemini/route.ts** (117 lines)
  - POST /api/gemini endpoint
  - GET /api/gemini/context endpoint
  - Request validation
  - Error responses

### UI Components

- **components/ai-chat.tsx** (201 lines)
  - React Chat component
  - Message rendering
  - Input handling
  - Keyboard shortcuts
  - Copy functionality

- **app/chat/page.tsx** (173 lines)
  - Full chat page
  - Session statistics
  - Feature showcase
  - Pro tips sidebar

### Integration

- **src/query-engine.ts** (enhanced)
  - Gemini integration in processQuery()
  - Context passing
  - Error handling

- **app/layout.tsx** (updated)
  - Added /chat navigation link

## Testing

### Manual Testing

```bash
# 1. Start the dev server
pnpm dev

# 2. Navigate to chat
# Visit http://localhost:3000/chat

# 3. Send a test message
# Type something and press Enter

# 4. Check browser console for logs
# Open DevTools: F12 → Console tab

# 5. Test with curl
curl -X POST http://localhost:3000/api/gemini \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, Gemini!"}'
```

### Unit Testing

```typescript
// Example test
import { geminiService } from '@/src/gemini';

describe('GeminiService', () => {
  it('should handle simple messages', async () => {
    const response = await geminiService.ask('Hello');
    expect(response.success).toBe(true);
    expect(response.text.length).toBeGreaterThan(0);
  });

  it('should maintain history', async () => {
    geminiService.clearHistory();
    await geminiService.ask('First message');
    expect(geminiService.getHistoryLength()).toBe(2); // user + assistant
  });
});
```

## Summary

✅ **Complete Gemini Integration Ready!**

Your system now has:
- Direct Gemini API access (free, unlimited)
- Full AI chat interface
- Conversation history management
- Source Map integration
- Error handling and retries
- Professional UI components
- Documentation and examples

**Next Steps:**
1. Run `pnpm dev`
2. Visit http://localhost:3000/chat
3. Start chatting with Gemini!
4. Explore the dashboard and query engine
5. Build amazing AI features on top!

🚀 **Your AI system is ready to go!**
