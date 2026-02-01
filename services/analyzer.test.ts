import { describe, it, expect } from 'vitest';
import { parseGitHubUsername } from './analyzer';

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

  // Current implementation limitation: it fails to extract username if just the username is provided
  // without a path structure, returning empty string.
  it('should return empty for simple username input (current limitation)', () => {
     expect(parseGitHubUsername('torvalds')).toBe('');
  });
});
