// ==================== GitHub API 类型定义 ====================

/**
 * GitHub 仓库许可证信息
 */
export interface GitHubLicense {
  key: string;
  name: string;
  spdx_id: string | null;
  url: string | null;
  node_id: string;
}

/**
 * GitHub 仓库所有者信息
 */
export interface GitHubOwner {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  type: 'User' | 'Organization' | 'Bot';
}

/**
 * GitHub 仓库信息
 */
export interface Repository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: GitHubOwner;
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  master_branch?: string;
  default_branch: string;
  score?: number;
  archived: boolean;
  disabled: boolean;
  visibility?: 'public' | 'private' | 'internal';
  license: GitHubLicense | null;
  topics?: string[];
  has_issues: boolean;
  has_projects: boolean;
  has_downloads: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  has_discussions: boolean;
  forks: number;
  open_issues: number;
  watchers: number;
}

/**
 * GitHub 用户信息
 */
export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
  hireable: boolean | null;
}

/**
 * GitHub API 错误响应
 */
export interface GitHubApiError {
  message: string;
  documentation_url?: string;
  status?: number;
}

// ==================== 应用业务类型定义 ====================

/**
 * 技术栈项目
 */
export interface TechStackItem {
  name: string;
  score: number;
  category?: string;
}

/**
 * 候选人档案
 */
export interface CandidateProfile {
  name: string;
  avatar: string;
  github: string;
  bio: string;
  location: string;
  company: string;
  blog: string | null;
  email: string | null;
  twitter: string | null;
  followers: number;
  following: number;
  publicRepos: number;
  createdAt: string;
  updatedAt: string;
  topRepositories: TopRepository[];
  techStack: TechStackItem[];
  strengths: string[];
  weaknesses: string[];
  overallScore: number;
  hireable: boolean;
}

/**
 * 顶级仓库（简化版）
 */
export interface TopRepository {
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  updatedAt: string;
  url: string;
}

/**
 * 分析结果
 */
export interface AnalysisResult {
  profile: CandidateProfile;
  rawData: {
    user: GitHubUser;
    repos: Repository[];
  };
}

/**
 * JD 匹配结果
 */
export interface JDMatchResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  recommendations: string[];
  analysis: string;
}

/**
 * 应用状态
 */
export type AppStatus = 'IDLE' | 'ANALYZING' | 'RESULT' | 'ERROR';

/**
 * 功能模式
 */
export type FeatureMode = 'github-analysis' | 'jd-matching' | 'resume-polish' | 'career-profile';

// ==================== 错误类型定义 ====================

/**
 * 应用错误类型
 */
export type AppError = Error | { message: string } | unknown;

/**
 * 获取错误消息
 */
export function getErrorMessage(err: AppError): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const message = (err as { message: unknown }).message;
    return typeof message === 'string' ? message : String(message);
  }
  if (typeof err === 'string') {
    return err;
  }
  return '发生未知错误';
}

// ==================== PDF 相关类型 ====================

/**
 * PDF 解析结果
 */
export interface PDFData {
  text: string;
  metadata?: {
    title?: string;
    author?: string;
    creationDate?: string;
    numPages?: number;
  };
}

/**
 * PDF 解析错误
 */
export class PDFParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PDFParseError';
  }
}

/**
 * Web Worker 消息类型
 */
export interface PDFWorkerMessage {
  type: 'success' | 'error' | 'progress';
  data?: PDFData;
  error?: string;
  progress?: number;
}

export interface PDFWorkerInput {
  arrayBuffer: ArrayBuffer;
  fileName?: string;
}
