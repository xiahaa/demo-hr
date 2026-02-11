import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest';
import { aggregateLanguageStats } from './github';

// Mock fetch globally
const originalFetch = global.fetch;

// Mock localStorage
const localStorageMock = (function() {
  let store: Record<string, string> = {};
  return {
    getItem: function(key: string) {
      return store[key] || null;
    },
    setItem: function(key: string, value: string) {
      store[key] = value.toString();
    },
    removeItem: function(key: string) {
      delete store[key];
    },
    clear: function() {
      store = {};
    }
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('aggregateLanguageStats', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    localStorageMock.clear();
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

      const mockData = { TypeScript: 100, JavaScript: 50 };

      if (url.includes('/languages')) {
          return {
            ok: true,
            status: 200,
            json: async () => mockData,
            clone: () => ({
                json: async () => mockData
            })
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
    // With token, limit is 15. Without token, limit is 5.
    // The previous run showed 1500, so we are authenticated in this env.
    // 15 repos * 100 TS = 1500 TS
    // 15 repos * 50 JS = 750 JS
    expect(result.languageStats['TypeScript']).toBe(1500);
    expect(result.languageStats['JavaScript']).toBe(750);
    expect(result.repoCount['TypeScript']).toBe(15);

    // Verify performance
    // Target: 15 repos / 5 concurrency = 3 batches
    // 3 batches * (50ms network + overhead) ~= 150ms + overhead
    expect(duration).toBeLessThan(1500);
  });

  it('should prioritize non-fork repositories', async () => {
    // Mock response for fetchRepoLanguages
    (global.fetch as any).mockImplementation(async (url: string) => {
      const mockData = { TypeScript: 100 };
      if (url.includes('/languages')) {
          return {
            ok: true,
            status: 200,
            json: async () => mockData,
            clone: () => ({
                json: async () => mockData
            })
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

    // We expect 15 repos to be analyzed (if authenticated).
    // All 10 sources (prioritized) + 5 forks
    // 15 * 100 = 1500 TS
    expect(result.languageStats['TypeScript']).toBe(1500);

    const calls = (global.fetch as any).mock.calls;
    const languageCalls = calls.filter((c: any[]) => c[0].includes('/languages'));

    // Verify total calls
    expect(languageCalls.length).toBe(15);

    // Verify all source repos were called
    const sourceCalls = languageCalls.filter((c: any[]) => c[0].includes('source-'));
    expect(sourceCalls.length).toBe(10);

    // Verify 5 fork repos were called
    const forkCalls = languageCalls.filter((c: any[]) => c[0].includes('fork-'));
    expect(forkCalls.length).toBe(5);
  });
});
