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
