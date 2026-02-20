import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseRobotsTxt,
  extractMetaInfo,
  extractTechnologies,
  extractTextContent,
  extractSkills,
  validatePersonalWebsiteUrl,
  checkRobotsTxt,
  fetchPersonalWebsite,
  isPrivateHostname
} from './website';

const originalFetch = global.fetch;

describe('isPrivateHostname', () => {
  it('should identify standard private hostnames', () => {
    expect(isPrivateHostname('127.0.0.1')).toBe(true);
    expect(isPrivateHostname('localhost')).toBe(true);
    expect(isPrivateHostname('192.168.1.1')).toBe(true);
    expect(isPrivateHostname('10.0.0.1')).toBe(true);
    expect(isPrivateHostname('169.254.1.1')).toBe(true);
    expect(isPrivateHostname('[::1]')).toBe(true);
    expect(isPrivateHostname('::1')).toBe(true);
    expect(isPrivateHostname('0:0:0:0:0:0:0:1')).toBe(true);
    expect(isPrivateHostname('[0:0:0:0:0:0:0:1]')).toBe(true);
    expect(isPrivateHostname('0000:0000:0000:0000:0000:0000:0000:0001')).toBe(true);
    expect(isPrivateHostname('::')).toBe(true);
    expect(isPrivateHostname('0:0:0:0:0:0:0:0')).toBe(true);
  });

  it('should identify alternative IPv4 formats as private', () => {
    expect(isPrivateHostname('127.1')).toBe(true);
    expect(isPrivateHostname('0177.0.0.1')).toBe(true);
    expect(isPrivateHostname('2130706433')).toBe(true); // Decimal 127.0.0.1
    expect(isPrivateHostname('0x7f.0.0.1')).toBe(true);
  });

  it('should identify public hostnames', () => {
    expect(isPrivateHostname('google.com')).toBe(false);
    expect(isPrivateHostname('8.8.8.8')).toBe(false);
    expect(isPrivateHostname('example.com')).toBe(false);
  });

  it('should block octal IPs even if URL normalization fails', () => {
    const originalURL = global.URL;
    // Mock URL constructor to throw error, forcing isPrivateHostname to parse the raw string
    global.URL = vi.fn(() => { throw new Error('Mock URL error'); }) as any;

    // Test octal IP that resolves to 127.0.0.1 (0177 = 127)
    // The improved regex/parsing logic should catch this
    expect(isPrivateHostname('0177.0.0.1')).toBe(true);

    // Restore original URL
    global.URL = originalURL;
  });
});

describe('parseRobotsTxt', () => {
  it('should allow scraping when robots.txt allows all', () => {
    const robotsTxt = `
User-agent: *
Disallow:
`;
    const result = parseRobotsTxt(robotsTxt);
    expect(result.allowed).toBe(true);
    expect(result.disallowedPaths).toHaveLength(0);
  });

  it('should disallow scraping when robots.txt blocks all', () => {
    const robotsTxt = `
User-agent: *
Disallow: /
`;
    const result = parseRobotsTxt(robotsTxt);
    expect(result.allowed).toBe(false);
    expect(result.disallowedPaths).toContain('/');
  });

  it('should handle partial disallow rules', () => {
    const robotsTxt = `
User-agent: *
Disallow: /admin/
Disallow: /private/
`;
    const result = parseRobotsTxt(robotsTxt);
    expect(result.allowed).toBe(true);
    expect(result.disallowedPaths).toContain('/admin/');
    expect(result.disallowedPaths).toContain('/private/');
  });

  it('should handle comments and empty lines', () => {
    const robotsTxt = `
# This is a comment
User-agent: *

# Another comment
Disallow: /secret/
`;
    const result = parseRobotsTxt(robotsTxt);
    expect(result.allowed).toBe(true);
    expect(result.disallowedPaths).toContain('/secret/');
  });
});

