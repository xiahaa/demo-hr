import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import db from './db.js';
import { analyzeCandidate, parseGitHubUsername } from './lib/analyzer.js';

// Load environment variables
try {
  process.loadEnvFile();
} catch (e) {
  // .env might not exist in production or if env vars are passed directly
}

const app = new Hono();

const rawCorsOrigins = process.env.CORS_ORIGINS;
const allowedOrigins = rawCorsOrigins
  ? rawCorsOrigins.split(',').map((o) => o.trim()).filter((o) => o.length > 0)
  : [];

app.use(
  '/*',
  cors({
    origin: (origin) => {
      // Allow non-browser or same-origin requests without an Origin header
      if (!origin) {
        return null;
      }

      // If explicit origins are configured, only allow those
      if (allowedOrigins.length > 0) {
        return allowedOrigins.includes(origin) ? origin : null;
      }

      // Fallback: in non-production, allow localhost for development convenience
      const isProd = process.env.NODE_ENV === 'production';
      if (!isProd && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return origin;
      }

      // Otherwise, disallow
      return null;
    },
  }),
);
app.post('/api/analyze', async (c) => {
  try {
    const body = await c.req.json();
    const { githubUrl, scholarUrl, linkedinText } = body;

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

    // Check Cache (7 days)
    const cached = db.prepare(`
      SELECT data FROM cached_profiles
      WHERE username = ?
      AND updated_at > datetime('now', '-7 days')
    `).get(username) as { data: string } | undefined;

    if (cached) {
      console.log(`Cache hit for ${username}`);
      return c.json(JSON.parse(cached.data));
    }

    console.log(`Analyzing ${username}...`);
    const result = await analyzeCandidate(githubUrl, scholarUrl, linkedinText);

    // Save to Cache
    const stmt = db.prepare(`
      INSERT INTO cached_profiles (username, data, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(username) DO UPDATE SET
        data = excluded.data,
        updated_at = CURRENT_TIMESTAMP
    `);
    stmt.run(username, JSON.stringify(result));

    return c.json(result);
  } catch (err: any) {
    console.error('Analysis failed:', err);
    return c.json({ error: err.message || 'Analysis failed' }, 500);
  }
});

const port = 3001;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
});
