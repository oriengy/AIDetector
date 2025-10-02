# 安全架构说明

## 问题与解决方案

### ❌ 原有安全问题

1. **前端直接访问数据库**
   - 用户可以通过浏览器直接操作 Supabase
   - 可以绕过业务逻辑创建多个免费订阅
   - 可以修改订阅的有效期

2. **缺乏访问控制**
   - 没有 Row Level Security (RLS)
   - 用户可能查看其他用户的数据

### ✅ 新的安全架构

## 1. Row Level Security (RLS) 策略

### Subscriptions 表
```sql
-- 用户只能查看自己的订阅
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- 禁止用户直接创建（必须通过 API）
CREATE POLICY "Only service role can create subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (false);
```

### 其他表同样受保护
- `detection_records`: 只读，通过 `/api/detect` 写入
- `rewrite_records`: 只读，通过 `/api/rewrite` 写入
- `users`: 可更新部分字段，统计字段受保护

## 2. API 端点架构

### 订阅管理
```
POST /api/subscription/create  - 创建订阅（防止重复）
GET  /api/subscription/check   - 检查订阅状态
```

### 核心业务
```
POST /api/detect   - AI 检测
POST /api/rewrite  - AI 改写
```

## 3. 安全保障

### ✅ RLS 解决的问题
1. **数据隔离**: 用户只能访问自己的数据
2. **访问控制**: 严格的读写权限
3. **防止越权**: 无法查看其他用户信息

### ✅ API 层解决的问题
1. **业务逻辑验证**: 防止重复订阅
2. **数据完整性**: 确保字段正确性
3. **审计追踪**: 服务端日志记录

### ⚠️ 仍需注意的问题
1. **订阅过期检查**: 定期清理过期订阅
2. **速率限制**: 防止 API 滥用
3. **输入验证**: 严格验证所有输入

## 4. 部署步骤

### 执行 RLS 策略

**方法 1: Supabase Dashboard**
1. 访问: https://supabase.com/dashboard
2. 进入 SQL Editor
3. 执行 `supabase/migrations/20250102_add_rls_policies.sql`

**方法 2: Supabase CLI**
```bash
supabase db push
```

### 验证安全性

1. **测试 RLS**:
   - 尝试在浏览器控制台直接创建订阅（应该失败）
   - 验证用户只能查看自己的数据

2. **测试 API**:
   - 创建订阅应该成功
   - 重复创建应该返回错误

## 5. 架构图

```
用户请求
    ↓
Vercel (Next.js)
    ↓
API Routes (业务逻辑 + 验证)
    ↓
Supabase Client (service_role)
    ↓
PostgreSQL (RLS 策略)
    ↓
返回数据
```

## 6. 最佳实践

1. **永远不要在前端直接写入敏感数据**
2. **使用 API 端点进行所有写操作**
3. **RLS 作为最后一道防线**
4. **定期审计安全策略**
5. **监控异常访问模式**
