import React, { useState, useMemo } from 'react';
import { CandidateProfile } from '../types';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { MapPin, Mail, Github, Star, ExternalLink, Calendar, Code } from 'lucide-react';

interface CandidateCardProps {
  profile: CandidateProfile;
}

type SortKey = 'stars' | 'date' | 'name';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10
    }
  }
};

export const CandidateCard: React.FC<CandidateCardProps> = ({ profile }) => {
  const [sortKey, setSortKey] = useState<SortKey>('stars');

  const radarData = profile.techStack.map(item => ({
    subject: item.name,
    A: item.score,
    fullMark: 100,
  }));
  const hasTechStack = radarData.length > 0;

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return '最近';
    }
  };

  const sortedRepos = useMemo(() => {
    const repos = [...profile.topRepositories];
    switch (sortKey) {
      case 'stars':
        return repos.sort((a, b) => b.stars - a.stars);
      case 'date':
        return repos.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      case 'name':
        return repos.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return repos;
    }
  }, [profile.topRepositories, sortKey]);

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-4 grid-rows-auto gap-4 md:gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >

      {/* 1. Hero Section: User Identity */}
      <motion.div
        variants={itemVariants}
        className="md:col-span-3 bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-start glass bento-card"
      >
        <img
          src={profile.avatarUrl}
          alt={profile.username}
          className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover ring-4 ring-[#2D5BFF]/20 shadow-xl shadow-black/50"
        />
        <div className="flex-1 w-full">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">{profile.name}</h1>
            <span className="px-3 py-1 rounded-full bg-[#2D5BFF]/20 border border-[#2D5BFF]/30 text-[#2D5BFF] text-xs font-bold uppercase tracking-widest">
              {profile.experienceLevel}
            </span>
          </div>
          <p className="text-gray-300 text-lg mb-6 font-medium leading-relaxed max-w-xl">
            {profile.oneLiner}
          </p>
          <div className="flex flex-wrap gap-6 text-base font-medium">
            <div className="flex items-center gap-2 text-gray-400">
              <MapPin className="w-4 h-4 text-[#2D5BFF]" />
              {profile.location}
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Mail className="w-4 h-4 text-[#2D5BFF]" />
              {profile.email || '邮箱私密'}
            </div>
            <a
              href={`https://github.com/${profile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <Github className="w-4 h-4 text-[#2D5BFF]" />
              github.com/{profile.username}
            </a>
          </div>
        </div>
      </motion.div>

      {/* 2. Engineering Score Card */}
      <motion.div
        variants={itemVariants}
        className="md:col-span-1 bg-gradient-to-br from-[#2D5BFF] to-[#00C896] rounded-3xl p-8 flex flex-col items-center justify-center text-center bento-card shadow-2xl shadow-[#2D5BFF]/20 border border-white/10"
      >
        <span className="text-white/90 text-sm font-bold uppercase tracking-widest mb-6 opacity-80">工程评分</span>
        <div className="relative">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/20"/>
            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={2 * Math.PI * 58} strokeDashoffset={2 * Math.PI * 58 * (1 - profile.engineeringScore / 100)} strokeLinecap="round" className="text-white"/>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-black text-white">{profile.engineeringScore}</span>
          </div>
        </div>
        <p className="mt-6 text-white/70 text-sm font-medium px-4 leading-relaxed">
          基于代码质量、一致性和复杂性分析。
        </p>
      </motion.div>

      {/* 3. Tech Stack Radar Chart */}
      <motion.div
        variants={itemVariants}
        className="md:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 glass bento-card flex flex-col"
      >
        <div className="flex items-center justify-between mb-4">
           <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
             <Code className="w-4 h-4" />
             技能熟练度
           </h3>
        </div>
        <div className="flex-1 min-h-[300px] w-full -ml-4 flex items-center justify-center">
          {hasTechStack ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 14, fontWeight: 500 }} />
                <Radar
                  name="Score"
                  dataKey="A"
                  stroke="#2D5BFF"
                  strokeWidth={3}
                  fill="#2D5BFF"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-sm text-gray-500 italic px-4 text-center">
              信号不足，无法推断可靠的技能概况。
            </div>
          )}
        </div>
      </motion.div>

      {/* 4. Top Repositories */}
      <motion.div
        variants={itemVariants}
        className="md:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 glass bento-card flex flex-col"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Github className="w-4 h-4" />
            核心贡献
          </h3>
          <div className="flex items-center bg-white/5 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setSortKey('stars')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${sortKey === 'stars' ? 'bg-[#2D5BFF] text-white shadow-lg shadow-[#2D5BFF]/20' : 'text-gray-500 hover:text-gray-300'}`}
            >
              星标
            </button>
            <button
              onClick={() => setSortKey('date')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${sortKey === 'date' ? 'bg-[#2D5BFF] text-white shadow-lg shadow-[#2D5BFF]/20' : 'text-gray-500 hover:text-gray-300'}`}
            >
              日期
            </button>
            <button
              onClick={() => setSortKey('name')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${sortKey === 'name' ? 'bg-[#2D5BFF] text-white shadow-lg shadow-[#2D5BFF]/20' : 'text-gray-500 hover:text-gray-300'}`}
            >
              名称
            </button>
          </div>
        </div>

        <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
          {sortedRepos.map((repo, i) => (
            <motion.a
              key={repo.name}
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="block group p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-transparent hover:border-[#2D5BFF]/30"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="font-bold text-[#2D5BFF] truncate group-hover:text-[#00C896] transition-colors">{repo.name}</span>
                  <ExternalLink className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono text-gray-500 uppercase px-2 py-0.5 rounded bg-white/5">{repo.language}</span>
                  <span className="flex items-center gap-1 text-xs font-bold text-[#FF6B35]">
                    <Star className="w-3 h-3 fill-current" /> {repo.stars}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-400 line-clamp-1 leading-relaxed mb-3">{repo.description || "未提供描述。"}</p>
              <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium uppercase tracking-tighter">
                <Calendar className="w-3 h-3" />
                最后更新 {formatDate(repo.updatedAt)}
              </div>
            </motion.a>
          ))}
        </div>
      </motion.div>

      {/* 5. Academic Stats */}
      {profile.academicStats ? (
        <motion.div
          variants={itemVariants}
          className="md:col-span-1 bg-white/5 border border-white/10 rounded-3xl p-6 glass bento-card flex flex-col justify-center"
        >
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">学术足迹</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-2xl font-bold text-white mb-1">{profile.academicStats.citations}</div>
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">引用</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-2xl font-bold text-white mb-1">{profile.academicStats.hIndex}</div>
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">H指数</div>
            </div>
          </div>
        </motion.div>
      ) : null}

      {/* 7. Qualitative SWOT */}
      <motion.div
        variants={itemVariants}
        className="md:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-8 glass bento-card"
      >
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h4 className="text-xs font-bold text-[#00C896] uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00C896]" />
              关键优势
            </h4>
            <ul className="space-y-3">
              {profile.strengths.map((s, i) => (
                <li key={i} className="text-sm text-gray-300 flex items-start gap-2 leading-relaxed">
                  <span className="text-[#00C896]/50 mt-0.5">●</span> {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#FF6B35] uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]" />
              需探索领域
            </h4>
            <ul className="space-y-3">
              {profile.weaknesses.map((w, i) => (
                <li key={i} className="text-sm text-gray-300 flex items-start gap-2 leading-relaxed">
                  <span className="text-[#FF6B35]/50 mt-0.5">●</span> {w}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>

      {/* 8. Interview Questions */}
      <motion.div
        variants={itemVariants}
        className="md:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-8 glass bento-card"
      >
        <h4 className="text-xs font-bold text-[#2D5BFF] uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2D5BFF]" />
          招聘面试官建议面试问题
        </h4>
        {profile.suggestedQuestions.length > 0 ? (
          <ul className="space-y-3">
            {profile.suggestedQuestions.map((q, i) => (
              <li key={i} className="text-sm text-gray-300 flex items-start gap-2 leading-relaxed">
                <span className="text-[#2D5BFF]/60 mt-0.5">●</span> {q}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-gray-500 italic">未生成针对性问题。</div>
        )}
      </motion.div>

      {/* 9. Recommended Positions */}
      <motion.div
        variants={itemVariants}
        className="md:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-8 glass bento-card"
      >
        <h4 className="text-xs font-bold text-[#00C896] uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00C896]" />
          推荐岗位
        </h4>
        {profile.recommendedPositions && profile.recommendedPositions.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {profile.recommendedPositions.map((position, i) => (
              <span 
                key={i} 
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00C896]/20 to-[#2D5BFF]/20 border border-[#00C896]/30 text-gray-200 text-sm font-medium hover:from-[#00C896]/30 hover:to-[#2D5BFF]/30 transition-all"
              >
                {position}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">未生成岗位推荐。</div>
        )}
      </motion.div>

    </motion.div>
  );
};
