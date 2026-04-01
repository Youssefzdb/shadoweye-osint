# Gemini Integration Guide

This document explains how to integrate Google's Gemini API with the Source Map Cloud system.

## Overview

Once you provide your Gemini integration file, the following components will be updated:

1. **API Route:** `/app/api/source-map/gemini/route.ts` - Handles Gemini API calls
2. **Query Engine:** Update `src/query-engine.ts` to use actual Gemini inference
3. **Models:** Update `src/models.ts` with real Gemini model configurations
4. **Environment Variables:** Add API keys and configuration

## Current Placeholder State

The system currently has placeholder implementations that return mock responses. When Gemini is integrated, actual responses will be generated using the Gemini models.

### Current Flow
```
User Query
    ↓
API Route (POST /api/source-map/query)
    ↓
Query Engine
    ↓
Command Detection (returns mock response)
    ↓
Response to User
```

### After Gemini Integration
```
User Query
    ↓
API Route (POST /api/source-map/query)
    ↓
Query Engine
    ↓
Gemini API Call (with tools)
    ↓
Model Processing
    ↓
Tool Execution (if needed)
    ↓
Final Response
    ↓
Response to User
```

## Expected Integration File Structure

When you provide your Gemini integration file, it should include:

### Option 1: Using Google's Official SDK
```typescript
// Expected: SDK initialization, API configuration
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
```

### Option 2: Using Vercel AI SDK
```typescript
// Expected: AI SDK with Google provider
import { google } from "@ai-sdk/google";

const model = google("gemini-pro");
```

### Option 3: Using Vertex AI
```typescript
// Expected: Google Cloud authentication
import { VertexAI } from "@google-cloud/vertexai";

const client = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: 'us-central1',
});
```

## How Integration Will Work

### Step 1: Upload Your File
Share your Gemini integration code (could be a file or API setup details)

### Step 2: Create Gemini API Route
I'll create `/app/api/source-map/gemini/route.ts` with:
- Initialization of Gemini client
- Request handling for queries
- Tool calling support
- Error handling
- Rate limiting

### Step 3: Update Query Engine
Modify `src/query-engine.ts` to:
- Call Gemini API instead of returning placeholder responses
- Pass conversation history to Gemini
- Handle tool calls from Gemini
- Process streaming responses (if enabled)

### Step 4: Update Models Registry
Update `src/models.ts` to:
- Add real Gemini model configurations
- Include model capabilities (tokens, supported tools, etc.)
- Add vision and embedding models

### Step 5: Configure Environment
- Set up environment variables
- Configure model parameters (temperature, max tokens, etc.)
- Set up rate limiting

## Example Integration Code

### Using Google's Official SDK

```typescript
// app/api/source-map/gemini/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { QueryContext, QueryResult } from "@/src/types";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function queryWithGemini(
  input: string,
  context: QueryContext
): Promise<QueryResult> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
    });

    const chat = model.startChat({
      history: context.history?.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })) || [],
    });

    const result = await chat.sendMessage(input);
    const response = result.response;
    const text = response.text();

    return {
      output: text,
      confidence: 0.95,
      toolsUsed: [],
      metadata: {
        model: "gemini-pro",
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      output: `Error: ${String(error)}`,
      confidence: 0,
      metadata: {
        error: String(error),
      },
    };
  }
}
```

### Using Vercel AI SDK

```typescript
// app/api/source-map/ai-sdk/route.ts
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

const model = google("gemini-pro");

export async function queryWithGeminiAISDK(
  input: string,
  systemPrompt?: string
) {
  const { text } = await generateText({
    model,
    prompt: input,
    system: systemPrompt || "You are a helpful AI assistant.",
  });

  return {
    output: text,
    confidence: 0.95,
    toolsUsed: [],
    metadata: {
      model: "gemini-pro",
      timestamp: new Date().toISOString(),
    },
  };
}
```

## Configuration After Integration

### Environment Variables to Add

```env
# Required
GOOGLE_API_KEY=your-api-key-here

# Optional (for Vertex AI)
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1

# Configuration
GEMINI_MODEL=gemini-pro
GEMINI_TEMPERATURE=0.7
GEMINI_MAX_TOKENS=8192
GEMINI_TOP_P=0.95
GEMINI_TOP_K=40

# Rate Limiting
API_RATE_LIMIT=100
API_TIMEOUT=30000
```

## Tool Calling with Gemini

Once integrated, tools will be called automatically by Gemini:

