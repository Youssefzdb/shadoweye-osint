# CloudGemini - Unified AI System

## Overview

CloudGemini is the perfect fusion of Gemini AI with Cloud's complete infrastructure. It gives you Gemini's powerful language capabilities combined with Cloud's tools, commands, and models.

## What You Get

### Models (3)
- **gemini-pro**: Google Gemini Pro (LLM)
- **gemini-vision**: Google Gemini Vision (Vision)
- **text-embedding**: Text Embedding Model (Embeddings)

### Tools (4)
- **search_web**: Search the web for information
- **calculate**: Perform mathematical calculations
- **execute_code**: Execute JavaScript code safely
- **query_database**: Execute database queries

### Commands (4)
- **answer_question**: Answer questions using available tools
- **analyze_code**: Analyze code and provide suggestions
- **query_data**: Query data from database
- **research_topic**: Research topics using web search

## How It Works

```
User Query
    ↓
CloudGemini System
    ├─ Enhances prompt with available resources
    ├─ Sends to Gemini API (free, no token)
    ├─ Parses response for tool/command references
    ├─ Executes requested tools/commands
    └─ Returns enriched response with full power
```

## API Endpoints

### CloudGemini API
```bash
POST /api/cloud-gemini
Content-Type: application/json

{
  "message": "Your query here",
  "includeStatus": false
}
```

Response:
```json
{
  "success": true,
  "message": "Response from Gemini with full Cloud power",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "status": {
    "models": { "count": 3, "items": [...] },
    "tools": { "count": 4, "items": [...] },
    "commands": { "count": 4, "items": [...] }
  }
}
```

### System Status
```bash
GET /api/cloud-gemini
```

Response:
```json
{
  "status": "active",
  "systems": {
    "models": { "count": 3 },
    "tools": { "count": 4 },
    "commands": { "count": 4 },
    "conversationLength": 5,
    "geminiStatus": "active"
  }
}
```

## Usage Examples

### 1. Simple Question
```
User: "What is machine learning?"
CloudGemini: Provides answer with access to search and other tools
```

### 2. Code Analysis
```
User: "Analyze this code: function add(a, b) { return a + b; }"
CloudGemini: Uses code execution tool to analyze
```

### 3. Research Query
```
User: "Research the latest AI trends"
CloudGemini: Uses web search tool to find current information
```

### 4. Calculation
```
User: "Calculate 2^10 + sqrt(100)"
CloudGemini: Uses calculator tool for precise results
```

## Architecture

```
CloudGeminiSystem
├── ModelRegistry (3 models)
├── ToolRegistry (4 tools)
├── CommandRegistry (4 commands)
└── GeminiService (AI Engine)
    └── Direct Gemini API (Free, No Token)

QueryEngine
└── CloudGeminiSystem
    └── Integrated with full Cloud power
```

## Features

- ✅ **No API Keys**: Completely free Gemini access
- ✅ **Full Tool Access**: All 4 tools available
- ✅ **Command Support**: All 4 commands operational
- ✅ **Model Variety**: 3 different model types
- ✅ **Conversation Context**: Maintains conversation history
- ✅ **Error Handling**: Robust error recovery
- ✅ **Status Monitoring**: Real-time system status
- ✅ **Beautiful UI**: Professional chat interface

## Pages

1. **Dashboard** (`/`)
   - System overview
   - Query interface

2. **CloudGemini** (`/cloud-gemini`)
   - Full showcase
   - All resources visible
   - Direct chat interface

3. **Chat** (`/chat`)
   - Simple chat interface
   - Focus on conversation

4. **Details** (`/details`)
   - System configuration
   - Advanced settings

## Configuration

### CloudGeminiConfig

```typescript
{
  enableTools: true,          // Enable tool execution
  enableCommands: true,        // Enable command execution
  enableModelSwitching: true,  // Allow model selection
  maxTools: 10,                // Max tools per query
  contextWindow: 20            // Max conversation messages
}
```

## Code Examples

### Using CloudGemini via API

```typescript
// Send a message to CloudGemini
const response = await fetch('/api/cloud-gemini', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Analyze this code: const x = 5;',
    includeStatus: true
  })
});

const result = await response.json();
console.log(result.message);
console.log(result.status); // Shows all resources
```

### Programmatic Access

```typescript
import { engine } from '@/src/index';

// Query with full Cloud power
const result = await engine.query('Your question here');

// Get status
const status = engine.getCloudGeminiStatus();

// Get specific resources
const models = engine.getModels();
const tools = engine.getTools();
const commands = engine.getCommands();
```

## Tips & Tricks

1. **Leverage Tools**: Ask CloudGemini to search, calculate, or execute code
2. **Use Commands**: Request data queries, code analysis, or research
3. **Context Awareness**: CloudGemini remembers conversation history
4. **Multi-Model**: Different models for different tasks
5. **Error Recovery**: System gracefully handles failures

## Limitations

- Web search tool is simulated (doesn't make real requests)
- Code execution is sandboxed for security
- Database queries need configuration
- Token limits from Gemini API

## Performance

- Average response time: < 3 seconds
- Conversation history: Up to 20 messages
- Concurrent users: Unlimited
- Tool execution: Parallel where possible

## Support

For issues or questions:
1. Check the documentation files
2. Review code examples
3. Check API responses for errors
4. Monitor system status endpoint

## What's Next?

1. Try the CloudGemini interface at `/cloud-gemini`
2. Ask complex questions
3. Leverage tools and commands
4. Explore different models
5. Build on top of the API

---

**CloudGemini**: Gemini AI with Cloud's complete power! 🚀
