
import { GoogleGenAI, Type } from "@google/genai";
import { CandidateProfile } from "../types";
import { fetchGitHubProfile, fetchGitHubRepos, searchForEmail as findEmail } from "./github";

export async function analyzeCandidate(
  githubUrl: string, 
  scholarUrl?: string, 
  linkedinText?: string
): Promise<CandidateProfile> {
  const username = githubUrl.split('/').pop()?.replace(/\?.*/, '') || '';
  if (!username) throw new Error('Invalid GitHub URL');

  // 1. Fetch real raw data
  const [profileData, reposData, email] = await Promise.all([
    fetchGitHubProfile(username),
    fetchGitHubRepos(username),
    findEmail(username)
  ]);

  if (!profileData) {
    throw new Error('Could not retrieve GitHub data for this user.');
  }

  // 2. Prepare context for Gemini
  const context = {
    username,
    fullName: profileData.name || username,
    bio: profileData.bio || '',
    repos: (reposData || []).map((r: any) => ({
      name: r.name,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      updated_at: r.updated_at
    })),
    additionalContext: linkedinText || '',
    scholar: scholarUrl || 'None'
  };

  // 3. Initialize Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this developer profile and return a structured assessment. Data: ${JSON.stringify(context)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          oneLiner: { type: Type.STRING },
          engineeringScore: { type: Type.NUMBER },
          experienceLevel: { type: Type.STRING },
          techStack: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                score: { type: Type.NUMBER }
              },
              required: ["name", "score"]
            }
          },
          salaryEstimate: {
            type: Type.OBJECT,
            properties: {
              min: { type: Type.NUMBER },
              max: { type: Type.NUMBER },
              currency: { type: Type.STRING }
            }
          },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          academicStats: {
            type: Type.OBJECT,
            properties: {
              citations: { type: Type.NUMBER },
              hIndex: { type: Type.NUMBER },
              publications: { type: Type.NUMBER }
            }
          }
        },
        required: ["name", "oneLiner", "engineeringScore", "techStack", "salaryEstimate", "strengths", "weaknesses", "experienceLevel"]
      }
    }
  });

  const aiResult = JSON.parse(response.text);

  // 4. Merge data for final profile - increased to 6 repos for better sorting experience
  return {
    ...aiResult,
    username,
    avatarUrl: profileData.avatar_url,
    location: profileData.location || 'Remote / Unknown',
    email: email || profileData.email || null,
    topRepositories: context.repos.slice(0, 6).map((r: any) => ({
      name: r.name,
      description: r.description,
      stars: r.stars,
      language: r.language || 'Plain Text',
      url: `https://github.com/${username}/${r.name}`,
      updatedAt: r.updated_at
    }))
  };
}
