
import { CandidateProfile, TechStackItem } from "../types";
import {
  fetchGitHubProfile,
  fetchGitHubRepos,
  searchForEmail as findEmail,
  aggregateLanguageStats,
  calculateTechStackFromLanguages
} from "./github";

type AiAnalysis = Omit<CandidateProfile, "username" | "avatarUrl" | "location" | "email" | "topRepositories">;

function selectDeepSeekModel(context: Record<string, unknown>): string {
  const chatModel = process.env.DEEPSEEK_CHAT_MODEL || "deepseek-chat";
  const reasonerModel = process.env.DEEPSEEK_REASONER_MODEL || "deepseek-reasoner";

  const repos = Array.isArray(context.repos) ? context.repos : [];
  const repoDescriptionsLength = repos.reduce((sum, repo) => {
    const description = (repo as { description?: string }).description || "";
    return sum + description.length;
  }, 0);
  const linkedinLength = ((context.additionalContext as string) || "").length;
  const publicRepos = Number(context.publicRepos || 0);
  const hasScholar = Boolean(context.scholar && context.scholar !== "None");

  let complexityScore = 0;
  complexityScore += Math.min(repos.length, 10);
  complexityScore += repoDescriptionsLength > 800 ? 3 : repoDescriptionsLength > 300 ? 2 : repoDescriptionsLength > 0 ? 1 : 0;
  complexityScore += linkedinLength > 2000 ? 3 : linkedinLength > 800 ? 2 : linkedinLength > 0 ? 1 : 0;
  complexityScore += publicRepos > 50 ? 2 : publicRepos > 10 ? 1 : 0;
  complexityScore += hasScholar ? 1 : 0;

  return complexityScore >= 6 ? reasonerModel : chatModel;
}

function parseGitHubUsername(githubUrl: string): string {
  const trimmed = githubUrl.trim();
  if (!trimmed) return "";

  try {
    const normalized = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    const url = new URL(normalized);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[0] || "";
  } catch {
    // fallback for non-URL inputs like "user"
    return trimmed.split("/").filter(Boolean)[0] || "";
  }
}

function extractJsonObject(text: string): Record<string, unknown> {
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("LLM response does not contain a JSON object.");
  }
  return JSON.parse(text.slice(firstBrace, lastBrace + 1));
}

function normalizeAiResult(result: Partial<AiAnalysis>, fullName: string): AiAnalysis {
  // Ensure techStack has valid scores
  const techStack = Array.isArray(result.techStack) ? result.techStack : [];
  const validatedTechStack = techStack
    .filter(item => item && typeof item.name === 'string' && item.name.trim())
    .map(item => ({
      name: item.name.trim(),
      score: typeof item.score === 'number' && item.score >= 0 && item.score <= 100
        ? Math.round(item.score)
        : 50 // Default to 50 if invalid
    }));

  return {
    name: result.name || fullName,
    oneLiner: result.oneLiner || "Software engineer",
    engineeringScore: typeof result.engineeringScore === "number"
      ? Math.max(0, Math.min(100, Math.round(result.engineeringScore)))
      : 50,
    experienceLevel: (result.experienceLevel as AiAnalysis["experienceLevel"]) || "Mid",
    techStack: validatedTechStack,
    salaryEstimate: result.salaryEstimate || { min: 0, max: 0, currency: "USD" },
    suggestedQuestions: Array.isArray(result.suggestedQuestions) ? result.suggestedQuestions : [],
    strengths: Array.isArray(result.strengths) ? result.strengths : [],
    weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses : [],
    academicStats: result.academicStats || null
  };
}

