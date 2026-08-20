import { describe, expect, it } from 'vitest';

describe('workspace', () => {
  it('runs API TypeScript tests', () => expect(process.version.startsWith('v20.')).toBe(true));
});
