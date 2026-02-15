import React, { useMemo, useState } from 'react';
import { FileText, Sparkles, ShieldCheck, LayoutTemplate, Download } from 'lucide-react';

interface ResumeInsight {
  title: string;
  details: string;
}

interface PreviewContent {
  headline: string;
  before: string;
  after: string;
}

interface ResumePreviewData {
  name: string;
  role: string;
  education: string;
  summary: string;
  highlights: string[];
  skills: string[];
}

type ResumeTemplateId = 'awesome-cv' | 'modern-deedy' | 'figma-minimal';

type TemplateEngine = 'latex' | 'react';

interface TemplateRecommendation {
  id: ResumeTemplateId;
  name: string;
  bestFor: string;
  highlight: string;
  engine: TemplateEngine;
}

const templateRecommendations: TemplateRecommendation[] = [
  {
    id: 'awesome-cv',
    name: 'LaTeX · Awesome-CV',
    bestFor: '有实习、项目、竞赛经历的同学',
    highlight: '排版专业、结构清晰，HR 首屏可读性高',
    engine: 'latex',
  },
  {
    id: 'modern-deedy',
    name: 'Overleaf · Modern Deedy',
    bestFor: '非 CS 转岗、需要突出跨学科技能',
    highlight: '双栏布局，便于压缩内容并突出关键词',
    engine: 'latex',
  },
  {
    id: 'figma-minimal',
    name: 'Figma / Illustrator 极简模板',
    bestFor: '设计、运营、产品等岗位',
    highlight: '视觉辨识度高，适合展示作品链接',
    engine: 'react',
  },
];

