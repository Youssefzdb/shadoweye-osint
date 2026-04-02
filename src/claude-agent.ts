/**
 * Claude Agent - True Claude-like behavior with ReAct pattern
 * Implements Reasoning + Acting for intelligent problem solving
 */

import { ccproxyService, type CCProxyResponse } from './ccproxy';
import type { ModelRegistry } from './models';
import type { ToolRegistry } from './tools';
import type { CommandRegistry } from './commands';
import { CLAUDE_SYSTEM_PROMPT, REACT_PROMPT } from './claude-system-prompt';

interface ReActStep {
  type: 'thought' | 'action' | 'observation' | 'final_answer';
  content: string;
  timestamp: string;
  toolUsed?: string;
  success?: boolean;
}

interface ThinkingProcess {
  initialAnalysis: string;
  steps: ReActStep[];
  finalReasoning: string;
  conclusion: string;
}

interface ClaudeAgentResponse {
  success: boolean;
  message: string;
  thinking?: ThinkingProcess;
  toolsUsed: string[];
  executionTime: number;
  metadata: {
    model: string;
    autonomyLevel: 'full' | 'semi' | 'manual';
    selfCorrected: boolean;
    iterationCount: number;
  };
}

export class ClaudeAgent {
  private modelRegistry: ModelRegistry;
  private toolRegistry: ToolRegistry;
  private commandRegistry: CommandRegistry;
  private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  private systemPrompt: string;

  constructor(
    models: ModelRegistry,
    tools: ToolRegistry,
    commands: CommandRegistry
  ) {
    this.modelRegistry = models;
    this.toolRegistry = tools;
    this.commandRegistry = commands;
    this.systemPrompt = CLAUDE_SYSTEM_PROMPT + '\n\n' + REACT_PROMPT;
  }