### Define Tools for Gemini
```typescript
const tools = [
  {
    name: "search_web",
    description: "Search the web for information",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query",
        },
        maxResults: {
          type: "number",
          description: "Maximum number of results",
        },
      },
      required: ["query"],
    },
  },
  // ... more tools
];
```

### Handle Tool Calls
```typescript
const response = await model.generateContent({
  contents: [{ role: "user", parts: [{ text: input }] }],
  tools: [{
    functionDeclarations: tools,
  }],
});

// Process tool calls
const toolCalls = response.candidates?.[0]?.content?.parts
  ?.filter(part => part.functionCall)
  .map(part => part.functionCall);

// Execute tools and return results
```

## Streaming Responses

After Gemini integration, you can enable streaming:

```typescript
// app/api/source-map/query/stream/route.ts
import { streamText } from "ai";
import { google } from "@ai-sdk/google";

export async function POST(request: Request) {
  const { input } = await request.json();

  const result = await streamText({
    model: google("gemini-pro"),
    prompt: input,
  });

  return result.toTextStreamResponse();
}
```

## Testing the Integration

### 1. Test via API
```bash
curl -X POST http://localhost:3000/api/source-map/query \
  -H "Content-Type: application/json" \
  -d '{"input": "What is 2 + 2?"}'
```

### 2. Test via UI
- Open http://localhost:3000
- Enter a query in the input box
- See Gemini response (instead of placeholder)

### 3. Test Tool Calling
```bash
curl -X POST http://localhost:3000/api/source-map/query \
  -H "Content-Type: application/json" \
  -d '{"input": "Search the web for latest AI news"}'
```

## Expected Results After Integration

### Better Responses
- Queries will return intelligent responses from Gemini
- Conversation context will be maintained
- Tool calling will work automatically

### New Capabilities
- Natural language understanding
- Code generation and analysis
- Data summarization
- Multi-turn conversations
- Custom instruction following

### Performance
- Response time: ~2-5 seconds (depending on query)
- Token usage tracking
- Rate limiting to prevent abuse
- Conversation history management

## Troubleshooting Integration

### API Key Issues
```
Error: API key not found
→ Check GOOGLE_API_KEY in environment variables
→ Verify key has correct permissions
→ Check quota limits in Google Cloud Console
```

### Model Not Found
```
Error: Model 'gemini-pro' not found
→ Update model name in integration code
→ Check available models: google/gemini-pro, google/gemini-vision, etc.
→ Verify API key has access to model
```

### Rate Limiting
```
Error: Rate limit exceeded
→ Implement exponential backoff
→ Add request queuing
→ Check API quota in Google Cloud Console
```

### Timeout Issues
```
Error: Request timeout
→ Increase timeout value in config
→ Consider streaming for long responses
→ Reduce max tokens for faster processing
```

## Security Considerations

1. **API Key Management**
   - Never expose API keys in client-side code
   - Use environment variables only
   - Rotate keys regularly

2. **Rate Limiting**
   - Implement per-user rate limits
   - Monitor usage patterns
   - Set up alerts for unusual activity

3. **Input Validation**
   - Validate all user inputs
   - Sanitize prompts before sending to API
   - Implement prompt injection prevention

4. **Output Handling**
   - Validate API responses
   - Handle errors gracefully
   - Log all interactions (with PII removal)

## Performance Optimization

1. **Caching**
   - Cache common queries
   - Use Redis for session storage
   - Implement semantic caching

2. **Batching**
   - Combine multiple queries when possible
   - Use batch API for cost savings
   - Implement request pooling

3. **Model Selection**
   - Use smaller models for simple tasks
   - Use vision model only when needed
   - Consider embeddings for similarity search

## Monitoring and Analytics

Track the following metrics:
- Query volume and latency
- Token usage and costs
- Error rates
- Tool call success rate
- User engagement

## Next Steps

1. **Prepare Your Gemini File**
   - Gather your API key
   - Choose integration method (official SDK, AI SDK, or Vertex AI)
   - Document any custom configurations

2. **Share With Me**
   - Upload the integration file
   - Provide any setup instructions
   - List any special requirements

3. **I Will**
   - Integrate the code
   - Update all relevant files
   - Test the integration
   - Add monitoring and error handling

4. **You Can Then**
   - Deploy to production
   - Monitor API usage
   - Optimize for your use case

## Support

For issues with Gemini integration:
- Check Google's documentation: https://ai.google.dev/
- Review API reference: https://ai.google.dev/api/rest
- Check rate limits: https://ai.google.dev/quotas
- Community support: https://developers.google.com/community

---

**Ready to provide your Gemini integration file? I'll handle the rest!** 🚀
