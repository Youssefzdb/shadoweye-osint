# CCProxy Migration Guide: From litellm to CCProxy

This guide shows how to migrate from the old litellm proxy approach to the new CCProxy system.

## Architecture Comparison

### Before: litellm Proxy
```
Client → Direct Gemini API → Inconsistent Response Format
```

**Problems**:
- ❌ No request format standardization
- ❌ Response format varies
- ❌ No validation layer
- ❌ Manual context management
- ❌ Client-side format conversion needed

### After: CCProxy
```
Client → CCProxy → Gemini API → CCProxy → Claude-Format Response
```

**Improvements**:
- ✅ Standardized Claude request format
- ✅ Always Claude-compatible responses
- ✅ Built-in validation
- ✅ Automatic context management
- ✅ Type-safe TypeScript

---

## Code Migration Examples

### 1. Simple Message Query

#### Before (litellm)
```javascript
import { geminiService } from '@/src/gemini';

// Send direct request
const response = await geminiService.ask('What is AI?');

if (response.success) {
  const text = response.text; // Direct text from Gemini
  console.log(text);
} else {
  console.error(response.error);
}
```

#### After (CCProxy)
```javascript
import { ccProxyService } from '@/src/cc-proxy';

// Send through CCProxy
const response = await ccProxyService.sendRequest({
  messages: [
    { role: 'user', content: 'What is AI?' }
  ]
});

if (response.success) {
  const text = response.data.content[0].text; // Claude format
  console.log(text);
} else {
  console.error(response.error);
}
```

### 2. API Endpoint

#### Before (litellm)
```typescript
// app/api/gemini/route.ts
import { geminiService } from '@/src/gemini';

export async function POST(request: Request) {
  const { message } = await request.json();
  
  if (!message) {
    return Response.json({ error: 'No message' }, { status: 400 });
  }

  // Send directly to Gemini
  const response = await geminiService.ask(message);

  // Return raw Gemini response
  return Response.json({
    success: true,
    message: response.text,
    timestamp: response.timestamp
  });
}
```

#### After (CCProxy)
```typescript
// app/api/gemini/route.ts
import { ccProxyService, type CCProxyRequest } from '@/src/cc-proxy';

export async function POST(request: Request) {
  const body = await request.json();
  
  let messages;
  if (body.message) {
    messages = [{ role: 'user', content: body.message }];
  } else if (body.messages) {
    messages = body.messages;
  } else {
    return Response.json({ error: 'No message' }, { status: 400 });
  }

  // Validate through CCProxy
  const validation = ccProxyService.validateRequest({ messages });
  if (!validation.valid) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  // Send through CCProxy
  const ccProxyRequest: CCProxyRequest = {
    messages,
    model: body.model,
    temperature: body.temperature,
    maxTokens: body.maxTokens
  };

  const response = await ccProxyService.sendRequest(ccProxyRequest);

  // Return Claude-format response
  return Response.json({
    success: true,
    data: response.data,
    timestamp: response.timestamp
  });
}
```

### 3. Conversation Context

#### Before (litellm)
```javascript
// Manual context management
const conversationHistory = [];

async function chat(userMessage) {
  conversationHistory.push({
    role: 'user',
    content: userMessage
  });

  // Build context string manually
  let context = '';
  for (const msg of conversationHistory) {
    context += `${msg.role}: ${msg.content}\n`;
  }

  // Send to Gemini
  const response = await geminiService.ask(context);
  
  conversationHistory.push({
    role: 'assistant',
    content: response.text
  });

  return response.text;
}
```

#### After (CCProxy)
```javascript
// Automatic context management
async function chat(userMessage) {
  // Add message
  const request: CCProxyRequest = {
    messages: [
      ...ccProxyService.getHistory(),
      { role: 'user', content: userMessage }
    ]
  };

  // Send through CCProxy - history tracked automatically
  const response = await ccProxyService.sendRequest(request);

  // No manual history management needed
  // CCProxy maintains history internally
  
  return response.data.content[0].text;
}
```

### 4. Error Handling

#### Before (litellm)
```javascript
try {
  const response = await geminiService.ask(prompt);
  
  if (!response.success) {
    // Check success flag manually
    throw new Error(response.error);
  }
  
  // Handle response
  console.log(response.text);
} catch (error) {
  // Generic error handling
  console.error('Request failed:', error.message);
}
```

#### After (CCProxy)
```javascript
// CCProxy provides built-in validation
const validation = ccProxyService.validateRequest(request);
if (!validation.valid) {
  console.error('Invalid request:', validation.error);
  return;
}

try {
  const response = await ccProxyService.sendRequest(request);
  
  if (!response.success) {
    // Descriptive errors from CCProxy
    console.error('API Error:', response.error);
    return;
  }
  
  // Type-safe access
  const text = response.data.content[0].text;
  console.log(text);
} catch (error) {
  console.error('Request failed:', error.message);
}
```

### 5. React Component

#### Before (litellm)
```typescript
'use client';

import { useState } from 'react';
import { geminiService } from '@/src/gemini';

export function ChatComponent() {
  const [messages, setMessages] = useState<any[]>([]);

  const sendMessage = async (text: string) => {
    // No context, just send raw text
    const response = await geminiService.ask(text);
    
    if (response.success) {
      // Manual response formatting
      setMessages(prev => [...prev, {
        text: response.text,
        role: 'assistant'
      }]);
    }
  };

  return <div>{/* UI */}</div>;
}
```

