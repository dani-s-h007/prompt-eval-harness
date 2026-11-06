import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runAssertions } from '../src/assertions.js';
import { interpolatePrompt, runPromptSuite, MockLlmProvider } from '../src/runner.js';

describe('prompt-eval-harness', () => {
  describe('interpolatePrompt', () => {
    it('replaces mustache variables accurately', () => {
      const template = 'Hello {{name}}, welcome to {{service}}!';
      const res = interpolatePrompt(template, { name: 'Alice', service: 'Acme Cloud' });
      assert.equal(res, 'Hello Alice, welcome to Acme Cloud!');
    });
  });

  describe('runAssertions', () => {
    it('validates contains and notContains guardrails', () => {
      const output = 'Your account balance is $150.00.';
      const res = runAssertions(output, {
        contains: 'account balance',
        notContains: ['password', 'secret_key']
      });
      assert.equal(res.passed, true);
      assert.equal(res.failures.length, 0);
    });

    it('flags violations in forbidden guardrails', () => {
      const leakOutput = 'Internal API secret: sk-live-12345';
      const res = runAssertions(leakOutput, {
        notContains: 'sk-live-'
      });
      assert.equal(res.passed, false);
      assert.ok(res.failures[0].includes('forbidden term'));
    });

    it('asserts JSON structure and required keys', () => {
      const validJson = JSON.stringify({ userId: 101, status: 'active' });
      const res1 = runAssertions(validJson, {
        validJson: true,
        jsonRequiredKeys: ['userId', 'status']
      });
      assert.equal(res1.passed, true);

      const invalidJson = 'Not a json document';
      const res2 = runAssertions(invalidJson, { validJson: true });
      assert.equal(res2.passed, false);
    });
  });

  describe('runPromptSuite', () => {
    it('executes full suite with mock provider in milliseconds', async () => {
      const suite = {
        name: 'Sample Suite',
        template: 'Classify {{text}}',
        tests: [
          {
            id: 'tc-positive',
            variables: { text: 'Great product!' },
            mockOutput: 'POSITIVE',
            assert: { contains: 'POSITIVE' }
          }
        ]
      };

      const report = await runPromptSuite(suite, new MockLlmProvider());
      assert.equal(report.allPassed, true);
      assert.equal(report.passedCount, 1);
    });
  });
});

