import React from 'react';
import { JDMatchResult } from '../types';
import { CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';

interface JDMatchResultCardProps {
  result: JDMatchResult;
}

export const JDMatchResultCard: React.FC<JDMatchResultCardProps> = ({ result }) => {
  const getFitColor = (fitLevel: string) => {
    switch (fitLevel) {
      case 'Excellent':
        return 'text-green-400';
      case 'Good':
        return 'text-blue-400';
      case 'Fair':
        return 'text-yellow-400';
      case 'Poor':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getFitBgColor = (fitLevel: string) => {
    switch (fitLevel) {
      case 'Excellent':
        return 'bg-green-400/10 border-green-400/20';
      case 'Good':
        return 'bg-blue-400/10 border-blue-400/20';
      case 'Fair':
        return 'bg-yellow-400/10 border-yellow-400/20';
      case 'Poor':
        return 'bg-red-400/10 border-red-400/20';
      default:
        return 'bg-gray-400/10 border-gray-400/20';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-8">
      {/* Overall Score */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">匹配度分析结果</h2>
          <div className={`px-4 py-2 rounded-full border ${getFitBgColor(result.fitLevel)}`}>
            <span className={`font-bold ${getFitColor(result.fitLevel)}`}>
              {result.fitLevel === 'Excellent' && '优秀匹配'}
              {result.fitLevel === 'Good' && '良好匹配'}
              {result.fitLevel === 'Fair' && '一般匹配'}
              {result.fitLevel === 'Poor' && '匹配度低'}
            </span>
          </div>
        </div>

        {/* Overall Score Display */}
        <div className="flex items-center justify-center mb-8">
          <div className="relative">
            <svg className="transform -rotate-90 w-40 h-40">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                className="text-white/10"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 70}`}
                strokeDashoffset={`${2 * Math.PI * 70 * (1 - result.overallScore / 100)}`}
                className={getScoreColor(result.overallScore)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <div className={`text-4xl font-bold ${getScoreColor(result.overallScore)}`}>
                {result.overallScore}
              </div>
              <div className="text-sm text-gray-400">总分</div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Scores */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        <h3 className="text-xl font-bold text-white mb-6">详细评分</h3>
        <div className="space-y-4">
          {result.matchScores.map((score, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 font-medium">{score.category}</span>
                <span className={`font-bold ${getScoreColor(score.score)}`}>
                  {score.score}分
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    score.score >= 80
                      ? 'bg-green-400'
                      : score.score >= 60
                      ? 'bg-blue-400'
                      : score.score >= 40
                      ? 'bg-yellow-400'
                      : 'bg-red-400'
                  }`}
                  style={{ width: `${score.score}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 pl-2">{score.details}</p>
            </div>
          ))}
        </div>
      </div>


      {/* Social Fit / Team Composition */}
      {result.socialProfile && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-white mb-6">社交画像与团队配比</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-gray-400 text-sm mb-1">MBTI 倾向</div>
              <div className="text-2xl font-bold text-[#2D5BFF]">{result.socialProfile.mbti}</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-gray-400 text-sm mb-1">团队角色</div>
              <div className="text-white font-semibold">{result.socialProfile.teamRole}</div>
            </div>
          </div>
          <p className="text-gray-300 mt-4">协作信号：{result.socialProfile.collaborationSignal}</p>
          <p className="text-gray-500 text-sm mt-1">置信度：{Math.round(result.socialProfile.confidence * 100)}%</p>
        </div>
      )}

      {/* Strengths */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        <div className="flex items-center gap-2 mb-6">
          <CheckCircle className="w-6 h-6 text-green-400" />
          <h3 className="text-xl font-bold text-white">核心优势</h3>
        </div>
        <ul className="space-y-3">
          {result.strengths.map((strength, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="text-green-400 mt-1">✓</span>
              <span className="text-gray-300">{strength}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Gaps */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        <div className="flex items-center gap-2 mb-6">
          <XCircle className="w-6 h-6 text-yellow-400" />
          <h3 className="text-xl font-bold text-white">需要改进</h3>
        </div>
        <ul className="space-y-3">
          {result.gaps.map((gap, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="text-yellow-400 mt-1">!</span>
              <span className="text-gray-300">{gap}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recommendations */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-bold text-white">建议</h3>
        </div>
        <ul className="space-y-3">
          {result.recommendations.map((recommendation, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="text-blue-400 mt-1">→</span>
              <span className="text-gray-300">{recommendation}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
