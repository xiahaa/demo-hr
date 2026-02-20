import { JobDescription, JDMatchResult, MatchScore } from "../types";
import { parsePDF } from "./pdf";
import { extractWithMineru } from "./mineru";
import { isPrivateHostname } from "./website";

// Validation constants
const MIN_RESUME_LENGTH = 100; // Minimum characters for valid resume content
const MAX_NON_PRINTABLE_RATIO = 0.05; // Maximum ratio of non-printable characters allowed (5%)
const MAX_RESUME_LENGTH = 50000; // Maximum characters for resume content (security & cost limit)

// Pre-compiled regex for block elements to avoid recompilation in recursive calls
const BLOCK_TAGS_REGEX = /^(div|p|h[1-6]|li|tr|header|footer|section|article|blockquote)$/i;

/**
 * Analyzes job description and resume/link for matching
 */
export async function analyzeJDMatch(jd: JobDescription, onProgress?: (msg: string) => void): Promise<JDMatchResult> {
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY;
  
  if (!apiKey) {
    throw new Error('DeepSeek API key not configured. Please set DEEPSEEK_API_KEY in .env file.');
  }

  let resumeContent = '';
  onProgress?.('Reading and parsing resume...');
  
  // Fetch resume content from URL or file
  if (jd.resumeUrl) {
    try {
      resumeContent = await fetchResumeFromUrl(jd.resumeUrl);
    } catch (err) {
      throw new Error(`Failed to fetch resume from URL: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  } else if (jd.resumeFile) {
    try {
      resumeContent = await readResumeFile(jd.resumeFile);
    } catch (err) {
      throw new Error(`Failed to read resume file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  } else {
    throw new Error('Please provide either a resume URL or upload a resume file');
  }

  // Security: Enforce maximum length to prevent DoS and token limit issues
  if (resumeContent.length > MAX_RESUME_LENGTH) {
    resumeContent = resumeContent.slice(0, MAX_RESUME_LENGTH);
  }

  // Validate resume content
  if (!resumeContent || resumeContent.trim().length < MIN_RESUME_LENGTH) {
    throw new Error(`Resume content is too short or empty. Please provide a valid resume with at least ${MIN_RESUME_LENGTH} characters.`);
  }

  // Check if content looks like binary data (contains many non-printable characters)
  // This check is safe because we already validated that resumeContent has minimum length above
  // OPTIMIZATION: Use regex replace instead of loop.
  // Benchmark shows this is ~50x faster for text (0.1ms vs 5.7ms) and ~3x faster for binary (1.5ms vs 3.9ms).
  // The regex removes all control characters (0x00-0x08, 0x0B, 0x0C, 0x0E-0x1F, 0x7F).
  // Note: 0x09 (Tab), 0x0A (LF), 0x0D (CR) are excluded as they are valid whitespace.
  const cleanContent = resumeContent.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  const nonPrintableCount = resumeContent.length - cleanContent.length;
  const nonPrintableRatio = nonPrintableCount / resumeContent.length;
  if (nonPrintableRatio > MAX_NON_PRINTABLE_RATIO) {
    throw new Error('Resume content appears to be corrupted or in an unsupported format. Please ensure the file is a valid text or PDF file.');
  }

  // Analyze with AI
  onProgress?.('Analyzing match with AI...');
  const prompt = buildMatchingPrompt(jd, resumeContent);
  const messages = [
    { role: 'system', content: prompt.system },
    { role: 'user', content: prompt.user }
  ];

  const aiResponse = await callDeepSeekAPI(messages, apiKey);
  
  return parseAIResponse(aiResponse);
}

/**
 * Fetch resume from URL (supports text, HTML pages, or LinkedIn/GitHub profiles)
 */
async function fetchResumeFromUrl(url: string): Promise<string> {
  const sanitizedUrl = sanitizeUrl(url);
  if (!sanitizedUrl) {
    throw new Error('Invalid URL format');
  }

  // Security check: Block private network access (SSRF)
  try {
    const hostname = new URL(sanitizedUrl).hostname;
    if (isPrivateHostname(hostname)) {
      throw new Error('Access to private network resources is blocked.');
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('blocked')) {
      throw err;
    }
    throw new Error('Invalid URL for security check');
  }

  let response;
  try {
    response = await fetch(sanitizedUrl, {
      headers: {
        'User-Agent': 'ZhimaBot/1.0 (HR JD Matcher; Contact: hr@zhima.ai)',
      },
      redirect: 'error' // Security: Prevent following redirects to private networks
    });
  } catch (err) {
    // Check if it's a redirect error or other fetch error
    if (err instanceof TypeError && err.message.includes('redirect')) {
      throw new Error('Redirects are not supported for security reasons. Please use the direct URL.');
    }
    throw err;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch URL (status ${response.status})`);
  }

  const contentType = response.headers.get('content-type') || '';
  
  if (contentType.includes('application/pdf')) {
    // Parse PDF from URL using Mineru API
    try {
      // Try mineru first for URL-based PDFs
      try {
        const result = await extractWithMineru(sanitizedUrl);
        return result.text;
      } catch (mineruErr) {
        // Fallback to local parsing if mineru fails
        // Only log in development to avoid exposing errors in production
        if (import.meta.env.DEV) {
          console.warn('Mineru parsing failed, falling back to local parser');
        }
        const arrayBuffer = await response.arrayBuffer();
        const pdfData = await parsePDF(arrayBuffer);
        return pdfData.text;
      }
    } catch (err) {
      throw new Error(`Failed to parse PDF from URL: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  const text = await response.text();
  
  // If HTML, extract text content
  if (contentType.includes('text/html')) {
    return extractTextFromHtml(text);
  }
  
  return text;
}

/**
 * Read resume from uploaded file
 */
async function readResumeFile(file: File): Promise<string> {
  if (file.type === 'application/pdf') {
    try {
      const pdfData = await parsePDF(file);
      return pdfData.text;
    } catch (err) {
      throw new Error(`Failed to parse PDF file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  // Security: Limit file reading to first 1MB to prevent memory exhaustion
  // 1MB is more than enough for a text resume (50,000 chars is ~50-200KB)
  const blob = file.slice(0, 1024 * 1024);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(blob);
  });
}

/**
 * Build the matching prompt for AI analysis
 */
function buildMatchingPrompt(jd: JobDescription, resumeContent: string): { system: string, user: string } {
  const systemPrompt = `You are an expert HR professional analyzing candidate fit for a job position.

# Task:
Analyze how well this candidate matches the job requirements. BE OBJECTIVE AND REALISTIC in your assessment. If the candidate's background is not relevant to the position, give a low score. Only give high scores (70+) when there is clear, strong alignment between the candidate's experience and the job requirements.

Provide:

1. Overall Match Score (0-100) - Be strict and realistic. Score should reflect actual fit.
2. Detailed category scores with explanations:
   - Technical Skills Match
   - Experience Level Match
   - Industry Knowledge Match
   - Cultural Fit
   - Educational Background
3. Key Strengths (how candidate excels for THIS specific role)
4. Gaps (what's missing or weak compared to job requirements)
5. Recommendations (for both candidate and hiring team)
6. Overall Fit Level (Excellent/Good/Fair/Poor)

Return your analysis in the following JSON format:
{
  "overallScore": number,
  "matchScores": [
    {"category": "Technical Skills", "score": number, "details": "explanation"},
    {"category": "Experience Level", "score": number, "details": "explanation"},
    {"category": "Industry Knowledge", "score": number, "details": "explanation"},
    {"category": "Cultural Fit", "score": number, "details": "explanation"},
    {"category": "Educational Background", "score": number, "details": "explanation"}
  ],
  "strengths": ["strength1", "strength2", ...],
  "gaps": ["gap1", "gap2", ...],
  "recommendations": ["rec1", "rec2", ...],
  "fitLevel": "Excellent" | "Good" | "Fair" | "Poor"
}`;

  const userPrompt = `# Job Details:
Industry: ${jd.industry}
Company: ${jd.companyName}
Job Description:
${jd.jobDescription}

# Candidate Resume/Profile:
${resumeContent}`;

  return { system: systemPrompt, user: userPrompt };
}

/**
 * Call DeepSeek API for analysis
 */
async function callDeepSeekAPI(messages: { role: string, content: string }[], apiKey: string): Promise<string> {
  const model = import.meta.env.VITE_DEEPSEEK_CHAT_MODEL || "deepseek-chat";
  
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Parse AI response into structured result
 */
function parseAIResponse(response: string): JDMatchResult {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate and return
    return {
      overallScore: Math.max(0, Math.min(100, parsed.overallScore || 0)),
      matchScores: parsed.matchScores || [],
      strengths: parsed.strengths || [],
      gaps: parsed.gaps || [],
      recommendations: parsed.recommendations || [],
      fitLevel: parsed.fitLevel || 'Fair',
    };
  } catch (err) {
    console.error('Failed to parse AI response:', err);
    throw new Error('Failed to parse AI analysis. Please try again.');
  }
}

/**
 * Helper to extract text from DOM node with structure preservation
 */
function extractTextFromNode(node: Node): string {
  if (node.nodeType === 3) { // Node.TEXT_NODE
    return node.textContent || '';
  }

  if (node.nodeType === 1) { // Node.ELEMENT_NODE
    const tagName = (node as Element).tagName.toLowerCase();

    // Skip script and style tags (safeguard)
    if (tagName === 'script' || tagName === 'style') return '';

    // Handle line breaks
    if (tagName === 'br') return '\n';

    let text = '';
    const isBlock = BLOCK_TAGS_REGEX.test(tagName);

    // Add newline before block elements
    if (isBlock) text += '\n';

    for (let i = 0; i < node.childNodes.length; i++) {
      text += extractTextFromNode(node.childNodes[i]);
    }

    // Add newline after block elements
    if (isBlock) text += '\n';

    return text;
  }

  return '';
}

function extractTextFromHtml(html: string): string {
  let text = html;

  // Optimized path for browser environments: Use DOMParser
  // This is significantly faster than the regex loop and safer against nested tags
  if (typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Remove script and style elements
      const elementsToRemove = doc.querySelectorAll('script, style');
      elementsToRemove.forEach(el => el.remove());

      // Extract text directly from DOM, preserving minimal structure
      return extractTextFromNode(doc.body).replace(/\s+/g, ' ').trim().substring(0, 50000);
    } catch (e) {
      console.warn('DOMParser failed, falling back to regex', e);
    }
  }

  // Fallback regex loop
  {
    // Remove script and style tags with their content (multiple iterations to handle nested tags)
    let previousLength = 0;

    // Iterate until no more script/style tags are found
    while (text.length !== previousLength) {
      previousLength = text.length;
      // Note: These regex patterns may not catch all malformed tags, but that's OK
      // because we remove ALL tags afterward and never render the result as HTML
      text = text.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gis, ' ');
      text = text.replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gis, ' ');
      // Also remove any orphaned script/style opening or closing tags
      text = text.replace(/<\/?script\b[^>]*>/gis, ' ');
      text = text.replace(/<\/?style\b[^>]*>/gis, ' ');
    }
  }
  
  // Remove all remaining HTML tags (final safeguard)
  text = text.replace(/<[^>]*>/g, ' ');
  
  // Decode HTML entities
  // Use DOMParser if available for safe decoding without executing scripts
  if (typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(text, 'text/html');
      text = doc.documentElement.textContent || text;
    } catch (e) {
      // Ignore parser errors and fall back to regex replacement
    }
  } else {
    // Fallback for non-browser environments or if DOMParser is unavailable
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    text = text.replace(/&amp;/g, '&'); // Decode & last to avoid double-decoding
  }
  
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  // Limit length for safety
  return text.substring(0, 50000);
}

/**
 * Sanitize and validate URL
 */
function sanitizeUrl(url: string): string | null {
  if (!url || !url.trim()) return null;
  
  const trimmed = url.trim();
  
  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    
    // Only allow http/https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    
    return parsed.toString();
  } catch {
    return null;
  }
}
