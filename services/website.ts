
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let response;
    try {
      response = await fetch(robotsUrl, {
        headers: {
          'User-Agent': 'ZhimaBot/1.0 (HR Analysis Tool; Respects robots.txt)'
        },
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }

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

// Common tech keywords to look for
const TECH_KEYWORDS = [
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

// Pre-compute normalized map for case restoration (e.g. "react" -> "React")
const NORMALIZED_TECH_MAP = new Map<string, string>();
TECH_KEYWORDS.forEach(k => {
  const clean = k.replace(/\\/g, '');
  NORMALIZED_TECH_MAP.set(clean.toLowerCase(), clean);
});

// Single compiled regex for performance
// Uses (?!\w) lookahead instead of \b at the end to correctly handle keywords ending in symbols (C++, C#, Node.js)
const TECH_REGEX = new RegExp(`\\b(${TECH_KEYWORDS.join('|')})(?!\\w)`, 'gi');

/**
 * Extract technology mentions from HTML content
 */
export function extractTechnologies(textContent: string, metaContent: string = ''): string[] {
  const technologies = new Set<string>();

  const processText = (text: string) => {
    if (!text) return;

    // Use matchAll to avoid allocating a large array of all matches.
    // matchAll returns an iterator and is memory efficient for large texts.
    const matches = text.matchAll(TECH_REGEX);

    for (const match of matches) {
      // match[0] is the full match, match[1] is the capturing group.
      // Since the regex uses zero-width assertions (\b and lookahead), match[0] is the keyword.
      const canonical = NORMALIZED_TECH_MAP.get(match[0].toLowerCase());
      if (canonical) {
        technologies.add(canonical);
      }
    }
  };

  // Process text and meta content separately to avoid large string concatenation
  // Performance: We only scan visible text and metadata, avoiding the large HTML structure
  // Accuracy: This prevents false positives from HTML attributes (e.g. class="react-container")
  processText(textContent);
  processText(metaContent);

  return Array.from(technologies);
}

/**
 * Extract plain text from HTML content
 * 
 * Security note: This function removes potentially dangerous tags (script, style)
 * before extracting text content. The regex patterns are designed to handle
 * various HTML edge cases while preventing injection attacks.
 */
export function extractTextContent(html: string): string {
  // Safe HTML parsing using DOMParser (Browser environment)
  // This helps prevent XSS and handles malformed HTML more robustly than regex
  if (typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Remove script and style elements
      // We use querySelectorAll to find all script and style tags, even nested ones
      const elementsToRemove = doc.querySelectorAll('script, style');
      elementsToRemove.forEach(el => el.remove());

      // Get text content
      // doc.body.textContent automatically handles entity decoding and strips tags
      let text = doc.body.textContent || '';

      // Normalize whitespace
      return text.replace(/\s+/g, ' ').trim();
    } catch (e) {
      console.warn('DOMParser failed, falling back to regex', e);
    }
  }

  // Fallback: Regex-based extraction (Node.js environment / Legacy)
  // Remove script and style tags completely
  // The pattern matches:
  // - Opening tag: <script or <style (case-insensitive)
  // - Any content between tags (including newlines): [\s\S]*?
  // - Closing tag with flexible matching: <\/script[^>]*> or <\/style[^>]*>
  // Note: [^>]* handles malformed HTML like </script attr> which shouldn't have attributes
  // but may exist in the wild due to HTML generation errors or attacks
  let text = html.replace(/<script[\s\S]*?<\/script[^>]*>/gi, ' ');
  text = text.replace(/<style[\s\S]*?<\/style[^>]*>/gi, ' ');
  
  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  
  // Decode HTML entities (basic ones)
  // Important: Do this AFTER removing tags to avoid double-escaping issues
  // Order matters: decode &amp; last to prevent corrupting already-decoded entities
  // Example: &amp;amp; should become &amp; then & (not & then & which would be wrong)
  // If we decoded &amp; first, then &amp;lt; would incorrectly remain as &lt; instead of becoming <
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&amp;/g, '&'); // Decode &amp; last to prevent corruption of other entities
  
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
 * Check if a hostname is a private IP address or local domain
 * Prevents SSRF attacks on local networks
 */
export function isPrivateHostname(hostname: string): boolean {
  // Normalize hostname to handle short/hex/octal IP formats (e.g. 127.1 -> 127.0.0.1)
  let normalizedHostname = hostname;
  try {
    // Prepend protocol if missing to satisfy URL constructor
    const urlStr = hostname.includes('://') ? hostname : `http://${hostname}`;
    normalizedHostname = new URL(urlStr).hostname;
  } catch {
    // If parsing fails, continue with original hostname
  }

  // Check for localhost and local domains
  if (normalizedHostname === 'localhost' || normalizedHostname.endsWith('.local') || normalizedHostname.endsWith('.localhost')) {
    return true;
  }

  // Block known DNS rebinding / localhost wildcard services
  const localhostDomains = [
    'localtest.me',
    'lvh.me',
    'vcap.me',
    'nip.io',
    'xip.io',
    'sslip.io',
    'localhost.tv'
  ];

  for (const domain of localhostDomains) {
    if (normalizedHostname === domain || normalizedHostname.endsWith('.' + domain)) {
      return true;
    }
  }

  // IPv6 check for localhost
  if (normalizedHostname === '[::1]' || normalizedHostname === '::1') {
    return true;
  }

  // Handle IPv6 mapped IPv4 (e.g., ::ffff:127.0.0.1)
  // URL hostname usually includes brackets for IPv6: [::ffff:127.0.0.1]
  let checkHostname = normalizedHostname;
  if (checkHostname.startsWith('[') && checkHostname.endsWith(']')) {
    checkHostname = checkHostname.slice(1, -1);
  }

  // OPTIMIZATION: Fast path - if no digits and no colons, it cannot be an IP address or contain an IP pattern.
  // This skips expensive regex matching and parsing for the majority of domains (e.g. google.com).
  // Note: 'localhost', '.local', and IPv6 '::1' are already handled above, so we don't need to worry about them here.
  if (!/[0-9:]/.test(checkHostname)) {
    return false;
  }

  if (checkHostname.toLowerCase().startsWith('::ffff:')) {
    const suffix = checkHostname.substring(7);
    if (suffix.includes('.')) {
       // Already dotted decimal
       checkHostname = suffix;
    } else {
       // Hex format (e.g. 7f00:1), convert to dotted decimal
       const parts = suffix.split(':');
       if (parts.length === 2) {
          const g1 = parseInt(parts[0], 16);
          const g2 = parseInt(parts[1], 16);
          const a = (g1 >> 8) & 0xff;
          const b = g1 & 0xff;
          const c = (g2 >> 8) & 0xff;
          const d = g2 & 0xff;
          checkHostname = `${a}.${b}.${c}.${d}`;
       }
    }
  }

  // IPv4 check with support for Hex/Octal and Short formats
  // Matches 1.2.3.4, 127.1, 0x7f.1, 0177.0.0.1 formats
  const parts = checkHostname.split('.');
  if (parts.length >= 1 && parts.length <= 4) {
    let isIp = true;
    const numericParts: number[] = [];

    for (const part of parts) {
      // Check if part is a valid number format (dec, hex, oct)
      if (!/^0x[0-9a-f]+$/i.test(part) && !/^\d+$/.test(part)) {
        isIp = false;
        break;
      }

      let val = 0;
      if (part.startsWith('0x') || part.startsWith('0X')) {
        val = parseInt(part, 16);
      } else if (part.length > 1 && part.startsWith('0')) {
        val = parseInt(part, 8); // Octal
      } else {
        val = parseInt(part, 10);
      }

      if (isNaN(val) || val < 0) {
        isIp = false;
        break;
      }
      numericParts.push(val);
    }

    if (isIp) {
      let finalParts: number[] = [];

      // Normalize to 4-part dotted decimal
      if (numericParts.length === 4) {
        finalParts = numericParts;
      } else if (numericParts.length === 1) {
        const val = numericParts[0];
        finalParts = [(val >>> 24) & 0xff, (val >>> 16) & 0xff, (val >>> 8) & 0xff, val & 0xff];
      } else if (numericParts.length === 2) {
        // a.b -> a.0.0.b (b is the rest)
        const [a, rest] = numericParts;
        finalParts = [a, (rest >>> 16) & 0xff, (rest >>> 8) & 0xff, rest & 0xff];
      } else if (numericParts.length === 3) {
        // a.b.c -> a.b.0.c (c is the rest)
        const [a, b, rest] = numericParts;
        finalParts = [a, b, (rest >>> 8) & 0xff, rest & 0xff];
      }

      const [a, b] = finalParts;

      // 127.0.0.0/8 (Loopback)
      if (a === 127) return true;

      // 10.0.0.0/8 (Private)
      if (a === 10) return true;

      // 192.168.0.0/16 (Private)
      if (a === 192 && b === 168) return true;

      // 172.16.0.0/12 (Private)
      if (a === 172 && b >= 16 && b <= 31) return true;

      // 169.254.0.0/16 (Link-local)
      if (a === 169 && b === 254) return true;

      // 0.0.0.0/8 (Current network)
      if (a === 0) return true;
    }
  }

  // Check for embedded IPs in hostname (e.g., 10-0-0-1.mycompany.com)
  // This helps catch DNS rebinding attempts or internal hostnames
  // We use a global regex to find ALL potential IP patterns
  // Improved regex to capture hex/octal parts (alphanumeric) and longer sequences
  const ipPattern = /([a-zA-Z0-9]+)[\.-]([a-zA-Z0-9]+)[\.-]([a-zA-Z0-9]+)[\.-]([a-zA-Z0-9]+)/g;
  const matches = checkHostname.matchAll(ipPattern);

  for (const match of matches) {
    const ip = `${match[1]}.${match[2]}.${match[3]}.${match[4]}`;
    // Recursively check the extracted IP
    // Note: strict check to avoid infinite recursion if something weird happens
    if (ip !== checkHostname && isPrivateHostname(ip)) {
      return true;
    }
  }

  return false;
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

    const hostname = parsed.hostname.toLowerCase();

    // Security: Block private IP addresses and localhost to prevent SSRF
    if (isPrivateHostname(hostname)) {
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let response;
    try {
      response = await fetch(validUrl, {
        headers: {
          'User-Agent': 'ZhimaBot/1.0 (HR Analysis Tool; Respects robots.txt)',
          'Accept': 'text/html,application/xhtml+xml'
        },
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      console.error(`Failed to fetch website ${validUrl}: ${response.status}`);
      return null;
    }

    const html = await response.text();
    
    // Extract information from HTML
    const { title, description, keywords } = extractMetaInfo(html);
    const textContent = extractTextContent(html);

    // Combine meta info for technology extraction
    // Filter out null/undefined and empty strings
    const metaParts = [title, description, ...keywords].filter((part): part is string => !!part);
    const metaContent = metaParts.join(' ');

    const technologies = extractTechnologies(textContent, metaContent);
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
