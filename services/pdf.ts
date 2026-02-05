import * as pdfjsLib from 'pdfjs-dist';

// Set worker source for PDF.js
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

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
  numpages: number;
}

/**
 * Parses a PDF file and extracts text content and metadata
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

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    // Extract metadata
    const metadata = await pdf.getMetadata().catch(() => ({ info: null, metadata: null }));
    
    // Extract text from all pages
    const textParts: string[] = [];
    const numPages = pdf.numPages;
    
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      textParts.push(pageText);
    }
    
    return {
      text: textParts.join('\n'),
      metadata: metadata.info ? {
        title: metadata.info.Title,
        author: metadata.info.Author,
        subject: metadata.info.Subject,
        keywords: metadata.info.Keywords,
        creator: metadata.info.Creator,
        producer: metadata.info.Producer,
      } : undefined,
      numpages: numPages
    };
  } catch (err) {
    console.error('Error parsing PDF:', err);
    throw new Error('Failed to parse PDF file. Please ensure the file is a valid PDF.');
  }
}

/**
 * Extracts relevant information from PDF text for candidate analysis
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
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  
  // Extract email using regex
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const emailMatch = text.match(emailRegex);
  const email = emailMatch ? emailMatch[0] : undefined;
  
  // Extract name from metadata or first few lines
  let name = pdfData.metadata?.author || pdfData.metadata?.title;
  
  // If no name in metadata, try to find it in first few lines (common CV format)
  if (!name && lines.length > 0) {
    // Usually name is in the first 3 lines and is longer than 2 words
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i];
      if (line.length > 5 && line.length < 50 && !line.includes('@') && !line.toLowerCase().includes('resume')) {
        name = line;
        break;
      }
    }
  }
  
  // Extract skills (look for common skill section headers)
  const skills: string[] = [];
  const skillSectionRegex = /(?:skills?|技能|expertise|competencies|technologies)/i;
  const skillSectionIndex = lines.findIndex(line => skillSectionRegex.test(line));
  
  if (skillSectionIndex !== -1) {
    // Extract skills from next 10 lines or until next section
    for (let i = skillSectionIndex + 1; i < Math.min(skillSectionIndex + 10, lines.length); i++) {
      const line = lines[i];
      // Stop if we hit another section header
      if (line.length > 0 && /^[A-Z\s]{3,}$/.test(line) && line.length < 30) {
        break;
      }
      if (line.length > 2) {
        // Split by common delimiters
        const items = line.split(/[,;•·|]/);
        items.forEach(item => {
          const trimmed = item.trim();
          if (trimmed.length > 1 && trimmed.length < 50) {
            skills.push(trimmed);
          }
        });
      }
    }
  }
  
  // Extract experience (look for experience section)
  const experience: string[] = [];
  const expSectionRegex = /(?:experience|工作经历|employment|work history)/i;
  const expSectionIndex = lines.findIndex(line => expSectionRegex.test(line));
  
  if (expSectionIndex !== -1) {
    // Extract experience entries (next 20 lines or until next section)
    let currentEntry = '';
    for (let i = expSectionIndex + 1; i < Math.min(expSectionIndex + 20, lines.length); i++) {
      const line = lines[i];
      // Stop if we hit another section header
      if (line.length > 0 && /^[A-Z\s]{3,}$/.test(line) && line.length < 30 && !currentEntry) {
        break;
      }
      currentEntry += line + ' ';
      // If line looks like a date or end of entry, save and reset
      if (/\d{4}/.test(line) || line.length === 0) {
        if (currentEntry.trim().length > 10) {
          experience.push(currentEntry.trim());
        }
        currentEntry = '';
      }
    }
    if (currentEntry.trim().length > 10) {
      experience.push(currentEntry.trim());
    }
  }
  
  // Extract education
  const education: string[] = [];
  const eduSectionRegex = /(?:education|教育背景|academic|qualifications)/i;
  const eduSectionIndex = lines.findIndex(line => eduSectionRegex.test(line));
  
  if (eduSectionIndex !== -1) {
    for (let i = eduSectionIndex + 1; i < Math.min(eduSectionIndex + 10, lines.length); i++) {
      const line = lines[i];
      if (line.length > 0 && /^[A-Z\s]{3,}$/.test(line) && line.length < 30) {
        break;
      }
      if (line.length > 5) {
        education.push(line);
      }
    }
  }
  
  // Create summary (first 500 characters of text)
  const summary = text.slice(0, 500).replace(/\s+/g, ' ').trim();
  
  return {
    name,
    email,
    skills: skills.slice(0, 20), // Limit to 20 skills
    experience: experience.slice(0, 5), // Limit to 5 experience entries
    education: education.slice(0, 5), // Limit to 5 education entries
    summary
  };
}
