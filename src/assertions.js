/**
 * prompt-eval-harness: Assertion Engine & Guardrails
 */

export function runAssertions(output, assertions = {}) {
  const failures = [];
  const text = typeof output === 'string' ? output : JSON.stringify(output);

  // 1. contains
  if (assertions.contains) {
    const list = Array.isArray(assertions.contains) ? assertions.contains : [assertions.contains];
    for (const term of list) {
      if (!text.includes(term)) {
        failures.push(`Expected output to contain "${term}"`);
      }
    }
  }

  // 2. notContains (guardrail)
  if (assertions.notContains) {
    const list = Array.isArray(assertions.notContains) ? assertions.notContains : [assertions.notContains];
    for (const term of list) {
      if (text.includes(term)) {
        failures.push(`Expected output NOT to contain forbidden term "${term}"`);
      }
    }
  }

  // 3. matchesRegex
  if (assertions.matchesRegex) {
    const regex = new RegExp(assertions.matchesRegex);
    if (!regex.test(text)) {
      failures.push(`Output failed regex check: /${assertions.matchesRegex}/`);
    }
  }

  // 4. validJson
  if (assertions.validJson) {
    try {
      const parsed = JSON.parse(text);
      if (assertions.jsonRequiredKeys && Array.isArray(assertions.jsonRequiredKeys)) {
        for (const key of assertions.jsonRequiredKeys) {
          if (!(key in parsed)) {
            failures.push(`JSON output is missing required key "${key}"`);
          }
        }
      }
    } catch {
      failures.push('Expected valid JSON output, but failed to parse');
    }
  }

  // 5. maxTokens (approximate token limit)
  if (assertions.maxTokens) {
    const estimatedTokens = Math.ceil(text.length * 0.28);
    if (estimatedTokens > assertions.maxTokens) {
      failures.push(`Output token count (~${estimatedTokens}) exceeded budget of ${assertions.maxTokens} tokens`);
    }
  }

  return {
    passed: failures.length === 0,
    failures
  };
}

