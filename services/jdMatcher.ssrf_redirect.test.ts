
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JobDescription } from '../types';

// Mock pdf service to avoid loading pdfjs-dist which fails in Node env
vi.mock('./pdf', () => ({
  parsePDF: vi.fn(),
  extractCandidateInfoFromPDF: vi.fn()
}));

// Mock mineru service
vi.mock('./mineru', () => ({
  extractWithMineru: vi.fn()
}));

import { analyzeJDMatch } from './jdMatcher';

// Mock types
const mockJD: JobDescription = {
  id: '1',
  companyName: 'Test Corp',
  industry: 'Tech',
  jobDescription: 'Looking for a developer',
  requirements: [],
  skills: [],
  location: 'Remote',
  salaryRange: '$100k',
  postedDate: '2023-01-01',
  resumeUrl: 'http://malicious.com/redirect'
};

describe('analyzeJDMatch Security', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.DEEPSEEK_API_KEY = 'test-key';

    // Mock global fetch
    global.fetch = vi.fn();

    // Mock console.error/warn to keep output clean
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should prevent following redirects when fetching resume', async () => {
    // We want to ensure that fetch is called with redirect: 'error'
    // This prevents SSRF attacks where an external URL redirects to localhost/intranet

    // Setup fetch mock to succeed initially (so we can check the call arguments)
    (global.fetch as any).mockResolvedValue({
      ok: true,
      headers: { get: () => 'text/plain' },
      text: () => Promise.resolve('Resume content')
    });

    try {
      await analyzeJDMatch(mockJD);
    } catch (e) {
      // Ignore errors from subsequent steps (AI analysis etc)
    }

    // Verify fetch was called with redirect: 'error'
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('http://malicious.com/redirect'),
      expect.objectContaining({
        redirect: 'error'
      })
    );
  });
});
