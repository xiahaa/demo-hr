import { CandidateProfile } from "../types";

// Get API base URL from environment variable, fallback to '/api' for development (where proxy works)
const API_BASE_URL = process.env.API_BASE_URL || '/api';

export async function analyzeCandidate(
  githubUrl: string,
  scholarUrl?: string,
  linkedinText?: string
): Promise<CandidateProfile> {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      githubUrl,
      scholarUrl,
      linkedinText,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Analysis failed with status ${response.status}`);
  }

  return await response.json();
}
