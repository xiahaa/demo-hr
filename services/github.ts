
const CACHE_TTL = 3600 * 1000; // 1 hour

function getGitHubToken() {
  return import.meta.env.VITE_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
}

async function fetchWithCache(url: string, options: RequestInit = {}) {
  const token = getGitHubToken();
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'Accept': 'application/vnd.github.v3+json'
  };

  const cacheKey = `gh_cache_${url}`;

  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { timestamp, data } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) {
        // Return a mock response-like object
        return {
          ok: true,
          json: async () => data,
          status: 200,
          clone: () => ({ json: async () => data })
        };
      }
      localStorage.removeItem(cacheKey);
    }
  } catch (e) {
    // Ignore cache errors
  }

  const response = await fetch(url, { ...options, headers });

  if (response.ok) {
    // Clone response to read body and cache it
    const clone = response.clone();
    const data = await clone.json();
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        data
      }));
    } catch (e) {
      // Ignore storage quota errors
      console.warn('Failed to cache GitHub response', e);
    }
    return response;
  }

  return response;
}

export async function fetchGitHubProfile(username: string) {
  try {
    const response = await fetchWithCache(`https://api.github.com/users/${username}`);
    if (!response.ok) throw new Error('GitHub profile not found');
    return await response.json();
  } catch (err) {
    console.error('Error fetching GH profile:', err);
    return null;
  }
}

export async function fetchGitHubRepos(username: string) {
  try {
    // Fetch more repos (up to 100) to get better language statistics
    const response = await fetchWithCache(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`);
    if (!response.ok) return [];
    return await response.json();
  } catch (err) {
    console.error('Error fetching GH repos:', err);
    return [];
  }
}

/**
 * Fetches detailed language statistics for a repository
 */
export async function fetchRepoLanguages(username: string, repoName: string) {
  try {
    const response = await fetchWithCache(`https://api.github.com/repos/${username}/${repoName}/languages`);
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.error(`Error fetching languages for ${repoName}:`, err);
    return null;
  }
}

/**
 * Aggregates language usage across all repositories to calculate tech proficiency
 */
export async function aggregateLanguageStats(username: string, repos: any[]) {
  const languageStats: Record<string, number> = {};
  const repoCount: Record<string, number> = {};

  // Process top repositories to get language data
  // Prioritize non-fork repos and limit to top 10 to speed up analysis
  const sourceRepos = repos.filter((r: any) => !r.fork);
  const forkRepos = repos.filter((r: any) => r.fork);

  // Adjust limit based on auth status
  const token = getGitHubToken();
  const limit = token ? 15 : 5; // More aggressive limit for unauthenticated users

  const topRepos = [...sourceRepos, ...forkRepos].slice(0, limit);

  // Process repositories with concurrency limit to respect API rate limits
  // while avoiding the "wait for batch" inefficiency of sequential batches.
  await runConcurrently(topRepos, 5, async (repo) => {
    const languages = await fetchRepoLanguages(username, repo.name);
    if (languages) {
      for (const [lang, bytes] of Object.entries(languages)) {
        languageStats[lang] = (languageStats[lang] || 0) + (bytes as number);
        repoCount[lang] = (repoCount[lang] || 0) + 1;
      }
    }
  });

  return { languageStats, repoCount };
}

/**
 * Helper to run async tasks with controlled concurrency
 */
async function runConcurrently<T>(
  items: T[],
  concurrency: number,
  task: (item: T) => Promise<void>
): Promise<void> {
  const queue = [...items];
  const workers = Array(Math.min(concurrency, items.length))
    .fill(null)
    .map(async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (item !== undefined) {
          try {
            await task(item);
          } catch (err) {
            console.error('Error in concurrent task:', err);
          }
        }
      }
    });

  await Promise.all(workers);
}

/**
 * Extract email from commit patches
 */
export async function searchForEmail(username: string) {
  try {
    // Note: /events/public doesn't support easy caching because it changes frequently
    // But we'll use the cache wrapper anyway for auth header support
    const eventsResponse = await fetchWithCache(`https://api.github.com/users/${username}/events/public`);
    if (!eventsResponse.ok) return null;
    const events = await eventsResponse.json();

    for (const event of events) {
      if (event.type === 'PushEvent') {
        const commit = event.payload.commits?.[0];
        if (commit?.author?.email && !commit.author.email.includes('noreply')) {
          return commit.author.email;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Calculate tech stack scores from language statistics
 * Returns a baseline tech stack that can be enhanced by LLM analysis
 */
export function calculateTechStackFromLanguages(
  languageStats: Record<string, number>,
  repoCount: Record<string, number>
): Array<{ name: string; score: number }> {
  const totalBytes = Object.values(languageStats).reduce((sum, bytes) => sum + bytes, 0);

  if (totalBytes === 0) return [];

  // Map common languages to more HR-friendly tech stack names
  const languageMapping: Record<string, string> = {
    'TypeScript': 'TypeScript',
    'JavaScript': 'JavaScript/Node.js',
    'Python': 'Python',
    'Java': 'Java',
    'Go': 'Go',
    'Rust': 'Rust',
    'C++': 'C++',
    'C': 'C',
    'C#': 'C#/.NET',
    'Ruby': 'Ruby',
    'PHP': 'PHP',
    'Swift': 'Swift/iOS',
    'Kotlin': 'Kotlin/Android',
    'Dart': 'Dart/Flutter',
    'Shell': 'Shell/DevOps',
    'HTML': 'HTML/CSS',
    'CSS': 'HTML/CSS',
    'Vue': 'Vue.js',
    'Jupyter Notebook': 'Data Science/ML'
  };

  const techStack: Array<{ name: string; score: number; bytes: number; repos: number }> = [];

  for (const [lang, bytes] of Object.entries(languageStats)) {
    const mappedName = languageMapping[lang] || lang;
    const bytesPercentage = (bytes / totalBytes) * 100;
    const repos = repoCount[lang] || 0;

    // Score based on: 70% usage volume + 30% repo diversity
    const volumeScore = Math.min(bytesPercentage * 0.7, 70);
    const diversityScore = Math.min(repos * 3, 30); // Up to 30 points for repo count
    const score = Math.round(volumeScore + diversityScore);

    if (score >= 10) { // Only include technologies with meaningful usage
      techStack.push({ name: mappedName, score, bytes, repos });
    }
  }

  // Sort by score and take top 8
  return techStack
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ name, score }) => ({ name, score }));
}
