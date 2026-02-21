/**
 * App 组件
 * 使用 useCallback 和 useMemo 优化性能，避免不必要的重渲染
 */

import React, { 
  useState, 
  useCallback, 
  useMemo,
  Suspense,
  lazy,
} from 'react';

import {
  CandidateProfile,
  JDMatchResult,
  AppStatus,
  FeatureMode,
  getErrorMessage,
  AppError,
} from './types';

import { analyzeCandidate } from './services/analyzer';

// 懒加载组件，减少初始包大小
const CandidateCard = lazy(() => import('./components/CandidateCard'));
const ResumePolish = lazy(() => import('./components/ResumePolish'));

// 加载占位符
const LoadingFallback: React.FC = () => (
  <div className="loading-container">
    <div className="spinner" />
    <p>加载中...请稍候</p>
  </div>
);

// 错误边界组件
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary">
          <h2>出错了</h2>
          <p>{this.state.error?.message || '请刷新页面重试'}</p>
          <button onClick={() => window.location.reload()}>刷新页面</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  // 功能模式状态
  const [featureMode, setFeatureMode] = useState<FeatureMode>('github-analysis');
  
  // 分析状态
  const [status, setStatus] = useState<AppStatus>('IDLE');
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [jdMatchResult, setJdMatchResult] = useState<JDMatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>('');
  
  // 输入状态
  const [githubUrl, setGithubUrl] = useState('');
  const [jdContent, setJdContent] = useState('');
  
  // AbortController 用于取消请求
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  // ============ 使用 useCallback 缓存回调函数 ============
  
  /**
   * 切换功能模式
   */
  const handleModeChange = useCallback((mode: FeatureMode) => {
    setFeatureMode(mode);
    // 重置状态
    setStatus('IDLE');
    setError(null);
    setProgressMessage('');
  }, []);
  
  /**
   * 处理 GitHub URL 输入变化
   */
  const handleGithubUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setGithubUrl(e.target.value);
    if (error) setError(null);
  }, [error]);
  
  /**
   * 处理 JD 内容输入变化
   */
  const handleJdContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJdContent(e.target.value);
    if (error) setError(null);
  }, [error]);
  
  /**
   * 取消当前操作
   */
  const handleCancel = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setStatus('IDLE');
    setProgressMessage('');
  }, [abortController]);
  
  /**
   * 重置所有状态
   */
  const handleReset = useCallback(() => {
    setStatus('IDLE');
    setProfile(null);
    setJdMatchResult(null);
    setError(null);
    setProgressMessage('');
    setGithubUrl('');
    setJdContent('');
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
  }, [abortController]);
  
  /**
   * 执行 GitHub 分析
   */
  const handleAnalyze = useCallback(async () => {
    if (!githubUrl.trim()) {
      setError('请输入 GitHub URL 或用户名');
      return;
    }
    
    // 取消之前的请求
    if (abortController) {
      abortController.abort();
    }
    
    const controller = new AbortController();
    setAbortController(controller);
    
    setStatus('ANALYZING');
    setError(null);
    setProgressMessage('正在分析候选人信息...');
    setProfile(null);
    
    try {
      const result = await analyzeCandidate(githubUrl, {
        signal: controller.signal,
      });
      
      setProfile(result.profile);
      setStatus('RESULT');
      setProgressMessage('');
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setStatus('IDLE');
      } else {
        setError(getErrorMessage(err as AppError));
        setStatus('ERROR');
      }
    } finally {
      setAbortController(null);
    }
  }, [githubUrl, abortController]);
  
  /**
   * 处理简历润色保存
   */
  const handlePolishSave = useCallback((content: string) => {
    console.log('保存润色后的简历:', content);
    // 实际项目中这里会调用 API 保存
  }, []);
  
  // ============ 使用 useMemo 缓存计算结果 ============
  
  /**
   * 缓存功能按钮配置
   */
  const featureButtons = useMemo(() => [
    { mode: 'github-analysis' as FeatureMode, label: 'GitHub 分析', icon: '🔍' },
    { mode: 'jd-matching' as FeatureMode, label: 'JD 匹配', icon: '📝' },
    { mode: 'resume-polish' as FeatureMode, label: '简历润色', icon: '✨' },
    { mode: 'career-profile' as FeatureMode, label: '职业画像', icon: '📊' },
  ], []);
  
  /**
   * 缓存状态文本
   */
  const statusText = useMemo(() => {
    switch (status) {
      case 'IDLE': return '准备就绪';
      case 'ANALYZING': return '分析中...';
      case 'RESULT': return '分析完成';
      case 'ERROR': return '分析失败';
      default: return '';
    }
  }, [status]);
  
  /**
   * 缓存是否显示分析按钮
   */
  const showAnalyzeButton = useMemo(() => 
    status !== 'ANALYZING' && featureMode === 'github-analysis',
  [status, featureMode]);
  
  /**
   * 缓存是否显示取消按钮
   */
  const showCancelButton = useMemo(() => 
    status === 'ANALYZING',
  [status]);
  
  // ============ 渲染 ============
  
  return (
    <div className="app">
      <header className="app-header">
        <h1>知马 HR - 智能招聘分析工具</h1>
        <nav className="feature-nav">
          {featureButtons.map(({ mode, label, icon }) => (
            <button
              key={mode}
              onClick={() => handleModeChange(mode)}
              className={featureMode === mode ? 'active' : ''}
              disabled={status === 'ANALYZING'}
            >
              <span className="icon">{icon}</span>
              {label}
            </button>
          ))}
        </nav>
      </header>
      
      <main className="app-main">
        {/* 状态栏 */}
        <div className={`status-bar ${status.toLowerCase()}`}>
          <span className="status-text">{statusText}</span>
          {progressMessage && (
            <span className="progress-message">{progressMessage}</span>
          )}
        </div>
        
        {/* 错误提示 */}
        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button onClick={() => setError(null)} aria-label="关闭错误提示">
              ×
            </button>
          </div>
        )}
        
        {/* 功能区域 */}
        <div className="feature-container">
          {/* GitHub 分析输入区 */}
          {featureMode === 'github-analysis' && (
            <div className="input-section">
              <label htmlFor="github-url">
                GitHub 链接或用户名
              </label>
              <input
                id="github-url"
                type="text"
                value={githubUrl}
                onChange={handleGithubUrlChange}
                placeholder="例如: https://github.com/torvalds 或 torvalds"
                disabled={status === 'ANALYZING'}
              />
              
              <div className="button-group">
                {showAnalyzeButton && (
                  <button
                    onClick={handleAnalyze}
                    disabled={!githubUrl.trim()}
                    className="btn btn-primary"
                  >
                    开始分析
                  </button>
                )}
                
                {showCancelButton && (
                  <button
                    onClick={handleCancel}
                    className="btn btn-secondary"
                  >
                    取消
                  </button>
                )}
                
                {(profile || error) && (
                  <button
                    onClick={handleReset}
                    className="btn btn-tertiary"
                  >
                    重置
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* JD 匹配输入区 */}
          {featureMode === 'jd-matching' && (
            <div className="input-section">
              <label htmlFor="jd-content">职位描述 (JD)</label>
              <textarea
                id="jd-content"
                value={jdContent}
                onChange={handleJdContentChange}
                placeholder="请粘贴职位描述..."
                rows={10}
                disabled={status === 'ANALYZING'}
              />
            </div>
          )}
          
          {/* 简历润色 */}
          {featureMode === 'resume-polish' && (
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <ResumePolish onSave={handlePolishSave} />
              </Suspense>
            </ErrorBoundary>
          )}
          
          {/* 结果显示区 */}
          {status === 'RESULT' && profile && (
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <CandidateCard profile={profile} />
              </Suspense>
            </ErrorBoundary>
          )}
        </div>
      </main>
      
      <footer className="app-footer">
        <p>© 2024 知马 HR - 智能招聘分析工具</p>
      </footer>
    </div>
  );
};

export default App;
