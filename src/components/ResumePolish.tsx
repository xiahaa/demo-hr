/**
 * ResumePolish 组件
 * 简历润色功能 - 使用 DOM API 安全构建 HTML，防止 XSS
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { getErrorMessage } from '../types';

interface ResumePolishProps {
  initialContent?: string;
  onSave?: (content: string) => void;
}

interface PolishResult {
  original: string;
  polished: string;
  improvements: string[];
}

/**
 * 安全地构建 HTML 元素
 * 使用 DOM API 替代字符串拼接，自动转义内容
 */
function createSafeHTML(result: PolishResult): HTMLElement {
  const container = document.createElement('div');
  container.className = 'resume-polish-result';
  
  // 标题
  const title = document.createElement('h3');
  title.textContent = '润色结果';
  container.appendChild(title);
  
  // 改进建议部分
  if (result.improvements.length > 0) {
    const improvementsSection = document.createElement('div');
    improvementsSection.className = 'improvements-section';
    
    const improvementsTitle = document.createElement('h4');
    improvementsTitle.textContent = '改进建议';
    improvementsSection.appendChild(improvementsTitle);
    
    const improvementsList = document.createElement('ul');
    improvementsList.className = 'improvements-list';
    
    for (const improvement of result.improvements) {
      const li = document.createElement('li');
      li.textContent = improvement; // 自动转义
      improvementsList.appendChild(li);
    }
    
    improvementsSection.appendChild(improvementsList);
    container.appendChild(improvementsSection);
  }
  
  // 对比部分
  const comparisonSection = document.createElement('div');
  comparisonSection.className = 'comparison-section';
  
  // 原文
  const originalSection = document.createElement('div');
  originalSection.className = 'original-section';
  
  const originalLabel = document.createElement('label');
  originalLabel.textContent = '原文：';
  originalSection.appendChild(originalLabel);
  
  const originalContent = document.createElement('div');
  originalContent.className = 'content-box original';
  // 将文本按段落分割，创建安全的 p 元素
  const originalParagraphs = result.original.split('\n').filter(p => p.trim());
  for (const para of originalParagraphs) {
    const p = document.createElement('p');
    p.textContent = para; // 自动转义
    originalContent.appendChild(p);
  }
  originalSection.appendChild(originalContent);
  comparisonSection.appendChild(originalSection);
  
  // 润色后
  const polishedSection = document.createElement('div');
  polishedSection.className = 'polished-section';
  
  const polishedLabel = document.createElement('label');
  polishedLabel.textContent = '润色后：';
  polishedSection.appendChild(polishedLabel);
  
  const polishedContent = document.createElement('div');
  polishedContent.className = 'content-box polished';
  const polishedParagraphs = result.polished.split('\n').filter(p => p.trim());
  for (const para of polishedParagraphs) {
    const p = document.createElement('p');
    p.textContent = para; // 自动转义
    polishedContent.appendChild(p);
  }
  polishedSection.appendChild(polishedContent);
  comparisonSection.appendChild(polishedSection);
  
  container.appendChild(comparisonSection);
  
  // 操作按钮
  const actions = document.createElement('div');
  actions.className = 'actions';
  
  const copyButton = document.createElement('button');
  copyButton.textContent = '复制润色内容';
  copyButton.className = 'btn btn-primary';
  copyButton.addEventListener('click', () => {
    navigator.clipboard.writeText(result.polished).then(() => {
      copyButton.textContent = '已复制！';
      setTimeout(() => {
        copyButton.textContent = '复制润色内容';
      }, 2000);
    });
  });
  actions.appendChild(copyButton);
  
  container.appendChild(actions);
  
  return container;
}

/**
 * 模拟简历润色 API 调用
 * 实际项目中应该调用后端 API
 */
async function polishResume(content: string): Promise<PolishResult> {
  // 模拟 API 延迟
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // 模拟润色结果
  const improvements = [
    '优化了技术栈的描述，使其更加专业',
    '增加了量化指标，突出项目成果',
    '调整了语句结构，提升可读性',
  ];
  
  // 简单的润色逻辑（实际应该调用 AI API）
  const polished = content
    .replace(/负责/g, '主导')
    .replace(/做了/g, '完成')
    .replace(/使用/g, '基于')
    + '\n\n优化后的内容更加专业，突出了技术深度和项目成果。';
  
  return {
    original: content,
    polished,
    improvements,
  };
}

export const ResumePolish: React.FC<ResumePolishProps> = ({
  initialContent = '',
  onSave,
}) => {
  const [content, setContent] = useState(initialContent);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultContainerRef = useRef<HTMLDivElement>(null);
  
  // 清理结果容器
  useEffect(() => {
    return () => {
      if (resultContainerRef.current) {
        resultContainerRef.current.innerHTML = '';
      }
    };
  }, []);
  
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setError(null);
  }, []);
  
  const handlePolish = useCallback(async () => {
    if (!content.trim()) {
      setError('请输入简历内容');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await polishResume(content);
      
      // 使用 DOM API 安全地渲染结果
      if (resultContainerRef.current) {
        resultContainerRef.current.innerHTML = '';
        const safeHTML = createSafeHTML(result);
        resultContainerRef.current.appendChild(safeHTML);
      }
      
      onSave?.(result.polished);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [content, onSave]);
  
  const handleClear = useCallback(() => {
    setContent('');
    setError(null);
    if (resultContainerRef.current) {
      resultContainerRef.current.innerHTML = '';
    }
  }, []);
  
  return (
    <div className="resume-polish-container">
      <div className="input-section">
        <label htmlFor="resume-content">
          简历内容
          <span className="hint">支持粘贴纯文本简历</span>
        </label>
        
        <textarea
          id="resume-content"
          value={content}
          onChange={handleContentChange}
          placeholder="请粘贴您的简历内容..."
          rows={10}
          disabled={isLoading}
          className={error ? 'error' : ''}
        />
        
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}
      </div>
      
      <div className="actions-section">
        <button
          onClick={handlePolish}
          disabled={isLoading || !content.trim()}
          className="btn btn-primary"
        >
          {isLoading ? (
            <>
              <span className="spinner" />
              润色中...
            </>
          ) : (
            '开始润色'
          )}
        </button>
        
        <button
          onClick={handleClear}
          disabled={isLoading}
          className="btn btn-secondary"
        >
          清空
        </button>
      </div>
      
      {/* 结果容器 - 使用 ref 安全地插入 DOM */}
      <div 
        ref={resultContainerRef}
        className="result-section"
        aria-live="polite"
      />
    </div>
  );
};

export default ResumePolish;
