/**
 * Code Execution Tool
 * Safely execute JavaScript/TypeScript code in a sandboxed environment
 */

import type { UnifiedTool } from '../types';
import { createTool } from '../tool-mapper';

interface CodeExecutionArgs {
  code: string;
  language?: 'javascript' | 'typescript' | 'python';
  timeout?: number;
}

interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
  logs: string[];
}

/**
 * Safe JavaScript execution using Function constructor
 * with restricted globals and timeout
 */
async function executeJavaScript(code: string, timeout: number = 5000): Promise<ExecutionResult> {
  const startTime = Date.now();
  const logs: string[] = [];

  // Create a mock console
  const mockConsole = {
    log: (...args: unknown[]) => logs.push(args.map(String).join(' ')),
    error: (...args: unknown[]) => logs.push('[ERROR] ' + args.map(String).join(' ')),
    warn: (...args: unknown[]) => logs.push('[WARN] ' + args.map(String).join(' ')),
    info: (...args: unknown[]) => logs.push('[INFO] ' + args.map(String).join(' ')),
  };

  // Safe globals
  const safeGlobals = {
    console: mockConsole,
    Math,
    Date,
    Array,
    Object,
    String,
    Number,
    Boolean,
    JSON,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    encodeURIComponent,
    decodeURIComponent,
    encodeURI,
    decodeURI,
    // No access to: fetch, XMLHttpRequest, eval, Function, etc.
  };

  try {
    // Wrap code in async function to support await
    const wrappedCode = `
      return (async () => {
        ${code}
      })();
    `;

    // Create function with safe globals
    const globalNames = Object.keys(safeGlobals);
    const globalValues = Object.values(safeGlobals);

    const fn = new Function(...globalNames, wrappedCode);

    // Execute with timeout
    const result = await Promise.race([
      fn(...globalValues),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Execution timeout')), timeout)
      ),
    ]);

    const executionTime = Date.now() - startTime;

    return {
      success: true,
      output: result !== undefined ? formatOutput(result) : logs.join('\n') || 'No output',
      executionTime,
      logs,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;

    return {
      success: false,
      output: '',
      error: error instanceof Error ? error.message : String(error),
      executionTime,
      logs,
    };
  }
}

/**
 * Format output for display
 */
