import { CandidateProfile } from "../types";

export async function analyzeCandidate(
  githubUrl: string,
  scholarUrl?: string,
  linkedinText?: string
): Promise<CandidateProfile> {
  const response = await fetch('/api/analyze', {
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