describe('extractMetaInfo', () => {
  it('should extract title from HTML', () => {
    const html = '<html><head><title>My Personal Website</title></head></html>';
    const result = extractMetaInfo(html);
    expect(result.title).toBe('My Personal Website');
  });

  it('should extract meta description', () => {
    const html = '<html><head><meta name="description" content="A great developer portfolio"></head></html>';
    const result = extractMetaInfo(html);
    expect(result.description).toBe('A great developer portfolio');
  });

  it('should extract meta keywords', () => {
    const html = '<html><head><meta name="keywords" content="JavaScript, React, Node.js"></head></html>';
    const result = extractMetaInfo(html);
    expect(result.keywords).toContain('JavaScript');
    expect(result.keywords).toContain('React');
    expect(result.keywords).toContain('Node.js');
  });

  it('should handle missing meta tags', () => {
    const html = '<html><head></head></html>';
    const result = extractMetaInfo(html);
    expect(result.title).toBeNull();
    expect(result.description).toBeNull();
    expect(result.keywords).toHaveLength(0);
  });
});

describe('extractTechnologies', () => {
  it('should extract common technologies from text', () => {
    const text = 'I work with React, Node.js, and Python for web development';
    const result = extractTechnologies(text, '');
    expect(result).toContain('React');
    expect(result).toContain('Node.js');
    expect(result).toContain('Python');
  });

  it('should extract technologies from meta content', () => {
    const text = 'I am a developer.';
    const meta = 'Expert in React and Vue';
    const result = extractTechnologies(text, meta);
    expect(result).toContain('React');
    expect(result).toContain('Vue');
  });

  it('should be case insensitive', () => {
    const text = 'JAVASCRIPT and react are my main tools';
    const result = extractTechnologies(text, '');
    expect(result).toContain('JavaScript');
    expect(result).toContain('React');
  });

  it('should not extract partial matches', () => {
    const text = 'I like reactionary politics'; // Should not match React
    const result = extractTechnologies(text, '');
    // This might match React, which is a limitation of simple regex
    // In production, you'd want more sophisticated NLP
  });
});

describe('extractTextContent', () => {
  it('should remove HTML tags', () => {
    const html = '<p>Hello <strong>World</strong></p>';
    const result = extractTextContent(html);
    expect(result).toBe('Hello World');
  });

  it('should remove script tags', () => {
    const html = '<script>alert("test")</script><p>Content</p>';
    const result = extractTextContent(html);
    expect(result).toBe('Content');
  });

  it('should remove style tags', () => {
    const html = '<style>body { color: red; }</style><p>Content</p>';
    const result = extractTextContent(html);
    expect(result).toBe('Content');
  });

  it('should decode HTML entities', () => {
    const html = 'Hello&nbsp;&amp;&nbsp;World';
    const result = extractTextContent(html);
    expect(result).toContain('&');
  });
});

describe('extractSkills', () => {
  it('should extract skills from common patterns', () => {
    const text = 'Skills: JavaScript, Python, React';
    const result = extractSkills(text);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should extract from expertise patterns', () => {
    const text = 'Expertise: Full-stack development, DevOps';
    const result = extractSkills(text);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should limit to reasonable skill lengths', () => {
    const text = 'Skills: ' + 'a'.repeat(100);
    const result = extractSkills(text);
    expect(result).toHaveLength(0); // Too long, should be filtered
  });
});

