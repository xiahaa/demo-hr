import { JDMatchResult, JobDescription, MBTIInsight, PersonalProfileCard } from '../types';
import { analyzeJDMatch } from './jdMatcher';
import { extractCandidateInfoFromPDF, parsePDF } from './pdf';

export interface ZhimaFitRequest {
  scholarUrl?: string;
  linkedinText?: string;
  githubUrl?: string;
  resumeUrl?: string;
  resumeFile?: File;
  resumeText?: string;
  focusArea?: string;
}

function inferMBTI(raw: string): MBTIInsight {
  const text = raw.toLowerCase();
  const extrovertSignals = /(lead|mentor|community|evangel|speaker|collabor|cross-functional|workshop|培训|分享|协作|跨团队)/i.test(raw);
  const introvertSignals = /(independent|autonom|deep work|research|architecture|focus|独立|深入|研究)/i.test(raw);
  const intuitionSignals = /(strategy|vision|innovation|future|system design|系统设计|创新|战略)/i.test(raw);
  const sensingSignals = /(delivery|operations|incident|stability|执行|落地|运维)/i.test(raw);
  const thinkingSignals = /(metrics|optimization|performance|debug|analysis|分析|指标|性能)/i.test(raw);
  const feelingSignals = /(empathy|people|coaching|culture|用户体验|同理心|团队氛围)/i.test(raw);
  const judgingSignals = /(roadmap|planning|deadline|process|规范|计划|交付)/i.test(raw);
  const perceivingSignals = /(explore|prototype|iterate|experiment|探索|试验|迭代)/i.test(raw);

  const type = `${extrovertSignals && !introvertSignals ? 'E' : 'I'}${intuitionSignals && !sensingSignals ? 'N' : 'S'}${thinkingSignals && !feelingSignals ? 'T' : 'F'}${judgingSignals && !perceivingSignals ? 'J' : 'P'}`;
  const collaborationStyle = extrovertSignals ? '高可见协作与跨团队推进' : '偏深度工作与结构化贡献';

  return {
    type,
    confidence: text.length > 800 ? 0.78 : 0.61,
    collaborationStyle,
    evidence: [
      extrovertSignals ? '存在组织/协作类关键词' : '更多独立深度工作信号',
      intuitionSignals ? '偏战略与创新表达' : '偏执行与交付表达',
      thinkingSignals ? '强调数据与性能分析' : '强调人际与文化协同',
    ],
    complementaryTypes: type.startsWith('I') ? ['ENFJ', 'ENTP'] : ['ISTJ', 'INTJ'],
  };
}

function inferTeamRole(mbtiType: string): string {
  if (/ENTJ|ENFJ|ESTJ/.test(mbtiType)) return '团队推进者';
  if (/INTJ|INTP|ISTJ/.test(mbtiType)) return '架构/深度问题解决者';
  if (/ENFP|ESFP|ISFP/.test(mbtiType)) return '创意协同者';
  return '平衡型贡献者';
}

function buildVirtualResume(input: ZhimaFitRequest): File | undefined {
  if (input.resumeFile || input.resumeUrl) return input.resumeFile;

  const blocks = [
    input.linkedinText ? `LinkedIn: ${input.linkedinText}` : '',
    input.githubUrl ? `GitHub: ${input.githubUrl}` : '',
    input.scholarUrl ? `Scholar: ${input.scholarUrl}` : '',
    input.resumeText ? `Resume Text: ${input.resumeText}` : '',
    input.focusArea ? `Focus Area: ${input.focusArea}` : '',
  ].filter(Boolean);

  if (blocks.length === 0) return undefined;
  return new File([blocks.join('\n\n')], 'profile-signals.txt', { type: 'text/plain' });
}

function buildZhimaJD(input: ZhimaFitRequest): JobDescription {
  const zhimaPrompt = [
    '# 专业画像分析上下文（非传统JD）',
    `评估重点: ${input.focusArea || '综合评估'}`,
    '请输出候选人的职业画像、优势/短板、潜在发展方向，并给出 MBTI 团队搭配建议。',
    input.linkedinText ? `LinkedIn信息:\n${input.linkedinText}` : '',
    input.githubUrl ? `GitHub链接: ${input.githubUrl}` : '',
    input.scholarUrl ? `Scholar链接: ${input.scholarUrl}` : '',
    input.resumeText ? `简历文本:\n${input.resumeText}` : '',
  ].filter(Boolean).join('\n\n');

  return {
    industry: '通用',
    companyName: 'Professional Portrait Agent',
    jobDescription: zhimaPrompt,
    resumeUrl: input.resumeUrl,
    resumeFile: buildVirtualResume(input),
  };
}

