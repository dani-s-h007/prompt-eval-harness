export interface PromptAssertions {
  contains?: string | string[];
  notContains?: string | string[];
  matchesRegex?: string;
  validJson?: boolean;
  jsonRequiredKeys?: string[];
  maxTokens?: number;
}

export interface PromptTestCase {
  id?: string;
  name?: string;
  prompt?: string;
  variables?: Record<string, any>;
  mockOutput?: string;
  assert?: PromptAssertions;
}

export interface PromptSuite {
  name?: string;
  template?: string;
  mocks?: Record<string, string>;
  tests: PromptTestCase[];
}

export interface TestResult {
  id: string;
  prompt: string;
  output: string;
  passed: boolean;
  failures: string[];
  durationMs: number;
}

export interface SuiteReport {
  suiteName: string;
  totalTests: number;
  passedCount: number;
  failedCount: number;
  allPassed: boolean;
  totalDurationMs: number;
  results: TestResult[];
}

export declare function runAssertions(output: string | any, assertions?: PromptAssertions): { passed: boolean; failures: string[] };
export declare function interpolatePrompt(template: string, variables?: Record<string, any>): string;
export declare function runPromptSuite(suite: PromptSuite, provider?: any): Promise<SuiteReport>;
export declare class MockLlmProvider {
  constructor(mockResponses?: Record<string, string | ((p: string) => string)>);
  complete(prompt: string): Promise<string>;
}