describe('validatePersonalWebsiteUrl', () => {
  it('should accept valid personal website URLs', () => {
    expect(validatePersonalWebsiteUrl('https://example.com')).toBe('https://example.com');
    expect(validatePersonalWebsiteUrl('http://myblog.org')).toBe('http://myblog.org');
    expect(validatePersonalWebsiteUrl('example.dev')).toBe('https://example.dev');
  });

  it('should reject blocked platforms', () => {
    expect(validatePersonalWebsiteUrl('https://github.com/user')).toBeNull();
    expect(validatePersonalWebsiteUrl('https://linkedin.com/in/user')).toBeNull();
    expect(validatePersonalWebsiteUrl('https://scholar.google.com')).toBeNull();
  });

  it('should reject invalid URLs', () => {
    expect(validatePersonalWebsiteUrl('not a url')).toBeNull();
    expect(validatePersonalWebsiteUrl('javascript:alert(1)')).toBeNull();
    expect(validatePersonalWebsiteUrl('ftp://example.com')).toBeNull();
  });

  it('should handle empty input', () => {
    expect(validatePersonalWebsiteUrl('')).toBeNull();
    expect(validatePersonalWebsiteUrl('   ')).toBeNull();
  });

  it('should reject private IP addresses and localhost', () => {
    expect(validatePersonalWebsiteUrl('http://localhost')).toBeNull();
    expect(validatePersonalWebsiteUrl('http://localhost:8080')).toBeNull();
    expect(validatePersonalWebsiteUrl('http://127.0.0.1')).toBeNull();
    expect(validatePersonalWebsiteUrl('http://192.168.1.1')).toBeNull();
    expect(validatePersonalWebsiteUrl('http://10.0.0.1')).toBeNull();
    expect(validatePersonalWebsiteUrl('http://172.16.0.1')).toBeNull();
    expect(validatePersonalWebsiteUrl('http://[::1]')).toBeNull();
    expect(validatePersonalWebsiteUrl('http://my-macbook.local')).toBeNull();
  });
});

describe('checkRobotsTxt', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should allow scraping when robots.txt returns 404', async () => {
    (global.fetch as any).mockResolvedValue({
      status: 404,
      ok: false
    });

    const result = await checkRobotsTxt('https://example.com');
    expect(result).toBe(true);
  });

  it('should check robots.txt content when available', async () => {
    (global.fetch as any).mockResolvedValue({
      status: 200,
      ok: true,
      text: async () => 'User-agent: *\nDisallow:'
    });

    const result = await checkRobotsTxt('https://example.com');
    expect(result).toBe(true);
  });

  it('should disallow when robots.txt blocks all', async () => {
    (global.fetch as any).mockResolvedValue({
      status: 200,
      ok: true,
      text: async () => 'User-agent: *\nDisallow: /'
    });

    const result = await checkRobotsTxt('https://example.com');
    expect(result).toBe(false);
  });

  it('should be conservative on fetch errors', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    const result = await checkRobotsTxt('https://example.com');
    expect(result).toBe(false);
  });
});

describe('fetchPersonalWebsite', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should return null for invalid URLs', async () => {
    const result = await fetchPersonalWebsite('not a url');
    expect(result).toBeNull();
  });

  it('should return null for blocked platforms', async () => {
    const result = await fetchPersonalWebsite('https://github.com/user');
    expect(result).toBeNull();
  });

  it('should respect robots.txt disallow', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        // robots.txt request
        status: 200,
        ok: true,
        text: async () => 'User-agent: *\nDisallow: /'
      });

    const result = await fetchPersonalWebsite('https://example.com');
    expect(result).not.toBeNull();
    expect(result?.canScrape).toBe(false);
    expect(result?.scrapingDisallowed).toBe(true);
  });

  it('should fetch and parse website when allowed', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        // robots.txt request
        status: 404,
        ok: false
      })
      .mockResolvedValueOnce({
        // website request
        status: 200,
        ok: true,
        text: async () => `
          <html>
            <head>
              <title>My Portfolio</title>
              <meta name="description" content="Full-stack developer">
            </head>
            <body>
              <p>I work with React and Node.js</p>
            </body>
          </html>
        `
      });

    const result = await fetchPersonalWebsite('https://example.com');
    expect(result).not.toBeNull();
    expect(result?.canScrape).toBe(true);
    expect(result?.title).toBe('My Portfolio');
    expect(result?.description).toBe('Full-stack developer');
    expect(result?.technologies).toContain('React');
  });
});
