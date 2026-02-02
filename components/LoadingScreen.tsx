
import React, { useEffect, useState } from 'react';

const STEPS = [
  "正在获取GitHub档案数据...",
  "正在克隆和扫描顶级仓库...",
  "正在提取技术栈分布...",
  "正在运行学术影响力分析...",
  "正在计算工程质量评分...",
  "正在估算市场薪酬...",
  "正在合成网格可视化..."
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
        <div className="w-24 h-24 border-4 border-[#2D5BFF]/20 border-t-[#2D5BFF] rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-[#2D5BFF]/20 rounded-full animate-pulse"></div>
        </div>
      </div>

      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold text-white">生成洞察</h2>
        <p className="text-[#2D5BFF] font-mono text-sm tracking-tight animate-pulse h-6">
          {STEPS[stepIndex]}
        </p>
      </div>

      <div className="mt-12 w-64 h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#2D5BFF] to-[#00C896] transition-all duration-500 ease-out"
          style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};
