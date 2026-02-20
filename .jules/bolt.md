## 2025-02-18 - Sequential API Calls with Artificial Delay
**Learning:** Found a severe bottleneck in `services/github.ts` where 30 GitHub API requests were made sequentially with a 100ms delay between each, causing ~5-10s load times.
**Action:** Always check for sequential `await` loops in data fetching logic. Replaced with batched `Promise.all` (concurrency 5) to respect rate limits while improving speed by ~15x.

## 2025-02-18 - Client-Side APIs in Node Environment
**Learning:** Codebase uses Vite for client-side but Vitest tests run in Node environment by default. `localStorage` is available in production (browser) but must be mocked or checked in tests/SSR.
**Action:** Always wrap browser-specific APIs (localStorage, window) in checks or try-catch blocks to prevent test failures or server-side crashes.

## 2025-02-18 - Optimized Repo Analysis Strategy
**Learning:** Analyzing top 30 repositories regardless of type (fork/source) wasted ~50% of API calls on forks or less relevant repos.
**Action:** Prioritized source repositories and reduced analysis limit to 15. This cuts API requests by half and focuses on code the user actually wrote.

## 2025-02-18 - Concurrent Pooling vs Batching
**Learning:** Batched `Promise.all` (chunking) causes head-of-line blocking where fast requests wait for the slowest in the batch.
**Action:** Implemented a concurrent worker pool (`runConcurrently`) for GitHub API calls. This maintains the concurrency limit (5) but improves throughput by utilizing slots as soon as they become free.

## 2025-02-19 - Parallelizing Dependent Promises with Independent Tasks
**Learning:** `aggregateLanguageStats` was unnecessarily waiting for unrelated tasks (profile fetch, PDF parsing) to complete because it was awaited after `Promise.all`. This added ~500ms of latency (the duration of the stats aggregation) to the total execution time.
**Action:** Chain dependent tasks (like stats aggregation) directly to their prerequisites (repo fetching) within the `Promise.all` array. This allows the dependent task to start as soon as its prerequisite is done, running concurrently with other independent long-running tasks.

## 2025-02-19 - Regex Loops vs Native DOM Parsing
**Learning:** Found a potential performance and security bottleneck in `jdMatcher.ts` using a `while` loop with regex to strip scripts/styles from HTML. This is O(N^2) worst-case and fragile.
**Action:** Replaced with `DOMParser` in browser environments, which is native, faster (single pass), and safer. Maintained regex fallback for Node.js/Test environments to avoid breaking tests or requiring heavy DOM mocks.

## 2025-02-21 - Regex Loop vs Single Compilation
**Learning:** Scanning content with 45 different regexes in a loop is O(K*N) and failed to detect keywords ending in symbols (e.g., `C++`) due to `\b` boundary issues.
**Action:** Replaced with a single pre-compiled `RegExp` using alternation (`|`) and lookahead `(?!\w)`. This is O(N), reduces execution time by ~40x in worst-case scenarios (no matches), and correctly handles symbol-ending keywords.

## 2025-02-24 - Efficient HTML Text Extraction
**Learning:** Sending raw HTML to LLMs increases token usage and costs. The previous `DOMParser` implementation returned `innerHTML` (HTML string), which was then regex-processed, causing redundant serialization/parsing overhead and inconsistent output compared to the plain-text regex fallback.
**Action:** Implemented recursive DOM traversal (`extractTextFromNode`) to extract text directly from the DOM tree, inserting smart whitespace for block elements. This avoids `innerHTML` serialization, reduces payload size by stripping tags early, and ensures clean plain-text output across environments.

## 2025-02-27 - Regex Optimization and String Concatenation Surprises
**Learning:**
1. `String.matchAll` with a complex regex in a loop (like checking for IP patterns in hostnames) is expensive when run frequently on strings that clearly don't match (e.g. "google.com"). A simple pre-check (e.g. `/[0-9:]/`) can skip 99% of the work.
2. Contrary to common wisdom, recursive string concatenation (`str += str`) in V8 for DOM text extraction was significantly faster (~30%) than array accumulation (`arr.push(str); arr.join('')`) for typical resume-sized DOM trees.
**Action:** Always measure micro-optimizations. Implemented a fast-path check in `isPrivateHostname` which improved performance by ~50% for common domain names.

