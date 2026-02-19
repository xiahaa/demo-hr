
import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest';
import { aggregateLanguageStats, calculateTechStackFromLanguages } from './github';

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

describe('GitHub API Optimization Benchmarks', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorageMock.clear();
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      // Mock fast response
      return {
        ok: true,
        status: 200,
        json: async () => ({ TypeScript: 100 }),
        clone: () => ({ json: async () => ({ TypeScript: 100 }) })
      };
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('benchmark aggregateLanguageStats with many repos', async () => {
    // Create 1000 repos to stress test the filtering logic
    // 500 forks, 500 sources, shuffled
    const repos = [];
    for (let i = 0; i < 500; i++) {
        repos.push({ name: `source-${i}`, fork: false });
        repos.push({ name: `fork-${i}`, fork: true });
    }
    // Shuffle
    repos.sort(() => Math.random() - 0.5);

    const start = performance.now();
    await aggregateLanguageStats('testuser', repos);
    const end = performance.now();

    console.log(`aggregateLanguageStats (1000 repos) took: ${(end - start).toFixed(4)}ms`);

    // We expect this to be fast, but we want to see if our optimization makes it faster later.
    // The key is comparing before/after.
    expect(end - start).toBeLessThan(5000); // Generous timeout
  });

  it('benchmark calculateTechStackFromLanguages with many calls', () => {
    const stats = { TypeScript: 1000, JavaScript: 500, Python: 200 };
    const repoCount = { TypeScript: 10, JavaScript: 5, Python: 2 };

    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
        calculateTechStackFromLanguages(stats, repoCount);
    }
    const end = performance.now();

    console.log(`calculateTechStackFromLanguages (10000 calls) took: ${(end - start).toFixed(4)}ms`);
    expect(end - start).toBeLessThan(1000);
  });
});
