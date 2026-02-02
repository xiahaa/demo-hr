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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2D5BFF]/10 border border-[#2D5BFF]/20 text-[#2D5BFF] text-xs font-semibold mb-6 tracking-wider uppercase">
          🔍 AI驱动的代码人才评估 🧠
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent flex items-center justify-center gap-4">
          <img src="/logo.png" alt="知码 Logo" className="w-16 h-16 md:w-20 md:h-20" />
          知码<span className="text-[#00C896]"> {}</span>
        </h1>
        <p className="text-xl text-gray-400">
          粘贴 GitHub 个人资料 URL，让知码在几秒钟内深度分析代码能力、
          技术栈分布和工程师价值。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-4">
        <div className="relative group">
          <input
            type="text"
            required
            aria-label="GitHub 个人资料链接"
            placeholder="GitHub URL（例如 github.com/torvalds）"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:ring-2 focus:ring-[#2D5BFF]/50 focus:border-[#2D5BFF] transition-all text-xl placeholder:text-gray-600"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
          />
          <button
            type="submit"
            disabled={!githubUrl.trim()}
            aria-label="分析个人资料"
            className="absolute right-3 top-3 bottom-3 bg-[#2D5BFF] hover:bg-[#2D5BFF]/90 text-white px-8 rounded-xl font-bold transition-all shadow-lg shadow-[#2D5BFF]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            分析
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            aria-label="Google Scholar 链接"
            placeholder="Google Scholar URL（可选）"
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#2D5BFF]/30 focus:border-[#2D5BFF] transition-all text-base placeholder:text-gray-600"
            value={scholarUrl}
            onChange={(e) => setScholarUrl(e.target.value)}
          />
          <input
            type="text"
            aria-label="LinkedIn 内容"
            placeholder="LinkedIn 内容 / 原始文本（可选）"
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#2D5BFF]/30 focus:border-[#2D5BFF] transition-all text-base placeholder:text-gray-600"
            value={linkedinText}
            onChange={(e) => setLinkedinText(e.target.value)}
          />
        </div>
      </form>

      <div className="mt-8">
        <button
          onClick={handleDemo}
          className="text-base text-gray-500 hover:text-white transition-colors underline decoration-dotted underline-offset-4"
        >
          查看实时演示
        </button>
      </div>

      <div className="mt-12 flex gap-8 items-center text-gray-600 text-base font-medium grayscale opacity-50">
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
