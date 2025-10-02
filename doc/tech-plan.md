# 技术方案文档
## AIGC 检测与改写工具 - MVP

### 1. 技术架构

```
┌─────────────┐
│   用户端    │
│  (Web App)  │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────────┐
│          前端 (Next.js)              │
│  - 检测页面                          │
│  - 改写页面                          │
│  - 用户中心                          │
│  - Supabase Auth SDK                │
│  - RevenueCat SDK                   │
└──────┬──────────────────────┬───────┘
       │                      │
       ↓                      ↓
┌─────────────┐      ┌────────────────┐
│  Supabase   │      │  RevenueCat    │
│  - Auth     │      │  - 订阅管理     │
│  - Database │      │  - Stripe 集成 │
│  - Storage  │      └────────────────┘
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────────┐
│       后端 API (Node.js)             │
│  - 检测接口包装                       │
│  - 改写接口包装                       │
│  - 权限验证                          │
│  - 历史记录                          │
└──────┬──────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│         外部 AI 服务                 │
│  - /aigc_check (检测 API)           │
│  - /ai_humanize (改写 API)          │
└─────────────────────────────────────┘
```

---

### 2. 技术栈

#### 2.1 前端
- **框架**：Next.js 14 (App Router)
- **UI**：Tailwind CSS + shadcn/ui
- **状态管理**：React Context / Zustand
- **HTTP 客户端**：Fetch API / Axios

#### 2.2 后端
- **运行环境**：Node.js 18+
- **框架**：Next.js API Routes（或 Supabase Edge Functions）
- **数据库**：Supabase PostgreSQL
- **认证**：Supabase Auth
- **订阅管理**：RevenueCat

#### 2.3 第三方服务
- **认证 & 数据库**：Supabase
- **订阅管理**：RevenueCat
- **支付**：Stripe（通过 RevenueCat）
- **分析**：Google Analytics 4
- **托管**：Vercel

---

### 3. 数据库设计

#### 3.1 表结构（Supabase PostgreSQL）

```sql
-- 用户扩展信息
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 检测记录
CREATE TABLE detection_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  score NUMERIC(5,2), -- 0-100
  result JSONB, -- 详细结果（句子级别）
  created_at TIMESTAMP DEFAULT NOW()
);

-- 改写记录
CREATE TABLE rewrite_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  original_text TEXT NOT NULL,
  rewritten_text TEXT NOT NULL,
  detection_id UUID REFERENCES detection_records(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 订阅状态（同步自 RevenueCat）
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id),
  revenue_cat_user_id TEXT NOT NULL,
  subscription_status TEXT, -- active, trial, expired, cancelled
  plan_type TEXT, -- monthly, yearly
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 3.2 Row Level Security (RLS)

```sql
-- 用户只能访问自己的记录
ALTER TABLE detection_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewrite_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own records"
  ON detection_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records"
  ON detection_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

### 4. API 设计

#### 4.1 检测接口

**POST /api/detect**

请求：
```json
{
  "text": "要检测的文本内容"
}
```

响应：
```json
{
  "score": 85.5,
  "result": {
    "sentences": [
      { "text": "句子1", "score": 90 },
      { "text": "句子2", "score": 75 }
    ]
  },
  "recordId": "uuid"
}
```

后端逻辑：
1. 验证 Supabase JWT Token
2. 检查用户配额（免费用户每日 5 次）
3. 调用 `/aigc_check` 接口
4. 保存检测记录到数据库
5. 返回结果

---

#### 4.2 改写接口

**POST /api/rewrite**

请求：
```json
{
  "text": "要改写的文本",
  "detectionId": "检测记录ID（可选）"
}
```

响应：
```json
{
  "originalText": "原文",
  "rewrittenText": "改写后文本",
  "recordId": "uuid"
}
```

后端逻辑：
1. 验证 Supabase JWT Token
2. **检查订阅状态**（调用 RevenueCat API 或查询本地数据库）
3. 如果未订阅，返回 403 错误
4. 调用 `/ai_humanize` 接口
5. 自动调用 `/aigc_check` 进行二次检测
6. 保存改写记录到数据库
7. 返回结果

---

#### 4.3 历史记录接口

**GET /api/history**

响应：
```json
{
  "detections": [
    {
      "id": "uuid",
      "score": 85.5,
      "createdAt": "2025-10-02T10:00:00Z"
    }
  ]
}
```

---

#### 4.4 订阅状态接口

**GET /api/subscription**

响应：
```json
{
  "status": "active", // trial, expired, cancelled
  "planType": "monthly",
  "expiresAt": "2025-11-02T10:00:00Z"
}
```

---

### 5. 认证流程（Supabase）

#### 5.1 Google OAuth 登录

```javascript
// 前端代码
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// 登录
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://yourdomain.com/auth/callback'
  }
})

// 获取当前用户
const { data: { user } } = await supabase.auth.getUser()

// 登出
await supabase.auth.signOut()
```

#### 5.2 后端验证 Token

