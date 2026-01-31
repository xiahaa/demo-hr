
import React, { useEffect, useState } from 'react';

const STEPS = [
  "Fetching GitHub profile data...",
  "Cloning and scanning top repositories...",
  "Extracting technology stack distribution...",
  "Running academic impact analysis...",
  "Calculating engineering quality score...",
  "Estimating market compensation...",
  "Synthesizing bento grid visualization..."
];

export const LoadingScreen: React.FC = () => {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % STEPS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="relative mb-12">
        <div className="w-24 h-24 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-indigo-500/20 rounded-full animate-pulse"></div>
        </div>
      </div>
      
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold text-white">Generating Insight</h2>
        <p className="text-indigo-400 font-mono text-sm tracking-tight animate-pulse h-6">
          {STEPS[stepIndex]}
        </p>
      </div>

      <div className="mt-12 w-64 h-1 bg-white/5 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out" 
          style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};
