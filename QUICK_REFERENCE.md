# Quick Reference Guide

## 🚀 Getting Started

### Start Development Server
```bash
pnpm dev
```
Open `http://localhost:3000` in your browser.

### Project Structure
```
src/               # Core system files
app/               # Next.js pages and API routes
components/        # React UI components
```

## 📚 Key Files Overview

| File | Purpose |
|------|---------|
| `src/index.ts` | Main entry point, exports everything |
| `src/types.ts` | All TypeScript type definitions |
| `src/models.ts` | Model registry and management |
| `src/tools.ts` | Tool registration and execution |
| `src/commands.ts` | Command definitions and handlers |
| `src/query-engine.ts` | Main query processing engine |
| `app/page.tsx` | Main dashboard page |
| `app/details/page.tsx` | System details page |

## 🔗 API Endpoints

### Query System
```bash
# Submit a query
POST /api/source-map/query
Body: { "input": "your query", "modelId": "gemini-pro" }

# Check health
GET /api/source-map/query

# Get conversation history
GET /api/source-map/history

# Clear history
DELETE /api/source-map/history

# List all models
GET /api/source-map/models

# List all tools
GET /api/source-map/tools

# List all commands
GET /api/source-map/commands
```

## 🛠️ Adding Features

### Add a New Tool
```typescript
// In src/tools.ts
registry.register({
  name: 'my_tool',
  description: 'What it does',
  parameters: {
    param: { type: 'string', description: 'Description' }
  },
  handler: async (args) => {
    // Implementation
    return result;
  }
});
```

### Add a New Command
```typescript
// In src/commands.ts
registry.register({
  id: 'my_command',
  name: 'My Command',
  description: 'Description',
  handler: async (input) => {
    return 'result';
  },
  tools: [/* relevant tools */]
});
```

### Add a New Model
```typescript
// In src/models.ts
registry.register({
  id: 'my-model',
  name: 'My Model',
  version: '1.0',
  type: 'llm',
  config: { /* config */ }
});
```

## 📋 Available Models
- `gemini-pro` - Main LLM model
- `gemini-vision` - Vision model
- `text-embedding` - Embeddings model

## 🔨 Available Tools
- `search_web` - Web search
- `calculate` - Math calculations
- `execute_code` - Code execution
- `query_database` - Database queries

## 📝 Available Commands
- `answer_question` - Q&A
- `analyze_code` - Code analysis
- `query_data` - Data querying
- `research_topic` - Research

## 🔐 Environment Variables

### Required (when Gemini is integrated)
```env
GOOGLE_API_KEY=your_api_key
```

### Optional
```env
GOOGLE_CLOUD_PROJECT=your_project_id
GEMINI_MODEL=gemini-pro
GEMINI_TEMPERATURE=0.7
GEMINI_MAX_TOKENS=8192
```

## 🧪 Testing

### Test via cURL
```bash
# Test API health
curl http://localhost:3000/api/source-map/query

# Submit a query
curl -X POST http://localhost:3000/api/source-map/query \
  -H "Content-Type: application/json" \
  -d '{"input": "Hello"}'

# Get models
curl http://localhost:3000/api/source-map/models
```

### Test in Browser
1. Open `http://localhost:3000`
2. See dashboard with statistics
3. Try entering a query in the input box
4. View conversation history

## 🎯 Common Tasks

### View System Status
```bash
curl http://localhost:3000/api/source-map/query
```

### Check Available Models
```bash
curl http://localhost:3000/api/source-map/models | jq
```

### Clear Conversation History
```bash
curl -X DELETE http://localhost:3000/api/source-map/history
```

### View Details Page
Open `http://localhost:3000/details` in browser

## 🐛 Debugging

### Enable Detailed Logging
Add to API route:
```typescript
console.log('[v0] Debug info:', data);
```

### Check Conversation History
```typescript
const history = engine.getConversationHistory();
console.log(history);
```

### Verify System State
```typescript
const sourceMap = engine.getSourceMap();
console.log('Models:', sourceMap.models);
console.log('Tools:', sourceMap.tools);
```

## 📦 Dependencies

Main packages:
- `next` - React framework
- `react` - UI library
- `typescript` - Type safety
- `tailwindcss` - Styling
- `zod` - Validation

## 🚀 Deployment

### To Vercel
```bash
vercel deploy
```

### To Docker
```bash
docker build -t source-map .
docker run -p 3000:3000 source-map
```

### Self-hosted
```bash
pnpm build
pnpm start
```

## 📖 Documentation Files

| File | Contents |
|------|----------|
| `SOURCE_MAP_README.md` | Full architecture & API docs |
| `SETUP.md` | Installation & configuration |
| `USAGE_EXAMPLES.md` | 12+ code examples |
| `GEMINI_INTEGRATION.md` | Gemini setup guide |
| `PROJECT_SUMMARY.md` | Project overview |
| `QUICK_REFERENCE.md` | This file |

## 🔄 Workflow

### Typical Development Cycle
1. Make changes to source files
2. Hot reload automatically applies
3. Test via UI or API
4. Check console for errors
5. Commit changes

### Adding New Feature
1. Define types in `src/types.ts`
2. Implement in appropriate registry
3. Create API endpoint if needed
4. Create UI component if needed
5. Test thoroughly
6. Update documentation

## ⚡ Performance Tips

- Keep conversation history small (default: 50)
- Cache frequently used queries
- Use appropriate model for task
- Implement tool batching
- Monitor API usage

## 🔗 Useful Links

- Next.js Docs: https://nextjs.org/docs
- Gemini API: https://ai.google.dev/docs
- TypeScript: https://www.typescriptlang.org/
- Tailwind: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com/

## ❓ FAQ

### Q: How do I add authentication?
A: Implement in middleware or API routes as needed.

### Q: Can I use a different AI model?
A: Yes, register in `src/models.ts` and use in queries.

### Q: How do I customize the UI?
A: Edit components in `components/` or update `app/globals.css`.

### Q: How do I increase history limit?
A: Change `maxHistoryLength` in `QueryEngine` class.

### Q: When will Gemini be integrated?
A: Once you upload your Gemini configuration file.

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000 in use | `pnpm dev -- -p 3001` |
| Module not found | Check tsconfig paths |
| Styles not applied | Clear `.next` folder |
| API returns error | Check API route file names |
| History not saving | Verify API endpoint working |

## 📞 Support

1. Check documentation files
2. Review code comments
3. Check browser console for errors
4. Review Next.js documentation
5. Open GitHub issues (if applicable)

---

**Last Updated:** 2024
**Status:** Ready for Gemini Integration 🚀
