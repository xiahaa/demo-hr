
export interface TechStackItem {
  name: string;
  score: number; // 0-100
}

export interface Repository {
  name: string;
  description: string;
  stars: number;
  language: string;
  url: string;
  updatedAt: string;
}

export interface CandidateProfile {
  name: string;
  username: string;
  avatarUrl: string;
  oneLiner: string;
  location: string;
  email: string | null;
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
