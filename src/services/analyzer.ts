/**
 * 候选人分析服务
 * 提供类型安全的候选人分析功能
 */

import {
  Repository,
  GitHubUser,
  CandidateProfile,
  AnalysisResult,
  TechStackItem,
  TopRepository,
  AppError,
  getErrorMessage,
} from '../types';

import {
  getUser,
  getUserRepos,
  parseGitHubUsername,
} from './github';

// 缓存配置
const CACHE_DURATION = 5 * 60 * 1000; // 5 分钟

interface CacheEntry {
  data: AnalysisResult;
  timestamp: number;
}

const analysisCache = new Map<string, CacheEntry>();

/**
 * 计算技术栈得分
 */
function calculateTechStack(repos: Repository[]): TechStackItem[] {
  const languageStats: Record<string, { count: number; stars: number }> = {};
  
  for (const repo of repos) {
    if (!repo.language) continue;
    
    if (!languageStats[repo.language]) {
      languageStats[repo.language] = { count: 0, stars: 0 };
    }
    
    languageStats[repo.language].count += 1;
    languageStats[repo.language].stars += repo.stargazers_count;
  }
  
  // 转换为数组并计算得分
  return Object.entries(languageStats)
    .map(([name, stats]) => ({
      name,
      score: Math.round(
        (stats.count * 10 + stats.stars * 0.5) / Math.max(1, repos.length / 10)
      ),
      category: categorizeLanguage(name),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

/**
 * 对编程语言进行分类
 */
function categorizeLanguage(language: string): string {
  const categories: Record<string, string> = {
    'JavaScript': 'Frontend',
    'TypeScript': 'Frontend',
    'HTML': 'Frontend',
    'CSS': 'Frontend',
    'Vue': 'Frontend',
    'Python': 'Backend',
    'Java': 'Backend',
    'Go': 'Backend',
    'Rust': 'Backend',
    'C++': 'Backend',
    'C': 'Backend',
    'C#': 'Backend',
    'PHP': 'Backend',
    'Ruby': 'Backend',
    'Swift': 'Mobile',
    'Kotlin': 'Mobile',
    'Objective-C': 'Mobile',
    'Dart': 'Mobile',
  };
  
  return categories[language] || 'Other';
}

/**
 * 分析候选人优势
 */
function analyzeStrengths(repos: Repository[], user: GitHubUser): string[] {
  const strengths: string[] = [];
  
  // 基于 star 数的优势
  const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  if (totalStars > 1000) {
    strengths.push(`拥有高影响力项目，总 Star 数 ${totalStars}`);
  }
  
  // 基于仓库多样性的优势
  const languages = new Set(repos.map(r => r.language).filter(Boolean));
  if (languages.size >= 5) {
    strengths.push(`技术栈多样化，掌握 ${languages.size} 种编程语言`);
  }
  
  // 基于活跃度的优势
  const recentRepos = repos.filter(repo => {
    const updated = new Date(repo.updated_at);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return updated > threeMonthsAgo;
  });
  
  if (recentRepos.length >= 3) {
    strengths.push('近期活跃度高，持续贡献代码');
  }
  
  // 基于开源贡献的优势
  const openSourceRepos = repos.filter(r => !r.private && r.stargazers_count > 0);
  if (openSourceRepos.length >= 5) {
    strengths.push('积极参与开源社区');
  }
  
  // 基于粉丝数的优势
  if (user.followers >= 100) {
    strengths.push(`拥有 ${user.followers} 个关注者，社区影响力良好`);
  }
  
  return strengths.length > 0 ? strengths : ['代码质量良好'];
}

/**
 * 分析候选人劣势
 */
function analyzeWeaknesses(repos: Repository[], user: GitHubUser): string[] {
  const weaknesses: string[] = [];
  
  // 检查活跃度
  const recentRepos = repos.filter(repo => {
    const pushed = new Date(repo.pushed_at);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return pushed > sixMonthsAgo;
  });
  
  if (recentRepos.length < 2 && repos.length > 0) {
    weaknesses.push('近期活跃度较低，建议保持持续贡献');
  }
  
  // 检查文档
  const reposWithoutDescription = repos.filter(r => !r.description);
  if (reposWithoutDescription.length > repos.length * 0.5 && repos.length > 3) {
    weaknesses.push('部分项目缺少描述，建议完善文档');
  }
  
  // 检查许可证
  const reposWithoutLicense = repos.filter(r => !r.license);
  if (reposWithoutLicense.length > repos.length * 0.7 && repos.length > 3) {
    weaknesses.push('多数项目缺少开源许可证');
  }
  
  // 检查 README
  // 注意：这需要额外的 API 调用，这里只是示例
  
  return weaknesses;
}

/**
 * 计算综合得分
 */
function calculateOverallScore(
  repos: Repository[],
  user: GitHubUser,
  techStack: TechStackItem[]
): number {
  let score = 50; // 基础分
  
  // 基于 star 数加分
  const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  score += Math.min(totalStars / 100, 20);
  
  // 基于仓库数量加分
  score += Math.min(repos.length * 0.5, 10);
  
  // 基于技术栈多样性加分
  score += Math.min(techStack.length * 1, 10);
  
  // 基于粉丝数加分
  score += Math.min(user.followers / 50, 10);
  
  return Math.min(Math.round(score), 100);
}

/**
 * 转换仓库为简化格式
 */
function convertToTopRepositories(repos: Repository[]): TopRepository[] {
  return repos
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 6)
    .map(repo => ({
      name: repo.name,
      description: repo.description,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language,
      updatedAt: repo.updated_at,
      url: repo.html_url,
    }));
}

/**
 * 分析候选人
 * 
 * @param githubUrl - GitHub URL 或用户名
 * @param options - 分析选项
 * @returns 候选人分析结果
 */
export async function analyzeCandidate(
  githubUrl: string,
  options: {
    skipCache?: boolean;
    signal?: AbortSignal;
  } = {}
): Promise<AnalysisResult> {
  const { skipCache = false, signal } = options;
  
  // 解析用户名
  const username = parseGitHubUsername(githubUrl);
  if (!username) {
    throw new Error('无效的 GitHub URL 或用户名');
  }
  
  // 检查缓存
  if (!skipCache) {
    const cached = analysisCache.get(username);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
  }
  
  try {
    // 并行获取用户信息和仓库列表
    const [user, repos] = await Promise.all([
      getUser(username, signal),
      getUserRepos(username, { perPage: 100, signal }),
    ]);
    
    // 过滤掉 fork 的仓库
    const ownedRepos = repos.filter(repo => !repo.fork);
    
    // 计算技术栈
    const techStack = calculateTechStack(ownedRepos);
    
    // 分析优势和劣势
    const strengths = analyzeStrengths(ownedRepos, user);
    const weaknesses = analyzeWeaknesses(ownedRepos, user);
    
    // 计算综合得分
    const overallScore = calculateOverallScore(ownedRepos, user, techStack);
    
    // 构建候选人档案
    const profile: CandidateProfile = {
      name: user.name || user.login,
      avatar: user.avatar_url,
      github: user.html_url,
      bio: user.bio || '',
      location: user.location || '',
      company: user.company || '',
      blog: user.blog,
      email: user.email,
      twitter: user.twitter_username,
      followers: user.followers,
      following: user.following,
      publicRepos: user.public_repos,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      topRepositories: convertToTopRepositories(ownedRepos),
      techStack,
      strengths,
      weaknesses,
      overallScore,
      hireable: user.hireable ?? false,
    };
    
    const result: AnalysisResult = {
      profile,
      rawData: { user, repos: ownedRepos },
    };
    
    // 存入缓存
    analysisCache.set(username, {
      data: result,
      timestamp: Date.now(),
    });
    
    return result;
  } catch (error) {
    // 统一错误处理
    const message = getErrorMessage(error as AppError);
    
    // 根据错误类型提供更友好的提示
    if (message.includes('404')) {
      throw new Error(`用户 "${username}" 不存在`);
    }
    if (message.includes('403')) {
      throw new Error('API 速率限制，请稍后再试');
    }
    if (signal?.aborted) {
      throw new Error('分析已取消');
    }
    
    throw new Error(`分析失败: ${message}`);
  }
}

/**
 * 清除分析缓存
 */
export function clearAnalysisCache(): void {
  analysisCache.clear();
}

/**
 * 获取缓存统计
 */
export function getCacheStats(): { size: number; entries: string[] } {
  return {
    size: analysisCache.size,
    entries: Array.from(analysisCache.keys()),
  };
}
