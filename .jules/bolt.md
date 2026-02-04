## 2025-02-18 - Sequential API Calls with Artificial Delay
**Learning:** Found a severe bottleneck in `services/github.ts` where 30 GitHub API requests were made sequentially with a 100ms delay between each, causing ~5-10s load times.
**Action:** Always check for sequential `await` loops in data fetching logic. Replaced with batched `Promise.all` (concurrency 5) to respect rate limits while improving speed by ~15x.
## 2025-02-18 - Client-Side APIs in Node Environment
**Learning:** Codebase uses Vite for client-side but Vitest tests run in Node environment by default. `localStorage` is available in production (browser) but must be mocked or checked in tests/SSR.
**Action:** Always wrap browser-specific APIs (localStorage, window) in checks or try-catch blocks to prevent test failures or server-side crashes.