function detectName(input: ZhimaFitRequest, fallback: string): string {
  const source = [input.linkedinText, input.resumeText, fallback].filter(Boolean).join('\n');
  const hit = source.match(/(?:name|姓名)[:：]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+|[\u4e00-\u9fa5]{2,4})/i);
  return hit?.[1] || 'Candidate';
}

function buildProfileCard(input: ZhimaFitRequest, jd: JDMatchResult, resumeSummary: string): PersonalProfileCard {
  const signalText = [input.linkedinText, input.resumeText, resumeSummary, input.focusArea].filter(Boolean).join('\n');
  const mbti = inferMBTI(signalText);
  const teamRole = inferTeamRole(mbti.type);

  const primarySkills = [
    ...(input.linkedinText?.match(/\b[A-Za-z+#.]{3,}\b/g) || []),
    ...(input.resumeText?.match(/\b[A-Za-z+#.]{3,}\b/g) || []),
  ]
    .map((s) => s.replace(/[^A-Za-z+#.]/g, ''))
    .filter((s) => !['and', 'the', 'with', 'for', 'from'].includes(s.toLowerCase()))
    .slice(0, 8);

  const fullName = detectName(input, resumeSummary);

  return {
    fullName,
    headline: `${teamRole} · ${input.focusArea || '综合胜任力'}`,
    location: 'Location inferred from provided signals',
    summary: resumeSummary || '候选人具备跨平台职业信号，适合进行复合型能力评估。',
    skills: Array.from(new Set(primarySkills)).slice(0, 6),
    strengths: jd.strengths.slice(0, 4),
    growthAreas: jd.gaps.slice(0, 3),
    careerTrajectory: [
      { stage: 'IC 深度贡献者', probability: 35, note: '以技术/研究深耕形成核心壁垒' },
      { stage: 'Tech Lead / 项目负责人', probability: 40, note: '向跨团队协作与架构决策迁移' },
      { stage: '领域专家/创业方向', probability: 25, note: '形成个人品牌与行业影响力' },
    ],
    sourceSignals: {
      linkedin: input.linkedinText?.slice(0, 120),
      github: input.githubUrl,
      scholar: input.scholarUrl,
      resume: input.resumeFile ? 'file' : input.resumeUrl ? 'url' : input.resumeText ? 'text' : 'none',
    },
    mbtiInsight: mbti,
  };
}

export async function analyzeZhimaFit(input: ZhimaFitRequest, onProgress?: (msg: string) => void): Promise<JDMatchResult> {
  if (!input.resumeUrl && !input.resumeFile && !input.linkedinText && !input.scholarUrl && !input.githubUrl && !input.resumeText) {
    throw new Error('请至少提供一种候选人信息：LinkedIn、Google Scholar、GitHub 或简历。');
  }

  onProgress?.('正在初始化专业画像...');
  const jd = buildZhimaJD(input);
  const result = await analyzeJDMatch(jd, (msg) => onProgress?.(`画像生成：${msg}`));

  let resumeSummary = input.resumeText || '';
  if (!resumeSummary && input.resumeFile && input.resumeFile.type === 'application/pdf') {
    try {
      onProgress?.('正在解析 PDF 简历...');
      const parsed = await parsePDF(input.resumeFile);
      resumeSummary = extractCandidateInfoFromPDF(parsed).summary;
    } catch {
      resumeSummary = '';
    }
  }

  const personalProfile = buildProfileCard(input, result, resumeSummary);
  const teamRole = inferTeamRole(personalProfile.mbtiInsight.type);

  return {
    ...result,
    socialProfile: {
      mbti: personalProfile.mbtiInsight.type,
      teamRole,
      collaborationSignal: personalProfile.mbtiInsight.collaborationStyle,
      confidence: personalProfile.mbtiInsight.confidence,
    },
    personalProfile,
    recommendations: [
      `MBTI建议：候选人倾向 ${personalProfile.mbtiInsight.type}（${teamRole}），建议配对 ${personalProfile.mbtiInsight.complementaryTypes.join(' / ')} 形成互补。`,
      ...result.recommendations,
    ],
  };
}
