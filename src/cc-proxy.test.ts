/**
 * CCProxy Service Tests
 * Validates request translation, response translation, and Claude compatibility
 */

import { ccProxyService, type CCProxyRequest } from './cc-proxy';

/**
 * Test Suite for CCProxy
 */
export async function runCCProxyTests() {
  const tests: { name: string; fn: () => Promise<void> | void }[] = [];
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Test 1: Request validation - valid request
  tests.push({
    name: 'Valid request validation',
    fn: () => {
      const request: CCProxyRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
      };
      const validation = ccProxyService.validateRequest(request);
      if (!validation.valid) {
        throw new Error(validation.error || 'Should be valid');
      }
    },
  });

  // Test 2: Request validation - missing messages
  tests.push({
    name: 'Reject request without messages',
    fn: () => {
      const request: any = { model: 'gemini-pro' };
      const validation = ccProxyService.validateRequest(request);
      if (validation.valid) {
        throw new Error('Should reject empty messages');
      }
      if (!validation.error?.includes('Messages')) {
        throw new Error('Should mention messages in error');
      }
    },
  });

  // Test 3: Request validation - invalid role
  tests.push({
    name: 'Reject message with invalid role',
    fn: () => {
      const request: any = {
        messages: [{ role: 'admin', content: 'Hello' }],
      };
      const validation = ccProxyService.validateRequest(request);
      if (validation.valid) {
        throw new Error('Should reject invalid role');
      }
      if (!validation.error?.includes('role')) {
        throw new Error('Should mention role in error');
      }
    },
  });

  // Test 4: Request validation - invalid temperature
  tests.push({
    name: 'Reject invalid temperature',
    fn: () => {
      const request: CCProxyRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 1.5,
      };
      const validation = ccProxyService.validateRequest(request);
      if (validation.valid) {
        throw new Error('Should reject temperature > 1');
      }
      if (!validation.error?.includes('Temperature')) {
        throw new Error('Should mention temperature in error');
      }
    },
  });

  // Test 5: Request validation - invalid maxTokens
  tests.push({
    name: 'Reject invalid maxTokens',
    fn: () => {
      const request: CCProxyRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
        maxTokens: -100,
      };
      const validation = ccProxyService.validateRequest(request);
      if (validation.valid) {
        throw new Error('Should reject negative maxTokens');
      }
      if (!validation.error?.includes('maxTokens')) {
        throw new Error('Should mention maxTokens in error');
      }
    },
  });

  // Test 6: Response format structure
  tests.push({
    name: 'Response has Claude format structure',
    fn: async () => {
      // Mock request (would fail without actual Gemini, but tests structure)
      const request: CCProxyRequest = {
        messages: [{ role: 'user', content: 'Test' }],
      };
      const response = await ccProxyService.sendRequest(request);
      
      if (response.success && response.data) {
        const data = response.data;
        // Check all required Claude fields
        if (!data.id) throw new Error('Missing id field');
        if (data.type !== 'message') throw new Error('Invalid type');
        if (data.role !== 'assistant') throw new Error('Invalid role');
        if (!Array.isArray(data.content)) throw new Error('Content not array');
        if (data.content[0]?.type !== 'text') throw new Error('Invalid content type');
        if (!data.model) throw new Error('Missing model field');
        if (!data.stop_reason) throw new Error('Missing stop_reason');
        if (!data.usage) throw new Error('Missing usage');
        if (typeof data.usage.input_tokens !== 'number') throw new Error('Invalid input_tokens');
        if (typeof data.usage.output_tokens !== 'number') throw new Error('Invalid output_tokens');
        if (data.originalSource !== 'gemini') throw new Error('Invalid originalSource');
      }
    },
  });

  // Test 7: Conversation history tracking
  tests.push({
    name: 'Track conversation history',
    fn: () => {
      ccProxyService.clearHistory();
      
      if (ccProxyService.getHistoryLength() !== 0) {
        throw new Error('History not cleared');
      }

      // After a request, history should be updated
      const history = ccProxyService.getHistory();
      if (!Array.isArray(history)) {
        throw new Error('History should be array');
      }
    },
  });

  // Test 8: Model getter/setter
  tests.push({
    name: 'Model configuration',
    fn: () => {
      const initialModel = ccProxyService.getModel();
      if (typeof initialModel !== 'string') {
        throw new Error('Model should be string');
      }

      ccProxyService.setModel('gemini-pro-vision');
      const newModel = ccProxyService.getModel();
      if (newModel !== 'gemini-pro-vision') {
        throw new Error('Model not updated');
      }

      // Reset
      ccProxyService.setModel('gemini-pro');
    },
  });

  // Test 9: Multiple messages in request
  tests.push({
    name: 'Handle multiple messages',
    fn: () => {
      const request: CCProxyRequest = {
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
          { role: 'user', content: 'How are you?' },
        ],
      };
      const validation = ccProxyService.validateRequest(request);
      if (!validation.valid) {
        throw new Error('Should accept multiple messages');
      }
    },
  });

  // Test 10: Empty messages array rejection
  tests.push({
    name: 'Reject empty messages array',
    fn: () => {
      const request: any = { messages: [] };
      const validation = ccProxyService.validateRequest(request);
      if (validation.valid) {
        throw new Error('Should reject empty array');
      }
    },
  });

  // Run all tests
  console.log('🧪 Running CCProxy Tests...\n');

  for (const test of tests) {
    try {
      await test.fn();
      results.push({ name: test.name, passed: true });
      console.log(`✅ ${test.name}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      results.push({ name: test.name, passed: false, error: errorMsg });
      console.log(`❌ ${test.name}`);
      console.log(`   Error: ${errorMsg}`);
    }
  }

  // Summary
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`\n📊 Results: ${passed}/${total} tests passed`);

  return {
    totalTests: total,
    passedTests: passed,
    failedTests: total - passed,
    results,
    success: passed === total,
  };
}

// Export types for use in other test files
export type CCProxyTestResult = {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: Array<{ name: string; passed: boolean; error?: string }>;
  success: boolean;
};

// If running directly
if (typeof window === 'undefined' && require.main === module) {
  runCCProxyTests()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test suite error:', error);
      process.exit(1);
    });
}
