## 2024-05-22 - Client-Side XSS in User Profiles
**Vulnerability:** User-controlled website/blog URL from GitHub profile was used directly in `href` without sanitization, allowing `javascript:` XSS payloads.
**Learning:** External data sources (like GitHub API) must be treated as untrusted. Even "safe" platforms allow users to input dangerous data.
**Prevention:** Always sanitize URLs used in `href` attributes. Use `sanitizeUrl` (which enforces http/https) for any user-provided link.
