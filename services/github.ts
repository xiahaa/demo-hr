
export async function fetchGitHubProfile(username: string) {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`);
    if (!response.ok) throw new Error('GitHub profile not found');
    return await response.json();
  } catch (err) {
    console.error('Error fetching GH profile:', err);
    return null;
  }
}

export async function fetchGitHubRepos(username: string) {
  try {
    const response = await fetch(`https://api.github.com/users/${username}/repos?sort=stars&per_page=10`);
    if (!response.ok) return [];
    return await response.json();
  } catch (err) {
    console.error('Error fetching GH repos:', err);
    return [];
  }
}

// Logic to extract email from commit patches (simplified simulation)
export async function searchForEmail(username: string) {
  try {
    const eventsResponse = await fetch(`https://api.github.com/users/${username}/events/public`);
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
