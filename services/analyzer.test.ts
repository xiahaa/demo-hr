import { describe, it, expect } from 'vitest';
import { parseGitHubUsername, validateScholarUrl, sanitizeInputText, sanitizeUrl } from './analyzer';

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
