import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, Sparkles, X, Github } from 'lucide-react';
import { ZhimaFitRequest } from '../services/zhimaFitMatcher';

interface ZhimaFitProps {
  onAnalyze: (payload: ZhimaFitRequest) => void;
}

export const ZhimaFit: React.FC<ZhimaFitProps> = ({ onAnalyze }) => {
  const [focusArea, setFocusArea] = useState('个人职业画像与团队协作潜力');
  const [scholarUrl, setScholarUrl] = useState('');
  const [linkedinText, setLinkedinText] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<'url' | 'file' | 'text'>('text');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasAnyInput = () => Boolean(
    scholarUrl.trim() || linkedinText.trim() || githubUrl.trim() || resumeUrl.trim() || resumeText.trim() || resumeFile
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!hasAnyInput()) {
      setValidationError('请至少提供一种候选人资料：LinkedIn / GitHub / Scholar / 简历。');
      return;
    }

    onAnalyze({
      focusArea,
      scholarUrl: scholarUrl || undefined,
      linkedinText: linkedinText || undefined,
      githubUrl: githubUrl || undefined,
      resumeText: resumeText || undefined,
      resumeUrl: resumeUrl || undefined,
      resumeFile: resumeFile || undefined,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      setResumeUrl('');
      setResumeText('');
      setValidationError(null);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResumeFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.focus();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] px-4 pb-10">
      <div className="mb-10 mt-20 text-center max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2D5BFF]/10 border border-[#2D5BFF]/20 text-[#2D5BFF] text-xs font-semibold mb-5 tracking-wider uppercase">
          🪪 Professional Card Generator
        </div>
        <div className="flex items-center justify-center gap-4 mb-5">
          <Sparkles className="w-14 h-14 md:w-16 md:h-16 text-[#2D5BFF]" />
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
            多源专业职业画像
          </h1>
        </div>
        <p className="text-lg text-gray-400">输入 LinkedIn / Google Scholar / GitHub / 简历，生成个人职业画像卡 + MBTI 推断。</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-3xl space-y-5">
        <div>
          <label className="block text-sm text-gray-400 mb-2">画像重点（可选）</label>
          <input
            placeholder="例如：研究转产业、技术领导力、跨团队协作"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D5BFF]/50"
            value={focusArea}
            onChange={(e) => setFocusArea(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">LinkedIn 信息（可选）</label>
          <textarea
            rows={4}
            placeholder="可贴链接，也可直接粘贴经历摘要"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D5BFF]/50 resize-none"
            value={linkedinText}
            onChange={(e) => setLinkedinText(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Google Scholar（可选）</label>
            <input
              placeholder="scholar.google.com/citations?user=..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D5BFF]/50"
              value={scholarUrl}
              onChange={(e) => setScholarUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">GitHub 链接（可选）</label>
            <div className="relative">
              <Github className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                placeholder="github.com/username"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D5BFF]/50"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <div className="text-sm text-gray-400 mb-3">简历输入（可选）</div>
          <div className="flex gap-3 mb-3 flex-wrap">
            <button type="button" onClick={() => setInputMode('text')} className={`px-4 py-2 rounded-lg text-sm ${inputMode === 'text' ? 'bg-[#2D5BFF] text-white' : 'bg-white/5 text-gray-400'}`}>
              文本粘贴
            </button>
            <button type="button" onClick={() => setInputMode('url')} className={`px-4 py-2 rounded-lg text-sm ${inputMode === 'url' ? 'bg-[#2D5BFF] text-white' : 'bg-white/5 text-gray-400'}`}>
              <LinkIcon className="w-4 h-4 inline mr-1" /> 链接
            </button>
            <button type="button" onClick={() => setInputMode('file')} className={`px-4 py-2 rounded-lg text-sm ${inputMode === 'file' ? 'bg-[#2D5BFF] text-white' : 'bg-white/5 text-gray-400'}`}>
              <Upload className="w-4 h-4 inline mr-1" /> 上传文件
            </button>
          </div>

          {inputMode === 'text' && (
            <textarea
              rows={6}
              placeholder="粘贴简历关键内容（教育、经历、项目、技能）"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D5BFF]/50 resize-none"
              value={resumeText}
              onChange={(e) => {
                setResumeText(e.target.value);
                setResumeFile(null);
                setResumeUrl('');
                setValidationError(null);
              }}
            />
          )}

          {inputMode === 'url' && (
            <input
              placeholder="简历链接（可选）"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D5BFF]/50"
              value={resumeUrl}
              onChange={(e) => {
                setResumeUrl(e.target.value);
                setResumeFile(null);
                setResumeText('');
                setValidationError(null);
              }}
            />
          )}

          {inputMode === 'file' && (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".txt,.pdf,.doc,.docx"
                onChange={handleFileChange}
                className="sr-only peer"
                aria-label={resumeFile ? `已选择文件: ${resumeFile.name}` : "上传简历文件"}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    setResumeFile(file);
                    setResumeUrl('');
                    setResumeText('');
                    setValidationError(null);
                  }
                }}
                className={`flex items-center justify-center gap-2 w-full border-2 border-dashed rounded-xl px-4 py-8 cursor-pointer transition-all peer-focus:ring-2 peer-focus:ring-[#2D5BFF] peer-focus:ring-offset-2 peer-focus:ring-offset-[#1A1A2E] ${isDragging ? 'bg-[#2D5BFF]/10 border-[#2D5BFF]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
              >
                <Upload className="w-5 h-5 text-gray-300" />
                <span className="text-gray-300">{resumeFile ? resumeFile.name : '点击或拖拽上传简历（可选）'}</span>
                {resumeFile && (
                  <button type="button" onClick={clearFile} className="p-1 hover:bg-white/20 rounded-full">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {validationError && <div role="alert" className="text-red-400 text-sm">{validationError}</div>}

        <button type="submit" className="w-full bg-[#2D5BFF] hover:bg-[#2D5BFF]/90 text-white px-12 py-4 rounded-xl font-bold text-lg transition-all">
          生成职业画像卡
        </button>
      </form>
    </div>
  );
};
