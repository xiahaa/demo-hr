import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseGitHubUsername, validateScholarUrl, sanitizeInputText, getCacheKey, analyzeCandidate, sanitizeUrl } from './analyzer';
import * as github from './github';

// Mock github services
vi.mock('./github', () => ({
  fetchGitHubProfile: vi.fn(),
  fetchGitHubRepos: vi.fn(),
  searchForEmail: vi.fn(),
  aggregateLanguageStats: vi.fn(),
  calculateTechStackFromLanguages: vi.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

// Polyfill localStorage
if (typeof global.localStorage === 'undefined') {
  Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true // allow tests to override if needed
  });
}

describe('parseGitHubUsername', () => {
  it('should accept valid usernames from URLs', () => {
    expect(parseGitHubUsername('https://github.com/torvalds')).toBe('torvalds');
    expect(parseGitHubUsername('github.com/user-name')).toBe('user-name');
    expect(parseGitHubUsername('https://github.com/user123')).toBe('user123');
  });

  it('should reject invalid usernames', () => {
    // Starts with hyphen
    expect(parseGitHubUsername('-user')).toBe('');
    // Ends with hyphen
    expect(parseGitHubUsername('user-')).toBe('');
    // Consecutive hyphens
    expect(parseGitHubUsername('user--name')).toBe('');
    // Space
    expect(parseGitHubUsername('user name')).toBe('');
    // Malicious payload
    expect(parseGitHubUsername('javascript:alert(1)')).toBe('');
    // Special chars
    expect(parseGitHubUsername('invalid!')).toBe('');
    // Too long
    expect(parseGitHubUsername('a'.repeat(40))).toBe('');
  });

  // Current implementation limitation: plain usernames without URL structure (e.g. "torvalds")
  // are interpreted as hostnames by the URL constructor, resulting in an empty string.
  it('should return empty for simple username input (current limitation)', () => {
    expect(parseGitHubUsername('torvalds')).toBe('');
  });
});

describe('sanitizeUrl', () => {
  it('should accept valid http/https URLs', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
  });

  it('should add https protocol to urls without protocol', () => {
    expect(sanitizeUrl('example.com')).toBe('https://example.com/');
    expect(sanitizeUrl('www.google.com')).toBe('https://www.google.com/');
  });

  it('should reject dangerous schemes', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeUndefined();
    expect(sanitizeUrl('data:text/html,alert(1)')).toBeUndefined();
    expect(sanitizeUrl('vbscript:msgbox')).toBeUndefined();
    expect(sanitizeUrl('file:///etc/passwd')).toBeUndefined();
  });
});

describe('validateScholarUrl', () => {
  it('should accept valid http/https URLs', () => {
    expect(validateScholarUrl('https://scholar.google.com/citations?user=123')).toBe('https://scholar.google.com/citations?user=123');
    expect(validateScholarUrl('http://scholar.google.com/citations?user=123')).toBe('http://scholar.google.com/citations?user=123');
  });

  it('should normalize URLs without protocol', () => {
    expect(validateScholarUrl('scholar.google.com')).toBe('https://scholar.google.com/');
  });

  it('should reject invalid URLs', () => {
    expect(validateScholarUrl('ftp://scholar.google.com')).toBeUndefined();
    expect(validateScholarUrl('')).toBeUndefined();
  });

  it('should reject dangerous schemes', () => {
    expect(validateScholarUrl('javascript:alert(1)')).toBeUndefined();
    expect(validateScholarUrl('data:text/html,alert(1)')).toBeUndefined();
  });
});

describe('sanitizeInputText', () => {
  it('should return original text if within limit', () => {
    expect(sanitizeInputText('hello', 10)).toBe('hello');
  });

  it('should truncate text if exceeding limit', () => {
    expect(sanitizeInputText('hello world', 5)).toBe('hello');
  });

  it('should handle empty input', () => {
    expect(sanitizeInputText('', 10)).toBe('');
  });
});

describe('Caching Logic', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  it('should generate consistent cache keys', () => {
    const key1 = getCacheKey('user1', 'http://scholar.com', 'linkedin info');
    const key2 = getCacheKey('user1', 'http://scholar.com', 'linkedin info');
    expect(key1).toBe(key2);
  });

  it('should generate different keys for different inputs', () => {
    const key1 = getCacheKey('user1', 'http://scholar.com', 'linkedin info');
    const key2 = getCacheKey('user2', 'http://scholar.com', 'linkedin info');
    const key3 = getCacheKey('user1', 'http://other.com', 'linkedin info');
    expect(key1).not.toBe(key2);
    expect(key1).not.toBe(key3);
  });

  it('should return cached profile if available and valid', async () => {
    const username = 'cachedUser';
    const mockProfile = { username, name: 'Cached User' };
    const cacheKey = getCacheKey(username);

    // Seed cache
    localStorage.setItem(cacheKey, JSON.stringify({
      timestamp: Date.now(),
      data: mockProfile
    }));

    const result = await analyzeCandidate('https://github.com/cachedUser');

    expect(result).toEqual(mockProfile);
    expect(github.fetchGitHubProfile).not.toHaveBeenCalled();
  });

  it('should attempt to fetch fresh data if cache is expired', async () => {
    const username = 'expiredUser';
    const mockProfile = { username, name: 'Expired User' };
    const cacheKey = getCacheKey(username);

    // Seed expired cache (25 hours old)
    localStorage.setItem(cacheKey, JSON.stringify({
      timestamp: Date.now() - (25 * 60 * 60 * 1000),
      data: mockProfile
    }));

    // Mock fetchGitHubProfile to throw an error so we can verify it was called
    // (and stop execution before hitting other dependencies)
    vi.mocked(github.fetchGitHubProfile).mockImplementationOnce(() => {
      throw new Error('Fetch called');
    });

    await expect(analyzeCandidate('https://github.com/expiredUser'))
      .rejects.toThrow('Fetch called');

    expect(github.fetchGitHubProfile).toHaveBeenCalled();
  });
});
