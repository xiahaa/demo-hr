
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchPersonalWebsite, checkRobotsTxt } from './website';

describe('website.ts SSRF Security', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
    // Mock URL to avoid network calls if any leak
    // but we use vi.fn() for fetch so it should be safe
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchPersonalWebsite should prevent following redirects', async () => {
    // Mock robots.txt check to pass (404 means allowed)
    (global.fetch as any).mockResolvedValueOnce({
      status: 404,
      ok: false
    });

    // Mock website fetch to succeed initially (to check arguments)
    (global.fetch as any).mockResolvedValueOnce({
      status: 200,
      ok: true,
      text: async () => '<html></html>'
    });

    await fetchPersonalWebsite('https://example.com');

    // Verify fetch was called with redirect: 'error'
    expect(global.fetch).toHaveBeenLastCalledWith(
      expect.stringContaining('https://example.com'),
      expect.objectContaining({
        redirect: 'error'
      })
    );
  });

  it('checkRobotsTxt should prevent following redirects', async () => {
    (global.fetch as any).mockResolvedValue({
      status: 200,
      ok: true,
      text: async () => 'User-agent: *'
    });

    await checkRobotsTxt('https://example.com');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/robots.txt'),
      expect.objectContaining({
        redirect: 'error'
      })
    );
  });
});
