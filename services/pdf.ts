import * as pdfjsLib from 'pdfjs-dist';
import { extractText, getDocumentProxy } from 'unpdf';

// Set worker source for PDF.js
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

// Constants for PDF parsing
const PDF_PARSE_TIMEOUT_MS = 30000; // 30 seconds timeout for PDF parsing
const PDF_PARSE_MAX_RETRIES = 2; // Maximum retry attempts
const PDF_PARSE_RETRY_DELAY_MS = 1000; // Initial retry delay (exponential backoff)
const PDF_MIN_TEXT_LENGTH = 10; // Minimum text length to consider parsing successful
const PDF_SIGNATURE = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // "%PDF" header

// Constants for information extraction
const RESUME_HEADER_KEYWORDS = ['resume', 'curriculum', 'vitae', 'cv', '@', 'phone', 'email', 'address'];
const SKILL_DELIMITERS = /[,;•·|●○◦▪▫–—]/;
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

// Section header keywords for resume parsing
const SKILLS_KEYWORDS = ['skills?', 'technical\\s+skills?', '技能', 'expertise', 'competencies', 'technologies', 'proficiencies', 'core\\s+competenc(?:y|ies)'];
const EXPERIENCE_KEYWORDS = ['professional\\s+experience', 'work\\s+experience', 'experience', '工作经历', 'employment', 'work\\s+history', 'career\\s+history'];
const EDUCATION_KEYWORDS = ['education', '教育背景', 'academic', 'qualifications', '学历'];

export interface PDFData {
  text: string;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
    producer?: string;
  };
  numPages: number;
}

/**
 * Error class for PDF parsing failures
 */
class PDFParseError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'PDFParseError';
  }
}

/**
 * Validates that the ArrayBuffer contains a valid PDF file structure
 * @param arrayBuffer - The buffer to validate
 * @returns true if valid PDF, false otherwise
 */
function validatePDFStructure(arrayBuffer: ArrayBuffer): boolean {
  try {
    if (arrayBuffer.byteLength < 4) {
      return false;
    }
    
    const header = new Uint8Array(arrayBuffer.slice(0, 4));
    
    // Check for PDF signature "%PDF"
    for (let i = 0; i < PDF_SIGNATURE.length; i++) {
      if (header[i] !== PDF_SIGNATURE[i]) {
        return false;
      }
    }
    
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Wraps a promise with a timeout
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param errorMessage - Error message to throw on timeout
 * @returns Promise that rejects if timeout is exceeded
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    })
  ]);
}

/**
 * Retry a function with exponential backoff
 * @param fn - The function to retry
 * @param maxRetries - Maximum number of retries
 * @param baseDelayMs - Base delay for exponential backoff
 * @returns Result of the function
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  baseDelayMs: number
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate exponential backoff delay
      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Parses a PDF file using unpdf library (enhanced PDF parser)
 * Falls back to pdfjs-dist if unpdf fails
 * @param arrayBuffer - The PDF file as ArrayBuffer
 * @returns PDFData containing text, metadata, and page count
 */
async function parsePDFWithUnpdf(arrayBuffer: ArrayBuffer): Promise<PDFData> {
  // Use unpdf's extractText for better text extraction
  const { text, totalPages, metadata } = await extractText(arrayBuffer, { 
    mergePages: true,
    // Add better spacing between text items
    itemSeparator: ' ',
  });
  
  return {
    text: text || '',
    metadata: metadata ? {
      title: metadata.title,
      author: metadata.author,
      subject: metadata.subject,
      keywords: metadata.keywords,
      creator: metadata.creator,
      producer: metadata.producer,
    } : undefined,
    numPages: totalPages || 0
  };
}

/**
 * Parses a PDF file using pdfjs-dist library (fallback method)
 * @param arrayBuffer - The PDF file as ArrayBuffer
 * @returns PDFData containing text, metadata, and page count
 */
async function parsePDFWithPDFJS(arrayBuffer: ArrayBuffer): Promise<PDFData> {
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  // Extract metadata
  const metadata = await pdf.getMetadata().catch(() => ({ info: null, metadata: null }));
  
  // Extract text from all pages with better spacing
  const textParts: string[] = [];
  const numPages = pdf.numPages;
  
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    // Improved text extraction with better spacing and line breaks
    let lastY = -1;
    let pageText = '';
    
    for (const item of textContent.items as any[]) {
      // Add line break if Y position changed significantly (new line)
      if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 5) {
        pageText += '\n';
      }
      pageText += item.str + ' ';
      lastY = item.transform[5];
    }
    
    textParts.push(pageText.trim());
  }
  
  return {
    text: textParts.join('\n\n'), // Double newline between pages
    metadata: metadata.info ? {
      title: metadata.info.Title,
      author: metadata.info.Author,
      subject: metadata.info.Subject,
      keywords: metadata.info.Keywords,
      creator: metadata.info.Creator,
      producer: metadata.info.Producer,
    } : undefined,
    numPages: numPages
  };
}