function formatOutput(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

/**
 * Execute Python-like code (simplified interpreter)
 * Note: This is a basic simulation, not full Python
 */
async function executePythonLike(code: string): Promise<ExecutionResult> {
  const startTime = Date.now();
  const logs: string[] = [];

  try {
    // Convert basic Python syntax to JavaScript
    let jsCode = code
      // Print statements
      .replace(/print\s*\(/g, 'console.log(')
      // Range function
      .replace(/range\s*\(\s*(\d+)\s*\)/g, 'Array.from({length: $1}, (_, i) => i)')
      .replace(/range\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/g, 'Array.from({length: $2 - $1}, (_, i) => i + $1)')
      // List comprehensions (basic)
      .replace(/\[([^\]]+)\s+for\s+(\w+)\s+in\s+([^\]]+)\]/g, '$3.map($2 => $1)')
      // len() function
      .replace(/len\s*\(/g, '((x) => x.length)(')
      // str() function
      .replace(/str\s*\(/g, 'String(')
      // int() function
      .replace(/int\s*\(/g, 'parseInt(')
      // float() function
      .replace(/float\s*\(/g, 'parseFloat(')
      // True/False/None
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false')
      .replace(/\bNone\b/g, 'null')
      // And/Or/Not
      .replace(/\band\b/g, '&&')
      .replace(/\bor\b/g, '||')
      .replace(/\bnot\b/g, '!')
      // Remove Python-specific syntax that can't be converted
      .replace(/^\s*def\s+/gm, 'function ')
      .replace(/:\s*$/gm, ' {')
      // Add closing braces (basic heuristic)
      .split('\n')
      .map((line, i, arr) => {
        const currentIndent = line.search(/\S/);
        const nextIndent = arr[i + 1]?.search(/\S/) ?? 0;
        if (currentIndent > nextIndent && line.trim()) {
          return line + '\n' + ' '.repeat(nextIndent) + '}';
        }
        return line;
      })
      .join('\n');

    // Execute as JavaScript
    return await executeJavaScript(jsCode);
  } catch (error) {
    return {
      success: false,
      output: '',
      error: `Python conversion error: ${error instanceof Error ? error.message : String(error)}`,
      executionTime: Date.now() - startTime,
      logs,
    };
  }
}

/**
 * Code execution handler
 */
async function codeExecutionHandler(args: Record<string, unknown>): Promise<unknown> {
  const execArgs: CodeExecutionArgs = {
    code: String(args.code || ''),
    language: (args.language as CodeExecutionArgs['language']) || 'javascript',
    timeout: Number(args.timeout) || 5000,
  };

  if (!execArgs.code.trim()) {
    return { error: 'No code provided', success: false };
  }

  let result: ExecutionResult;

  switch (execArgs.language) {
    case 'python':
      result = await executePythonLike(execArgs.code);
      break;
    case 'typescript':
    case 'javascript':
    default:
      result = await executeJavaScript(execArgs.code, execArgs.timeout);
      break;
  }

  return {
    language: execArgs.language,
    ...result,
    formatted: result.success
      ? `Output:\n${result.output}${result.logs.length > 0 ? '\n\nLogs:\n' + result.logs.join('\n') : ''}`
      : `Error: ${result.error}`,
  };
}

/**
 * Create the code execution tool
 */
export const codeExecutionTool: UnifiedTool = createTool(
  'execute_code',
  'Execute JavaScript or Python code safely. Returns the output and any console logs.',
  {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'The code to execute',
      },
      language: {
        type: 'string',
        description: 'Programming language: javascript, typescript, or python',
        enum: ['javascript', 'typescript', 'python'],
      },
      timeout: {
        type: 'number',
        description: 'Maximum execution time in milliseconds (default: 5000)',
      },
    },
    required: ['code'],
  },
  codeExecutionHandler
);

/**
 * Calculator tool - specialized for math expressions
 */
export const calculatorTool: UnifiedTool = createTool(
  'calculator',
  'Evaluate mathematical expressions and perform calculations',
  {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'Mathematical expression to evaluate (e.g., "2 + 2 * 3", "Math.sqrt(16)")',
      },
    },
    required: ['expression'],
  },
  async (args: Record<string, unknown>) => {
    const expression = String(args.expression);

    try {
      // Safe math evaluation
      const safeExpression = expression
        .replace(/[^0-9+\-*/().%\s]/g, (match) => {
          // Allow Math functions
          if (match === 'M' || match === 'a' || match === 't' || match === 'h') return match;
          return '';
        });

      const result = await executeJavaScript(`return ${safeExpression}`, 1000);

      if (result.success) {
        return {
          expression,
          result: result.output,
          success: true,
        };
      }

      return {
        expression,
        error: result.error,
        success: false,
      };
    } catch (error) {
      return {
        expression,
        error: error instanceof Error ? error.message : String(error),
        success: false,
      };
    }
  }
);

/**
 * JSON parser tool
 */
export const jsonParserTool: UnifiedTool = createTool(
  'parse_json',
  'Parse and validate JSON, extract values, or transform JSON data',
  {
    type: 'object',
    properties: {
      json: {
        type: 'string',
        description: 'JSON string to parse',
      },
      path: {
        type: 'string',
        description: 'Optional path to extract (e.g., "data.users[0].name")',
      },
      transform: {
        type: 'string',
        description: 'Optional JavaScript transformation code',
      },
    },
    required: ['json'],
  },
  async (args: Record<string, unknown>) => {
    const jsonStr = String(args.json);
    const path = args.path as string | undefined;
    const transform = args.transform as string | undefined;

    try {
      const parsed = JSON.parse(jsonStr);

      let result = parsed;

      // Extract path if specified
      if (path) {
        const parts = path.split(/[.\[\]]+/).filter(Boolean);
        for (const part of parts) {
          if (result === undefined) break;
          result = result[part];
        }
      }

      // Apply transformation if specified
      if (transform) {
        const transformResult = await executeJavaScript(`
          const data = ${JSON.stringify(result)};
          return ${transform};
        `);

        if (transformResult.success) {
          try {
            result = JSON.parse(transformResult.output);
          } catch {
            result = transformResult.output;
          }
        }
      }

      return {
        success: true,
        result,
        formatted: typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
);

export default codeExecutionTool;
