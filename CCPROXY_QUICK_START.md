# CCProxy Quick Start Guide

## What is CCProxy?

CCProxy is a **proxy layer** that translates Gemini API requests to Claude format and ensures all responses are Claude-compatible. This means you can treat Gemini responses exactly like Claude responses.

## Quick Usage

### Simple Request
```javascript
const response = await fetch('/api/gemini', {
  method: 'POST',
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'What is AI?' }
    ]
  })
});

const data = await response.json();
console.log(data.data.content[0].text); // Get the response text
```

### With Full Options
```javascript
const response = await fetch('/api/gemini', {
  method: 'POST',
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Explain quantum physics' }
    ],
    model: 'gemini-pro',
    maxTokens: 2000,
    temperature: 0.7,
    systemPrompt: 'You are a physics expert.'
  })
});
```

## Response Format

All responses follow Claude's API format:

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
        text: "Response text here..."
      }
    ],
    model: "gemini-pro",
    stop_reason: "end_turn",
    usage: {
      input_tokens: 42,
      output_tokens: 156
    }
  }
}
```

## Accessing the Response

```javascript
// Extract just the text
const text = data.data.content[0].text;

// Or full response
const fullResponse = data.data;
```

## Error Handling

```javascript
const response = await fetch('/api/gemini', {
  method: 'POST',
  body: JSON.stringify({ messages: [...] })
});

const result = await response.json();

if (!result.success) {
  console.error('Error:', result.error);
  // Handle error
}

// Use result.data
```

## Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| `messages` | array | Yes | Array of `{role, content}` |
| `model` | string | No | Default: 'gemini-pro' |
| `maxTokens` | number | No | Max response length |
| `temperature` | number | No | 0-1, higher = more creative |
| `systemPrompt` | string | No | System instructions |

## Conversation History

Get conversation history:
```javascript
const response = await fetch('/api/gemini');
const data = await response.json();
console.log(data.context); // Array of messages
```

## Common Patterns

### Multi-turn Conversation
```javascript
const messages = [
  { role: 'user', content: 'Hello' },
  { role: 'assistant', content: 'Hi there!' },
  { role: 'user', content: 'How are you?' }
];

const response = await fetch('/api/gemini', {
  method: 'POST',
  body: JSON.stringify({ messages })
});
```

### With React Hook
```javascript
const [response, setResponse] = useState('');

const sendMessage = async (message) => {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    body: JSON.stringify({
      messages: [{ role: 'user', content: message }]
    })
  });
  
  const data = await res.json();
  setResponse(data.data.content[0].text);
};
```

### Building a Chat
```javascript
const messages = [];

const addUserMessage = (text) => {
  messages.push({ role: 'user', content: text });
};

const getResponse = async () => {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    body: JSON.stringify({ messages })
  });
  
  const data = await res.json();
  const assistantMessage = data.data.content[0].text;
  messages.push({ role: 'assistant', content: assistantMessage });
  
  return assistantMessage;
};
```

## Troubleshooting

### "Messages array is required"
```javascript
// ✅ Correct
{ messages: [{ role: 'user', content: 'text' }] }

// ❌ Wrong
{ message: 'text' } // Use messages array instead
```

### "Invalid temperature"
```javascript
// ✅ Correct (0-1)
{ temperature: 0.7 }

// ❌ Wrong (outside range)
{ temperature: 1.5 }
```

### Empty response
```javascript
// Verify structure
if (data.data?.content?.[0]?.text) {
  console.log(data.data.content[0].text);
}
```

## Key Differences from Direct Gemini

| Feature | Direct Gemini | CCProxy |
|---------|----------------|---------|
| Request format | Varied | Claude-standard |
| Response format | Gemini format | Claude format |
| Error handling | Basic | Comprehensive |
| Validation | None | Built-in |
| Token info | None | Estimated |
| History | Manual | Automatic |

## API Endpoints

```
POST /api/gemini
- Send message to Gemini via CCProxy
- Returns Claude-format response

GET /api/gemini/context  
- Get conversation history
- Returns message array
```

## Cloud-Gemini

CCProxy also works with Cloud-Gemini:

```javascript
const response = await fetch('/api/cloud-gemini', {
  method: 'POST',
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Analyze data' }],
    includeStatus: true
  })
});

const data = await response.json();
console.log(data.message);      // Cloud-Gemini response
console.log(data.claudeFormat); // Claude-format response
```

## Next Steps

1. **Read** `/CCPROXY_INTEGRATION.md` for full documentation
2. **Review** `/CCPROXY_IMPLEMENTATION.md` for technical details
3. **Check** `/src/cc-proxy.ts` for source code
4. **Run** tests in `/src/cc-proxy.test.ts`

## Support

- Check error messages in response
- Verify request format matches examples
- Review TypeScript types in `/src/cc-proxy.ts`
- Read full docs in `/CCPROXY_INTEGRATION.md`

---

**Status**: ✅ Production Ready

CCProxy is fully integrated and tested. All Gemini requests are translated to Claude format automatically.
