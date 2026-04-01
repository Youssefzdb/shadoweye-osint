# 🧪 Gemini Integration - Testing Guide

## Quick Start Test

### Step 1: Start the Application
```bash
pnpm dev
```

Expected output:
```
> next dev
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  ✓ Ready in 2.1s
```

### Step 2: Access the Chat
Open your browser to:
```
http://localhost:3000/chat
```

You should see:
- Header: "Gemini AI Chat"
- Empty chat area with greeting
- Input box at bottom
- Sidebar with stats and tips

### Step 3: Test Basic Message
Type in the input box:
```
What is the capital of France?
```

Click "Send" or press Enter.

Expected result:
- Message appears on the right (blue)
- "Gemini is thinking..." appears
- AI response appears on the left (gray)
- Timestamp shows

### Step 4: Test Copy Functionality
Hover over an AI response, click the copy icon (📋)
- Icon should change to checkmark (✓)
- Message copied to clipboard

### Step 5: Test Conversation Context
Send follow-up message:
```
What is the weather like there?
```

Expected behavior:
- AI should understand you mean France
- Response should show context awareness
- History should show both messages

---

## 📋 Complete Test Checklist

### Navigation & UI

- [ ] **Dashboard page loads**
  - Visit: http://localhost:3000
  - Should see: Statistics, query input, system info

- [ ] **Chat page loads**
  - Visit: http://localhost:3000/chat
  - Should see: Chat interface, sidebar stats, pro tips

- [ ] **Navigation links work**
  - Click "Dashboard" → Should go to /
  - Click "Gemini Chat" → Should go to /chat
  - Click logo → Should go to /

- [ ] **Details page loads**
  - Visit: http://localhost:3000/details
  - Should display system configuration

### Chat Functionality

- [ ] **Send basic message**
  - Type: "Hello"
  - Result: Message sent and response received

- [ ] **Multiple messages**
  - Send 3+ messages
  - All should appear in history

- [ ] **Context awareness**
  - Send: "What is AI?"
  - Follow: "Can you explain more?"
  - AI should reference previous answer

- [ ] **Copy functionality**
  - Hover AI message
  - Click copy icon
  - Verify clipboard has content

- [ ] **Clear history**
  - Click "Clear Chat" button
  - Confirm dialog appears
  - History clears

- [ ] **Auto-scroll**
  - Send many messages
  - View should stay at bottom

- [ ] **Keyboard shortcuts**
  - Shift+Enter should create new line
  - Enter should send message

### API Testing

#### Test 1: Direct API Call
```bash
curl -X POST http://localhost:3000/api/gemini \
  -H "Content-Type: application/json" \
  -d '{"message": "Say hello"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Hello there!...",
  "timestamp": "2024-01-15T10:30:00Z",
  "contextLength": 2
}
```

#### Test 2: API with Context
```bash
curl -X POST http://localhost:3000/api/gemini \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Do you remember what I asked?",
    "context": [
      {"role": "user", "content": "What is AI?"},
      {"role": "assistant", "content": "AI is..."}
    ]
  }'
```

Expected: Response shows context awareness

#### Test 3: Get Context
```bash
curl http://localhost:3000/api/gemini/context
```

Expected response:
```json
{
  "success": true,
  "context": [...],
  "length": 4,
  "timestamp": "..."
}
```

#### Test 4: Error Handling - Empty Message
```bash
curl -X POST http://localhost:3000/api/gemini \
  -H "Content-Type: application/json" \
  -d '{"message": ""}'
```

Expected: Error response with 400 status

#### Test 5: Error Handling - Too Long
```bash
curl -X POST http://localhost:3000/api/gemini \
  -H "Content-Type: application/json" \
  -d '{"message": "'$(python3 -c 'print("a"*10001)')'"}'
```

Expected: Error response about message too long

---

## 🧬 Component Tests

### Test AIChat Component

```typescript
// In your test file
import { AIChat } from '@/components/ai-chat';

describe('AIChat Component', () => {
  it('renders chat interface', () => {
    render(<AIChat />);
    expect(screen.getByPlaceholderText(/Type your message/i)).toBeInTheDocument();
  });

  it('sends message on button click', async () => {
    const { getByPlaceholderText, getByRole } = render(<AIChat />);
    const input = getByPlaceholderText(/Type your message/i);
    const sendButton = getByRole('button', { name: /Send/i });
    
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
  });

  it('displays loading state', async () => {
    render(<AIChat />);
    const input = screen.getByPlaceholderText(/Type your message/i);
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.keyPress(input, { key: 'Enter' });
    
    expect(screen.getByText(/thinking/i)).toBeInTheDocument();
  });
});
```

### Test Gemini Service

```typescript
import { geminiService } from '@/src/gemini';

describe('GeminiService', () => {
  beforeEach(() => {
    geminiService.clearHistory();
  });

  it('should ask and get response', async () => {
    const response = await geminiService.ask('Hello');
    expect(response.success).toBe(true);
    expect(response.text.length).toBeGreaterThan(0);
  });

  it('should maintain history', async () => {
    await geminiService.ask('First');
    await geminiService.ask('Second');
    
    const context = geminiService.getContext();
    expect(context.history.length).toBe(4); // 2 user + 2 assistant
  });

  it('should handle empty message', async () => {
    const response = await geminiService.ask('   ');
    expect(response.text).toBe('');
  });

  it('should clear history', () => {
    geminiService.ask('Test');
    geminiService.clearHistory();
    expect(geminiService.getHistoryLength()).toBe(0);
  });
});
```

