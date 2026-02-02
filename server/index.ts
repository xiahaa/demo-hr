import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createHash } from 'crypto';
import db from './db';
import { analyzeCandidate, parseGitHubUsername } from './lib/analyzer';

// Load environment variables
try {
  process.loadEnvFile();
} catch (e) {
  // .env might not exist in production or if env vars are passed directly
}

const app = new Hono();

app.use('/*', cors());

app.post('/api/analyze', async (c) => {
  try {
    const body = await c.req.json();
    const { githubUrl, scholarUrl, linkedinText } = body;

    // Validate githubUrl type and length
    if (typeof githubUrl !== 'string' || githubUrl.length === 0 || githubUrl.length > 2048) {
      return c.json({ error: 'GitHub URL must be a non-empty string of reasonable length' }, 400);
    }

    // Validate scholarUrl type and length when provided
    if (scholarUrl !== undefined && scholarUrl !== null) {
      if (typeof scholarUrl !== 'string' || scholarUrl.length > 2048) {
        return c.json({ error: 'Scholar URL must be a string of reasonable length when provided' }, 400);
      }
    }

    // Validate linkedinText type and length when provided
    if (linkedinText !== undefined && linkedinText !== null) {
      if (typeof linkedinText !== 'string' || linkedinText.length > 20000) {
        return c.json({ error: 'LinkedIn text must be a string of reasonable length when provided' }, 400);
      }
    }
    if (!githubUrl) {
      return c.json({ error: 'GitHub URL is required' }, 400);
    }

    const username = parseGitHubUsername(githubUrl);
    if (!username) {
        return c.json({ error: 'Invalid GitHub URL' }, 400);
    }

    // Get IP
    const ip = c.req.header('x-forwarded-for') || 'unknown';

    // Log IP
    try {
      db.prepare('INSERT INTO analysis_logs (ip_address, github_username) VALUES (?, ?)').run(ip, username);
    } catch (e) {
      console.error('Failed to log IP:', e);
    }

    // Create cache key that includes optional parameters
    // Use hash to avoid separator collisions and keep key consistent
    const cacheKeyData = JSON.stringify({
      username,
      scholarUrl: scholarUrl || null,
      linkedinText: linkedinText || null
    });
    const cacheKey = createHash('sha256').update(cacheKeyData).digest('hex');

    // Check Cache (7 days)
    const cached = db.prepare(`
      SELECT data FROM cached_profiles
      WHERE cache_key = ?
      AND updated_at > datetime('now', '-7 days')
    `).get(cacheKey) as { data: string } | undefined;

    if (cached) {
      console.log(`Cache hit for ${username} (scholar: ${!!scholarUrl}, linkedin: ${!!linkedinText})`);
      return c.json(JSON.parse(cached.data));
    }

    console.log(`Analyzing ${username}...`);
    const result = await analyzeCandidate(githubUrl, scholarUrl, linkedinText);

    // Save to Cache
    const stmt = db.prepare(`
      INSERT INTO cached_profiles (username, cache_key, data, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(cache_key) DO UPDATE SET
        data = excluded.data,
        updated_at = CURRENT_TIMESTAMP
    `);
    stmt.run(username, cacheKey, JSON.stringify(result));

    return c.json(result);
  } catch (err: any) {
    console.error('Analysis failed:', err);
    return c.json({ error: err.message || 'Analysis failed' }, 500);
  }
});

const port = 3001;
console.log(`Server is running on port ${port}`);

const server = serve({
  fetch: app.fetch,
  port
});

// Graceful shutdown handlers
const SHUTDOWN_TIMEOUT_MS = 10000;
let isShuttingDown = false;
const shutdown = (signal: string) => {
  if (isShuttingDown) {
    console.log(`${signal} received but shutdown already in progress`);
    return;
  }
  isShuttingDown = true;
  
  console.log(`${signal} received, closing server and database connection...`);
  
  // Set a timeout to force exit if graceful shutdown takes too long
  const forceExitTimeout = setTimeout(() => {
    console.error('Graceful shutdown timed out, forcing exit...');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  
  server.close((err) => {
    if (err) {
      console.error('Error closing server:', err);
    } else {
      console.log('Server closed');
    }
    closeDatabase();
    console.log('Shutdown complete, exiting...');
    clearTimeout(forceExitTimeout);
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
