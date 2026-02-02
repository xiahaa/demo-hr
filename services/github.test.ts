import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest';
import { aggregateLanguageStats } from './github';

// Mock fetch globally
const originalFetch = global.fetch;

describe('aggregateLanguageStats', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should correctly aggregate stats and run efficiently', async () => {
    // Mock response for fetchRepoLanguages
    (global.fetch as any).mockImplementation(async (url: string) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 50));

      if (url.includes('/languages')) {
          return {
            ok: true,
            json: async () => ({ TypeScript: 100, JavaScript: 50 }),
          };
      }
      return { ok: false };
    });

    // Create 30 mock repos
    const mockRepos = Array(30).fill(0).map((_, i) => ({ name: `repo-${i}` }));

    const start = Date.now();
    const result = await aggregateLanguageStats('testuser', mockRepos);
    const end = Date.now();

    const duration = end - start;
    console.log(`Duration: ${duration}ms`);

    // Verify correctness
    // 30 repos * 100 TS = 3000 TS
    expect(result.languageStats['TypeScript']).toBe(3000);
    expect(result.languageStats['JavaScript']).toBe(1500);
    expect(result.repoCount['TypeScript']).toBe(30);

    // Verify performance
    // Current implementation: (50ms network + 100ms delay) * 30 = 4500ms
    // New implementation target: < 1500ms
    expect(duration).toBeLessThan(1500);
  });
});
