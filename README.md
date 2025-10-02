# AI Content Detector - MVP

AIGC 内容检测与人性化改写工具

## 🚀 项目状态

**Week 1-4 已完成：**
- ✅ Next.js 项目初始化
- ✅ Supabase 集成（Auth + Database）
- ✅ Google OAuth 登录
- ✅ Dummy API (/api/detect, /api/rewrite)
- ✅ 检测页面 UI
- ✅ 检测结果展示（句子高亮、评分）

## 📋 前置要求

- Node.js 18+
- npm
- Supabase 账号

## 📚 文档索引

- [数据库配置](database/README.md) - 所有数据库相关的 SQL 和文档
- [安全架构](database/docs/SECURITY.md) - 完整的安全防护说明
- [技术方案](docs/tech-plan.md) - 项目技术规划
- [产品需求](docs/prd.md) - 产品需求文档

## 🛠️ 安装步骤

### 1. 安装依赖
```bash
npm install
```

### 2. 配置 Supabase

参考 [database/README.md](database/README.md) 完整配置指南

#### 2.1 创建 Supabase 项目
1. 访问 [Supabase](https://supabase.com/)
2. 创建新项目
3. 记录项目信息

#### 2.2 运行数据库脚本
1. 打开 Supabase Dashboard → SQL Editor
2. 复制 `docs/supabase-setup.sql` 内容
3. 执行脚本

#### 2.3 配置 Google OAuth
按照 `docs/supabase-setup.md` 中的说明配置 Google OAuth

### 3. 配置环境变量

更新 `.env.local` 并填入实际值：
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. 运行开发服务器
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 📁 项目结构

```
aidetect/
├── app/
│   ├── page.tsx              # 首页
│   ├── login/page.tsx        # 登录页面
│   ├── detect/page.tsx       # 检测页面
│   ├── auth/callback/        # OAuth 回调
│   └── api/
│       ├── detect/route.ts   # 检测 API (dummy)
│       └── rewrite/route.ts  # 改写 API (dummy)
├── lib/
│   └── supabase/
│       ├── client.ts         # 客户端 Supabase 实例
│       ├── server.ts         # 服务端 Supabase 实例
│       └── middleware.ts     # 会话刷新中间件
├── docs/
│   ├── prd.md                # 产品需求文档
│   ├── tech-plan.md          # 技术方案
│   ├── supabase-setup.sql    # 数据库初始化脚本
│   └── supabase-setup.md     # Supabase 配置指南
└── middleware.ts             # Next.js 中间件
```

## 🔑 主要功能

### 已实现

1. **用户认证**
   - Google OAuth 登录
   - 邮箱密码登录/注册
   - 游客模式（1 次免费检测）

2. **AI 检测（Dummy）**
   - 文本输入（最多 50,000 字符）
   - 整体 AI 概率评分
   - 句子级别高亮标注
   - 检测结果保存到数据库

3. **改写服务（Dummy）**
   - 一键改写
   - 改写后自动检测
   - 结果保存到数据库

### 待实现

- [ ] RevenueCat 订阅集成
- [ ] 真实 AI 检测 API 集成
- [ ] 真实 AI 改写 API 集成
- [ ] 用户配额限制
- [ ] 历史记录页面
- [ ] 用户中心
- [ ] GA4 事件追踪

## 🔗 API 接口

### POST /api/detect
检测文本中的 AI 生成内容

**请求：**
```json
{
  "text": "要检测的文本"
}
```

**响应：**
```json
{
  "score": 75.5,
  "result": {
    "overallScore": 75.5,
    "sentences": [
      { "text": "句子1", "score": 85 },
      { "text": "句子2", "score": 66 }
    ]
  },
  "message": "Detection completed (dummy data)"
}
```

### POST /api/rewrite
改写文本使其更具人性化（需登录）

**请求：**
```json
{
  "text": "要改写的文本",
  "detectionId": "检测记录ID（可选）"
}
```

**响应：**
```json
{
  "originalText": "原文",
  "rewrittenText": "改写后文本",
  "originalScore": 75,
  "newScore": 32.5,
  "recordId": "uuid",
  "message": "Rewrite completed (dummy data)"
}
```

## 🗄️ 数据库表

- `user_profiles` - 用户信息
- `detection_records` - 检测记录
- `rewrite_records` - 改写记录
- `subscriptions` - 订阅状态

## 🚧 下一步开发计划

### Week 5-6：改写功能
- [ ] 改写页面 UI
- [ ] 对比视图
- [ ] 改写模式选择

### Week 7-8：订阅系统
- [ ] RevenueCat + Stripe 集成
- [ ] 订阅页面
- [ ] 权限控制

### Week 9-10：用户中心 & 优化
- [ ] 历史记录
- [ ] 用户中心
- [ ] 响应式优化

### Week 11-12：获客 & 上线
- [ ] SEO 优化
- [ ] Google Ads
- [ ] GA4 追踪
- [ ] 部署到 Vercel

## 📝 注意事项

### Dummy API
当前 `/api/detect` 和 `/api/rewrite` 使用模拟数据：
- 检测评分为随机生成（50-95）
- 改写只是简单的文本转换

**集成真实 API 时需要：**
1. 替换 `/api/detect` 中的检测逻辑
2. 替换 `/api/rewrite` 中的改写逻辑
3. 处理 API 错误和超时
4. 添加 API 费用监控

### Supabase 配置
- 确保已配置 Google OAuth
- 确保 RLS 策略已启用
- 定期备份数据库

## 📚 文档

- [产品需求文档](./docs/prd.md)
- [技术方案](./docs/tech-plan.md)
- [Supabase 配置指南](./docs/supabase-setup.md)

## 🤝 贡献

遇到问题或需要新功能，请联系项目负责人。

## 📄 License

Private Project