/**
 * Parses a PDF file and extracts text content and metadata
 * Uses unpdf (enhanced parser) with pdfjs-dist as fallback
 * Includes retry logic, timeout protection, and structure validation
 * @param file - The PDF file to parse (File or ArrayBuffer)
 * @returns PDFData containing text, metadata, and page count
 */
export async function parsePDF(file: File | ArrayBuffer): Promise<PDFData> {
  try {
    let arrayBuffer: ArrayBuffer;
    
    if (file instanceof File) {
      arrayBuffer = await file.arrayBuffer();
    } else {
      arrayBuffer = file;
    }

    // Validate PDF structure before attempting to parse
    if (!validatePDFStructure(arrayBuffer)) {
      throw new PDFParseError('Invalid PDF file: File does not have a valid PDF header. Please ensure the file is a valid PDF document.');
    }

    // Define parsing function with retry and timeout
    const parseWithRetryAndTimeout = async (): Promise<PDFData> => {
      // Try unpdf first (more robust PDF parsing)
      try {
        const result = await retryWithBackoff(
          async () => withTimeout(
            parsePDFWithUnpdf(arrayBuffer),
            PDF_PARSE_TIMEOUT_MS,
            'PDF parsing timed out (unpdf). The file may be corrupted or too complex.'
          ),
          PDF_PARSE_MAX_RETRIES,
          PDF_PARSE_RETRY_DELAY_MS
        );
        
        // Validate that we got meaningful text
        if (!result.text || result.text.trim().length < PDF_MIN_TEXT_LENGTH) {
          throw new Error('No meaningful text extracted from PDF');
        }
        
        return result;
      } catch (unpdfError) {
        // Fallback to pdfjs-dist
        try {
          const result = await retryWithBackoff(
            async () => withTimeout(
              parsePDFWithPDFJS(arrayBuffer),
              PDF_PARSE_TIMEOUT_MS,
              'PDF parsing timed out (pdfjs-dist). The file may be corrupted or too complex.'
            ),
            PDF_PARSE_MAX_RETRIES,
            PDF_PARSE_RETRY_DELAY_MS
          );
          
          // Validate that we got meaningful text
          if (!result.text || result.text.trim().length < PDF_MIN_TEXT_LENGTH) {
            throw new Error('No meaningful text extracted from PDF using fallback parser');
          }
          
          return result;
        } catch (pdfjsError) {
          // Both parsers failed
          throw new PDFParseError(
            'Failed to parse PDF with all available parsers. The file may be corrupted, password-protected, or contain only images.',
            pdfjsError instanceof Error ? pdfjsError : new Error(String(pdfjsError))
          );
        }
      }
    };

    const result = await parseWithRetryAndTimeout();
    return result;
  } catch (err) {
    if (err instanceof PDFParseError) {
      throw err;
    }
    
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    throw new PDFParseError(
      `Failed to parse PDF file: ${errorMessage}. Please ensure the file is a valid, non-encrypted PDF document.`,
      err instanceof Error ? err : undefined
    );
  }
}

/**
 * Extracts relevant information from PDF text for candidate analysis
 * Enhanced with better pattern matching and text processing
 * @param pdfData - Parsed PDF data
 * @returns Structured information extracted from the PDF
 */
