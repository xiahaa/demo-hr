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
    const mockRepos = Array(30).fill(0).map((_, i) => ({ name: `repo-${i}`, fork: false }));

    const start = Date.now();
    const result = await aggregateLanguageStats('testuser', mockRepos);
    const end = Date.now();

    const duration = end - start;
    console.log(`Duration: ${duration}ms`);

    // Verify correctness
    // 15 repos (limit) * 100 TS = 1500 TS
    expect(result.languageStats['TypeScript']).toBe(1500);
    expect(result.languageStats['JavaScript']).toBe(750);
    expect(result.repoCount['TypeScript']).toBe(15);

    // Verify performance
    // Target: 15 repos / 5 concurrency = 3 batches
    // 3 batches * (50ms network + overhead) ~= 150ms + overhead
    // Allowing generous buffer for test env
    expect(duration).toBeLessThan(1000);
  });

  it('should prioritize non-fork repositories', async () => {
    // Mock response for fetchRepoLanguages
    (global.fetch as any).mockImplementation(async (url: string) => {
      if (url.includes('/languages')) {
          return {
            ok: true,
            json: async () => ({ TypeScript: 100 }),
          };
      }
      return { ok: false };
    });

    // Create 20 forks and 10 non-forks
    // Repos 0-19 are forks, 20-29 are sources
    const mockRepos = [
        ...Array(20).fill(0).map((_, i) => ({ name: `fork-${i}`, fork: true })),
        ...Array(10).fill(0).map((_, i) => ({ name: `source-${i}`, fork: false }))
    ];

    const result = await aggregateLanguageStats('testuser', mockRepos);

    // We expect 15 repos to be analyzed.
    // 10 sources (all prioritized) + 5 forks (fallback)
    // 15 * 100 = 1500 TS
    expect(result.languageStats['TypeScript']).toBe(1500);

    const calls = (global.fetch as any).mock.calls;
    const languageCalls = calls.filter((c: any[]) => c[0].includes('/languages'));

    // Verify total calls
    expect(languageCalls.length).toBe(15);

    // Verify all source repos were called
    const sourceCalls = languageCalls.filter((c: any[]) => c[0].includes('source-'));
    expect(sourceCalls.length).toBe(10);

    // Verify only 5 fork repos were called
    const forkCalls = languageCalls.filter((c: any[]) => c[0].includes('fork-'));
    expect(forkCalls.length).toBe(5);
  });
});
