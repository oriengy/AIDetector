# Supabase RLS 策略设置

## 执行 RLS 策略

### 方法 1: 通过 Supabase Dashboard（推荐）

1. 访问 Supabase Dashboard: https://supabase.com/dashboard
2. 选择项目: `lzqdulfabceoclhfjcdd`
3. 进入 **SQL Editor**
4. 复制 `20250102_add_rls_policies.sql` 文件内容
5. 粘贴并执行

### 方法 2: 通过 Supabase CLI

```bash
# 安装 Supabase CLI（如果还没安装）
npm install -g supabase

# 登录
supabase login

# 链接到项目
supabase link --project-ref lzqdulfabceoclhfjcdd

# 执行迁移
supabase db push
```

## RLS 策略说明

### Subscriptions 表
- ✅ 用户可以**查看**自己的订阅
- ❌ 用户**不能直接创建**订阅（必须通过 `/api/subscription/create`）
- ❌ 用户**不能修改**订阅
- ❌ 用户**不能删除**订阅

### Detection Records 表
- ✅ 用户可以**查看**自己的检测记录
- ❌ 用户**不能直接创建**检测记录（必须通过 `/api/detect`）

### Rewrite Records 表
- ✅ 用户可以**查看**自己的改写记录
- ❌ 用户**不能直接创建**改写记录（必须通过 `/api/rewrite`）

### Users 表
- ✅ 用户可以**查看**自己的信息
- ✅ 用户可以**更新**自己的用户名等字段
- ❌ 用户**不能修改**统计字段（detection_count, rewrite_count）

## 安全优势

1. **数据隔离**: 用户只能访问自己的数据
2. **防止滥用**: 禁止用户直接创建多个免费订阅
3. **业务逻辑保护**: 所有写操作必须通过受控的 API 端点
4. **防止数据篡改**: 用户无法修改敏感字段

## API 端点

### 检查订阅状态
```
GET /api/subscription/check
```

### 创建订阅
```
POST /api/subscription/create
```

这两个 API 使用 `service_role` 权限，可以绕过 RLS 策略进行数据库操作。
