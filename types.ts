
export interface TechStackItem {
  name: string;
  score: number; // 0-100
}

export interface Repository {
  name: string;
  description: string;
  summary?: string; // One-sentence project summary
  useCases?: string[]; // Common application scenarios
  stars: number;
  language: string;
  url: string;
  updatedAt: string;
}

export interface PersonalWebsiteData {
  url: string;
  title: string | null;
  description: string | null;
  technologies: string[];
  skills: string[];
  canScrape: boolean;
  scrapingDisallowed?: boolean;
}

export interface PDFResumeData {
  fileName: string;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
  };
  extractedInfo: {
    name?: string;
    email?: string;
    skills: string[];
    experience: string[];
    education: string[];
    summary: string;
  };
  numPages: number;
}

export interface CandidateProfile {
  name: string;
  username: string;
  avatarUrl: string;
  oneLiner: string;
  location: string;
  email: string | null;
  website?: string | null; // Personal website or blog (from GitHub profile)
  personalWebsiteData?: PersonalWebsiteData | null; // Scraped data from personal website
  pdfResumeData?: PDFResumeData | null; // Extracted data from PDF resume
  engineeringScore: number; // 0-100
  salaryEstimate: {
    min: number;
    max: number;
    currency: string;
  };
  techStack: TechStackItem[];
  topRepositories: Repository[];
  suggestedQuestions: string[];
  recommendedPositions: string[];
  academicStats: {
    citations: number;
    hIndex: number;
    publications: number;
  } | null;
  strengths: string[];
  weaknesses: string[];
  experienceLevel: 'Junior' | 'Mid' | 'Senior' | 'Staff' | 'Principal';
}

export type AppStatus = 'IDLE' | 'ANALYZING' | 'RESULT' | 'ERROR';

// JD Matching Feature Types
export interface JobDescription {
  industry: string;
  companyName: string;
  jobDescription: string;
  resumeUrl?: string;
  resumeFile?: File;
}

export interface MatchScore {
  category: string;
  score: number; // 0-100
  details: string;
}

export interface JDMatchResult {
  overallScore: number; // 0-100
  matchScores: MatchScore[];
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  fitLevel: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  socialProfile?: {
    mbti: string;
    teamRole: string;
    collaborationSignal: string;
    confidence: number; // 0-1
  };
}

export type FeatureMode = 'github-analysis' | 'jd-match' | 'zhima-fit';