---

## 📊 Browser Console Tests

Open browser DevTools (F12) and run these tests:

### Test 1: Fetch API
```javascript
fetch('/api/gemini', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Test from console' })
})
  .then(r => r.json())
  .then(d => console.log('Success:', d))
  .catch(e => console.error('Error:', e))
```

### Test 2: Check Context
```javascript
fetch('/api/gemini/context')
  .then(r => r.json())
  .then(d => console.log('Context:', d))
```

### Test 3: Get Local Storage
```javascript
// Check if history is saved locally
console.log('Messages:', localStorage.getItem('gemini_history'))
```

### Test 4: Performance
```javascript
console.time('gemini-request');
fetch('/api/gemini', {
  method: 'POST',
  body: JSON.stringify({ message: 'Timing test' })
})
  .then(() => console.timeEnd('gemini-request'))
```

---

## ⚠️ Error Scenario Tests

### Scenario 1: Network Offline
1. Open DevTools → Network tab
2. Check "Offline" checkbox
3. Try to send message
4. Should show error gracefully
5. Go back online
6. Message should work again

### Scenario 2: Very Long Message
1. Try pasting a 15,000+ character message
2. Should show: "Message is too long"
3. Input should be rejected

### Scenario 3: Rapid Messages
1. Send 10 messages quickly
2. All should queue properly
3. No messages should be lost

### Scenario 4: Browser Back Button
1. Send a message
2. Click browser back
3. Come back forward
4. History should be preserved

### Scenario 5: Page Refresh
1. Send some messages
2. Refresh the page (F5)
3. History should be reloaded
4. Should show previous messages

---

## 🔄 Integration Tests

### Test Dashboard with Gemini
1. Open http://localhost:3000
2. Enter query: "What is machine learning?"
3. Should get response from Gemini
4. Should show in chat area

### Test History Sync
1. Open http://localhost:3000/chat
2. Send a message
3. Open http://localhost:3000
4. History should be same
5. Send another from dashboard
6. Refresh /chat
7. New message should appear

### Test Source Map Integration
1. Open http://localhost:3000/details
2. Should show Gemini as available model
3. Statistics should show conversation count
4. Model should show "gemini-pro"

---

## 🎯 Performance Tests

### Load Test
```javascript
// Send 20 messages in quick succession
for (let i = 0; i < 20; i++) {
  fetch('/api/gemini', {
    method: 'POST',
    body: JSON.stringify({ message: `Message ${i}` })
  });
}
```

Expected: All requests succeed

### Memory Test
```javascript
// Check memory usage
console.log(performance.memory);

// Send 100 messages
// Check memory again
console.log(performance.memory);

// Should not exceed 50MB increase
```

### Response Time Test
```javascript
// Measure response time
const times = [];
for (let i = 0; i < 10; i++) {
  const start = performance.now();
  await fetch('/api/gemini', {
    method: 'POST',
    body: JSON.stringify({ message: 'Time test' })
  }).then(r => r.json());
  times.push(performance.now() - start);
}
console.log('Avg:', times.reduce((a,b)=>a+b)/times.length, 'ms');
```

Expected: Average ~1000-3000ms

---

## 📝 Test Report Template

```markdown
# Test Report - Date: [DATE]

## Environment
- Browser: [BROWSER + VERSION]
- OS: [OPERATING SYSTEM]
- Node: [NODE VERSION]
- Next.js: [NEXT.JS VERSION]

## Results

### Navigation ✅/❌
- Dashboard: [PASS/FAIL]
- Chat: [PASS/FAIL]
- Details: [PASS/FAIL]

### Chat Functionality ✅/❌
- Send message: [PASS/FAIL]
- Multiple messages: [PASS/FAIL]
- Context awareness: [PASS/FAIL]
- Copy functionality: [PASS/FAIL]

### API Tests ✅/❌
- Direct API call: [PASS/FAIL]
- Error handling: [PASS/FAIL]
- Context endpoint: [PASS/FAIL]

### Performance ✅/❌
- Load time: [TIME]ms
- Response time: [TIME]ms
- Memory usage: [AMOUNT]MB

## Issues Found
[LIST ISSUES]

## Notes
[ADDITIONAL NOTES]
```

---

## ✅ Final Verification

When all tests pass:

- [ ] Chat interface works
- [ ] Messages send/receive
- [ ] History persists
- [ ] Copy works
- [ ] Context aware
- [ ] Clear chat works
- [ ] Dashboard integration works
- [ ] Details page shows Gemini
- [ ] No console errors
- [ ] Performance acceptable

---

## 🎉 Success Criteria

System is ready when:

1. ✅ Can send and receive messages
2. ✅ No JavaScript errors in console
3. ✅ Response time < 5 seconds
4. ✅ Memory usage stable
5. ✅ History persists across refresh
6. ✅ All UI elements responsive
7. ✅ Copy functionality works
8. ✅ Error handling works

---

**All tests passed? You're ready to deploy! 🚀**
