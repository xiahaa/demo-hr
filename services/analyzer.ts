
import { CandidateProfile } from "../types";
import { fetchGitHubProfile, fetchGitHubRepos, searchForEmail as findEmail } from "./github";

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
  return {
    name: result.name || fullName,
    oneLiner: result.oneLiner || "Software engineer",
    engineeringScore: typeof result.engineeringScore === "number" ? result.engineeringScore : 50,
    experienceLevel: (result.experienceLevel as AiAnalysis["experienceLevel"]) || "Mid",
    techStack: Array.isArray(result.techStack) ? result.techStack : [],
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
  model: string
): Promise<AiAnalysis> {
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Missing DeepSeek API key. Set DEEPSEEK_API_KEY in .env");
  }

  const systemPrompt =
    "You are a hiring analyst. Return ONLY valid JSON matching the required schema, no prose or markdown.";
  const userPrompt =
    "Analyze this developer profile and return a structured assessment. " +
    "Include 4-6 suggested technical interview questions. " +
    "Ensure numeric fields are numbers (not strings). Data: " +
    JSON.stringify(context);

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
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

  // 2. Prepare context for Gemini
  const context = {
    username,
    fullName: profileData.name || username,
    bio: profileData.bio || '',
    company: profileData.company || '',
    blog: profileData.blog || '',
    followers: profileData.followers || 0,
    following: profileData.following || 0,
    publicRepos: profileData.public_repos || 0,
    repos: (reposData || []).map((r: any) => ({
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
    additionalContext: linkedinText || '',
    scholar: scholarUrl || 'None'
  };

  // 3. Run DeepSeek analysis
  const selectedModel = selectDeepSeekModel(context);
  const aiResult = await runDeepSeekAnalysis(context, context.fullName, selectedModel);
  if (!scholarUrl) {
    aiResult.academicStats = null;
  }

  // 4. Merge data for final profile - increased to 6 repos for better sorting experience
  return {
    ...aiResult,
    username,
    avatarUrl: profileData.avatar_url,
    location: profileData.location || 'Remote / Unknown',
    email: email || profileData.email || null,
    topRepositories: context.repos.slice(0, 6).map((r: any) => ({
      name: r.name,
      description: r.description,
      stars: r.stars,
      language: r.language || 'Plain Text',
      url: `https://github.com/${username}/${r.name}`,
      updatedAt: r.updated_at
    }))
  };
}
