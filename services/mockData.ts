import { CandidateProfile } from "../types";

export const MOCK_PROFILE: CandidateProfile = {
  name: "Sarah Chen",
  username: "schen_dev",
  avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
  oneLiner: "Full-stack architect specializing in distributed systems and high-performance React applications.",
  location: "San Francisco, CA",
  email: "sarah.chen@example.com",
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
      description: "A high-performance virtualization library for React tables handling 1M+ rows.",
      stars: 4200,
      language: "TypeScript",
      url: "https://github.com/example/fast-grid-renderer",
      updatedAt: new Date().toISOString()
    },
    {
      name: "node-cluster-manager",
      description: "Zero-downtime reload manager for Node.js clusters.",
      stars: 1800,
      language: "JavaScript",
      url: "https://github.com/example/node-cluster-manager",
      updatedAt: new Date(Date.now() - 86400000 * 5).toISOString()
    },
    {
      name: "rust-wasm-bridge",
      description: "Experimental bridge for high-compute tasks in the browser using WASM.",
      stars: 950,
      language: "Rust",
      url: "https://github.com/example/rust-wasm-bridge",
      updatedAt: new Date(Date.now() - 86400000 * 20).toISOString()
    },
    {
      name: "graphql-query-optimizer",
      description: "AST-based query complexity analyzer and optimizer for Apollo Server.",
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
  strengths: [
    "Deep understanding of React internals and performance optimization",
    "Strong architectural patterns for distributed Node.js services",
    "Active open-source maintainer with high code quality standards"
  ],
  weaknesses: [
    "Less experience with low-level systems programming (C/C++)",
    "Mobile development experience is limited to React Native"
  ],
  suggestedQuestions: [
    "Can you walk me through how you optimized the virtual rendering in fast-grid-renderer?",
    "What trade-offs did you consider when designing the node-cluster-manager for zero-downtime?",
    "How do you approach performance profiling in large React applications?",
    "Tell me about your experience with WASM integration and browser performance constraints.",
    "How do you handle GraphQL N+1 query problems at scale?"
  ]
};
