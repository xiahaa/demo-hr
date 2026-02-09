import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeJDMatch } from './jdMatcher';
import { JobDescription } from '../types';

// Mock dependencies
vi.mock('./pdf', () => ({
  parsePDF: vi.fn(),
  extractCandidateInfoFromPDF: vi.fn()
}));

vi.mock('./website', () => ({
  isPrivateHostname: vi.fn(() => false), // Allow all hosts for this test
  sanitizeUrl: vi.fn((url) => url)
}));

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

const mockJD: JobDescription = {
  id: '1',
  companyName: 'Test Corp',
  industry: 'Tech',
  jobDescription: 'Developer needed',
  requirements: [],
  skills: [],
  location: 'Remote',
  salaryRange: '$100k',
  postedDate: '2023-01-01',
  resumeUrl: 'https://example.com/resume.txt'
};

const LONG_RESUME = 'A'.repeat(60000); // 60k chars, exceeds 50k limit

describe('analyzeJDMatch Security Fixes', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.DEEPSEEK_API_KEY = 'test-key';
  });

  it('should truncate resume content and use system role', async () => {
    // 1. Mock Resume Fetch Response (Long Text)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'text/plain' },
      text: () => Promise.resolve(LONG_RESUME)
    });

    // 2. Mock DeepSeek API Response
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: JSON.stringify({ overallScore: 85 }) } }]
      })
    });

    // 3. Run Analysis
    await analyzeJDMatch(mockJD);

    // 4. Verify DeepSeek API Call
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const deepSeekCall = fetchMock.mock.calls[1]; // Second call is to API
    const [url, options] = deepSeekCall;

    expect(url).toBe('https://api.deepseek.com/v1/chat/completions');

    const body = JSON.parse(options.body as string);

    // Check Messages Structure
    expect(body.messages).toHaveLength(2);
    expect(body.messages[0].role).toBe('system');
    expect(body.messages[1].role).toBe('user');

    // Check System Prompt Content
    expect(body.messages[0].content).toContain('You are an expert HR professional');
    expect(body.messages[0].content).toContain('Return your analysis in the following JSON format');

    // Check User Prompt Content Truncation
    const userContent = body.messages[1].content;
    expect(userContent).toContain('# Candidate Resume/Profile:');

    // Extract the resume part from user prompt
    // The prompt is: "# Job Details:...\n\n# Candidate Resume/Profile:\n" + resumeContent
    // So the total length depends on JD + Resume.
    // But we know the resume part should be truncated to 50000.
    // We can check if the total length is reasonable (e.g. < 55000) vs full (60000+)

    expect(userContent.length).toBeLessThan(60000);
    // Actually, exact check:
    // Resume is 60k 'A's.
    // Truncated to 50k.
    // User prompt contains truncated resume.
    // Let's verify 'A' count approx.
    const aCount = (userContent.match(/A/g) || []).length;
    expect(aCount).toBe(50000);
  });
});