async function runDeepSeekAnalysis(
  context: Record<string, unknown>,
  fullName: string,
  model: string,
  fallbackTechStack: TechStackItem[]
): Promise<AiAnalysis> {
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Missing DeepSeek API key. Set DEEPSEEK_API_KEY in .env");
  }

  const systemPrompt = `You are a senior technical recruiter and hiring analyst. Your task is to analyze developer profiles and create comprehensive technical assessments.

Return ONLY valid JSON with NO markdown formatting, NO code blocks, NO explanations - just pure JSON.`;

  // Create detailed schema with examples
  const schemaExample = {
    name: "Full Name",
    oneLiner: "Brief professional headline (e.g., 'Senior Full-stack Engineer specializing in React and Node.js')",
    engineeringScore: 75,
    experienceLevel: "Senior",
    techStack: [
      { name: "React/TypeScript", score: 90 },
      { name: "Node.js", score: 85 },
      { name: "Python", score: 70 }
    ],
    salaryEstimate: { min: 120000, max: 160000, currency: "USD" },
    suggestedQuestions: [
      "Technical question 1?",
      "Technical question 2?"
    ],
    strengths: [
      "Specific strength based on their work",
      "Another concrete strength"
    ],
    weaknesses: [
      "Area that could be explored in interview",
      "Potential gap to probe"
    ],
    academicStats: null
  };

  const userPrompt = `Analyze this GitHub developer profile and create a comprehensive technical assessment.

PROFILE DATA:
${JSON.stringify(context, null, 2)}

BASELINE TECH STACK (from code analysis):
${JSON.stringify(fallbackTechStack, null, 2)}

INSTRUCTIONS:
1. **Tech Stack**: You MUST provide 4-8 technologies with scores (0-100). Use the baseline tech stack as a starting point, but refine scores based on:
   - Repository complexity and quality
   - Stars/forks indicating community validation
   - Recent activity showing current expertise
   - README descriptions revealing depth
   If baseline is empty, infer from repo names, descriptions, and languages.

2. **Engineering Score** (0-100): Consider:
   - Code complexity (starred repos, forks, issues)
   - Consistency (regular commits, maintained projects)
   - Impact (followers, popular repos)
   - Documentation quality

3. **Experience Level**: Junior (0-2 yrs), Mid (2-5 yrs), Senior (5-10 yrs), Staff (10+ yrs), Principal (15+ yrs, leadership)

4. **One-Liner**: Concise, recruiter-friendly headline highlighting their core expertise

5. **Salary Estimate**: Be realistic based on experience level, location indicators, and tech stack. USD is fine unless location clearly indicates otherwise.

6. **Suggested Questions**: Provide 4-6 specific technical interview questions based on their tech stack and project types

7. **Strengths**: 3-5 specific, evidence-based strengths from their profile

8. **Weaknesses**: 2-4 areas to probe (NOT deficiencies, but gaps to explore)

9. **Academic Stats**: Only fill if scholarUrl is provided, otherwise set to null

CRITICAL: Return EXACTLY this JSON structure:
${JSON.stringify(schemaExample, null, 2)}

Ensure ALL numeric fields are numbers (not strings). The techStack array MUST have at least 4 items unless truly no signal exists.`;

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || "";
  const parsed = extractJsonObject(content);
  return normalizeAiResult(parsed as Partial<AiAnalysis>, fullName);
}

export async function analyzeCandidate(
  githubUrl: string,
  scholarUrl?: string,
  linkedinText?: string
): Promise<CandidateProfile> {
  const username = parseGitHubUsername(githubUrl);
  if (!username) throw new Error('Invalid GitHub URL');

  // 1. Fetch real raw data
  const [profileData, reposData, email] = await Promise.all([
    fetchGitHubProfile(username),
    fetchGitHubRepos(username),
    findEmail(username)
  ]);

  if (!profileData) {
    throw new Error('Could not retrieve GitHub data for this user.');
  }

  // 2. Aggregate language statistics for better tech stack inference
  const { languageStats, repoCount } = await aggregateLanguageStats(username, reposData || []);
  const fallbackTechStack = calculateTechStackFromLanguages(languageStats, repoCount);

  // 3. Prepare enhanced context for LLM
  const sortedRepos = (reposData || [])
    .sort((a: any, b: any) => b.stargazers_count - a.stargazers_count)
    .slice(0, 20); // Top 20 by stars for quality signal

  const context = {
    username,
    fullName: profileData.name || username,
    bio: profileData.bio || '',
    company: profileData.company || '',
    blog: profileData.blog || '',
    followers: profileData.followers || 0,
    following: profileData.following || 0,
    publicRepos: profileData.public_repos || 0,
    repos: sortedRepos.map((r: any) => ({
      name: r.name,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      forks: r.forks_count,
      openIssues: r.open_issues_count,
      license: r.license?.spdx_id || null,
      homepage: r.homepage || '',
      updated_at: r.updated_at,
      pushed_at: r.pushed_at
    })),
    languageStatistics: languageStats,
    repoCountByLanguage: repoCount,
    additionalContext: linkedinText || '',
    scholar: scholarUrl || 'None'
  };

  // 4. Run DeepSeek analysis with fallback tech stack
  const selectedModel = selectDeepSeekModel(context);
  const aiResult = await runDeepSeekAnalysis(context, context.fullName, selectedModel, fallbackTechStack);

  if (!scholarUrl) {
    aiResult.academicStats = null;
  }

  // 5. Ensure techStack has content - use fallback if LLM returned empty
  if (!aiResult.techStack || aiResult.techStack.length === 0) {
    console.warn('LLM returned empty techStack, using fallback from language analysis');
    aiResult.techStack = fallbackTechStack;
  }

  // 6. Merge data for final profile
  return {
    ...aiResult,
    username,
    avatarUrl: profileData.avatar_url,
    location: profileData.location || 'Remote / Unknown',
    email: email || profileData.email || null,
    topRepositories: sortedRepos.slice(0, 6).map((r: any) => ({
      name: r.name,
      description: r.description,
      stars: r.stargazers_count,
      language: r.language || 'Plain Text',
      url: `https://github.com/${username}/${r.name}`,
      updatedAt: r.updated_at
    }))
  };
}
