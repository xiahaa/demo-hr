
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeJDMatch } from './jdMatcher';
import { JobDescription } from '../types';

// Mock dependencies
vi.mock('./pdf', () => ({
  parsePDF: vi.fn(),
}));

vi.mock('./mineru', () => ({
  extractWithMineru: vi.fn(),
}));

vi.mock('./website', () => ({
  isPrivateHostname: vi.fn().mockReturnValue(false),
}));

// Mock global fetch
global.fetch = vi.fn();

const mockJD: JobDescription = {
  companyName: 'Test Corp',
  industry: 'Tech',
  jobDescription: 'Developer role',
  resumeUrl: 'https://example.com/resume.txt'
};

describe('analyzeJDMatch Binary Detection', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.DEEPSEEK_API_KEY = 'test-key';
  });

  it('should reject resume content with high ratio of non-printable characters', async () => {
    // Create content with > 5% non-printable characters
    // 500 chars total, 30 non-printable (6%)
    const normalText = 'A'.repeat(470);
    const binaryText = String.fromCharCode(0).repeat(30);
    const content = normalText + binaryText;

    (global.fetch as any).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(content),
      headers: { get: () => 'text/plain' }
    });

    await expect(analyzeJDMatch(mockJD)).rejects.toThrow('Resume content appears to be corrupted or in an unsupported format');
  });

  it('should accept resume content with low ratio of non-printable characters', async () => {
    // Create content with < 5% non-printable characters
    // 500 chars total, 20 non-printable (4%)
    const normalText = 'A'.repeat(480);
    const binaryText = String.fromCharCode(0).repeat(20);
    const content = normalText + binaryText;

    (global.fetch as any).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(content),
      headers: { get: () => 'text/plain' }
    });

    // Mock successful AI response
    (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('api.deepseek.com')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    choices: [{ message: { content: JSON.stringify({ overallScore: 80 }) } }]
                })
            });
        }
        return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(content),
            headers: { get: () => 'text/plain' }
        });
    });

    const result = await analyzeJDMatch(mockJD);
    expect(result.overallScore).toBe(80);
  });
});