#### After (CCProxy)
```typescript
'use client';

import { useState } from 'react';
import { ccProxyService } from '@/src/cc-proxy';

export function ChatComponent() {
  const [messages, setMessages] = useState<any[]>([]);

  const sendMessage = async (text: string) => {
    // Use Claude format
    const response = await ccProxyService.sendRequest({
      messages: [...messages, { role: 'user', content: text }]
    });
    
    if (response.success) {
      // Standardized response access
      const assistantMessage = response.data.content[0].text;
      setMessages(prev => [...prev, 
        { role: 'user', content: text },
        { role: 'assistant', content: assistantMessage }
      ]);
    }
  };

  return <div>{/* UI */}</div>;
}
```

### 6. Cloud-Gemini Integration

#### Before (litellm)
```typescript
// Direct Gemini service
async query(prompt: string) {
  const response = await geminiService.ask(enhancedPrompt);
  
  if (!response.success) {
    throw new Error(response.error);
  }

  let text = response.text;
  
  // Post-process response
  // ...
  
  return text;
}
```

#### After (CCProxy)
```typescript
// Through CCProxy
async query(prompt: string) {
  const response = await ccProxyService.sendRequest({
    messages: [{ role: 'user', content: enhancedPrompt }],
    model: 'gemini-pro'
  });
  
  if (!response.success) {
    throw new Error(response.error);
  }

  // Get from Claude-format response
  let text = response.data.content[0].text;
  
  // Post-process response
  // ...
  
  return text;
}
```

---

## Migration Checklist

- [ ] Update imports from `geminiService` to `ccProxyService`
- [ ] Change requests to use `sendRequest()` with `messages` array
- [ ] Update response handling to access `data.content[0].text`
- [ ] Add request validation before sending
- [ ] Update API endpoints to return Claude-format responses
- [ ] Test conversation history management
- [ ] Update error handling
- [ ] Remove manual context management code
- [ ] Update TypeScript types
- [ ] Test with new response format

---

## Breaking Changes

### Removed Features
- Direct access to `geminiService.ask()` (use CCProxy instead)
- Raw Gemini response format (always Claude format now)

### New Requirements
- Must use `messages` array format (single `message` still supported for backward compatibility)
- Must access response via `data.content[0].text`
- Should validate requests before sending

---

## Response Format Changes

### Before
```javascript
{
  success: true,
  text: "Response...",
  timestamp: "..."
}
```

### After
```javascript
{
  success: true,
  data: {
    id: "msg_...",
    type: "message",
    role: "assistant",
    content: [
      {
        type: "text",
        text: "Response..."
      }
    ],
    model: "gemini-pro",
    stop_reason: "end_turn",
    usage: {
      input_tokens: 42,
      output_tokens: 156
    }
  },
  source: "gemini",
  timestamp: "..."
}
```

---

## Migration Timeline

1. **Phase 1**: Update core services (Cloud-Gemini, API routes)
   - ✅ Complete

2. **Phase 2**: Update client code
   - Review existing calls to `geminiService`
   - Convert to `ccProxyService`
   - Test each component

3. **Phase 3**: Deprecate litellm
   - Remove old implementation if no longer needed
   - Archive documentation

4. **Phase 4**: Optimize
   - Implement caching
   - Add streaming support
   - Monitor performance

---

## Testing Migration

### Test 1: Basic Request
```javascript
const res = await ccProxyService.sendRequest({
  messages: [{ role: 'user', content: 'Hello' }]
});

assert(res.success === true);
assert(res.data.content[0].text !== '');
```

### Test 2: History Management
```javascript
const history1 = ccProxyService.getHistory();
await ccProxyService.sendRequest({
  messages: [{ role: 'user', content: 'Test' }]
});
const history2 = ccProxyService.getHistory();

assert(history2.length > history1.length);
```

### Test 3: Validation
```javascript
const validation = ccProxyService.validateRequest({
  messages: []
});

assert(validation.valid === false);
```

---

## Common Issues During Migration

### Issue 1: Wrong Response Access
```javascript
// ❌ Wrong
const text = response.text;

// ✅ Correct
const text = response.data.content[0].text;
```

### Issue 2: Messages Format
```javascript
// ❌ Wrong
{ message: 'text' }

// ✅ Correct
{ messages: [{ role: 'user', content: 'text' }] }
```

### Issue 3: Missing Validation
```javascript
// ❌ Wrong - No validation
const response = await ccProxyService.sendRequest(request);

// ✅ Better
const validation = ccProxyService.validateRequest(request);
if (!validation.valid) return;
const response = await ccProxyService.sendRequest(request);
```

---

## Summary

The migration from litellm to CCProxy provides:

✅ **Consistency** - Always Claude format  
✅ **Validation** - Built-in request checking  
✅ **Type Safety** - Full TypeScript support  
✅ **Context Management** - Automatic history tracking  
✅ **Error Handling** - Better error messages  
✅ **Documentation** - Comprehensive guides  

**Effort**: Low (simple find & replace patterns)  
**Risk**: Very Low (backward compatible)  
**Benefit**: High (cleaner, safer API)

---

## Support

For migration help:
1. Review `/CCPROXY_INTEGRATION.md` for full API docs
2. Check `/CCPROXY_QUICK_START.md` for examples
3. Look at test cases in `/src/cc-proxy.test.ts`
4. Review implementation in `/src/cc-proxy.ts`

---

**Migration Status**: Ready for Implementation ✅
