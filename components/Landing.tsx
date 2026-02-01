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

  const handleDemo = () => {
    onAnalyze('demo', '', '');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] px-4">
      <div className="mb-12 text-center max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6 tracking-wider uppercase">
          AI驱动的人才情报
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
          揭示工程学的深度。
        </h1>
        <p className="text-lg text-gray-400">
          粘贴 GitHub 个人资料 URL，让 GitTalent AI 在几秒钟内可视化技术卓越性、
          学术影响力和市场价值。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-4">
        <div className="relative group">
          <input
            type="text"
            required
            aria-label="GitHub 个人资料链接"
            placeholder="GitHub URL（例如 github.com/torvalds）"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-lg placeholder:text-gray-600"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
          />
          <button
            type="submit"
            disabled={!githubUrl.trim()}
            aria-label="分析个人资料"
            className="absolute right-3 top-3 bottom-3 bg-indigo-600 hover:bg-indigo-500 text-white px-8 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            分析
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            aria-label="Google Scholar 链接"
            placeholder="Google Scholar URL（可选）"
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm placeholder:text-gray-600"
            value={scholarUrl}
            onChange={(e) => setScholarUrl(e.target.value)}
          />
          <input
            type="text"
            aria-label="LinkedIn 内容"
            placeholder="LinkedIn 内容 / 原始文本（可选）"
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm placeholder:text-gray-600"
            value={linkedinText}
            onChange={(e) => setLinkedinText(e.target.value)}
          />
        </div>
      </form>

      <div className="mt-8">
        <button
          onClick={handleDemo}
          className="text-sm text-gray-500 hover:text-white transition-colors underline decoration-dotted underline-offset-4"
        >
          查看实时演示
        </button>
      </div>

      <div className="mt-12 flex gap-8 items-center text-gray-600 text-sm font-medium grayscale opacity-50">
        <span>被以下团队使用</span>
        <div className="flex gap-6 items-center">
          <span className="font-bold text-lg">Tencent</span>
          <span className="font-bold text-lg">Alibaba</span>
          <span className="font-bold text-lg">Bytedance</span>
        </div>
      </div>
    </div>
  );
};
