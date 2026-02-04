## 2024-05-22 - Client-Side XSS in User Profiles
**Vulnerability:** User-controlled website/blog URL from GitHub profile was used directly in `href` without sanitization, allowing `javascript:` XSS payloads.
**Learning:** External data sources (like GitHub API) must be treated as untrusted. Even "safe" platforms allow users to input dangerous data.
**Prevention:** Always sanitize URLs used in `href` attributes. Use `sanitizeUrl` (which enforces http/https) for any user-provided link.

## 2025-02-18 - Client-Side SSRF in URL Analysis
**Vulnerability:** Application fetched user-provided URLs without validating if they pointed to internal network resources (localhost, 192.168.x.x), allowing potential reconnaissance of local services.
**Learning:** Even client-side fetches are subject to SSRF risks if the user is tricked into analyzing a malicious profile that targets their own local network.
**Prevention:** Implement strict hostname validation that blocks private IP ranges and localhost before initiating any fetch requests.
