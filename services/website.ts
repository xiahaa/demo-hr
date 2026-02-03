
/**
 * Personal website scraping service with robots.txt compliance
 * This module handles fetching and analyzing personal websites while respecting
 * robots.txt rules and implementing proper web scraping etiquette.
 */

export interface WebsiteInfo {
  url: string;
  title: string | null;
  description: string | null;
  technologies: string[];
  content: string;
  skills: string[];
  canScrape: boolean;
  scrapingDisallowed?: boolean;
}

/**
 * Parse robots.txt content to check if scraping is allowed
 */
export function parseRobotsTxt(robotsTxtContent: string, userAgent = '*'): {
  allowed: boolean;
  disallowedPaths: string[];
} {
  const lines = robotsTxtContent.split('\n');
  let currentUserAgent = '';
  const disallowedPaths: string[] = [];
  let foundUserAgent = false;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip comments and empty lines
    if (trimmed.startsWith('#') || !trimmed) continue;

    // Check for User-agent directive
    if (trimmed.toLowerCase().startsWith('user-agent:')) {
      currentUserAgent = trimmed.substring(11).trim().toLowerCase();
      if (currentUserAgent === userAgent.toLowerCase() || currentUserAgent === '*') {
        foundUserAgent = true;
      }
    }

    // Check for Disallow directive
    if (foundUserAgent && trimmed.toLowerCase().startsWith('disallow:')) {
      const path = trimmed.substring(9).trim();
      if (path) {
        disallowedPaths.push(path);
      }
    }
  }

  // If disallow is "/" or empty disallow (allowing all), check accordingly
  const allowed = disallowedPaths.length === 0 || !disallowedPaths.includes('/');

  return { allowed, disallowedPaths };
}

/**
 * Check if a URL can be scraped by checking robots.txt
 */
export async function checkRobotsTxt(url: string): Promise<boolean> {
  try {
    const urlObj = new URL(url);
    const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;

    const response = await fetch(robotsUrl, {
      headers: {
        'User-Agent': 'ZhimaBot/1.0 (HR Analysis Tool; Respects robots.txt)'
      }
    });

    // If robots.txt doesn't exist (404), assume scraping is allowed
    if (response.status === 404) {
      return true;
    }

    if (!response.ok) {
      // For other errors, be conservative and disallow
      console.warn(`Error fetching robots.txt for ${robotsUrl}: ${response.status}`);
      return false;
    }

    const robotsTxt = await response.text();
    const { allowed } = parseRobotsTxt(robotsTxt, '*');
    
    return allowed;
  } catch (error) {
    // If we can't check robots.txt (network error, etc.), be conservative
    console.error('Error checking robots.txt:', error);
    return false;
  }
}

/**
 * Extract meta tags and basic information from HTML content
 */
export function extractMetaInfo(html: string): {
  title: string | null;
  description: string | null;
  keywords: string[];
} {
  let title: string | null = null;
  let description: string | null = null;
  const keywords: string[] = [];

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }

  // Extract meta description
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  if (descMatch) {
    description = descMatch[1].trim();
  }

  // Extract meta keywords
  const keywordsMatch = html.match(/<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']/i);
  if (keywordsMatch) {
    const kws = keywordsMatch[1].split(',').map(k => k.trim()).filter(Boolean);
    keywords.push(...kws);
  }

  return { title, description, keywords };
}

/**
 * Extract technology mentions from HTML content
 */
export function extractTechnologies(html: string, textContent: string): string[] {
  const technologies = new Set<string>();

  // Common tech keywords to look for
  const techKeywords = [
    // Languages
    'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C\\+\\+', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin',
    // Frameworks
    'React', 'Vue', 'Angular', 'Node\\.js', 'Express', 'Django', 'Flask', 'Spring', 'Rails',
    // Databases
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch',
    // Cloud/DevOps
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Jenkins',
    // Other
    'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Data Science'
  ];

  const combinedContent = html + ' ' + textContent;
  
  for (const tech of techKeywords) {
    const regex = new RegExp(`\\b${tech}\\b`, 'gi');
    if (regex.test(combinedContent)) {
      // Normalize the match to the standard form
      technologies.add(tech.replace(/\\/g, ''));
    }
  }

  return Array.from(technologies);
}

