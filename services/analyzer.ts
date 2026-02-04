
import { CandidateProfile, TechStackItem } from "../types";
import {
  fetchGitHubProfile,
  fetchGitHubRepos,
  searchForEmail as findEmail,
  aggregateLanguageStats,
  calculateTechStackFromLanguages
} from "./github";

type AiAnalysis = Omit<CandidateProfile, "username" | "avatarUrl" | "location" | "email" | "topRepositories">;

const CACHE_PREFIX = 'gittalent_v1_';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export function getCacheKey(username: string, scholarUrl?: string, linkedinText?: string): string {
  // Simple hash for text content
  const hashText = (text: string) => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  };

  const scholarHash = scholarUrl ? hashText(scholarUrl) : '0';
  const linkedinHash = linkedinText ? hashText(linkedinText) : '0';
  return `${CACHE_PREFIX}${username}_${scholarHash}_${linkedinHash}`;
}

function getCachedProfile(key: string): CandidateProfile | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const { timestamp, data } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }

    return data as CandidateProfile;
  } catch (err) {
    console.warn('Error reading from cache:', err);
    return null;
  }
}

function saveCachedProfile(key: string, data: CandidateProfile) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify({
      timestamp: Date.now(),
      data
    }));
  } catch (err) {
    console.warn('Error saving to cache:', err);
  }
}

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

export function sanitizeUrl(url: string): string | undefined {
  if (!url || !url.trim()) return undefined;
  const trimmed = url.trim();

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    try {
      parsed = new URL(`https://${trimmed}`);
    } catch {
      return undefined;
    }
  }

  if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
    return parsed.href;
  }
  return undefined;
}

export function validateScholarUrl(url: string): string | undefined {
  return sanitizeUrl(url);
}

export function sanitizeInputText(text: string, maxLength: number): string {
  if (!text) return '';
  return text.slice(0, maxLength);
}

export function parseGitHubUsername(githubUrl: string): string {
  const trimmed = githubUrl.trim();
  if (!trimmed) return "";

  let username = "";

  try {
    const normalized = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    const url = new URL(normalized);
    const parts = url.pathname.split("/").filter(Boolean);
    username = parts[0] || "";
  } catch {
    // fallback for malformed URL inputs or unexpected formats that new URL() cannot parse
    username = trimmed.split("/").filter(Boolean)[0] || "";
  }

  // Security Validation: GitHub usernames are alphanumeric with single hyphens, max 39 chars.
  // Cannot begin or end with hyphen.
  const validUsernameRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

  return validUsernameRegex.test(username) ? username : "";
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
    recommendedPositions: Array.isArray(result.recommendedPositions) ? result.recommendedPositions : [],
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

  const systemPrompt = `您是资深技术招聘人员和招聘分析师。您的任务是分析开发者档案并创建全面的技术评估。

请仅返回有效的JSON格式，不要markdown格式，不要代码块，不要解释 - 只需要纯JSON。所有内容必须是中文。`;

  // Create detailed schema with examples
  const schemaExample = {
    name: "全名",
    oneLiner: "简洁的职业标题（例如，'专注于React和Node.js的高级全栈工程师'）",
    engineeringScore: 75,
    experienceLevel: "高级",
    techStack: [
      { name: "React/TypeScript", score: 90 },
      { name: "Node.js", score: 85 },
      { name: "Python", score: 70 }
    ],
    salaryEstimate: { min: 120000, max: 160000, currency: "USD" },
    suggestedQuestions: [
      "技术问题1？",
      "技术问题2？"
    ],
    recommendedPositions: [
      "高级全栈工程师",
      "前端架构师",
      "技术负责人"
    ],
    strengths: [
      "基于他们工作的具体优势",
      "另一个具体优势"
    ],
    weaknesses: [
      "面试中可以探索的领域",
      "潜在差距需要探究"
    ],
    academicStats: null
  };

  const userPrompt = `分析这个GitHub开发者档案并创建全面的技术评估。所有输出必须是中文。

档案数据:
${JSON.stringify(context, null, 2)}

基准技术栈（来自代码分析）:
${JSON.stringify(fallbackTechStack, null, 2)}

指令:
1. **技术栈**: 您必须提供4-8项技术及其评分(0-100)。以基准技术栈为基础，但基于以下因素优化评分：
   - 仓库复杂性和质量
   - 星标/复刻数表明的社区验证
   - 近期活动显示当前专业技能
   - README描述揭示的深度
   如果基准为空，从仓库名称、描述和语言推断。

2. **工程评分**(0-100): 考虑：
   - 代码复杂度（标星仓库、复刻、问题）
   - 一致性（定期提交、维护项目）
   - 影响力（关注者、热门仓库）
   - 文档质量

3. **经验等级**: 初级(0-2年), 中级(2-5年), 高级(5-10年), 资深(10年以上), 首席(15年以上，有领导力)

4. **一句话简介**: 简洁、招聘友好的标题，突出他们的核心专业技能

5. **薪资估算**: 基于经验等级、地点指标和技术栈给出现实估算。除非地点明确表明，否则使用USD。

6. **建议问题**: 基于他们的技术栈和项目类型提供4-6个具体的面试技术问题

7. **推荐岗位**: 基于候选人的技术栈、经验等级和项目类型，提供3-5个最适合的岗位名称。考虑：
   - 技术栈匹配度
   - 经验等级和职业发展路径
   - 项目类型和专业领域
   - 领导力和影响力指标

8. **优势**: 3-5个基于档案的具体、证据支撑的优势

9. **弱点**: 2-4个需要探索的领域（不是缺陷，而是可以探索的差距）

10. **学术统计**: 仅在提供scholarUrl时填写，否则设为null

重要: 返回完全符合此JSON结构的输出:
${JSON.stringify(schemaExample, null, 2)}

确保所有数字字段都是数字（不是字符串）。techStack数组必须至少有4项，除非确实没有信号。`;

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

  // Check cache
  const cacheKey = getCacheKey(username, scholarUrl, linkedinText);
  const cached = getCachedProfile(cacheKey);
  if (cached) {
    console.log('Returning cached profile for:', username);
    return cached;
  }

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
    additionalContext: sanitizeInputText(linkedinText || '', 10000),
    scholar: sanitizeUrl(scholarUrl || '') || 'None'
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
  const finalProfile = {
    ...aiResult,
    username,
    avatarUrl: profileData.avatar_url,
    location: profileData.location || 'Remote / Unknown',
    email: email || profileData.email || null,
    website: sanitizeUrl(profileData.blog || '') || null,
    topRepositories: sortedRepos.slice(0, 6).map((r: any) => ({
      name: r.name,
      description: r.description,
      stars: r.stargazers_count,
      language: r.language || 'Plain Text',
      url: `https://github.com/${username}/${r.name}`,
      updatedAt: r.updated_at
    }))
  };

  // Save to cache
  saveCachedProfile(cacheKey, finalProfile);

  return finalProfile;
}
