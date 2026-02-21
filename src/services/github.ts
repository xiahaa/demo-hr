/**
 * GitHub API 服务
 * 提供类型安全的 GitHub API 调用
 */

import {
  Repository,
  GitHubUser,
  GitHubApiError,
  AppError,
  getErrorMessage,
} from '../types';

// GitHub API 基础 URL
const GITHUB_API_BASE = 'https://api.github.com';

// 请求配置
interface RequestConfig {
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * 构建 GitHub API URL
 */
function buildUrl(endpoint: string): string {
  return `${GITHUB_API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}

/**
 * 处理 GitHub API 响应
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData: GitHubApiError = await response.json().catch(() => ({
      message: `HTTP ${response.status}: ${response.statusText}`,
    }));
    
    const error = new Error(errorData.message || `GitHub API 错误: ${response.status}`);
    (error as Error & { status: number }).status = response.status;
    throw error;
  }
  
  return response.json() as Promise<T>;
}

/**
 * 发送 GitHub API 请求
 */
async function githubRequest<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const url = buildUrl(endpoint);
  
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    ...config.headers,
  };
  
  // 如果存在 GitHub Token，添加到请求头
  const token = import.meta.env.VITE_GITHUB_TOKEN;
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }
  
  const response = await fetch(url, {
    headers,
    signal: config.signal,
  });
  
  return handleResponse<T>(response);
}

/**
 * 解析 GitHub URL 获取用户名
 */
export function parseGitHubUsername(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }
  
  // 清理输入，防止 XSS
  const cleanUrl = url.trim().replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
  
  // 匹配 github.com/username 或 github.com/username/repo
  const match = cleanUrl.match(/github\.com\/([^\/\s]+)/i);
  if (match) {
    return match[1];
  }
  
  // 直接是用户名
  if (/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(cleanUrl)) {
    return cleanUrl;
  }
  
  return null;
}

/**
 * 获取用户信息
 */
export async function getUser(
  username: string,
  signal?: AbortSignal
): Promise<GitHubUser> {
  if (!username || typeof username !== 'string') {
    throw new Error('用户名不能为空');
  }
  
  // 验证用户名格式
  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(username)) {
    throw new Error('无效的用户名格式');
  }
  
  return githubRequest<GitHubUser>(`/users/${encodeURIComponent(username)}`, {
    signal,
  });
}

/**
 * 获取用户仓库列表
 */
export async function getUserRepos(
  username: string,
  options: {
    perPage?: number;
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
    signal?: AbortSignal;
  } = {}
): Promise<Repository[]> {
  const { 
    perPage = 100, 
    sort = 'updated', 
    direction = 'desc',
    signal,
  } = options;
  
  if (!username || typeof username !== 'string') {
    throw new Error('用户名不能为空');
  }
  
  const queryParams = new URLSearchParams({
    per_page: String(perPage),
    sort,
    direction,
  });
  
  return githubRequest<Repository[]>(
    `/users/${encodeURIComponent(username)}/repos?${queryParams}`,
    { signal }
  );
}

/**
 * 获取单个仓库信息
 */
export async function getRepo(
  owner: string,
  repo: string,
  signal?: AbortSignal
): Promise<Repository> {
  if (!owner || !repo) {
    throw new Error('仓库所有者和名称不能为空');
  }
  
  return githubRequest<Repository>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
    { signal }
  );
}

/**
 * 搜索仓库
 */
export async function searchRepos(
  query: string,
  options: {
    sort?: 'stars' | 'forks' | 'updated';
    order?: 'asc' | 'desc';
    perPage?: number;
    signal?: AbortSignal;
  } = {}
): Promise<{ items: Repository[]; total_count: number }> {
  const { 
    sort = 'stars', 
    order = 'desc', 
    perPage = 30,
    signal,
  } = options;
  
  if (!query || typeof query !== 'string') {
    throw new Error('搜索关键词不能为空');
  }
  
  const queryParams = new URLSearchParams({
    q: query,
    sort,
    order,
    per_page: String(perPage),
  });
  
  return githubRequest(`/search/repositories?${queryParams}`, { signal });
}

/**
 * 获取仓库语言统计
 */
export async function getRepoLanguages(
  owner: string,
  repo: string,
  signal?: AbortSignal
): Promise<Record<string, number>> {
  if (!owner || !repo) {
    throw new Error('仓库所有者和名称不能为空');
  }
  
  return githubRequest<Record<string, number>>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`,
    { signal }
  );
}

/**
 * 批量获取仓库信息（带并发控制）
 */
export async function getReposBatch(
  repos: Array<{ owner: string; repo: string }>,
  options: {
    concurrency?: number;
    signal?: AbortSignal;
  } = {}
): Promise<Array<Repository | null>> {
  const { concurrency = 5, signal } = options;
  
  const results: Array<Repository | null> = [];
  
  // 使用简单的并发控制
  for (let i = 0; i < repos.length; i += concurrency) {
    if (signal?.aborted) {
      throw new Error('请求已取消');
    }
    
    const batch = repos.slice(i, i + concurrency);
    const batchPromises = batch.map(async ({ owner, repo }) => {
      try {
        return await getRepo(owner, repo, signal);
      } catch (error) {
        console.warn(`获取仓库 ${owner}/${repo} 失败:`, getErrorMessage(error as AppError));
        return null;
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * 检查速率限制状态
 */
export async function getRateLimit(signal?: AbortSignal): Promise<{
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}> {
  const data = await githubRequest<{
    resources: {
      core: {
        limit: number;
        remaining: number;
        reset: number;
        used: number;
      };
    };
  }>('/rate_limit', { signal });
  
  return data.resources.core;
}

// 导出类型
export type { Repository, GitHubUser, GitHubApiError };
