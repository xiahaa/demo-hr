import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = "正在分析..." }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="relative mb-12">
        <div className="w-24 h-24 border-4 border-[#2D5BFF]/20 border-t-[#2D5BFF] rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-[#2D5BFF]/20 rounded-full animate-pulse"></div>
        </div>
      </div>

      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold text-white">生成洞察</h2>
        <p
          role="status"
          aria-live="polite"
          className="text-[#2D5BFF] font-mono text-base tracking-tight animate-pulse h-6"
        >
          {message}
        </p>
      </div>

      <div className="mt-12 w-64 h-1 bg-white/5 rounded-full overflow-hidden relative">
        <div className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-[#2D5BFF] to-[#00C896] animate-[shimmer_2s_infinite]"></div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { left: -35%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
};
