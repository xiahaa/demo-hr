import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractCandidateInfoFromPDF } from './pdf';

// Mock pdfjs-dist for Node.js environment
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(),
}));

describe('PDF Service', () => {
  describe('extractCandidateInfoFromPDF', () => {
    it('should extract email from PDF text', () => {
      const mockPdfData = {
        text: 'John Doe\nSoftware Engineer\nemail: john.doe@example.com\nPhone: 123-456-7890',
        numPages: 1
      };

      const result = extractCandidateInfoFromPDF(mockPdfData);

      expect(result.email).toBe('john.doe@example.com');
    });

    it('should extract skills from skills section', () => {
      const mockPdfData = {
        text: `
John Doe
Software Engineer

SKILLS
JavaScript, TypeScript, React
Node.js • Python • Docker

EXPERIENCE
Software Engineer at Tech Corp
        `,
        numPages: 1
      };

      const result = extractCandidateInfoFromPDF(mockPdfData);

      expect(result.skills.length).toBeGreaterThan(0);
      expect(result.skills).toContain('JavaScript');
    });

    it('should extract experience from experience section', () => {
      const mockPdfData = {
        text: `
EXPERIENCE
Software Engineer at Tech Corp
2020-2023
Developed web applications

Senior Developer at StartUp Inc
2018-2020
        `,
        numPages: 1
      };

      const result = extractCandidateInfoFromPDF(mockPdfData);

      expect(result.experience.length).toBeGreaterThan(0);
    });

    it('should extract education from education section', () => {
      const mockPdfData = {
        text: `
EDUCATION
Bachelor of Science in Computer Science
University of Technology
2014-2018
        `,
        numPages: 1
      };

      const result = extractCandidateInfoFromPDF(mockPdfData);

      expect(result.education.length).toBeGreaterThan(0);
    });

    it('should handle PDFs without structured sections', () => {
      const mockPdfData = {
        text: 'Random text without any structure',
        numPages: 1
      };

      const result = extractCandidateInfoFromPDF(mockPdfData);

      expect(result.skills).toEqual([]);
      expect(result.experience).toEqual([]);
      expect(result.education).toEqual([]);
      expect(result.summary).toBeTruthy();
    });

    it('should extract name from metadata', () => {
      const mockPdfData = {
        text: 'Some resume text',
        metadata: {
          author: 'Jane Smith'
        },
        numPages: 1
      };

      const result = extractCandidateInfoFromPDF(mockPdfData);

      expect(result.name).toBe('Jane Smith');
    });

    it('should create a summary from text', () => {
      const mockPdfData = {
        text: 'This is a long resume text that should be truncated. ' + 'a'.repeat(1000),
        numPages: 1
      };

      const result = extractCandidateInfoFromPDF(mockPdfData);

      expect(result.summary).toBeTruthy();
      expect(result.summary.length).toBeLessThanOrEqual(500);
    });

    it('should limit extracted items to reasonable counts', () => {
      const mockPdfData = {
        text: `
SKILLS
${Array(50).fill('Skill').map((s, i) => `${s}${i}`).join(', ')}

EXPERIENCE
${Array(20).fill('Job Title at Company\n2020-2021\n').join('')}

EDUCATION
${Array(10).fill('Degree at University\n2014-2018\n').join('')}
        `,
        numPages: 1
      };

      const result = extractCandidateInfoFromPDF(mockPdfData);

      expect(result.skills.length).toBeLessThanOrEqual(20);
      expect(result.experience.length).toBeLessThanOrEqual(5);
      expect(result.education.length).toBeLessThanOrEqual(5);
    });
  });
});
