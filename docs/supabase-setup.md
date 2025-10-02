# Supabase 配置指南

## 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com/)
2. 创建新项目
3. 记录以下信息：
   - Project URL: `https://xxx.supabase.co`
   - Anon Public Key
   - Service Role Key (保密)

## 2. 配置环境变量

更新 `.env.local` 文件：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 3. 运行数据库脚本

1. 进入 Supabase Dashboard
2. 点击左侧 **SQL Editor**
3. 点击 **New Query**
4. 复制 `supabase-setup.sql` 的内容
5. 点击 **Run** 执行

## 4. 配置 Google OAuth

### 4.1 创建 Google OAuth 应用

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 **Google+ API**
4. 前往 **APIs & Services > Credentials**
5. 创建 **OAuth 2.0 Client ID**
   - Application type: Web application
   - Authorized redirect URIs:
     ```
     https://your-project.supabase.co/auth/v1/callback
     ```
6. 记录 **Client ID** 和 **Client Secret**

### 4.2 在 Supabase 中配置

1. 进入 Supabase Dashboard
2. 点击 **Authentication > Providers**
3. 启用 **Google**
4. 输入：
   - Client ID
   - Client Secret
5. 保存

## 5. 测试配置

运行以下命令测试：

```bash
npm run dev
```

访问 `http://localhost:3000/login` 测试 Google 登录功能。

## 6. 验证数据库

在 Supabase Dashboard 中：
1. 点击 **Table Editor**
2. 确认以下表已创建：
   - `user_profiles`
   - `detection_records`
   - `rewrite_records`
   - `subscriptions`

## 7. 测试 RLS 策略

在 SQL Editor 中运行：

```sql
-- 切换到普通用户视角
SET LOCAL ROLE authenticated;

-- 测试查询（应该只能看到自己的记录）
SELECT * FROM detection_records;
```
