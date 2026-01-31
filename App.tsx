import React, { useState } from 'react';
import { Landing } from './components/Landing';
import { LoadingScreen } from './components/LoadingScreen';
import { CandidateCard } from './components/CandidateCard';
import { AppStatus, CandidateProfile } from './types';
import { analyzeCandidate } from './services/analyzer';
import { MOCK_PROFILE } from './services/mockData';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>('IDLE');
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (githubUrl: string, scholarUrl?: string, linkedinText?: string) => {
    setStatus('ANALYZING');
    setError(null);

    // Mock/Demo Mode
    if (githubUrl === 'demo') {
      setTimeout(() => {
        setProfile(MOCK_PROFILE);
        setStatus('RESULT');
      }, 2000); // Simulate network delay
      return;
    }

    try {
      const result = await analyzeCandidate(githubUrl, scholarUrl, linkedinText);
      setProfile(result);
      setStatus('RESULT');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred during analysis.');
      setStatus('ERROR');
    }
  };

  const reset = () => {
    setStatus('IDLE');
    setProfile(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 selection:bg-indigo-500/30">
      {status === 'IDLE' && <Landing onAnalyze={handleAnalyze} />}
      
      {status === 'ANALYZING' && <LoadingScreen />}

      {status === 'RESULT' && profile && (
        <div className="max-w-6xl mx-auto px-4 py-12">
          <button 
            onClick={reset}
            className="mb-8 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            New Analysis
          </button>
          <CandidateCard profile={profile} />
        </div>
      )}

      {status === 'ERROR' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl max-w-md">
            <h2 className="text-xl font-bold text-red-400 mb-2">Analysis Failed</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <button 
              onClick={reset}
              className="bg-white text-black px-6 py-2 rounded-full font-medium hover:bg-gray-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
