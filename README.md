# 知码 (Zhima) - AI-Driven Code Talent Assessment Platform

<div align="center">
  <img src="/public/logo.png" alt="知码 Logo" width="100" height="100" />
  
  <h3>🔍 AI驱动的代码人才评估平台 🧠</h3>
  
  <p>深度分析 GitHub 档案，生成工程评分、技术栈雷达图和市场价值洞察</p>
  
  <p>Deep GitHub profile analysis generating engineering scores, tech stack radar charts, and market value insights</p>
</div>

---

## 🌟 Features / 功能特性

### GitHub Analysis / GitHub 分析
- 📊 **Comprehensive GitHub Analysis** - Analyzes up to 100 repositories with language statistics
- 🎯 **Engineering Score** - AI-powered evaluation of coding capabilities and project quality
- 📈 **Tech Stack Radar** - Visual representation of technology proficiency across multiple languages
- 💰 **Market Value Assessment** - Estimates developer market worth based on skills and experience
- 🔬 **Multi-Source Integration** - Optional Google Scholar and LinkedIn data for enhanced analysis
- 🌐 **Personal Website Scraping** - Extracts skills and technologies from personal websites (with robots.txt compliance)

### JD Matching / 职位匹配 (NEW!)
- 💼 **Job Description Matching** - AI-powered candidate-to-job fit analysis
- 📝 **Resume Analysis** - Supports online resume links (GitHub, LinkedIn) and file uploads (TXT, PDF)
- 🔍 **Enhanced PDF Parsing** - Uses Mineru API for URL-based PDFs with automatic fallback to local parsing
- 🎯 **Multi-Dimensional Scoring** - Evaluates technical skills, experience, industry knowledge, cultural fit, and education
- ✅ **Strengths & Gaps** - Identifies candidate strengths and areas for improvement
- 💡 **Recommendations** - Provides actionable suggestions for both candidates and hiring teams
- 📊 **Visual Results** - Intuitive score visualization with detailed category breakdowns

### Zhima Fit Tool / 知码匹配工具 (NEW!)
- 🧩 **Zhima Fit Workflow** - A third 知码-branded tool with mission + business-impact + collaboration-aware matching
- 📝 **Optional Multi-Source Inputs** - Accepts Google Scholar, LinkedIn, and resume inputs (all optional but at least one required)
- 📊 **Social Fit Signals** - Adds MBTI-style team-fit hints to support team composition decisions
- 
### Resume Polish / 简历美化
- 🎨 **Template-based Preview** - Real-time resume preview with modern/classic layout options
- 📤 **One-click Export** - Export selected template directly as `.tex` (LaTeX templates) or `.html` (React template)
- 🧩 **Template Selection** - Choose Awesome-CV / Modern Deedy / Figma-Minimal style before export

### Platform Features / 平台特性
- ⚡ **Fast & Reliable** - Code-based baseline with LLM enhancement and automatic fallbacks
- 🎨 **Modern UI** - Built with React, TypeScript, Tailwind CSS, and Framer Motion
- 🔄 **Multi-Tool Navigation** - Seamlessly switch between GitHub analysis, JD matching, and Zhima Fit analysis

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
   # Optional: Mineru PDF parsing service (for enhanced PDF extraction from URLs)
   # MINERU_ID=your_mineru_id
   # MINERU_KEY=your_mineru_key
   # Optional: Customize AI models
   # DEEPSEEK_CHAT_MODEL=deepseek-chat
   # DEEPSEEK_REASONER_MODEL=deepseek-reasoner
   ```
   
   **Note on PDF Parsing:**
   - For URL-based PDF resumes, the system will attempt to use [Mineru](https://mineru.net) for enhanced extraction if credentials are configured
   - If Mineru is not configured or fails, it will automatically fall back to local PDF parsing
   - For uploaded PDF files, local parsing is always used
   - Get Mineru credentials from [https://mineru.net/apiManage/docs](https://mineru.net/apiManage/docs)

4. **Run the development server / 运行开发服务器**
   ```bash
   npm run dev
   ```

5. **Open your browser / 打开浏览器**
   
   Navigate to `http://localhost:5173`

## 📖 Usage / 使用方法

### GitHub Analysis / GitHub 分析

1. **Select GitHub Analysis Mode** - Click the "GitHub 分析" tab at the top
2. **Enter a GitHub URL** - Paste any GitHub profile URL (e.g., `github.com/torvalds`)
3. **Optional: Add Scholar/LinkedIn** - Enhance analysis with additional data sources
4. **Click "分析" (Analyze)** - Wait 10-15 seconds for comprehensive analysis
5. **View Results** - Explore engineering scores, tech stack radar, and insights

**Demo Mode**: Click "查看实时演示" (View Live Demo) or enter `demo` as the GitHub URL

### JD Matching / 职位匹配