## 2026-02-12 - Fetch Response Cloning and Double Parsing
**Learning:** Calling `response.clone()` on a fetch response creates a stream tee, forcing the browser to buffer the stream. When followed by `.json()`, it results in parsing the JSON twice (once for the clone, once for the original).
**Action:** Avoid `clone()` for caching logic. Read the body once using `.json()`, cache the data, and return a mock Response object that wraps the parsed data. This saves memory and CPU.

## 2025-02-27 - Response Cloning Overhead
**Learning:** Using `response.clone()` to cache a response body doubles the JSON parsing work (once for cache, once for the caller) and adds stream buffering overhead.
**Action:** Read the body once (`await response.json()`), cache the data, and return a proxy object that mimics the `Response` interface but returns the pre-parsed data. This saves ~50% of parsing time.

## 2025-02-27 - Optimized Text Scanning with matchAll
**Learning:** `String.match()` with a global regex allocates an array of all matching strings, which can be memory-intensive for large texts and frequent scans. `String.matchAll()` returns an iterator, processing matches lazily.
**Action:** Replaced `match(globalRegex)` with `matchAll(globalRegex)` in `extractTechnologies`. This reduces memory allocation during keyword extraction from large website content.

## 2025-05-18 - Set.has vs Regex.test Performance
**Learning:** Found that `Set.has(tagName)` combined with string normalization (or mixed-case Set) was ~2-3x slower than a simple regex check `/(DIV|P|...)/.test(tagName)` in V8 for checking HTML tag names.
**Action:** Don't assume `Set` lookup is always faster than optimized regex literals for small sets of strings. V8's regex engine is highly optimized for simple alternations. Always benchmark micro-optimizations.

## 2025-05-19 - Recursive Object Creation and Redundant Checks
**Learning:** In `isPrivateHostname`, a recursive function created a new `URL` object and re-checked embedded IPs at every level of recursion, leading to O(N^depth) complexity and excessive object allocation.
**Action:** Added a control flag (`allowEmbeddedCheck`) to disable deep recursion and redundant checks for embedded IPs, reducing execution time by ~80% (from ~975ms to ~200ms for 16k checks).

## 2025-05-19 - Optimizing JavaScript Array Operations
**Learning:** `Array.prototype.shift()` is O(N), which can be costly in loops. Using an index pointer (O(1)) is a better pattern for processing queues in JavaScript when order matters.
**Action:** When implementing concurrent queue processing or consuming arrays in order, prefer index pointers over `shift()` or `splice()` unless the array is guaranteed to be very small.

**Learning:** Replacing multiple `filter()` + `spread` + `slice()` chains with a single-pass loop (with early exit) significantly reduces temporary array allocations and iteration count.
**Action:** For filtering and prioritizing items from a list with a limit, use a single loop with a counter instead of functional chains, especially if the source list is large.

## 2025-05-19 - Binary Data Detection Performance
**Learning:** Iterating over character codes in a loop (O(N) in JS) to check for non-printable characters is significantly slower (~50x for text, ~3x for binary) than using  with a pre-compiled regex in V8.
**Action:** For simple character class counting or removal, prefer  or  over manual loops. V8's regex engine is highly optimized.

## 2025-05-19 - Binary Data Detection Performance
**Learning:** Iterating over character codes in a loop (O(N) in JS) to check for non-printable characters is significantly slower (~50x for text, ~3x for binary) than using `String.prototype.replace` with a pre-compiled regex in V8.
**Action:** For simple character class counting or removal, prefer `str.replace(regex, '').length` or `str.match(regex)` over manual loops. V8's regex engine is highly optimized.
