import { JDMatchResult, JobDescription } from '../types';
import { analyzeJDMatch } from './jdMatcher';

export interface ZhimaFitRequest {
  scholarUrl?: string;
  linkedinText?: string;
  resumeUrl?: string;
  resumeFile?: File;
  focusArea?: string;
}

function inferSocialProfile(raw: string): JDMatchResult['socialProfile'] {
  const text = raw.toLowerCase();

  const extrovertSignals = /(lead|mento|community|evangel|speaker|collabor|cross-functional|workshop|培训|分享|协作|跨团队)/i.test(raw);
  const introvertSignals = /(independent|autonom|deep work|research|architecture|focus|独立|深入|研究)/i.test(raw);
  const intuitionSignals = /(strategy|vision|innovation|future|系统设计|创新|战略)/i.test(raw);
  const sensingSignals = /(delivery|operations|incident|stability|执行|落地|运维)/i.test(raw);
  const thinkingSignals = /(metrics|optimization|performance|debug|分析|指标|性能)/i.test(raw);
  const feelingSignals = /(empathy|people|coaching|culture|用户体验|同理心|团队氛围)/i.test(raw);
  const judgingSignals = /(roadmap|planning|deadline|process|规范|计划|交付)/i.test(raw);
  const perceivingSignals = /(explore|prototype|iterate|experiment|探索|试验|迭代)/i.test(raw);

  const mbti = `${extrovertSignals && !introvertSignals ? 'E' : 'I'}${intuitionSignals && !sensingSignals ? 'N' : 'S'}${thinkingSignals && !feelingSignals ? 'T' : 'F'}${judgingSignals && !perceivingSignals ? 'J' : 'P'}`;

  let teamRole = '平衡型贡献者';
  if (/ENTJ|ENFJ|ESTJ/.test(mbti)) teamRole = '团队推进者';
  else if (/INTJ|INTP|ISTJ/.test(mbti)) teamRole = '架构/深度问题解决者';
  else if (/ENFP|ESFP|ISFP/.test(mbti)) teamRole = '创意协同者';

  return {
    mbti,
    teamRole,
    collaborationSignal: extrovertSignals ? '高协作倾向' : '偏深度工作',
    confidence: text.length > 500 ? 0.72 : 0.58,
  };
}

function buildVirtualResume(input: ZhimaFitRequest): File | undefined {
  if (input.resumeFile || input.resumeUrl) return input.resumeFile;

  const blocks = [
    input.linkedinText ? `LinkedIn: ${input.linkedinText}` : '',
    input.scholarUrl ? `Scholar: ${input.scholarUrl}` : '',
    input.focusArea ? `Focus Area: ${input.focusArea}` : '',
  ].filter(Boolean);

  if (blocks.length === 0) return undefined;
  return new File([blocks.join('\n\n')], 'zhima-profile.txt', { type: 'text/plain' });
}

function buildZhimaJD(input: ZhimaFitRequest): JobDescription {
  const zhimaPrompt = [
    '# 知码匹配上下文（非传统JD）',
    `评估重点: ${input.focusArea || '综合评估'}`,
    '请额外关注候选人的协作方式与团队适配度，并在建议中给出团队配比建议。',
    input.linkedinText ? `LinkedIn信息:\n${input.linkedinText}` : '',
    input.scholarUrl ? `Scholar链接: ${input.scholarUrl}` : '',
  ].filter(Boolean).join('\n\n');

  return {
    industry: '通用',
    companyName: '知码团队',
    jobDescription: zhimaPrompt,
    resumeUrl: input.resumeUrl,
    resumeFile: buildVirtualResume(input),
  };
}

export async function analyzeZhimaFit(input: ZhimaFitRequest, onProgress?: (msg: string) => void): Promise<JDMatchResult> {
  if (!input.resumeUrl && !input.resumeFile && !input.linkedinText && !input.scholarUrl) {
    throw new Error('请至少提供一种候选人信息：LinkedIn、Google Scholar 或简历。');
  }

  onProgress?.('正在初始化知码匹配...');
  const jd = buildZhimaJD(input);
  const result = await analyzeJDMatch(jd, (msg) => onProgress?.(`知码匹配：${msg}`));

  const socialBase = [input.linkedinText, input.focusArea, input.scholarUrl].filter(Boolean).join('\n');
  const socialProfile = inferSocialProfile(socialBase);

  return {
    ...result,
    socialProfile,
    recommendations: [
      `团队MBTI建议：当前候选人倾向 ${socialProfile.mbti}（${socialProfile.teamRole}），建议搭配互补类型形成平衡团队。`,
      ...result.recommendations,
    ],
  };
}
