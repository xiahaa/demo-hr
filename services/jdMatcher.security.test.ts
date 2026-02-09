import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeJDMatch } from './jdMatcher';
import { JobDescription } from '../types';

// Mock process.env
vi.stubEnv('DEEPSEEK_API_KEY', 'test-key');

// Mock pdf service to avoid loading pdfjs-dist which fails in node environment
vi.mock('./pdf', () => ({
  parsePDF: vi.fn(),
  extractCandidateInfoFromPDF: vi.fn(),
}));

describe('JD Matcher Security (SSRF)', () => {
  const mockJobDescription: JobDescription = {
    industry: 'Tech',
    companyName: 'Test Corp',
    jobDescription: 'Software Engineer',
  };

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should block access to localhost', async () => {
    const jd = { ...mockJobDescription, resumeUrl: 'http://localhost/resume.txt' };

    await expect(analyzeJDMatch(jd)).rejects.toThrow(/private network|blocked/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should block access to 127.0.0.1', async () => {
    const jd = { ...mockJobDescription, resumeUrl: 'http://127.0.0.1/resume.txt' };

    await expect(analyzeJDMatch(jd)).rejects.toThrow(/private network|blocked/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should block access to integer IPs (2130706433 -> 127.0.0.1)', async () => {
    const jd = { ...mockJobDescription, resumeUrl: 'http://2130706433/resume.txt' };

    await expect(analyzeJDMatch(jd)).rejects.toThrow(/private network|blocked/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should block access to octal IPs (0177.0.0.1 -> 127.0.0.1)', async () => {
    const jd = { ...mockJobDescription, resumeUrl: 'http://0177.0.0.1/resume.txt' };

    await expect(analyzeJDMatch(jd)).rejects.toThrow(/private network|blocked/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should block access to hex IPs (0x7f.0.0.1 -> 127.0.0.1)', async () => {
     const jd = { ...mockJobDescription, resumeUrl: 'http://0x7f.0.0.1/resume.txt' };

    await expect(analyzeJDMatch(jd)).rejects.toThrow(/private network|blocked/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should block access to IPv6 localhost ([::1])', async () => {
    const jd = { ...mockJobDescription, resumeUrl: 'http://[::1]/resume.txt' };

    await expect(analyzeJDMatch(jd)).rejects.toThrow(/private network|blocked/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should allow public URLs', async () => {
    const jd = { ...mockJobDescription, resumeUrl: 'https://example.com/resume.txt' };

    // Mock successful fetch
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'text/plain' },
      text: async () => 'Resume content with enough length to pass the minimum requirement of 100 characters. '.repeat(5),
    });

    // Mock AI response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({ overallScore: 80 }) } }]
      })
    });

    const result = await analyzeJDMatch(jd);
    expect(result).toBeDefined();
    // Verify first fetch was to the resume URL
    expect(global.fetch).toHaveBeenNthCalledWith(1, expect.stringContaining('example.com'), expect.anything());
  });

  it('should truncate excessively long resume content and separate system/user roles', async () => {
    // 60k chars
    const longResume = 'A'.repeat(60000);

    const jd = {
      industry: 'Tech',
      companyName: 'Test Corp',
      jobDescription: 'Dev',
      resumeUrl: 'https://example.com/resume.txt'
    };

    // Mock Resume Fetch
    const fetchMock = global.fetch as any;
    fetchMock.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'text/plain' },
      text: () => Promise.resolve(longResume)
    });

    // Mock AI Fetch
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: JSON.stringify({ overallScore: 85 }) } }]
      })
    });

    await analyzeJDMatch(jd);

    // Verify AI call
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const aiCall = fetchMock.mock.calls[1];
    const [url, options] = aiCall;

    expect(url).toContain('api.deepseek.com');
    const body = JSON.parse(options.body as string);

    // Check Messages Structure
    expect(body.messages).toHaveLength(2);
    expect(body.messages[0].role).toBe('system');
    expect(body.messages[1].role).toBe('user');

    // Check Truncation
    const userContent = body.messages[1].content;
    // userContent format is "# Job Details:...\n\n# Candidate Resume/Profile:\n" + resumeContent
    // The resume content part should be truncated to 50000 'A's.
    const aCount = (userContent.match(/A/g) || []).length;
    expect(aCount).toBe(50000); // Should be truncated to MAX_RESUME_LENGTH
  });
});
