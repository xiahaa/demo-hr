/**
 * GitHub API 类型定义
 * 用于替代 any 类型，提供类型安全
 */

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  updated_at: string;
  pushed_at: string;
  fork: boolean;
  homepage: string | null;
  license: {
    spdx_id: string | null;
  } | null;
  html_url: string;
}

export interface GitHubUserProfile {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  followers: number;
  following: number;
  public_repos: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubEvent {
  id: string;
  type: string;
  payload: {
    commits?: Array<{
      author?: {
        email?: string;
      };
    }>;
  };
}

export interface GitHubLanguageStats {
  [language: string]: number;
}

export interface AggregatedLanguageStats {
  languageStats: GitHubLanguageStats;
  repoCount: Record<string, number>;
}

export interface TechStackItem {
  name: string;
  score: number;
}
