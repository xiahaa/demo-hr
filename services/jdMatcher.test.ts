import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobDescription } from '../types';

// Mock pdf service to avoid loading pdfjs-dist which fails in Node env
vi.mock('./pdf', () => ({
  parsePDF: vi.fn(),
  extractCandidateInfoFromPDF: vi.fn()
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
  resumeUrl: 'https://example.com/resume.html'
};

// Mock fetch
global.fetch = vi.fn();

const LONG_RESUME_TEXT = `
  Full Name: Java Expert
  Experience:
  - Senior Java Developer at Tech Corp (2020-Present)
    * Built scalable microservices using Spring Boot
    * Optimized database queries for PostgreSQL
  - Junior Developer at StartUp Inc (2018-2020)
    * Developed frontend using React and TypeScript
  Skills: Java, Spring Boot, React, TypeScript, SQL, Docker, Kubernetes
  Education:
  - BS in Computer Science, University of Tech
`.repeat(5);

const LONG_RESUME_HTML = `
<html>
  <body>
    <h1>Resume</h1>
    <script>alert('malicious')</script>
    <div class="content">
      ${LONG_RESUME_TEXT.replace(/\n/g, '<br>')}
    </div>
  </body>
</html>
`;

describe('analyzeJDMatch', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.DEEPSEEK_API_KEY = 'test-key';
  });

  it('should process HTML resume correctly using fallback regex in Node', async () => {
    // Mock resume response
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'text/html' },
        text: () => Promise.resolve(LONG_RESUME_HTML)
      })
      // Mock API response
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: JSON.stringify({ overallScore: 80 }) } }]
        })
      });

    const result = await analyzeJDMatch(mockJD);
    expect(result.overallScore).toBe(80);
  });

  it('should process HTML resume using DOMParser when available', async () => {
    // Mock DOMParser
    const mockRemove = vi.fn();
    const mockParseFromString = vi.fn((html: string) => {
      // Return a mocked document structure
      return {
        querySelectorAll: () => [{ remove: mockRemove }], // Mock finding one script/style
        body: {
          // After script removal, innerHTML should contain the text content
          // We simulate what DOMParser would produce after removal
          innerHTML: `<h1>Resume</h1> <div class="content">${LONG_RESUME_TEXT.replace(/\n/g, '<br>')}</div>`
        }
      };
    });

    const originalDOMParser = global.DOMParser;
    global.DOMParser = class MockDOMParser {
      parseFromString = mockParseFromString;
    } as any;

    try {
       // Mock resume response
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => 'text/html' },
          text: () => Promise.resolve(LONG_RESUME_HTML)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: JSON.stringify({ overallScore: 90 }) } }]
          })
        });

      const result = await analyzeJDMatch(mockJD);
      expect(result.overallScore).toBe(90);
      expect(mockParseFromString).toHaveBeenCalled();
      expect(mockRemove).toHaveBeenCalled();

    } finally {
      if (originalDOMParser) {
        global.DOMParser = originalDOMParser;
      } else {
        // @ts-ignore
        delete global.DOMParser;
      }
    }
  });
});
