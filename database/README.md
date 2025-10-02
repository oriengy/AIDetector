# 数据库配置目录

所有与数据库相关的 SQL 脚本和文档集中在此目录。

## 📂 目录结构

```
database/
├── README.md                          # 本文档
├── migrations/                        # SQL 迁移脚本
│   ├── README.md                     # 执行指南
│   ├── 20250102_table_permissions.sql   # 表级权限配置
│   └── 20250102_add_rls_policies.sql    # RLS 行级安全策略
└── docs/                             # 相关文档
    ├── SECURITY.md                   # 安全架构说明
    ├── supabase-setup.md            # Supabase 初始设置
    └── supabase-api-settings.md     # API 访问控制配置
```

## 🚀 快速开始

### 1. 执行数据库迁移（按顺序）

在 Supabase Dashboard SQL Editor 中执行：

```bash
# Step 1: 表级权限配置
migrations/20250102_table_permissions.sql

# Step 2: RLS 策略配置
migrations/20250102_add_rls_policies.sql
```

### 2. 验证配置

```sql
-- 检查表权限
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name IN ('subscriptions', 'detection_records', 'rewrite_records');

-- 检查 RLS 是否启用
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('subscriptions', 'detection_records', 'rewrite_records');
```

## 🔒 安全架构

### 4 层防护体系

| 层级 | 配置文件 | 说明 |
|-----|---------|------|
| **1. API 密钥** | `.env.local` | anon vs service_role |
| **2. 表权限** | `20250102_table_permissions.sql` | GRANT/REVOKE 控制 |
| **3. RLS 策略** | `20250102_add_rls_policies.sql` | 行级数据隔离 |
| **4. 应用逻辑** | `app/api/*` | 业务验证 |

详细说明见：[docs/SECURITY.md](docs/SECURITY.md)

## 📋 主要表和策略

### Subscriptions 表
- ✅ 用户只能**查看**自己的订阅
- ❌ 禁止直接**创建/修改/删除**
- ✅ 通过 `/api/subscription/create` 创建

### Detection Records 表
- ✅ 用户只能**查看**自己的检测记录
- ❌ 禁止直接**创建**
- ✅ 通过 `/api/detect` 创建

### Rewrite Records 表
- ✅ 用户只能**查看**自己的改写记录
- ❌ 禁止直接**创建**
- ✅ 通过 `/api/rewrite` 创建

### Users 表
- ✅ 用户可以**查看**和**更新**自己的信息
- ❌ 统计字段（detection_count, rewrite_count）受保护

## 📚 相关文档

- [migrations/README.md](migrations/README.md) - SQL 迁移执行指南
- [docs/SECURITY.md](docs/SECURITY.md) - 完整安全架构说明
- [docs/supabase-setup.md](docs/supabase-setup.md) - Supabase 初始设置
- [docs/supabase-api-settings.md](docs/supabase-api-settings.md) - API 访问控制详解

## ⚠️ 重要提醒

1. **service_role key** 绝不能暴露到前端
2. 所有写操作必须通过后端 API
3. 定期审计数据库访问日志
4. 在生产环境启用所有安全策略
