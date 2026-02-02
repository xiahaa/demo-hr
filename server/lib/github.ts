/**
 * Get GitHub API headers with optional authentication
 */
function getGitHubHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'GitTalent-AI'
  };
  
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }
  
  return headers;
}

export async function fetchGitHubProfile(username: string) {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: getGitHubHeaders()
    });
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
    const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`, {
      headers: getGitHubHeaders()
    });
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
    const response = await fetch(`https://api.github.com/repos/${username}/${repoName}/languages`, {
      headers: getGitHubHeaders()
    });
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
  const topRepos = repos.slice(0, 30); // Analyze top 30 repos

  for (const repo of topRepos) {
    const languages = await fetchRepoLanguages(username, repo.name);
    if (languages) {
      for (const [lang, bytes] of Object.entries(languages)) {
        languageStats[lang] = (languageStats[lang] || 0) + (bytes as number);
        repoCount[lang] = (repoCount[lang] || 0) + 1;
      }
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { languageStats, repoCount };
}

/**
 * Extract email from commit patches
 */
export async function searchForEmail(username: string) {
  try {
    const eventsResponse = await fetch(`https://api.github.com/users/${username}/events/public`, {
      headers: getGitHubHeaders()
    });
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
