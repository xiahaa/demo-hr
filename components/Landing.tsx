import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';

interface LandingProps {
  onAnalyze: (githubUrl: string, scholarUrl?: string, linkedinText?: string, personalWebsiteUrl?: string, pdfFile?: File) => void;
}

export const Landing: React.FC<LandingProps> = ({ onAnalyze }) => {
  const [githubUrl, setGithubUrl] = useState('');
  const [scholarUrl, setScholarUrl] = useState('');
  const [linkedinText, setLinkedinText] = useState('');
  const [personalWebsiteUrl, setPersonalWebsiteUrl] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const githubInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl.trim()) return;
    onAnalyze(githubUrl, scholarUrl, linkedinText, personalWebsiteUrl, pdfFile || undefined);
  };

  const handleDemo = () => {
    onAnalyze('demo', '', '', '');
  };

  const handleClearGithubUrl = () => {
    setGithubUrl('');
    githubInputRef.current?.focus();
  };

  const handleClearFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPdfFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.focus();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setError(null);
    } else if (file) {
      setError('请上传 PDF 文件');
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setPdfFile(file);
        setError(null);
      } else {
        setError('请上传 PDF 文件');
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] px-4">
      <div className="mb-12 text-center max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2D5BFF]/10 border border-[#2D5BFF]/20 text-[#2D5BFF] text-xs font-semibold mb-6 tracking-wider uppercase">
          🔍 AI驱动的代码人才评估 🧠
        </div>
        <div className="flex items-center justify-center gap-4 mb-6">
          <img src="/logo.png" alt="" className="w-16 h-16 md:w-20 md:h-20" />
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
            知码<span className="text-[#00C896]"> {}</span>
          </h1>
        </div>
        <p className="text-xl text-gray-400">
          粘贴 GitHub 个人资料 URL，让知码在几秒钟内深度分析代码能力、
          技术栈分布和工程师价值。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="github-url" className="text-sm text-gray-400 px-2 font-medium">
            GitHub 个人资料 URL <span className="text-red-400">*</span>
          </label>
          <div className="relative group">
            <input
              ref={githubInputRef}
              id="github-url"
              type="text"
              required
              placeholder="GitHub URL（例如 github.com/torvalds）"
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-6 pr-48 py-5 focus:outline-none focus:ring-2 focus:ring-[#2D5BFF]/50 focus:border-[#2D5BFF] transition-all text-xl placeholder:text-gray-600"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
            {githubUrl && (
              <button
                type="button"
                onClick={handleClearGithubUrl}
                aria-label="清除 GitHub URL"
                className="absolute right-36 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5BFF]"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <button
              type="submit"
              disabled={!githubUrl.trim()}
              aria-label="分析个人资料"
              className="absolute right-3 top-3 bottom-3 bg-[#2D5BFF] hover:bg-[#2D5BFF]/90 text-white px-8 rounded-xl font-bold transition-all shadow-lg shadow-[#2D5BFF]/20 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#2D5BFF]"
            >
              分析
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm text-gray-400 px-2 font-medium">Google Scholar (可选)</span>
            <input
              type="text"
              aria-label="Google Scholar 链接"
              placeholder="例如：scholar.google.com/citations?user=..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#2D5BFF]/30 focus:border-[#2D5BFF] transition-all text-base placeholder:text-gray-600"
              value={scholarUrl}
              onChange={(e) => setScholarUrl(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-gray-400 px-2 font-medium">LinkedIn (可选)</span>
            <input
              type="text"
              aria-label="LinkedIn 内容"
              placeholder="例如：linkedin.com/in/username"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#2D5BFF]/30 focus:border-[#2D5BFF] transition-all text-base placeholder:text-gray-600"
              value={linkedinText}
              onChange={(e) => setLinkedinText(e.target.value)}
            />
          </label>
        </div>

        <div className="w-full">
          <label className="flex flex-col gap-2">
            <span className="text-sm text-gray-400 px-2 font-medium">个人网站 (可选)</span>
            <input
              type="text"
              aria-label="个人网站链接"
              placeholder="例如：yoursite.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#2D5BFF]/30 focus:border-[#2D5BFF] transition-all text-base placeholder:text-gray-600"
              value={personalWebsiteUrl}
              onChange={(e) => setPersonalWebsiteUrl(e.target.value)}
            />
          </label>
          <p className="text-xs text-gray-500 mt-2 px-2">
            注意：仅抓取允许爬取的网站（遵守 robots.txt 规范）
          </p>
        </div>

        <div className="w-full">
          <label className="block text-sm text-gray-400 px-2 font-medium mb-2">上传简历 PDF (可选)</label>
          <div className="relative group">
            <input
              type="file"
              ref={fileInputRef}
              id="resumeFile"
              accept=".pdf"
              onChange={handleFileChange}
              className="sr-only peer"
              aria-label={pdfFile ? `已选择文件: ${pdfFile.name}` : "上传简历 PDF"}
            />
            <div
              className={`relative flex items-center justify-center gap-2 w-full border-2 border-dashed rounded-xl px-4 py-8 transition-all
                ${isDragging
                  ? 'bg-[#2D5BFF]/10 border-[#2D5BFF] scale-[1.02]'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
                }
                peer-focus:ring-2 peer-focus:ring-[#2D5BFF] peer-focus:ring-offset-2 peer-focus:ring-offset-[#1A1A2E]`}
            >
              <label
                htmlFor="resumeFile"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className="absolute inset-0 cursor-pointer w-full h-full z-10"
                aria-label="上传简历 PDF"
              ></label>

              <Upload className={`w-6 h-6 ${isDragging ? 'text-[#2D5BFF]' : 'text-gray-400'}`} />
              <span className={`${isDragging ? 'text-[#2D5BFF] font-medium' : 'text-gray-400'}`}>
                {isDragging
                  ? '释放文件以上传'
                  : pdfFile
                    ? pdfFile.name
                    : '点击上传简历 PDF'}
              </span>

              {pdfFile && !isDragging && (
                <button
                  type="button"
                  aria-label="移除文件"
                  onClick={handleClearFile}
                  className="z-20 ml-2 p-1 hover:bg-white/20 rounded-full transition-colors text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {error && (
              <div role="alert" className="mt-2 text-red-400 text-sm px-2">
                {error}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2 px-2">
            PDF 将被解析以提取技能、经验和教育背景信息
          </p>
        </div>
      </form>

      <div className="mt-8">
        <button
          onClick={handleDemo}
          className="text-base text-gray-500 hover:text-white transition-colors underline decoration-dotted underline-offset-4 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5BFF] p-1"
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
