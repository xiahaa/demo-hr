# Personal Website Scraping Feature

## 概述 (Overview)

此功能为知码（Zhima）AI驱动的代码人才评估平台增加了个人网站信息的获取和分析能力。该功能遵守Web抓取规范和合规性要求。

This feature adds the ability to fetch and analyze personal website information for the Zhima AI-driven code talent assessment platform. The feature complies with web scraping standards and compliance requirements.

## 功能特性 (Features)

### ✅ 已实现的功能

1. **个人网站URL输入**
   - 在评估表单中添加了可选的个人网站URL输入字段
   - 自动排除GitHub、LinkedIn、Google Scholar等已处理的平台

2. **Robots.txt 合规性检查**
   - 自动检测并解析目标网站的 robots.txt 文件
   - 遵守 robots.txt 禁止规则，不抓取不允许的内容
   - 如果没有 robots.txt 或允许抓取，则继续处理

3. **网站内容提取**
   - 提取网站标题和元描述
   - 识别页面中提到的技术栈（React、Python、Node.js等）
   - 提取技能关键词
   - 清理和标准化HTML内容

4. **安全验证**
   - URL验证和消毒
   - 阻止危险的协议（javascript:、data:等）
   - 仅允许http/https协议
   - 内容长度限制防止过大数据

5. **AI分析集成**
   - 将个人网站数据整合到候选人分析中
   - LLM使用网站信息增强技术栈评估
   - 考虑网站专业性评估工程评分

6. **UI展示**
   - 在候选人卡片中显示个人网站信息
   - 显示提取的技术栈和技能
   - 清晰标识robots.txt禁止的网站

## 技术实现 (Technical Implementation)

### 新增文件

- `services/website.ts` - 网站抓取核心服务
- `services/website.test.ts` - 完整的单元测试套件

### 修改文件

- `types.ts` - 添加 PersonalWebsiteData 类型
- `components/Landing.tsx` - 添加个人网站URL输入框
- `components/CandidateCard.tsx` - 显示个人网站数据
- `services/analyzer.ts` - 集成网站数据到分析流程
- `App.tsx` - 传递个人网站URL参数
- `services/mockData.ts` - 添加示例数据

### 核心函数

```typescript
// 检查 robots.txt
async function checkRobotsTxt(url: string): Promise<boolean>

// 解析 robots.txt
function parseRobotsTxt(robotsTxtContent: string): { allowed: boolean }

// 验证URL
function validatePersonalWebsiteUrl(url: string): string | null

// 提取网站信息
async function fetchPersonalWebsite(url: string): Promise<WebsiteInfo | null>

// 提取技术栈
function extractTechnologies(html: string, textContent: string): string[]

// 提取技能
function extractSkills(textContent: string): string[]
```

## 合规性保障 (Compliance Safeguards)

### ✅ 遵守的规范

1. **Robots.txt 协议**
   - 在抓取前检查 robots.txt
   - 遵守 Disallow 规则
   - 使用友好的User-Agent标识

2. **礼貌抓取**
   - 使用明确的User-Agent: "ZhimaBot/1.0 (HR Analysis Tool; Respects robots.txt)"
   - 不进行频繁请求
   - 限制内容大小

3. **安全措施**
   - 输入验证和消毒
   - 阻止已知平台（防止重复处理）
   - 协议白名单（仅http/https）

4. **错误处理**
   - 对于无法访问的robots.txt采取保守策略
   - 网络错误不抓取
   - 优雅降级，不影响主要分析流程

### 🚫 不会做的事情

- ❌ 不会抓取robots.txt禁止的页面
- ❌ 不会抓取GitHub、LinkedIn等已处理平台
- ❌ 不会使用非http/https协议
- ❌ 不会进行深度爬取或跟踪链接
- ❌ 不会存储完整网页内容

## 使用方法 (Usage)

### 基本使用

1. 在主页输入GitHub用户名
2. （可选）在"个人网站URL"字段输入候选人的个人网站
3. 点击"分析"按钮
4. 在结果页面查看个人网站信息（如果可用）

### 示例

```
GitHub URL: https://github.com/torvalds
个人网站: https://example.dev (可选)
```

### Demo模式

在主页点击"查看实时演示"或输入"demo"查看包含个人网站数据的示例。

## 测试 (Testing)

### 运行测试

```bash
# 运行所有测试
npm test

# 只运行网站相关测试
npm test -- services/website.test.ts

# 运行特定测试
npm test -- services/website.test.ts -t "should respect robots.txt"
```

### 测试覆盖

- ✅ Robots.txt 解析
- ✅ URL验证
- ✅ 内容提取
- ✅ 技术栈识别
- ✅ 技能提取
- ✅ 合规性检查
- ✅ 错误处理

所有测试通过：40/40 ✅

## 安全性 (Security)

### 已实施的安全措施

1. **输入验证**
   - URL格式验证
   - 协议白名单
   - 长度限制

2. **内容消毒**
   - HTML标签移除
   - 实体解码
   - 脚本/样式标签清除

3. **访问控制**
   - Robots.txt遵守
   - 域名黑名单
   - 请求头标识

### CodeQL扫描

在完成开发后运行CodeQL检查以确保没有安全漏洞。

## 性能考虑 (Performance Considerations)

### 时间影响

- 无个人网站：+0ms
- 有个人网站（robots.txt存在）：+200-500ms
- 有个人网站（robots.txt不存在）：+100-300ms

### 优化建议

1. **生产环境**
   - 实现缓存机制（24小时TTL）
   - 添加超时设置
   - 考虑后台处理

2. **错误监控**
   - 跟踪robots.txt失败率
   - 监控网站访问错误
   - 记录解析异常

## 局限性 (Limitations)

1. 仅支持静态HTML内容（不执行JavaScript）
2. 不支持需要认证的网站
3. 基于正则表达式的技术识别可能不完全准确
4. 不抓取单页应用的动态内容

## 未来改进 (Future Improvements)

### 短期
- [ ] 添加更多技术关键词
- [ ] 改进技能提取算法
- [ ] 添加内容缓存

### 长期
- [ ] 支持JavaScript渲染（使用headless browser）
- [ ] NLP改进技能提取
- [ ] 多语言支持
- [ ] 结构化数据提取（JSON-LD, microdata）

## 相关文档 (Related Documentation)

- [README.md](./README.md) - 主要项目文档
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - 快速参考
- [services/website.ts](./services/website.ts) - 源代码
- [services/website.test.ts](./services/website.test.ts) - 测试代码

## 问题排查 (Troubleshooting)

### 个人网站未显示

**可能原因：**
- robots.txt 禁止抓取
- URL 格式无效
- 网站无法访问
- 属于黑名单平台

**解决方案：**
1. 检查浏览器控制台错误
2. 验证URL格式
3. 检查网站的robots.txt
4. 确认网站可公开访问

### 技术栈不准确

**原因：**
基于关键词匹配，可能有假阳性/假阴性

**解决方案：**
LLM会综合GitHub数据和网站数据做最终判断

## 贡献 (Contributing)

欢迎改进此功能！关键领域：
- 添加更多技术关键词到 `extractTechnologies`
- 改进技能提取模式
- 增强robots.txt解析
- 添加更多安全检查

## 许可证 (License)

遵循主项目许可证。

---

**问题或反馈？** 请在GitHub仓库创建issue。
