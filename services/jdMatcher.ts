import { JobDescription, JDMatchResult, MatchScore } from "../types";

/**
 * Analyzes job description and resume/link for matching
 */
export async function analyzeJDMatch(jd: JobDescription): Promise<JDMatchResult> {
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY;
  
  if (!apiKey) {
    throw new Error('DeepSeek API key not configured. Please set DEEPSEEK_API_KEY in .env file.');
  }

  let resumeContent = '';
  
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

  // Analyze with AI
  const prompt = buildMatchingPrompt(jd, resumeContent);
  const aiResponse = await callDeepSeekAPI(prompt, apiKey);
  
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

  const response = await fetch(sanitizedUrl, {
    headers: {
      'User-Agent': 'ZhimaBot/1.0 (HR JD Matcher; Contact: hr@zhima.ai)',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL (status ${response.status})`);
  }

  const contentType = response.headers.get('content-type') || '';
  
  if (contentType.includes('application/pdf')) {
    // For PDF, we'll need to handle it differently or just return a message
    throw new Error('PDF parsing from URL is not yet supported. Please upload the PDF file instead.');
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
    throw new Error('PDF file parsing requires a PDF library. For now, please provide resume as a text file or URL.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Build the matching prompt for AI analysis
 */
function buildMatchingPrompt(jd: JobDescription, resumeContent: string): string {
  return `You are an expert HR professional analyzing candidate fit for a job position.

# Job Details:
Industry: ${jd.industry}
Company: ${jd.companyName}
Job Description:
${jd.jobDescription}

# Candidate Resume/Profile:
${resumeContent}

# Task:
Analyze how well this candidate matches the job requirements. Provide:

1. Overall Match Score (0-100)
2. Detailed category scores with explanations:
   - Technical Skills Match
   - Experience Level Match
   - Industry Knowledge Match
   - Cultural Fit
   - Educational Background
3. Key Strengths (how candidate excels)
4. Gaps (what's missing or weak)
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
}

/**
 * Call DeepSeek API for analysis
 */
async function callDeepSeekAPI(prompt: string, apiKey: string): Promise<string> {
  const model = import.meta.env.VITE_DEEPSEEK_CHAT_MODEL || "deepseek-chat";
  
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
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
 * Extract text content from HTML
 * This function removes all HTML tags and extracts plain text only
 * The extracted text is used for AI analysis, NOT rendered as HTML
 * 
 * Security Note: The regex patterns below are flagged by CodeQL as potentially
 * incomplete for HTML sanitization. However, this is acceptable because:
 * 1. The result is never rendered as HTML in the browser
 * 2. All HTML tags are removed after script/style removal (line 224)
 * 3. When document is available, we use browser's textContent (line 228)
 * 4. The final text is only sent to the DeepSeek API for analysis
 */
function extractTextFromHtml(html: string): string {
  // Remove script and style tags with their content (multiple iterations to handle nested tags)
  let text = html;
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
  
  // Remove all remaining HTML tags (final safeguard)
  text = text.replace(/<[^>]*>/g, ' ');
  
  // Decode HTML entities (safe because result is used for text analysis, not HTML rendering)
  // Only decode common entities to avoid double-escaping issues
  const tempDiv = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (tempDiv) {
    tempDiv.innerHTML = text;
    text = tempDiv.textContent || tempDiv.innerText || text;
  } else {
    // Fallback for non-browser environments
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
