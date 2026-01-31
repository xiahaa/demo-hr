
import React, { useState, useMemo } from 'react';
import { CandidateProfile, Repository } from '../types';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface CandidateCardProps {
  profile: CandidateProfile;
}

type SortKey = 'stars' | 'date' | 'name';

export const CandidateCard: React.FC<CandidateCardProps> = ({ profile }) => {
  const [sortKey, setSortKey] = useState<SortKey>('stars');

  const radarData = profile.techStack.map(item => ({
    subject: item.name,
    A: item.score,
    fullMark: 100,
  }));

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return 'Recently';
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
    <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-auto gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 1. Hero Section: User Identity */}
      <div className="md:col-span-3 bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-start glass bento-card">
        <img 
          src={profile.avatarUrl} 
          alt={profile.username}
          className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover ring-4 ring-indigo-500/20"
        />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{profile.name}</h1>
            <span className="px-3 py-1 rounded-full bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest">
              {profile.experienceLevel}
            </span>
          </div>
          <p className="text-gray-400 text-lg mb-4 font-medium leading-relaxed max-w-xl">
            {profile.oneLiner}
          </p>
          <div className="flex flex-wrap gap-4 text-sm font-medium">
            <div className="flex items-center gap-1.5 text-gray-300">
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              {profile.location}
            </div>
            <div className="flex items-center gap-1.5 text-gray-300">
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/></svg>
              {profile.email || 'Email Private'}
            </div>
            <div className="flex items-center gap-1.5 text-gray-300">
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
              github.com/{profile.username}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Engineering Score Card */}
      <div className="md:col-span-1 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 flex flex-col items-center justify-center text-center bento-card shadow-2xl shadow-indigo-500/20">
        <span className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-4 opacity-80">ENG SCORE</span>
        <div className="relative">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/20"/>
            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={2 * Math.PI * 58} strokeDashoffset={2 * Math.PI * 58 * (1 - profile.engineeringScore / 100)} strokeLinecap="round" className="text-white"/>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-black text-white">{profile.engineeringScore}</span>
          </div>
        </div>
        <p className="mt-4 text-indigo-100/70 text-sm font-medium px-4">Top {100 - profile.engineeringScore}% of global developers</p>
      </div>

      {/* 3. Tech Stack Radar Chart */}
      <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 glass bento-card flex flex-col">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Skill Proficiency</h3>
        <div className="flex-1 min-h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid stroke="#333" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Radar
                name="Score"
                dataKey="A"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.5}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Top Repositories */}
      <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 glass bento-card flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Core Contributions</h3>
          <div className="flex items-center bg-white/5 p-1 rounded-lg border border-white/10">
            <button 
              onClick={() => setSortKey('stars')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${sortKey === 'stars' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-500 hover:text-gray-300'}`}
            >
              STARS
            </button>
            <button 
              onClick={() => setSortKey('date')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${sortKey === 'date' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-500 hover:text-gray-300'}`}
            >
              DATE
            </button>
            <button 
              onClick={() => setSortKey('name')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${sortKey === 'name' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-500 hover:text-gray-300'}`}
            >
              NAME
            </button>
          </div>
        </div>
        
        <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
          {sortedRepos.map((repo, i) => (
            <a 
              key={repo.name} 
              href={repo.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block group p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-transparent hover:border-indigo-500/30 animate-in fade-in slide-in-from-right-2 duration-300"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="font-bold text-indigo-300 truncate">{repo.name}</span>
                  <svg className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] font-mono text-gray-500 uppercase">{repo.language}</span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-500/80">
                    ★ {repo.stars}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 line-clamp-1 leading-relaxed mb-2">{repo.description || "No description provided."}</p>
              <div className="text-[9px] text-gray-600 font-medium uppercase tracking-tighter">
                Last Updated {formatDate(repo.updatedAt)}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* 5. Salary Estimate */}
      <div className="md:col-span-1 bg-white/5 border border-white/10 rounded-3xl p-6 glass bento-card flex flex-col justify-center items-center text-center">
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">MARKET VALUATION</h3>
        <div className="text-2xl font-black text-emerald-400">
          {profile.salaryEstimate.currency}{profile.salaryEstimate.min.toLocaleString()} - {profile.salaryEstimate.max.toLocaleString()}
        </div>
        <p className="text-[10px] text-gray-500 mt-2 font-medium">Estimated base salary (Annual)</p>
      </div>

      {/* 6. Academic Stats */}
      <div className="md:col-span-1 bg-white/5 border border-white/10 rounded-3xl p-6 glass bento-card flex flex-col justify-center">
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">ACADEMIC FOOTPRINT</h3>
        {profile.academicStats ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xl font-bold text-white">{profile.academicStats.citations}</div>
              <div className="text-[10px] text-gray-500 font-bold">CITATIONS</div>
            </div>
            <div>
              <div className="text-xl font-bold text-white">{profile.academicStats.hIndex}</div>
              <div className="text-[10px] text-gray-500 font-bold">H-INDEX</div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-600 italic">No significant academic record found.</div>
        )}
      </div>

      {/* 7. Qualitative SWOT */}
      <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 glass bento-card">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-3">KEY STRENGTHS</h4>
            <ul className="space-y-2">
              {profile.strengths.map((s, i) => (
                <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                  <span className="text-emerald-500">✔</span> {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-3">AREAS TO PROBE</h4>
            <ul className="space-y-2">
              {profile.weaknesses.map((w, i) => (
                <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                  <span className="text-amber-500">!</span> {w}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
};
