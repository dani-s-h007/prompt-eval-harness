/**
 * prompt-eval-harness: CLI Interface
 */

import { parseArgs } from 'node:util';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runPromptSuite, MockLlmProvider } from './runner.js';

export async function runCli(argv = process.argv.slice(2)) {
  const options = {
    help: { type: 'boolean', short: 'h', default: false },
    version: { type: 'boolean', short: 'v', default: false },
    file: { type: 'string', short: 'f' },
    json: { type: 'boolean', default: false }
  };

  let parsed;
  try {
    parsed = parseArgs({ args: argv, options, allowPositionals: true });
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  const { values, positionals } = parsed;

  if (values.help) {
    printHelp();
    return 0;
  }

  if (values.version) {
    console.log('prompt-eval-harness v1.0.0');
    return 0;
  }

  const suiteFile = values.file || positionals[0];
  if (!suiteFile) {
    printHelp();
    return 0;
  }

  let suite;
  try {
    suite = JSON.parse(readFileSync(resolve(suiteFile), 'utf8'));
  } catch (err) {
    console.error(`Error reading suite "${suiteFile}": ${err.message}`);
    process.exit(1);
  }

  const report = await runPromptSuite(suite, new MockLlmProvider(suite.mocks || {}));

  if (values.json) {
    console.log(JSON.stringify(report, null, 2));
    if (!report.allPassed) process.exit(1);
    return 0;
  }

  console.log(`\n ${report.suiteName}`);
  console.log('============================================================');
  for (const res of report.results) {
    const badge = res.passed ? '\x1b[32m[PASS]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m';
    console.log(`${badge} ${res.id} (${res.durationMs}ms)`);
    if (!res.passed) {
      for (const fail of res.failures) {
        console.log(`     └─ \x1b[31m${fail}\x1b[0m`);
      }
      console.log(`     └─ Received Output: ${res.output.slice(0, 120)}...`);
    }
  }

  console.log('------------------------------------------------------------');
  console.log(`Results: ${report.passedCount} passed, ${report.failedCount} failed (${report.totalDurationMs}ms)`);
  console.log('============================================================\n');

  if (!report.allPassed) {
    process.exit(1);
  }

  return 0;
}

function printHelp() {
  console.log(`
prompt-eval-harness - Deterministic LLM Prompt Regression & Guardrails Test Runner

USAGE:
  $ prompt-eval-harness <suite.json> [flags]

FLAGS:
  -f, --file <path>     Path to evaluation suite JSON
      --json            Output machine-readable report
  -v, --version         Show version
  -h, --help            Show help

EXAMPLES:
  # Run prompt regression suite:
  $ prompt-eval-harness test/prompts.json

  # Run in CI and fail build if any assertion or guardrail fails:
  $ prompt-eval-harness test/prompts.json --json
`);
}