```javascript
// API Route
import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY // 服务端密钥
  )

  // 从请求头获取 JWT
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')

  // 验证 Token
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 继续处理请求
  // ...
}
```

---

### 6. 订阅管理（RevenueCat）

#### 6.1 前端集成

```javascript
import Purchases from '@revenuecat/purchases-js'

// 初始化
Purchases.configure(REVENUECAT_PUBLIC_KEY, userId)

// 获取产品列表
const offerings = await Purchases.getOfferings()
const monthlyProduct = offerings.current.monthly
const yearlyProduct = offerings.current.annual

// 购买订阅（跳转到 Stripe Checkout）
await Purchases.purchasePackage(monthlyProduct)

// 获取订阅状态
const customerInfo = await Purchases.getCustomerInfo()
const isSubscribed = customerInfo.entitlements.active['pro'] !== undefined
```

#### 6.2 后端验证订阅

```javascript
// 方式 1：查询本地数据库（推荐，速度快）
const { data } = await supabase
  .from('subscriptions')
  .select('*')
  .eq('user_id', userId)
  .single()

const isActive = data?.subscription_status === 'active' ||
                 data?.subscription_status === 'trial'

// 方式 2：调用 RevenueCat API（实时，但较慢）
const response = await fetch(
  `https://api.revenuecat.com/v1/subscribers/${userId}`,
  {
    headers: {
      'Authorization': `Bearer ${REVENUECAT_SECRET_KEY}`
    }
  }
)
const customerInfo = await response.json()
const isActive = customerInfo.subscriber.entitlements['pro']?.expires_date > Date.now()
```

#### 6.3 Webhook 同步（RevenueCat → Supabase）

```javascript
// /api/webhooks/revenuecat
export async function POST(request) {
  const body = await request.json()

  // 验证 Webhook 签名（重要！）
  // ...

  const { event, app_user_id, subscriber } = body

  // 同步订阅状态到数据库
  await supabase
    .from('subscriptions')
    .upsert({
      user_id: app_user_id,
      revenue_cat_user_id: subscriber.subscriber_id,
      subscription_status: subscriber.entitlements['pro'] ? 'active' : 'expired',
      plan_type: subscriber.subscriptions?.monthly ? 'monthly' : 'yearly',
      expires_at: subscriber.subscriptions?.expires_date,
      updated_at: new Date()
    })

  return Response.json({ received: true })
}
```

---

### 7. 分析追踪（GA4）

#### 7.1 关键事件

```javascript
import { gtag } from '@/lib/gtag'

// 用户注册
gtag('event', 'sign_up', {
  method: 'google'
})

// 首次检测
gtag('event', 'first_detection', {
  content_length: text.length
})

// 订阅转化
gtag('event', 'purchase', {
  transaction_id: 'xxx',
  value: 15.00,
  currency: 'USD',
  items: [{
    item_id: 'monthly_sub',
    item_name: 'Monthly Subscription'
  }]
})

// 广告归因
gtag('event', 'conversion', {
  send_to: 'AW-CONVERSION_ID',
  transaction_id: 'xxx'
})
```

---

### 8. 部署方案

#### 8.1 Vercel 部署
- **项目类型**：Next.js
- **环境变量**：
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `REVENUECAT_PUBLIC_KEY`
  - `REVENUECAT_SECRET_KEY`
  - `AIGC_CHECK_API_URL`
  - `AI_HUMANIZE_API_URL`
  - `GA4_MEASUREMENT_ID`

#### 8.2 域名配置
- 自定义域名绑定
- HTTPS 自动配置（Let's Encrypt）

---

### 9. 安全考虑

- **敏感信息**：所有 API 密钥使用环境变量
- **RLS 策略**：确保用户只能访问自己的数据
- **Rate Limiting**：使用 Vercel Edge Middleware 限流
- **Webhook 验证**：验证 RevenueCat Webhook 签名
- **XSS 防护**：Next.js 自动转义输出

---

### 10. 性能优化

- **缓存策略**：
  - 订阅状态缓存 5 分钟（Redis 或内存）
  - 静态资源 CDN 加速（Vercel Edge Network）
- **代码分割**：Next.js 自动代码分割
- **图片优化**：Next.js Image 组件

---

### 11. 开发计划

**Week 1-2：基础搭建**
- Next.js 项目初始化
- Supabase 数据库设计 + RLS 策略
- 登录页面（Google OAuth）

**Week 3-4：检测功能**
- 检测页面 UI
- `/api/detect` 接口开发
- 结果展示（高亮、评分）

**Week 5-6：改写功能**
- 改写页面 UI
- `/api/rewrite` 接口开发
- 对比视图

**Week 7-8：订阅系统**
- RevenueCat + Stripe 集成
- 订阅页面
- 权限控制

**Week 9-10：用户中心 & 优化**
- 历史记录
- 用户中心
- 响应式优化

**Week 11-12：获客 & 上线**
- SEO 优化
- Google Ads 设置
- GA4 事件埋点
- 测试 & 上线

---

**文档版本**：v1.0
**更新日期**：2025-10-02