  /**
   * Main method: Think, Act, Observe, Iterate
   * Returns Claude-style response with reasoning
   */
  async execute(userRequest: string): Promise<ClaudeAgentResponse> {
    const startTime = Date.now();
    const thinking: ThinkingProcess = {
      initialAnalysis: '',
      steps: [],
      finalReasoning: '',
      conclusion: '',
    };

    const toolsUsed: string[] = [];
    let iterationCount = 0;
    let selfCorrected = false;

    try {
      // Add to conversation history
      this.conversationHistory.push({
        role: 'user',
        content: userRequest,
      });

      // Step 1: THOUGHT - Analyze the request
      thinking.initialAnalysis = await this.analyzeRequest(userRequest);
      thinking.steps.push({
        type: 'thought',
        content: thinking.initialAnalysis,
        timestamp: new Date().toISOString(),
      });

      // Step 2: Determine which tools/commands are needed
      const toolPlan = await this.planToolUsage(userRequest, thinking.initialAnalysis);

      // Step 3: ACTION - Execute tools/commands
      let actionResult = '';
      if (toolPlan.tools.length > 0 || toolPlan.commands.length > 0) {
        const executionResult = await this.executeTools(toolPlan.tools, toolPlan.commands);
        actionResult = executionResult.result;
        toolsUsed.push(...executionResult.toolsUsed);

        thinking.steps.push({
          type: 'action',
          content: `Executed ${executionResult.toolsUsed.length} tools/commands`,
          timestamp: new Date().toISOString(),
          toolUsed: executionResult.toolsUsed.join(', '),
          success: executionResult.success,
        });

        // Step 4: OBSERVATION - Analyze results
        const observation = await this.analyzeResults(userRequest, actionResult);
        thinking.steps.push({
          type: 'observation',
          content: observation,
          timestamp: new Date().toISOString(),
        });

        iterationCount = 1;

        // Step 5: Check if we need to iterate (self-correction)
        if (await this.needsIteration(observation, actionResult)) {
          selfCorrected = true;
          const correctionResult = await this.iterateAndCorrect(
            userRequest,
            actionResult,
            observation
          );
          actionResult = correctionResult;
          iterationCount++;
        }
      }

      // Step 6: FINAL ANSWER - Synthesize response
      const finalAnswer = await this.synthesizeAnswer(userRequest, actionResult, thinking);
      thinking.conclusion = finalAnswer;
      thinking.steps.push({
        type: 'final_answer',
        content: finalAnswer,
        timestamp: new Date().toISOString(),
      });

      // Add to conversation history
      this.conversationHistory.push({
        role: 'assistant',
        content: finalAnswer,
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        message: finalAnswer,
        thinking,
        toolsUsed,
        executionTime,
        metadata: {
          model: ccproxyService.getModel(),
          autonomyLevel: 'full',
          selfCorrected,
          iterationCount,
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('[Claude Agent] Error:', error);

      return {
        success: false,
        message: `Error: ${String(error)}`,
        toolsUsed,
        executionTime,
        metadata: {
          model: ccproxyService.getModel(),
          autonomyLevel: 'full',
          selfCorrected,
          iterationCount,
        },
      };
    }
  }

  /**
   * Analyze the user request carefully
   */
  private async analyzeRequest(request: string): Promise<string> {
    const prompt = `Analyze this request: "${request}"
    
What is the user trying to accomplish? What are the key requirements?
Think step-by-step about the best approach.
Be concise but thorough.`;

    const response = await ccproxyService.ask(prompt);
    return response.success ? response.text : 'Analysis failed';
  }

  /**
   * Plan which tools and commands to use
   */
  private async planToolUsage(
    request: string,
    analysis: string
  ): Promise<{ tools: string[]; commands: string[] }> {
    const availableTools = this.toolRegistry.getAll().map((t) => t.id);
    const availableCommands = this.commandRegistry.getAll().map((c) => c.id);

    const prompt = `Given this request: "${request}"
    
Analysis: ${analysis}

Available tools: ${availableTools.join(', ')}
Available commands: ${availableCommands.join(', ')}

Which tools and commands would be most useful?
Return as JSON: { "tools": [...], "commands": [...] }`;

    const response = await ccproxyService.ask(prompt);

    try {
      if (response.success) {
        const parsed = JSON.parse(response.text);
        return {
          tools: Array.isArray(parsed.tools) ? parsed.tools : [],
          commands: Array.isArray(parsed.commands) ? parsed.commands : [],
        };
      }
    } catch (e) {
      console.error('[Claude Agent] Parse error:', e);
    }

    return { tools: [], commands: [] };
  }

  /**
   * Execute selected tools and commands
   */
  private async executeTools(
    tools: string[],
    commands: string[]
  ): Promise<{ result: string; toolsUsed: string[]; success: boolean }> {
    const results: string[] = [];
    const executed: string[] = [];

    // Execute tools
    for (const toolId of tools) {
      const tool = this.toolRegistry.getAll().find((t) => t.id === toolId);
      if (tool) {
        try {
          const result = await tool.execute({});
          results.push(`[${toolId}] ${result}`);
          executed.push(toolId);
        } catch (error) {
          results.push(`[${toolId}] Error: ${String(error)}`);
        }
      }
    }

    // Execute commands
    for (const cmdId of commands) {
      const cmd = this.commandRegistry.getAll().find((c) => c.id === cmdId);
      if (cmd) {
        try {
          const result = await cmd.execute({});
          results.push(`[${cmdId}] ${result}`);
          executed.push(cmdId);
        } catch (error) {
          results.push(`[${cmdId}] Error: ${String(error)}`);
        }
      }
    }

    return {
      result: results.join('\n'),
      toolsUsed: executed,
      success: executed.length > 0,
    };
  }

  /**
   * Analyze the results from tools/commands
   */
  private async analyzeResults(request: string, results: string): Promise<string> {
    const prompt = `Original request: "${request}"
    
Tool/Command results:
${results}

What do these results tell us? Do they answer the original request?
Are there any issues or gaps?`;

    const response = await ccproxyService.ask(prompt);
    return response.success ? response.text : 'Analysis incomplete';
  }

  /**
   * Check if we need to iterate and fix issues
   */
  private async needsIteration(observation: string, results: string): Promise<boolean> {
    // Simple heuristic: if observation mentions issues/gaps, iterate
    const hasIssues = observation.toLowerCase().includes('issue')
      || observation.toLowerCase().includes('error')
      || observation.toLowerCase().includes('gap')
      || observation.toLowerCase().includes('incomplete');

    return hasIssues && results.length < 100; // Simple threshold
  }

  /**
   * Iterate and correct based on observations
   */
  private async iterateAndCorrect(
    request: string,
    previousResult: string,
    observation: string
  ): Promise<string> {
    const prompt = `Original request: "${request}"
    
Previous result was incomplete.
Observation: ${observation}

How should we correct this? What additional steps are needed?
Provide a detailed correction or improvement.`;

    const response = await ccproxyService.ask(prompt);
    return response.success
      ? `${previousResult}\n\n[CORRECTION]\n${response.text}`
      : previousResult;
  }

  /**
   * Synthesize final answer in Claude style
   */
  private async synthesizeAnswer(
    request: string,
    results: string,
    thinking: ThinkingProcess
  ): Promise<string> {
    const conversationContext = this.conversationHistory
      .slice(-4) // Last 4 messages for context
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    const prompt = `${this.systemPrompt}

Conversation context:
${conversationContext}

User request: "${request}"

Based on the analysis and results:
${results}

Provide a comprehensive, helpful Claude-style response that:
1. Directly addresses the user's request
2. Shows your reasoning when appropriate
3. Provides clear, actionable information
4. Uses clean formatting
5. Is concise but thorough`;

    const response = await ccproxyService.ask(prompt);
    return response.success
      ? response.text
      : 'I encountered an error processing your request. Please try again.';
  }

  /**
   * Get conversation history
   */
  getHistory(): typeof this.conversationHistory {
    return this.conversationHistory;
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }
}
