## 2024-05-22 - Client-Side XSS in User Profiles
**Vulnerability:** User-controlled website/blog URL from GitHub profile was used directly in `href` without sanitization, allowing `javascript:` XSS payloads.
**Learning:** External data sources (like GitHub API) must be treated as untrusted. Even "safe" platforms allow users to input dangerous data.
**Prevention:** Always sanitize URLs used in `href` attributes. Use `sanitizeUrl` (which enforces http/https) for any user-provided link.

## 2025-02-18 - Client-Side SSRF in URL Analysis
**Vulnerability:** Application fetched user-provided URLs without validating if they pointed to internal network resources (localhost, 192.168.x.x), allowing potential reconnaissance of local services.
**Learning:** Even client-side fetches are subject to SSRF risks if the user is tricked into analyzing a malicious profile that targets their own local network.
**Prevention:** Implement strict hostname validation that blocks private IP ranges and localhost before initiating any fetch requests.

## 2025-02-18 - SSRF Bypass via IP Normalization
**Vulnerability:** Private IP checks relied on strict regex matching (e.g. `127.0.0.1`), allowing bypasses using alternative formats like `127.1`, octal, or hex IPs.
**Learning:** Attackers can represent IPs in many valid formats that simple regexes miss. The browser/OS resolves them to the same target.
**Prevention:** Normalize hostnames using `new URL(url).hostname` before applying security checks. This converts obscure formats (e.g. `0x7f.0.0.1`) to standard dotted-decimal notation.

## 2025-05-22 - SSRF Bypass via IPv6-Mapped IPv4
**Vulnerability:** Private IP checks bypassed using IPv6-mapped IPv4 addresses (e.g., `[::ffff:127.0.0.1]` or `[::ffff:7f00:1]`) which `new URL()` normalizes differently than standard IPv4.
**Learning:** URL parsers may normalize IPv6-mapped addresses to compressed hex format, evading standard regex-based IPv4 blocklists.
**Prevention:** Explicitly detect and decode IPv6-mapped IPv4 addresses (starting with `::ffff:`) back to dotted-decimal notation before applying IP allow/block lists.
## 2026-02-07 - Client-Side SSRF & DNS Rebinding Mitigation
**Vulnerability:** Client-side applications fetching arbitrary URLs can be used to scan local networks or access localhost services (DNS Rebinding) via the user's browser.
**Learning:** Browser APIs lack DNS resolution capabilities, making traditional SSRF prevention (resolve IP -> check range -> fetch) impossible.
**Prevention:** Implement a defense-in-depth approach:
1. Block known localhost wildcard domains (nip.io, localtest.me).
2. Recursively check hostnames for embedded IP patterns (e.g., 1-1-1-1.nip.io) to detect and block private IPs hidden in public domains.

## 2026-02-18 - SSRF in JD Matcher & Integer IP Bypass
**Vulnerability:** The JD Matcher feature allowed fetching arbitrary URLs (including localhost/private IPs) via `resumeUrl` because it only validated the protocol. Additionally, `isPrivateHostname` was vulnerable to integer IP formats (e.g., `2130706433`) in environments where `URL` normalization is inconsistent.
**Learning:** New features often duplicate security logic (like URL validation) poorly instead of reusing robust centralized functions. Also, browser URL parsing behavior varies for non-standard IP formats.
**Prevention:** Centralize all URL validation in `services/website.ts` and enforce its use. Explicitly handle integer/octal IP formats by converting to dotted-decimal before validation.

## 2026-03-05 - Prompt Injection & DoS in JD Matcher
**Vulnerability:** The JD Matcher combined system instructions and user-provided resume content into a single prompt string for the LLM, making it susceptible to prompt injection. Additionally, large resume files were processed without length limits, risking Denial of Service (DoS) and API cost spikes.
**Learning:** Treating user input as instructions (by concatenating it with system prompts) is a security risk. Also, client-side file reading and API calls must have explicit size limits to prevent resource exhaustion.
**Prevention:**
1. Use structured `system` and `user` roles in LLM API calls to separate instructions from data.
2. Enforce strict character/size limits on user-provided content before processing or sending to external APIs.

## 2026-02-10 - SSRF Bypass via Redirects
**Vulnerability:** Client-side SSRF protection using `isPrivateHostname` was bypassed because `fetch` follows redirects by default. An attacker could use a public URL that redirects to a private IP (e.g. localhost) to scan the local network or access internal services.
**Learning:** Validating the initial URL is insufficient. The HTTP client must also be configured to block redirects or validate the redirect target.
**Prevention:** Use `redirect: 'error'` in `fetch` options for high-risk data retrieval to prevent the browser/client from silently following redirects to restricted networks.

## 2026-03-05 - SSRF Defense in Depth for Octal/Hex IPs
**Vulnerability:** Private IP blocklists often rely on standard IPv4 parsing. Attackers can bypass these using Octal (e.g. 0177.0.0.1) or Hex (0x7f.0.0.1) formats if the underlying network library normalizes them differently than the validator.
**Learning:** URL parsers (like `new URL`) are generally reliable but can vary by environment or fail. A robust blocklist must explicitly handle alternative IP formats as a fallback.
**Prevention:** Implement explicit parsing logic for Octal (leading zero) and Hex (0x prefix) components in hostnames before validating against private ranges, ensuring defense-in-depth.

## 2026-03-05 - Insecure HTML Parsing in Isomorphic Code
**Vulnerability:** The application used regex-based HTML sanitization (`replace(/<script...>/)`) to extract text content, which is fragile and prone to bypasses (e.g., nested tags, malformed HTML).
**Learning:** Regex is insufficient for parsing HTML securely. In browser environments, the native `DOMParser` API provides robust, standards-compliant parsing and sanitization that is far superior to regex.
**Prevention:** Use `DOMParser` for HTML text extraction when available (browser), falling back to regex only in environments where DOM is absent (Node.js). Ideally, use a robust library like `jsdom` for consistent behavior across environments.

## 2026-05-27 - SSRF Bypass via Obfuscated IP Patterns in Hostnames
**Vulnerability:** The `isPrivateHostname` function used a strict regex `(\d{1,3})` to detect embedded IPs, which failed to capture 4-digit octal IPs (e.g., `0177`) or hexadecimal IPs (e.g., `0x7f`). This allowed attackers to bypass SSRF protection using domains like `0177.0.0.1.traefik.me`.
**Learning:** Regex-based IP detection must account for all valid IP representations, including octal and hexadecimal formats, not just standard decimal notation.
**Prevention:** Use a more inclusive regex for IP part detection (e.g., `[a-zA-Z0-9]+`) and rely on robust parsing logic to validate the extracted parts as private IPs.