/**
 * Extract plain text from HTML content
 */
export function extractTextContent(html: string): string {
  // Remove script and style tags
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
  
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  
  // Decode HTML entities (basic ones)
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

/**
 * Extract skills and expertise from text content
 */
export function extractSkills(textContent: string): string[] {
  const skills = new Set<string>();
  
  // Common skill-related keywords and phrases
  const skillPatterns = [
    /skills?:?\s*([^.]+)/gi,
    /expertise:?\s*([^.]+)/gi,
    /proficient\s+in:?\s*([^.]+)/gi,
    /experienced\s+with:?\s*([^.]+)/gi,
    /specializ(?:e|ing)\s+in:?\s*([^.]+)/gi,
  ];

  for (const pattern of skillPatterns) {
    const matches = textContent.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        // Split by common delimiters
        const items = match[1].split(/[,;•·\n]/)
          .map(s => s.trim())
          .filter(s => s.length > 0 && s.length < 50); // Filter reasonable lengths
        
        items.forEach(item => skills.add(item));
      }
    }
  }

  return Array.from(skills).slice(0, 10); // Limit to top 10 skills
}

/**
 * Validate and sanitize a personal website URL
 */
export function validatePersonalWebsiteUrl(url: string): string | null {
  if (!url || !url.trim()) return null;

  try {
    // First check if it already has a protocol
    let normalized: string;
    if (url.includes('://')) {
      // Has protocol, validate it
      const protocolMatch = url.match(/^([a-z]+):\/\//i);
      if (!protocolMatch) return null;
      const protocol = protocolMatch[1].toLowerCase();
      if (protocol !== 'http' && protocol !== 'https') {
        return null;
      }
      normalized = url;
    } else {
      // No protocol, add https
      normalized = `https://${url}`;
    }
    
    const parsed = new URL(normalized);

    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    // Block known platforms that are already handled elsewhere
    const blockedDomains = [
      'github.com',
      'linkedin.com',
      'scholar.google.com',
      'scholar.google',
      'facebook.com',
      'twitter.com',
      'x.com',
      'instagram.com'
    ];

    const hostname = parsed.hostname.toLowerCase();
    for (const blocked of blockedDomains) {
      if (hostname === blocked || hostname.endsWith('.' + blocked)) {
        return null;
      }
    }

    return normalized;
  } catch {
    return null;
  }
}

/**
 * Fetch and analyze a personal website
 */
export async function fetchPersonalWebsite(url: string): Promise<WebsiteInfo | null> {
  const validUrl = validatePersonalWebsiteUrl(url);
  
  if (!validUrl) {
    console.warn('Invalid personal website URL:', url);
    return null;
  }

  try {
    // Check robots.txt compliance first
    const canScrape = await checkRobotsTxt(validUrl);
    
    if (!canScrape) {
      console.warn('Scraping disallowed by robots.txt for:', validUrl);
      return {
        url: validUrl,
        title: null,
        description: null,
        technologies: [],
        content: '',
        skills: [],
        canScrape: false,
        scrapingDisallowed: true
      };
    }

    // Fetch the website content
    const response = await fetch(validUrl, {
      headers: {
        'User-Agent': 'ZhimaBot/1.0 (HR Analysis Tool; Respects robots.txt)',
        'Accept': 'text/html,application/xhtml+xml'
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch website ${validUrl}: ${response.status}`);
      return null;
    }

    const html = await response.text();
    
    // Extract information from HTML
    const { title, description, keywords } = extractMetaInfo(html);
    const textContent = extractTextContent(html);
    const technologies = extractTechnologies(html, textContent);
    const skills = extractSkills(textContent);

    // Add keywords to skills if they seem relevant
    const relevantKeywords = keywords.filter(k => 
      k.length > 2 && k.length < 30 && !k.includes('http')
    );

    return {
      url: validUrl,
      title,
      description,
      technologies,
      content: textContent.slice(0, 2000), // Limit content to 2000 chars
      skills: [...new Set([...skills, ...relevantKeywords])].slice(0, 15),
      canScrape: true
    };
  } catch (error) {
    console.error('Error fetching personal website:', error);
    return null;
  }
}
