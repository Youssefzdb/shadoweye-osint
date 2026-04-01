# Source Map Cloud - Setup Instructions

## Initial Setup Complete ✅

The complete Source Map system has been set up with:

### Core System Files
- ✅ `src/types.ts` - Type definitions
- ✅ `src/models.ts` - Model management
- ✅ `src/tools.ts` - Tool management
- ✅ `src/commands.ts` - Command management
- ✅ `src/query-engine.ts` - Query orchestration
- ✅ `src/index.ts` - Main entry point

### API Routes
- ✅ `/api/source-map/query` - Main query endpoint
- ✅ `/api/source-map/history` - Conversation history
- ✅ `/api/source-map/models` - Model listing
- ✅ `/api/source-map/tools` - Tool listing
- ✅ `/api/source-map/commands` - Command listing

### UI Components
- ✅ `components/source-map-dashboard.tsx` - Statistics dashboard
- ✅ `components/query-input.tsx` - Query input form
- ✅ `components/message-display.tsx` - Message display
- ✅ `app/page.tsx` - Main dashboard page

### Documentation
- ✅ `SOURCE_MAP_README.md` - Complete documentation
- ✅ `USAGE_EXAMPLES.md` - Usage examples
- ✅ `SETUP.md` - This file

## Next Steps

### 1. Start the Development Server
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

### 2. Test the System
- Open http://localhost:3000 in your browser
- You should see the Source Map dashboard with:
  - System status cards
  - Query input interface
  - Message display area
  - Quick info sidebar

### 3. Upload Your Gemini Integration File

When you're ready, upload your Gemini configuration file and I'll:
1. Create `/app/api/source-map/gemini/route.ts` with Gemini integration
2. Update the query engine to use actual Gemini models
3. Add tool calling capabilities
4. Implement streaming responses

### 4. Configure Environment Variables

Once you have your Gemini API key, add to Vercel project settings:

1. Go to Settings → Vars
2. Add these variables:
   - `GOOGLE_API_KEY` - Your Gemini API key
   - `GOOGLE_CLOUD_PROJECT` - Optional: Your Google Cloud project ID

Or create a `.env.local` file locally:
```bash
cp .env.example .env.local
# Edit .env.local and add your credentials
```

## Current System Status

### Available Models
- `gemini-pro` - Main LLM model (placeholder, waiting for Gemini integration)
- `gemini-vision` - Vision model
- `text-embedding` - Embedding model

### Available Tools
- `search_web` - Web search functionality
- `calculate` - Mathematical calculations
- `execute_code` - Code execution
- `query_database` - Database queries

### Available Commands
- `answer_question` - General Q&A
- `analyze_code` - Code analysis
- `query_data` - Data querying
- `research_topic` - Research and synthesis

## Testing Without Gemini (Current State)

The system is fully functional without Gemini! You can:

1. **Test the dashboard:**
   - Check system statistics
   - View available models, tools, commands

2. **Test the API:**
   ```bash
   # Check health
   curl http://localhost:3000/api/source-map/query
   
   # List models
   curl http://localhost:3000/api/source-map/models
   
   # Submit a test query
   curl -X POST http://localhost:3000/api/source-map/query \
     -H "Content-Type: application/json" \
     -d '{"input": "test query"}'
   ```

3. **Test the UI:**
   - Enter queries in the input box
   - See responses (basic processing)
   - View conversation history

## Architecture Overview

```
User Interface (Next.js)
        ↓
    Page.tsx
        ↓
    Components (QueryInput, MessageDisplay, Dashboard)
        ↓
    API Routes
        ↓
    Source Map Engine
        ├─ Model Registry
        ├─ Tool Registry
        ├─ Command Registry
        └─ Query Engine
        ↓
    External Services
        ├─ Gemini API (when configured)
        ├─ Database (optional)
        ├─ Web Search (optional)
        └─ Other Tools
```

## File Organization Guide

### For Understanding the System
1. Start with `SOURCE_MAP_README.md` for architecture overview
2. Read `src/types.ts` for all type definitions
3. Check `src/index.ts` to see how components connect
4. Review API routes to understand endpoints

### For Making Changes
1. **Add a new tool:** Edit `src/tools.ts` → `initializeTools()`
2. **Add a new command:** Edit `src/commands.ts` → `initializeCommands()`
3. **Add a model:** Edit `src/models.ts` → `initializeModels()`
4. **Add an API endpoint:** Create new file in `app/api/source-map/`
5. **Add UI component:** Create new file in `components/`

### For Integration Work
1. Update `src/models.ts` to include Gemini config
2. Create `app/api/source-map/gemini/route.ts` for Gemini API
3. Update `src/query-engine.ts` to use actual model inference
4. Add environment variables to `.env.local` (local) and Vercel settings

## Deployment

### Deploying to Vercel

1. Connect your GitHub repository (if using Git)
2. Set environment variables in Vercel dashboard:
   - `GOOGLE_API_KEY`
   - Any other required keys

3. Deploy:
   ```bash
   vercel deploy
   ```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

## Troubleshooting

### Issue: "Cannot find module '@/src/index'"
**Solution:** Make sure `tsconfig.json` has proper path aliases configured (should be default)

### Issue: Port 3000 already in use
**Solution:** Run on different port:
```bash
pnpm dev -- -p 3001
```

### Issue: API returns "model not found"
**Solution:** 
1. Check `/api/source-map/models` endpoint
2. Verify model ID in request
3. Ensure model is registered in `src/models.ts`

### Issue: Components not rendering
**Solution:**
1. Clear Next.js cache: `rm -rf .next`
2. Rebuild: `pnpm build`
3. Check browser console for errors

## Performance Optimization

### For Production
1. Enable compression
2. Implement query caching
3. Add rate limiting
4. Use database connection pooling
5. Implement conversation pruning

### Monitoring
- Log all queries for analysis
- Track model performance
- Monitor API response times
- Watch error rates

## Security Checklist

- [ ] Never commit `.env.local` or API keys
- [ ] Use environment variables for all secrets
- [ ] Validate all user input
- [ ] Implement rate limiting
- [ ] Add authentication/authorization
- [ ] Use HTTPS in production
- [ ] Implement CORS properly
- [ ] Sanitize database queries

## Getting Help

### Check Documentation
- `SOURCE_MAP_README.md` - Full system docs
- `USAGE_EXAMPLES.md` - Code examples
- `src/*.ts` - Inline code comments

### For Gemini Issues
1. Verify API key is valid
2. Check Gemini quota in Google Cloud console
3. Review API documentation at: https://ai.google.dev/docs

### For Next.js Issues
1. Check Next.js documentation: https://nextjs.org/docs
2. Review Next.js examples: https://github.com/vercel/next.js/tree/canary/examples

## Ready to Continue?

When you're ready with your Gemini integration file, just upload it and I'll:
1. Integrate Gemini API with the system
2. Update all relevant files
3. Set up proper error handling
4. Configure streaming responses
5. Test the full integration

**The system is now ready to receive your Gemini configuration! 🚀**
