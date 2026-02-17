
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkRobotsTxt, fetchPersonalWebsite } from './website';

describe('website.ts SSRF Redirect Protection', () => {
  beforeEach(() => {
    // Mock global fetch
    global.fetch = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('checkRobotsTxt should prevent following redirects', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('User-agent: *\nDisallow: /'),
      status: 200
    });

    await checkRobotsTxt('https://example.com');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('robots.txt'),
      expect.objectContaining({
        redirect: 'error'
      })
    );
  });

  it('fetchPersonalWebsite should prevent following redirects', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<html><body>Content</body></html>'),
      status: 200,
      headers: { get: () => 'text/html' }
    });

    await fetchPersonalWebsite('https://example.com');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        redirect: 'error'
      })
    );
  });
});
