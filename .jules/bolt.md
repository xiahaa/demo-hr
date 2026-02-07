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
