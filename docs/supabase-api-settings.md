# Supabase API 访问控制配置

## 1. Dashboard 设置路径

访问: **Supabase Dashboard** → **Settings** → **API**

## 2. 可配置的安全选项

### A. API Keys 管理
```
Settings → API → API Keys
```

- **anon (public)**: 前端使用，受 RLS 限制
- **service_role**: 后端使用，绕过 RLS
- 🔒 可以**重新生成密钥**（需要更新 .env）

### B. 启用/禁用表访问

```
Settings → API → Table Permissions
```

可以完全禁用某些表的 API 访问：
- ✅ 启用：允许通过 API 访问
- ❌ 禁用：完全阻止 API 访问

### C. PostgREST 配置

```
Settings → API → PostgREST
```

- **Max Rows**: 限制单次查询返回的最大行数（防止大量数据泄露）
- **DB Schema**: 指定可访问的数据库 schema
- **Extra Search Path**: 添加额外的搜索路径

## 3. 推荐配置

### 敏感表配置

对于 `subscriptions` 表：

```sql
-- 在 Supabase Dashboard SQL Editor 中执行

-- 1. 启用 RLS（已完成）
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 2. 撤销 public 和 authenticated 的写权限
REVOKE INSERT, UPDATE, DELETE ON subscriptions FROM PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON subscriptions FROM authenticated;

-- 3. 只保留读权限
GRANT SELECT ON subscriptions TO authenticated;
```

### API 密钥最佳实践

1. **anon key**（前端）:
   - 只用于前端代码
   - 受 RLS 保护
   - 可以公开（在客户端代码中）

2. **service_role key**（后端）:
   - ⚠️ **绝对不能暴露到前端**
   - 只在服务器端使用（API Routes）
   - 存储在环境变量 `.env.local`
   - 拥有完全数据库访问权限

## 4. 多层防护架构

```
┌─────────────────────────────────────┐
│  Layer 1: API Key Type              │
│  - anon: 前端使用                    │
│  - service_role: 后端使用            │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  Layer 2: Table Permissions         │
│  - GRANT SELECT/INSERT/UPDATE       │
│  - REVOKE 不需要的权限               │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  Layer 3: Row Level Security (RLS)  │
│  - 策略限制可访问的行                │
│  - auth.uid() = user_id             │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  Layer 4: Application Logic         │
│  - API 业务验证                      │
│  - 防止重复订阅等                    │
└─────────────────────────────────────┘
```

## 5. 检查当前权限

在 Supabase SQL Editor 执行：

```sql
-- 查看 subscriptions 表的权限
SELECT
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'subscriptions';

-- 查看 RLS 是否启用
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('subscriptions', 'detection_records', 'rewrite_records');
```

## 6. 限制 API 的额外措施

### 在 Dashboard 中设置：

1. **Rate Limiting** (Settings → API):
   - 限制每个 IP 的请求频率
   - 防止 API 滥用

2. **IP Allowlist** (付费功能):
   - 只允许特定 IP 访问数据库
   - 适合生产环境

3. **Network Restrictions**:
   - 只允许从 Vercel 的 IP 范围访问
   - 提升后端 API 安全性

## 7. 当前项目配置建议

执行这两个 SQL 文件：

1. `20250102_add_rls_policies.sql` - RLS 策略
2. `20250102_table_permissions.sql` - 表级权限

然后验证：
```sql
-- 验证权限配置
SELECT * FROM information_schema.role_table_grants
WHERE table_name IN ('subscriptions', 'detection_records');
```

这样就实现了**完整的 4 层安全防护**！
