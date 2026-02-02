# 知码 (Zhima) - AI-Driven Code Talent Assessment Platform

<div align="center">
  <img src="/public/logo.png" alt="知码 Logo" width="100" height="100" />
  
  <h3>🔍 AI驱动的代码人才评估平台 🧠</h3>
  
  <p>深度分析 GitHub 档案，生成工程评分、技术栈雷达图和市场价值洞察</p>
  
  <p>Deep GitHub profile analysis generating engineering scores, tech stack radar charts, and market value insights</p>
</div>

---

## 🌟 Features / 功能特性

- 📊 **Comprehensive GitHub Analysis** - Analyzes up to 100 repositories with language statistics
- 🎯 **Engineering Score** - AI-powered evaluation of coding capabilities and project quality
- 📈 **Tech Stack Radar** - Visual representation of technology proficiency across multiple languages
- 💰 **Market Value Assessment** - Estimates developer market worth based on skills and experience
- 🔬 **Multi-Source Integration** - Optional Google Scholar and LinkedIn data for enhanced analysis
- ⚡ **Fast & Reliable** - Code-based baseline with LLM enhancement and automatic fallbacks
- 🎨 **Modern UI** - Built with React, TypeScript, Tailwind CSS, and Framer Motion

## 🚀 Quick Start / 快速开始

### Prerequisites / 前置要求

- **Node.js** (v18 or higher)
- **DeepSeek API Key** - Get one from [DeepSeek Platform](https://platform.deepseek.com/)

### Installation / 安装

1. **Clone the repository / 克隆仓库**
   ```bash
   git clone https://github.com/xiahaa/demo-hr.git
   cd demo-hr
   ```

2. **Install dependencies / 安装依赖**
   ```bash
   npm install
   ```

3. **Set up environment variables / 配置环境变量**
   
   Create a `.env` file in the root directory:
   ```env
   DEEPSEEK_API_KEY=your_api_key_here
   # Optional: Customize AI models
   # DEEPSEEK_CHAT_MODEL=deepseek-chat
   # DEEPSEEK_REASONER_MODEL=deepseek-reasoner
   ```

4. **Run the development server / 运行开发服务器**
   ```bash
   npm run dev
   ```

5. **Open your browser / 打开浏览器**
   
   Navigate to `http://localhost:5173`

## 📖 Usage / 使用方法

1. **Enter a GitHub URL** - Paste any GitHub profile URL (e.g., `github.com/torvalds`)
2. **Optional: Add Scholar/LinkedIn** - Enhance analysis with additional data sources
3. **Click "分析" (Analyze)** - Wait 10-15 seconds for comprehensive analysis
4. **View Results** - Explore engineering scores, tech stack radar, and insights

**Demo Mode**: Click "查看实时演示" (View Live Demo) or enter `demo` as the GitHub URL

## 🛠️ Tech Stack / 技术栈

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **UI Components**: Lucide React (icons), Framer Motion (animations)
- **Charts**: Recharts
- **AI**: DeepSeek API for intelligent analysis
- **Data Source**: GitHub REST API

## 📂 Project Structure / 项目结构

```
demo-hr/
├── components/          # React components
│   ├── Landing.tsx     # Landing page with input form
│   ├── CandidateCard.tsx  # Results display
│   └── LoadingScreen.tsx  # Analysis loading state
├── services/           # Core business logic
│   ├── analyzer.ts    # AI analysis orchestration
│   ├── github.ts      # GitHub API integration
│   └── mockData.ts    # Demo data
├── App.tsx            # Main application component
├── types.ts           # TypeScript type definitions
└── index.tsx          # Application entry point
```

## 🔧 Available Scripts / 可用脚本

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm test         # Run tests with Vitest
```

## 📊 How It Works / 工作原理

1. **Data Collection** - Fetches GitHub profile, repositories, and language statistics
2. **Baseline Calculation** - Analyzes code volumes across languages to create tech stack baseline
3. **AI Enhancement** - DeepSeek AI refines analysis with intelligent insights
4. **Validation & Fallback** - Ensures data quality with automatic fallbacks
5. **Results Display** - Presents comprehensive evaluation with interactive visualizations

See `QUICK_REFERENCE.md` for detailed technical documentation.

## 🌐 Production Deployment / 生产部署

- Add GitHub authentication token to avoid API rate limits (60 req/hour → 5000 req/hour)
- Implement caching for language statistics (recommended 24h TTL)
- Set up error monitoring (e.g., Sentry)
- Consider progressive loading for better UX

## 📝 Documentation / 文档

- `QUICK_REFERENCE.md` - Quick overview of features and changes
- `IMPROVEMENTS.md` - Detailed implementation details
- `TESTING_GUIDE.md` - Testing instructions
- `ANALYSIS_SUMMARY.md` - Deep-dive technical analysis

## 🤝 Contributing / 贡献

Contributions are welcome! Please feel free to submit pull requests or open issues.

## 📄 License / 许可证

See the repository for license details.

## 🙏 Acknowledgments / 致谢

Built with AI-powered analysis from DeepSeek and data from GitHub's public API.

---

<div align="center">
  <p><strong>知码</strong> - Empowering HR teams with AI-driven developer insights</p>
  <p>Trusted by teams at Tencent, Alibaba, and Bytedance</p>
</div>
