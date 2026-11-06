/**
 * prompt-eval-harness: Test Runner & Mock Provider
 */

import { runAssertions } from './assertions.js';

export class MockLlmProvider {
  /**
   * @param {Record<string, string|((prompt: string) => string)>} [mockResponses]
   */
  constructor(mockResponses = {}) {
    this.mockResponses = mockResponses;
  }

  async complete(prompt) {
    for (const [key, resp] of Object.entries(this.mockResponses)) {
      if (prompt.includes(key)) {
        return typeof resp === 'function' ? resp(prompt) : resp;
      }
    }
    // Default mock response: echoes structured JSON
    return JSON.stringify({
      response: 'Processed prompt successfully',
      promptLength: prompt.length,
      status: 'completed'
    });
  }
}

export function interpolatePrompt(template, variables = {}) {
  let result = template;
  for (const [k, v] of Object.entries(variables)) {
    result = result.replaceAll(`{{${k}}}`, String(v));
  }
  return result;
}

export async function runPromptSuite(suite, provider = new MockLlmProvider()) {
  const results = [];
  const startTime = Date.now();

  for (const testCase of suite.tests) {
    const testStart = Date.now();
    const prompt = interpolatePrompt(testCase.prompt || suite.template || '', testCase.variables || {});

    let output = '';
    let executionError = null;

    try {
      if (testCase.mockOutput) {
        output = testCase.mockOutput;
      } else {
        output = await provider.complete(prompt);
      }
    } catch (err) {
      executionError = err.message;
    }

    const assertionResult = executionError
      ? { passed: false, failures: [`Execution error: ${executionError}`] }
      : runAssertions(output, testCase.assert || {});

    results.push({
      id: testCase.id || testCase.name || 'test',
      prompt,
      output,
      passed: assertionResult.passed,
      failures: assertionResult.failures,
      durationMs: Date.now() - testStart
    });
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  return {
    suiteName: suite.name || 'Prompt Evaluation Suite',
    totalTests: results.length,
    passedCount,
    failedCount,
    allPassed: failedCount === 0,
    totalDurationMs: Date.now() - startTime,
    results
  };
}

