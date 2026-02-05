import React, { useState } from 'react';
import { Upload, Link as LinkIcon, Briefcase } from 'lucide-react';

interface JDMatchProps {
  onAnalyze: (industry: string, companyName: string, jobDescription: string, resumeUrl?: string, resumeFile?: File) => void;
}

export const JDMatch: React.FC<JDMatchProps> = ({ onAnalyze }) => {
  const [industry, setIndustry] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<'url' | 'file'>('url');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!industry.trim() || !companyName.trim() || !jobDescription.trim()) {
      return;
    }
    if (!resumeUrl.trim() && !resumeFile) {
      alert('Please provide either a resume URL or upload a resume file');
      return;
    }
    
    onAnalyze(industry, companyName, jobDescription, resumeUrl, resumeFile || undefined);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      setResumeUrl(''); // Clear URL when file is selected
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] px-4">
      <div className="mb-12 text-center max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2D5BFF]/10 border border-[#2D5BFF]/20 text-[#2D5BFF] text-xs font-semibold mb-6 tracking-wider uppercase">
          💼 HR职位匹配分析 📊
        </div>
        <div className="flex items-center justify-center gap-4 mb-6">
          <Briefcase className="w-16 h-16 md:w-20 md:h-20 text-[#2D5BFF]" />
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
            JD 匹配分析
          </h1>
        </div>
        <p className="text-xl text-gray-400">
          输入职位信息和简历，智能分析候选人与岗位的匹配度
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-3xl space-y-6">
        {/* Industry and Company Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-400 mb-2">
              行业 <span className="text-red-400">*</span>
            </label>
            <input
              id="industry"
              type="text"
              required
              placeholder="例如：互联网、金融、教育"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D5BFF]/50 focus:border-[#2D5BFF] transition-all text-base placeholder:text-gray-600"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-400 mb-2">
              公司名称 <span className="text-red-400">*</span>
            </label>
            <input
              id="companyName"
              type="text"
              required
              placeholder="例如：阿里巴巴、腾讯"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D5BFF]/50 focus:border-[#2D5BFF] transition-all text-base placeholder:text-gray-600"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
        </div>

        {/* Job Description */}
        <div>
          <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-400 mb-2">
            职位描述 <span className="text-red-400">*</span>
          </label>
          <textarea
            id="jobDescription"
            required
            rows={8}
            placeholder="请输入详细的职位描述，包括职责、要求、技能等..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D5BFF]/50 focus:border-[#2D5BFF] transition-all text-base placeholder:text-gray-600 resize-none"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>

        {/* Resume Input Mode Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-3">
            简历输入方式 <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-4 mb-4">
            <button
              type="button"
              onClick={() => setInputMode('url')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                inputMode === 'url'
                  ? 'bg-[#2D5BFF] text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              链接
            </button>
            <button
              type="button"
              onClick={() => setInputMode('file')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                inputMode === 'file'
                  ? 'bg-[#2D5BFF] text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <Upload className="w-4 h-4" />
              上传文件
            </button>
          </div>

          {/* URL Input */}
          {inputMode === 'url' && (
            <div>
              <input
                type="text"
                placeholder="简历链接（GitHub、LinkedIn或其他在线简历）"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D5BFF]/50 focus:border-[#2D5BFF] transition-all text-base placeholder:text-gray-600"
                value={resumeUrl}
                onChange={(e) => {
                  setResumeUrl(e.target.value);
                  setResumeFile(null); // Clear file when URL is entered
                }}
              />
            </div>
          )}

          {/* File Upload */}
          {inputMode === 'file' && (
            <div>
              <div className="relative">
                <input
                  type="file"
                  id="resumeFile"
                  accept=".txt,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="resumeFile"
                  className="flex items-center justify-center gap-2 w-full bg-white/5 border-2 border-dashed border-white/10 rounded-xl px-4 py-8 cursor-pointer hover:bg-white/10 transition-all"
                >
                  <Upload className="w-6 h-6 text-gray-400" />
                  <span className="text-gray-400">
                    {resumeFile ? resumeFile.name : '点击上传简历文件 (TXT, PDF)'}
                  </span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                支持格式：TXT, PDF（PDF解析功能开发中，建议使用TXT）
              </p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            disabled={!industry.trim() || !companyName.trim() || !jobDescription.trim() || (!resumeUrl.trim() && !resumeFile)}
            className="bg-[#2D5BFF] hover:bg-[#2D5BFF]/90 text-white px-12 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-[#2D5BFF]/20 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#2D5BFF]"
          >
            开始匹配分析
          </button>
        </div>
      </form>

      <div className="mt-12 text-center text-gray-500 text-sm">
        <p>💡 提示：输入越详细，分析结果越准确</p>
      </div>
    </div>
  );
};
