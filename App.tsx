import React, { useState, Suspense } from 'react';
import { Landing } from './components/Landing';
import { JDMatch } from './components/JDMatch';
import { JDMatchResultCard } from './components/JDMatchResultCard';
import { LoadingScreen } from './components/LoadingScreen';
import { AppStatus, CandidateProfile, FeatureMode, JDMatchResult } from './types';
import { analyzeCandidate } from './services/analyzer';
import { analyzeJDMatch } from './services/jdMatcher';
import { MOCK_PROFILE } from './services/mockData';
import { User, Briefcase } from 'lucide-react';

// Lazy load CandidateCard to reduce initial bundle size
// Includes heavy dependencies like Recharts and Framer Motion
const CandidateCard = React.lazy(() =>
  import('./components/CandidateCard').then(module => ({ default: module.CandidateCard }))
);

const App: React.FC = () => {
  const [featureMode, setFeatureMode] = useState<FeatureMode>('github-analysis');
  const [status, setStatus] = useState<AppStatus>('IDLE');
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [jdMatchResult, setJdMatchResult] = useState<JDMatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (githubUrl: string, scholarUrl?: string, linkedinText?: string, personalWebsiteUrl?: string, pdfFile?: File) => {
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
      const result = await analyzeCandidate(githubUrl, scholarUrl, linkedinText, personalWebsiteUrl, pdfFile);
      setProfile(result);
      setStatus('RESULT');
    } catch (err: any) {
      console.error(err);
      setError(err.message || '分析过程中发生意外错误。');
      setStatus('ERROR');
    }
  };

  const handleJDMatch = async (industry: string, companyName: string, jobDescription: string, resumeUrl?: string, resumeFile?: File) => {
    setStatus('ANALYZING');
    setError(null);

    try {
      const result = await analyzeJDMatch({
        industry,
        companyName,
        jobDescription,
        resumeUrl,
        resumeFile,
      });
      setJdMatchResult(result);
      setStatus('RESULT');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'JD匹配分析过程中发生意外错误。');
      setStatus('ERROR');
    }
  };

  const reset = () => {
    setStatus('IDLE');
    setProfile(null);
    setJdMatchResult(null);
    setError(null);
  };

  const switchMode = (mode: FeatureMode) => {
    setFeatureMode(mode);
    reset();
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-gray-100 selection:bg-[#2D5BFF]/30">
      {/* Feature Mode Navigation */}
      {status === 'IDLE' && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-full p-1 flex gap-1">
            <button
              onClick={() => switchMode('github-analysis')}
              aria-pressed={featureMode === 'github-analysis'}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                featureMode === 'github-analysis'
                  ? 'bg-[#2D5BFF] text-white shadow-lg shadow-[#2D5BFF]/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              GitHub 分析
            </button>
            <button
              onClick={() => switchMode('jd-match')}
              aria-pressed={featureMode === 'jd-match'}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                featureMode === 'jd-match'
                  ? 'bg-[#2D5BFF] text-white shadow-lg shadow-[#2D5BFF]/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              JD 匹配
            </button>
          </div>
        </div>
      )}

      {status === 'IDLE' && featureMode === 'github-analysis' && (
        <Landing onAnalyze={handleAnalyze} />
      )}

      {status === 'IDLE' && featureMode === 'jd-match' && (
        <JDMatch onAnalyze={handleJDMatch} />
      )}

      {status === 'ANALYZING' && <LoadingScreen />}

      {status === 'RESULT' && profile && featureMode === 'github-analysis' && (
        <div className="max-w-6xl mx-auto px-4 py-12">
          <button
            onClick={reset}
            className="mb-8 flex items-center gap-2 text-base text-gray-400 hover:text-white transition-colors group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5BFF]"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            新分析
          </button>
          <Suspense fallback={<LoadingScreen />}>
            <CandidateCard profile={profile} />
          </Suspense>
        </div>
      )}

      {status === 'RESULT' && jdMatchResult && featureMode === 'jd-match' && (
        <div className="max-w-6xl mx-auto px-4 py-12">
          <button
            onClick={reset}
            className="mb-8 flex items-center gap-2 text-base text-gray-400 hover:text-white transition-colors group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5BFF]"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            新分析
          </button>
          <JDMatchResultCard result={jdMatchResult} />
        </div>
      )}

      {status === 'ERROR' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl max-w-md">
            <h2 className="text-2xl font-bold text-red-400 mb-2">分析失败</h2>
            <p className="text-base text-gray-400 mb-6">{error}</p>
            <button
              onClick={reset}
              className="bg-white text-black px-6 py-2 rounded-full font-medium hover:bg-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5BFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1A2E]"
            >
              重试
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
