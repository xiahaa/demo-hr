
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
  numpages: number;
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