const downloadFile = (fileName: string, content: string, mime: string) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const escapeHtml = (text: string) => text
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const buildResumeHtml = (data: ResumePreviewData, theme: 'modern' | 'classic') => {
  const highlights = data.highlights.map((item) => `<li>${escapeHtml(item.replace(/^•\s*/, ''))}</li>`).join('');
  const skills = data.skills.map((skill) => `<li>${escapeHtml(skill)}</li>`).join('');

  if (theme === 'modern') {
    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(data.name)} - Resume</title>
  <style>
    body { margin: 0; background: #e5e7eb; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .page { width: 794px; min-height: 1123px; margin: 20px auto; background: #fff; display: grid; grid-template-columns: 34% 66%; }
    .left { background: #0f172a; color: #e2e8f0; padding: 28px; }
    .right { padding: 34px; color: #0f172a; }
    .name { font-size: 32px; font-weight: 700; line-height: 1.1; }
    .role { margin-top: 6px; font-size: 14px; color: #cbd5e1; }
    .section { margin-top: 28px; }
    .title { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #64748b; margin-bottom: 10px; font-weight: 600; }
    .left .title { color: #94a3b8; }
    ul { margin: 0; padding-left: 18px; }
    li { margin-bottom: 8px; line-height: 1.6; font-size: 14px; }
    p { margin: 0; line-height: 1.7; font-size: 14px; }
    @media print { body { background: white; } .page { margin: 0; box-shadow: none; } }
  </style>
</head>
<body>
  <div class="page">
    <aside class="left">
      <div class="name">${escapeHtml(data.name)}</div>
      <div class="role">${escapeHtml(data.role)}</div>
      <section class="section">
        <div class="title">Education</div>
        <p>${escapeHtml(data.education)}</p>
      </section>
      <section class="section">
        <div class="title">Skills</div>
        <ul>${skills}</ul>
      </section>
    </aside>
    <main class="right">
      <section>
        <div class="title">Profile</div>
        <p>${escapeHtml(data.summary)}</p>
      </section>
      <section class="section">
        <div class="title">Experience Highlights</div>
        <ul>${highlights}</ul>
      </section>
    </main>
  </div>
</body>
</html>`;
  }

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(data.name)} - Resume</title>
  <style>
    body { margin: 0; background: #e5e7eb; font-family: 'Helvetica Neue', Arial, sans-serif; }
    .page { width: 794px; min-height: 1123px; margin: 20px auto; background: #fff; padding: 40px 52px; box-sizing: border-box; color: #0f172a; }
    .name { font-size: 34px; font-weight: 700; letter-spacing: 0.01em; }
    .meta { margin-top: 6px; color: #64748b; font-size: 14px; }
    .divider { margin: 18px 0 22px; border-bottom: 1px solid #cbd5e1; }
    .title { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #64748b; margin-bottom: 10px; font-weight: 700; }
    p { margin: 0; line-height: 1.7; font-size: 14px; }
    ul { margin: 0; padding-left: 18px; }
    li { margin-bottom: 8px; line-height: 1.6; font-size: 14px; }
    section { margin-bottom: 22px; }
    @media print { body { background: white; } .page { margin: 0; box-shadow: none; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="name">${escapeHtml(data.name)}</div>
    <div class="meta">${escapeHtml(data.role)} · ${escapeHtml(data.education)}</div>
    <div class="divider"></div>

    <section>
      <div class="title">Professional Summary</div>
      <p>${escapeHtml(data.summary)}</p>
    </section>

    <section>
      <div class="title">Selected Experience</div>
      <ul>${highlights}</ul>
    </section>
  </div>
</body>
</html>`;
};

const buildResumeLatex = (data: ResumePreviewData, templateId: ResumeTemplateId) => {
  const bullets = data.highlights
    .map((item) => item.replace(/^•\s*/, '').replaceAll('%', '\\%'))
    .map((item) => `\\item ${item}`)
    .join('\n');

  const templateName = templateId === 'awesome-cv' ? 'awesome-cv style' : 'modern-deedy style';

  return `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=1.8cm]{geometry}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{hyperref}
\\titleformat{\\section}{\\large\\bfseries}{}{0em}{}[\\titlerule]
\\setlist[itemize]{leftmargin=*, itemsep=4pt, topsep=3pt}

\\begin{document}

{\\LARGE \\textbf{${data.name}}}\\\\
${data.role} \\quad|\\quad ${data.education}

\\section*{Profile}
${data.summary}

\\section*{Selected Experience}
\\begin{itemize}
${bullets}
\\end{itemize}

\\section*{Skills}
${data.skills.join(', ')}

\\vfill
\\small Generated by Resume Booster (${templateName})

\\end{document}
`;
};

export const ResumePolish: React.FC = () => {
  const [targetRole, setTargetRole] = useState('');
  const [major, setMajor] = useState('');
  const [rawExperience, setRawExperience] = useState('');
  const [optInData, setOptInData] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<'modern' | 'classic'>('modern');
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplateId>('awesome-cv');

  const insights = useMemo<ResumeInsight[]>(() => {
    if (!submitted) return [];

    const hasMetrics = /\d+/.test(rawExperience);
    const hasActionVerb = /(负责|参与|完成|优化|搭建|提升|组织|设计)/.test(rawExperience);

    return [
      {
        title: '结构美化建议',
        details: `优先使用 PDF 导出，避免 Word 默认样式。为“${targetRole || '目标岗位'}”设置 1 页版本，控制在 3-4 个模块。`,
      },
      {
        title: '亮点提炼建议',
        details: hasActionVerb
          ? '你已经有行动描述，下一步建议补充结果：用“动作 + 结果 + 业务价值”的句式改写每条经历。'
          : '当前描述偏事务罗列。建议每条经历都以“动词开头”，例如“优化 / 搭建 / 提升 / 组织”。',
      },
      {
        title: '量化表达建议',
        details: hasMetrics
          ? '检测到数字信息，建议统一口径（百分比、时长、规模）并放在句尾强化说服力。'
          : '当前缺少量化结果。建议至少补充 2 个指标，例如“效率提升 30%”“覆盖 500+ 用户”。',
      },
      {
        title: '专业迁移叙事',
        details: major
          ? `你可以把“${major}”背景转化为优势：强调方法论、沟通协作和领域知识，再映射到岗位能力。`
          : '补充你的专业背景，有助于生成跨专业优势表达。',
      },
    ];
  }, [submitted, rawExperience, major, targetRole]);

  const previewContent = useMemo<PreviewContent>(() => {
    const role = targetRole || '目标岗位';
    const lines = rawExperience.split('\n').map((line) => line.trim()).filter(Boolean);
    const firstLine = lines[0] || '负责社团活动执行与宣传';

    return {
      headline: `${role} - 亮点表达预览`,
      before: firstLine,
      after: `围绕${role}目标，主导关键任务落地，并通过流程优化实现可量化结果（建议补充数据，如效率提升 30% / 触达 500+ 用户）。`,
    };
  }, [rawExperience, targetRole]);

  const resumePreview = useMemo<ResumePreviewData>(() => {
    const role = targetRole || '目标岗位实习生';
    const education = major || '在校生';
    const experienceLines = rawExperience.split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 3);

    const highlights = (experienceLines.length > 0
      ? experienceLines
      : ['负责校园活动执行与传播', '组织跨学院讲座宣传，协调 8 名同学', '优化报名流程并提升到场率'])
      .map((line) => `• ${line}${line.includes('提升') || line.includes('%') ? '' : '（建议补充量化结果）'}`)
      .slice(0, 3);

    return {
      name: '同学姓名',
      role,
      education,
      summary: `面向 ${role} 的候选人，具备执行力与跨专业迁移能力，能够把任务拆解成可交付结果。`,
      highlights,
      skills: ['沟通协作', '项目执行', '数据分析', '内容表达'],
    };
  }, [major, rawExperience, targetRole]);

  const selectedTemplateMeta = useMemo(
    () => templateRecommendations.find((template) => template.id === selectedTemplate) ?? templateRecommendations[0],
    [selectedTemplate]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleDirectExport = () => {
    if (selectedTemplateMeta.engine === 'latex') {
      const tex = buildResumeLatex(resumePreview, selectedTemplateMeta.id);
      downloadFile(`resume-${selectedTemplateMeta.id}.tex`, tex, 'application/x-tex;charset=utf-8');
      return;
    }

    const html = buildResumeHtml(resumePreview, previewTheme);
    downloadFile(`resume-${previewTheme}.html`, html, 'text/html;charset=utf-8');
  };

  return (
    <div className="min-h-[90vh] px-4 pt-24 pb-16">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00C896]/10 border border-[#00C896]/30 text-[#00C896] text-xs font-semibold mb-5 tracking-wider uppercase">
            Resume Booster
          </div>
          <h2 className="text-3xl font-bold mb-3">在校生简历美化助手</h2>
          <p className="text-gray-400 mb-6">帮你把“事务罗列”升级成“亮点表达”，并推荐 LaTeX / Illustrator 风格模板。</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">目标岗位</label>
              <input
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="如：产品经理实习生 / 数据分析实习生"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#2D5BFF]/50"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">专业背景</label>
              <input
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="如：机械工程 / 新闻传播 / 金融"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#2D5BFF]/50"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">你的经历原文（可粘贴 2-5 条）</label>
              <textarea
                value={rawExperience}
                onChange={(e) => setRawExperience(e.target.value)}
                placeholder="如：负责社团公众号运营，参与活动执行..."
                rows={6}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#2D5BFF]/50"
                required
              />
            </div>

            <label className="flex items-start gap-3 text-sm text-gray-400">
              <input
                type="checkbox"
                checked={optInData}
                onChange={(e) => setOptInData(e.target.checked)}
                className="mt-0.5"
              />
              我同意平台在匿名化后使用我的简历文本做产品优化与模型训练（可随时撤回）。
            </label>

            <button
              type="submit"
              className="w-full bg-[#2D5BFF] hover:bg-[#2D5BFF]/90 rounded-xl py-3 font-semibold transition-colors"
            >
              生成美化建议
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4"><Sparkles className="w-4 h-4 text-[#00C896]" />智能改写建议</h3>
            {insights.length === 0 ? (
              <p className="text-gray-500 text-sm">提交后将自动生成结构、亮点、量化与专业迁移建议。</p>
            ) : (
              <ul className="space-y-3">
                {insights.map((item) => (
                  <li key={item.title} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="font-medium mb-1">{item.title}</p>
                    <p className="text-sm text-gray-400">{item.details}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <h3 className="text-lg font-semibold mb-4">推荐预览（Before / After）</h3>
            <div className="rounded-xl border border-[#2D5BFF]/30 bg-[#2D5BFF]/5 p-4 mb-3">
              <p className="text-sm text-[#9FB4FF]">{previewContent.headline}</p>
            </div>
            <div className="grid gap-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Before</p>
                <p className="text-sm text-gray-300">{previewContent.before}</p>
              </div>
              <div className="rounded-xl border border-[#00C896]/30 bg-[#00C896]/5 p-4">
                <p className="text-xs uppercase tracking-wider text-[#63DDBB] mb-2">After</p>
                <p className="text-sm text-gray-200">{previewContent.after}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><LayoutTemplate className="w-4 h-4 text-[#2D5BFF]" />高保真简历预览</h3>
              <div className="inline-flex bg-black/30 border border-white/10 rounded-lg p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewTheme('modern')}
                  className={`px-3 py-1 rounded ${previewTheme === 'modern' ? 'bg-[#2D5BFF] text-white' : 'text-gray-400'}`}
                >现代</button>
                <button
                  type="button"
                  onClick={() => setPreviewTheme('classic')}
                  className={`px-3 py-1 rounded ${previewTheme === 'classic' ? 'bg-[#2D5BFF] text-white' : 'text-gray-400'}`}
                >经典</button>
              </div>
            </div>

            <div className="rounded-2xl bg-[#E5E7EB] p-4">
              <div className="aspect-[1/1.414] bg-white shadow-2xl rounded-sm overflow-hidden text-[#0F172A]">
                {previewTheme === 'modern' ? (
                  <div className="grid grid-cols-[34%_66%] h-full">
                    <aside className="bg-[#0F172A] text-slate-100 p-5">
                      <p className="text-xl font-semibold tracking-wide">{resumePreview.name}</p>
                      <p className="text-xs text-slate-300 mt-1">{resumePreview.role}</p>
                      <div className="mt-6">
                        <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400">Education</p>
                        <p className="text-xs mt-1 text-slate-200">{resumePreview.education}</p>
                      </div>
                      <div className="mt-6">
                        <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400">Skills</p>
                        <ul className="mt-1 space-y-1 text-xs text-slate-200">
                          {resumePreview.skills.map((skill) => <li key={skill}>• {skill}</li>)}
                        </ul>
                      </div>
                    </aside>
                    <main className="p-6">
                      <section>
                        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Profile</p>
                        <p className="text-xs leading-5 mt-2">{resumePreview.summary}</p>
                      </section>
                      <section className="mt-6">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Experience Highlights</p>
                        <ul className="mt-2 space-y-2 text-xs leading-5">
                          {resumePreview.highlights.map((line) => <li key={line}>{line}</li>)}
                        </ul>
                      </section>
                    </main>
                  </div>
                ) : (
                  <div className="h-full p-7">
                    <header className="border-b border-slate-300 pb-3">
                      <p className="text-2xl font-bold tracking-tight">{resumePreview.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{resumePreview.role} · {resumePreview.education}</p>
                    </header>
                    <section className="mt-5">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Professional Summary</p>
                      <p className="text-xs leading-5 mt-2">{resumePreview.summary}</p>
                    </section>
                    <section className="mt-5">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Selected Experience</p>
                      <ul className="text-xs mt-2 space-y-2 leading-5">
                        {resumePreview.highlights.map((line) => <li key={line}>{line}</li>)}
                      </ul>
                    </section>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">基于 React 实时渲染的简历样式预览。下一步可接入后端 LaTeX 编译导出 PDF（高质量排版）。</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4"><FileText className="w-4 h-4 text-[#2D5BFF]" />模板推荐</h3>
            <ul className="space-y-3">
              {templateRecommendations.map((template) => (
                <li key={template.id} className={`rounded-xl border bg-black/20 p-4 ${selectedTemplate === template.id ? 'border-[#2D5BFF]' : 'border-white/10'}`}>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="font-medium">{template.name}</p>
                    <button
                      type="button"
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`text-xs px-3 py-1 rounded-full border ${selectedTemplate === template.id ? 'bg-[#2D5BFF] border-[#2D5BFF] text-white' : 'border-white/20 text-gray-400 hover:text-white'}`}
                    >
                      {selectedTemplate === template.id ? '已选中' : '选择模版'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">适合：{template.bestFor}</p>
                  <p className="text-sm text-gray-400 mt-1">{template.highlight}</p>
                  <p className="text-xs text-gray-500 mt-2">输出格式：{template.engine === 'latex' ? '.tex（可编译 PDF）' : '.html（可直接打印为 PDF）'}</p>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={handleDirectExport}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-[#00C896] hover:bg-[#00C896]/90 text-[#04261d] font-semibold rounded-xl py-3 transition-colors"
            >
              <Download className="w-4 h-4" />
              直出简历文件（按选中模版）
            </button>
            <p className="text-xs text-gray-500 mt-2">LaTeX 模版会导出 `.tex`；React 模版会导出 `.html`，打开后可直接打印另存为 PDF。</p>
          </div>

          <div className="bg-[#00C896]/10 border border-[#00C896]/30 rounded-2xl p-4 text-sm text-gray-300 flex gap-3">
            <ShieldCheck className="w-4 h-4 text-[#00C896] mt-0.5 shrink-0" />
            <p>
              数据使用说明：仅在用户明确同意后用于优化建议质量，默认不对外分享个人信息，并提供删除/撤回机制。
              {submitted && !optInData ? '（你当前未授权数据使用）' : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
