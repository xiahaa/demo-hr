import { CandidateProfile } from "../types";

export const MOCK_PROFILE: CandidateProfile = {
  name: "Sarah Chen",
  username: "schen_dev",
  avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
  oneLiner: "专注于分布式系统和高性能React应用的全栈架构师。",
  location: "San Francisco, CA",
  email: "sarah.chen@example.com",
  website: "https://sarahchen.dev",
  personalWebsiteData: {
    url: "https://sarahchen.dev",
    title: "Sarah Chen - Full Stack Architect",
    description: "Personal website and blog about distributed systems, React performance, and web development",
    technologies: ["React", "TypeScript", "Node.js", "Rust", "GraphQL", "Docker"],
    skills: ["Full-stack Development", "Performance Optimization", "Distributed Systems", "Open Source Contribution"],
    canScrape: true
  },
  engineeringScore: 94,
  experienceLevel: "Senior",
  salaryEstimate: {
    min: 185000,
    max: 240000,
    currency: "$"
  },
  techStack: [
    { name: "React/Next.js", score: 98 },
    { name: "TypeScript", score: 95 },
    { name: "Node.js", score: 90 },
    { name: "GraphQL", score: 85 },
    { name: "Rust", score: 70 },
    { name: "Docker/K8s", score: 80 }
  ],
  topRepositories: [
    {
      name: "fast-grid-renderer",
      description: "用于处理100万+行数据的React表格的高性能虚拟化库。",
      summary: "高性能虚拟化表格渲染库，支持百万级数据展示",
      useCases: ["数据密集型仪表板", "企业级报表系统", "大规模数据分析工具"],
      stars: 4200,
      language: "TypeScript",
      url: "https://github.com/example/fast-grid-renderer",
      updatedAt: new Date().toISOString()
    },
    {
      name: "node-cluster-manager",
      description: "Node.js集群的零停机重载管理器。",
      summary: "实现Node.js应用零停机部署的集群管理工具",
      useCases: ["高可用性Web服务", "微服务架构", "云原生应用"],
      stars: 1800,
      language: "JavaScript",
      url: "https://github.com/example/node-cluster-manager",
      updatedAt: new Date(Date.now() - 86400000 * 5).toISOString()
    },
    {
      name: "rust-wasm-bridge",
      description: "使用WASM在浏览器中进行高计算任务的实验性桥梁。",
      summary: "在浏览器中运行高性能Rust代码的WASM桥接库",
      useCases: ["图像处理应用", "科学计算工具", "游戏引擎"],
      stars: 950,
      language: "Rust",
      url: "https://github.com/example/rust-wasm-bridge",
      updatedAt: new Date(Date.now() - 86400000 * 20).toISOString()
    },
    {
      name: "graphql-query-optimizer",
      description: "基于AST的Apollo Server查询复杂度分析器和优化器。",
      summary: "GraphQL查询性能优化和复杂度分析工具",
      useCases: ["大型GraphQL API", "电商平台后端", "社交网络服务"],
      stars: 640,
      language: "TypeScript",
      url: "https://github.com/example/graphql-query-optimizer",
      updatedAt: new Date(Date.now() - 86400000 * 45).toISOString()
    }
  ],
  academicStats: {
    citations: 124,
    hIndex: 4,
    publications: 3
  },
  recommendedPositions: [
    "高级全栈工程师",
    "前端架构师",
    "技术负责人",
    "性能优化专家"
  ],
  strengths: [
    "深入理解React内部机制和性能优化",
    "分布式Node.js服务的强大架构模式",
    "积极的开源维护者，具有高代码质量标准"
  ],
  weaknesses: [
    "底层系统编程经验较少（C/C++）",
    "移动开发经验仅限于React Native"
  ],
  suggestedQuestions: [
    "您能详细说明在fast-grid-renderer中如何优化虚拟渲染吗？",
    "在设计node-cluster-manager实现零停机时，您考虑了哪些权衡？",
    "您如何处理大型React应用程序的性能分析？",
    "请谈谈您在WASM集成和浏览器性能限制方面的经验。",
    "您如何处理大规模GraphQL N+1查询问题？"
  ]
};
