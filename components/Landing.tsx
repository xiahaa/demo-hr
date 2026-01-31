
import React, { useState } from 'react';

interface LandingProps {
  onAnalyze: (githubUrl: string, scholarUrl?: string, linkedinText?: string) => void;
}

export const Landing: React.FC<LandingProps> = ({ onAnalyze }) => {
  const [githubUrl, setGithubUrl] = useState('');
  const [scholarUrl, setScholarUrl] = useState('');
  const [linkedinText, setLinkedinText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl.trim()) return;
    onAnalyze(githubUrl, scholarUrl, linkedinText);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] px-4">
      <div className="mb-12 text-center max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6 tracking-wider uppercase">
          AI-Powered Talent Intelligence
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
          Uncover the depth of engineering.
        </h1>
        <p className="text-lg text-gray-400">
          Paste a GitHub profile URL and let GitTalent AI visualize technical excellence, 
          academic impact, and market value in seconds.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-4">
        <div className="relative group">
          <input
            type="text"
            required
            placeholder="GitHub URL (e.g. github.com/torvalds)"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-lg placeholder:text-gray-600"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
          />
          <button
            type="submit"
            className="absolute right-3 top-3 bottom-3 bg-indigo-600 hover:bg-indigo-500 text-white px-8 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20"
          >
            Analyze
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Google Scholar URL (Optional)"
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm placeholder:text-gray-600"
            value={scholarUrl}
            onChange={(e) => setScholarUrl(e.target.value)}
          />
          <input
            type="text"
            placeholder="LinkedIn Content / Raw Text (Optional)"
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm placeholder:text-gray-600"
            value={linkedinText}
            onChange={(e) => setLinkedinText(e.target.value)}
          />
        </div>
      </form>
      
      <div className="mt-20 flex gap-8 items-center text-gray-600 text-sm font-medium grayscale opacity-50">
        <span>Used by teams at</span>
        <div className="flex gap-6 items-center">
          <span className="font-bold text-lg">HYPER</span>
          <span className="font-bold text-lg">VERTEX</span>
          <span className="font-bold text-lg">NEURAL</span>
        </div>
      </div>
    </div>
  );
};