1. **Select JD Matching Mode** - Click the "JD 匹配" tab at the top
2. **Enter Job Information**:
   - Industry (e.g., 互联网, 金融, 教育)
   - Company Name (e.g., 阿里巴巴, 腾讯)
   - Detailed Job Description
3. **Provide Resume**:
   - **Option A**: Enter an online resume URL (GitHub profile, LinkedIn, or personal website)
   - **Option B**: Upload a resume file (TXT or PDF format supported with enhanced parsing)
4. **Click "开始匹配分析"** - Wait 10-20 seconds for AI analysis
5. **View Results** - Review matching scores, strengths, gaps, and recommendations

### Zhima Fit Tool / 知码匹配工具

1. **Select Zhima Fit Mode** - Click the "知码匹配" tab at the top
2. **Add Optional Candidate Sources** - Google Scholar URL, LinkedIn text/link, and/or resume
3. **Provide Candidate Material** - Resume URL or TXT/PDF file
4. **Click "开始知码匹配分析"** - Wait for AI-powered analysis
5. **Review Social + Capability Output** - See score, strengths/gaps, and MBTI-style team-fit hints

## 🛠️ Tech Stack / 技术栈

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **UI Components**: Lucide React (icons), Framer Motion (animations)
- **Charts**: Recharts
- **AI**: DeepSeek API for intelligent analysis
- **Data Source**: GitHub REST API
- **PDF Processing**: unpdf (primary), pdfjs-dist (fallback) for robust PDF parsing

## 📂 Project Structure / 项目结构

```
demo-hr/
├── components/              # React components
│   ├── Landing.tsx         # GitHub analysis landing page
│   ├── JDMatch.tsx         # JD matching input form
│   ├── ZhimaFit.tsx        # Zhima Fit input form with extended context (NEW)
│   ├── JDMatchResultCard.tsx  # JD/Zhima Fit results display
│   ├── CandidateCard.tsx   # GitHub analysis results display
│   └── LoadingScreen.tsx   # Analysis loading state
├── services/               # Core business logic
│   ├── analyzer.ts        # GitHub analysis orchestration
│   ├── jdMatcher.ts       # JD matching analysis
│   ├── zhimaFitMatcher.ts # Zhima Fit orchestration (NEW)
│   ├── github.ts          # GitHub API integration
│   ├── website.ts         # Personal website scraping
│   └── mockData.ts        # Demo data
├── App.tsx                # Main application with multi-tool navigation
├── types.ts               # TypeScript type definitions
└── index.tsx              # Application entry point
```

## 🔧 Available Scripts / 可用脚本

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm test         # Run tests with Vitest
npm run compile:tex -- ./resume.tex  # Compile .tex to PDF (requires tectonic or pdflatex)
```

### TeX Compile via MCP / TeX 编译说明

可以。当前实现会先导出 `.tex`，然后可通过 MCP 执行本地编译命令：

```bash
npm run compile:tex -- ./resume-awesome-cv.tex
```

- 脚本会自动优先使用 `tectonic`，其次使用 `pdflatex`。
- 若环境未安装 TeX 引擎，会提示安装依赖。

## 📊 How It Works / 工作原理

### GitHub Analysis / GitHub 分析
1. **Data Collection** - Fetches GitHub profile, repositories, and language statistics
2. **Baseline Calculation** - Analyzes code volumes across languages to create tech stack baseline
3. **AI Enhancement** - DeepSeek AI refines analysis with intelligent insights
4. **Validation & Fallback** - Ensures data quality with automatic fallbacks
5. **Results Display** - Presents comprehensive evaluation with interactive visualizations

### JD Matching / 职位匹配
1. **Input Processing** - Collects job description and resume from URL or file
2. **Content Extraction** - Extracts text content from HTML pages or files
3. **AI Analysis** - DeepSeek AI analyzes candidate-job fit across multiple dimensions
4. **Scoring** - Generates overall score and detailed category scores
5. **Recommendations** - Provides strengths, gaps, and actionable suggestions

See `QUICK_REFERENCE.md` for detailed technical documentation and `JD_MATCH_FEATURE.md` for JD matching specifics.

## 🌐 Production Deployment / 生产部署

- Add GitHub authentication token to avoid API rate limits (60 req/hour → 5000 req/hour)
- Implement caching for language statistics (recommended 24h TTL)
- Set up error monitoring (e.g., Sentry)
- Consider progressive loading for better UX

## 📝 Documentation / 文档

- `README.md` - Main project documentation (this file)
- `QUICK_REFERENCE.md` - Quick overview of features and changes
- `PDF_PARSING_ENHANCEMENT.md` - Enhanced PDF parsing with unpdf documentation
- `JD_MATCH_FEATURE.md` - Complete JD matching feature documentation
- `PERSONAL_WEBSITE_FEATURE.md` - Personal website scraping feature documentation
- `IMPLEMENTATION_SUMMARY.md` - Personal website feature implementation summary

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