export function extractCandidateInfoFromPDF(pdfData: PDFData): {
  name?: string;
  email?: string;
  skills: string[];
  experience: string[];
  education: string[];
  summary: string;
} {
  const text = pdfData.text;
  
  // Split into lines for processing
  const lines = text.split(/\n+/).map(line => line.trim()).filter(Boolean);
  
  // Extract email using regex
  const emailMatches = text.match(EMAIL_REGEX);
  const email = emailMatches ? emailMatches[0] : undefined;
  
  // Extract name from metadata or first few lines
  let name = pdfData.metadata?.author || pdfData.metadata?.title;
  
  // If no name in metadata, try to find it in first few lines (common CV format)
  if (!name && lines.length > 0) {
    // Usually name is in the first 3 lines and is longer than 2 words
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      // Skip lines that are too short, too long, or contain common resume header keywords
      const shouldSkip = RESUME_HEADER_KEYWORDS.some(kw => line.toLowerCase().includes(kw));
      
      if (!shouldSkip && line.length > 3 && line.length < 60 && /[a-zA-Z]/.test(line)) {
        // Check if it looks like a name (has at least 2 words or is capitalized)
        const words = line.split(/\s+/);
        if (words.length >= 2 || /^[A-Z][a-z]+/.test(line)) {
          name = line;
          break;
        }
      }
    }
  }
  
  // Extract skills - looks for common skill section headers
  // Matches variations like "SKILLS", "Technical Skills", "Competencies", etc.
  const skills: string[] = [];
  const skillSectionRegex = new RegExp(`(?:^|\\n)\\s*(?:${SKILLS_KEYWORDS.join('|')})(?:\\s*:|\\s*$)`, 'im');
  const skillSectionMatch = text.match(skillSectionRegex);
  
  if (skillSectionMatch) {
    const skillStartIndex = skillSectionMatch.index! + skillSectionMatch[0].length;
    const skillText = text.substring(skillStartIndex, Math.min(skillStartIndex + 1000, text.length));
    const skillLines = skillText.split(/\n+/).slice(0, 15); // Get next 15 lines
    
    for (const line of skillLines) {
      const trimmedLine = line.trim();
      
      // Stop if we hit another section header
      if (trimmedLine.length > 0 && /^[A-Z\s]{5,}$/.test(trimmedLine) && trimmedLine.length < 40) {
        break;
      }
      
      if (trimmedLine.length > 2) {
        // Split by common delimiters and bullet points
        const items = trimmedLine.split(SKILL_DELIMITERS);
        items.forEach(item => {
          const cleaned = item.trim().replace(/^[-*]\s*/, ''); // Remove leading bullets/dashes
          if (cleaned.length > 1 && cleaned.length < 60 && /[a-zA-Z]/.test(cleaned)) {
            skills.push(cleaned);
          }
        });
      }
    }
  }
  
  // Extract experience - looks for experience/employment section headers
  // Matches variations like "EXPERIENCE", "Work History", "Professional Experience", etc.
  const experience: string[] = [];
  const expSectionRegex = new RegExp(`(?:^|\\n)\\s*(?:${EXPERIENCE_KEYWORDS.join('|')})(?:\\s*:|\\s*$)`, 'im');
  const expSectionMatch = text.match(expSectionRegex);
  
  if (expSectionMatch) {
    const expStartIndex = expSectionMatch.index! + expSectionMatch[0].length;
    const expText = text.substring(expStartIndex, Math.min(expStartIndex + 2000, text.length));
    const expLines = expText.split(/\n+/).slice(0, 30);
    
    let currentEntry = '';
    for (const line of expLines) {
      const trimmedLine = line.trim();
      
      // Stop if we hit another major section header
      if (trimmedLine.length > 0 && /^[A-Z\s]{5,}$/.test(trimmedLine) && trimmedLine.length < 40 && !currentEntry) {
        break;
      }
      
      currentEntry += trimmedLine + ' ';
      
      // If line contains a year range or date, it might be end of entry
      if (/\d{4}\s*[-–—]\s*(?:\d{4}|present|current)/i.test(trimmedLine)) {
        if (currentEntry.trim().length > 15) {
          experience.push(currentEntry.trim());
        }
        currentEntry = '';
      }
      // Also check for double newline in original text (paragraph break)
      else if (currentEntry.length > 100 && /\d{4}/.test(currentEntry)) {
        if (currentEntry.trim().length > 15) {
          experience.push(currentEntry.trim());
        }
        currentEntry = '';
      }
    }
    
    // Add final entry if exists
    if (currentEntry.trim().length > 15) {
      experience.push(currentEntry.trim());
    }
  }
  
  // Extract education - looks for education/academic section headers
  // Matches variations like "EDUCATION", "Academic Background", "Qualifications", etc.
  const education: string[] = [];
  const eduSectionRegex = new RegExp(`(?:^|\\n)\\s*(?:${EDUCATION_KEYWORDS.join('|')})(?:\\s*:|\\s*$)`, 'im');
  const eduSectionMatch = text.match(eduSectionRegex);
  
  if (eduSectionMatch) {
    const eduStartIndex = eduSectionMatch.index! + eduSectionMatch[0].length;
    const eduText = text.substring(eduStartIndex, Math.min(eduStartIndex + 1000, text.length));
    const eduLines = eduText.split(/\n+/).slice(0, 15);
    
    for (const line of eduLines) {
      const trimmedLine = line.trim();
      
      // Stop if we hit another section header
      if (trimmedLine.length > 0 && /^[A-Z\s]{5,}$/.test(trimmedLine) && trimmedLine.length < 40) {
        break;
      }
      
      if (trimmedLine.length > 5 && /[a-zA-Z]/.test(trimmedLine)) {
        education.push(trimmedLine);
      }
    }
  }
  
  // Create summary (first 500 characters of text, normalized)
  const summary = text.slice(0, 500).replace(/\s+/g, ' ').trim();
  
  return {
    name,
    email,
    skills: [...new Set(skills)].slice(0, 20), // Remove duplicates, limit to 20 skills
    experience: experience.slice(0, 5), // Limit to 5 experience entries
    education: education.slice(0, 5), // Limit to 5 education entries
    summary
  };
}
