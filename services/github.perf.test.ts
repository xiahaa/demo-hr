
import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest';
import { fetchGitHubProfile } from './github';

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

describe('GitHub API Performance', () => {
  const originalFetch = global.fetch;
  let cloneSpy: any;

  beforeEach(() => {
    localStorageMock.clear();
    cloneSpy = vi.fn();

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      const mockData = { login: 'testuser', id: 123 };

      return {
        ok: true,
        status: 200,
        json: async () => mockData,
        clone: () => {
          cloneSpy();
          return {
            json: async () => mockData
          };
        }
      };
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should NOT call clone() anymore', async () => {
    await fetchGitHubProfile('testuser');

    // OPTIMIZED BEHAVIOR: clone() IS NOT called
    expect(cloneSpy).not.toHaveBeenCalled();
  });
});
