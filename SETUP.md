# 项目配置指南

## 快速开始（无需 Supabase）

如果您想先运行项目查看效果，无需配置 Supabase：

```bash
npm run dev
```

访问 http://localhost:3000

**⚠️ 注意：** 未配置 Supabase 时，登录功能将无法使用，但可以：
- 查看首页
- 访问检测页面（使用 Dummy API）
- 测试 UI 和交互

---

## 完整配置（含 Supabase）

### 第 1 步：创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com/) 并登录
2. 点击 "New Project"
3. 填写项目信息：
   - **Name**: aidetect（或自定义）
   - **Database Password**: 设置一个强密码（记住它！）
   - **Region**: 选择离您最近的区域
4. 点击 "Create new project"
5. 等待项目创建完成（约 2 分钟）

### 第 2 步：获取 API 密钥

1. 进入项目后，点击左侧 **Settings** (齿轮图标)
2. 点击 **API**
3. 复制以下信息：
   - **Project URL** (格式: https://xxx.supabase.co)
   - **anon public** key
   - **service_role** key (点击 "Reveal" 显示)

### 第 3 步：配置环境变量

编辑 `.env.local` 文件，替换为实际值：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 第 4 步：初始化数据库

1. 在 Supabase Dashboard 中，点击左侧 **SQL Editor**
2. 点击右上角 **New Query**
3. 复制 `docs/supabase-setup.sql` 的全部内容
4. 粘贴到编辑器中
5. 点击 **Run** 执行

**验证：** 点击左侧 **Table Editor**，应该看到以下表：
- `user_profiles`
- `detection_records`
- `rewrite_records`
- `subscriptions`

### 第 5 步：配置 Google OAuth

#### 5.1 创建 Google OAuth 应用

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 **Google+ API**：
   - 左侧菜单 → **APIs & Services** → **Library**
   - 搜索 "Google+ API" → 点击 → **Enable**

4. 创建 OAuth 凭据：
   - 左侧菜单 → **APIs & Services** → **Credentials**
   - 点击 **+ CREATE CREDENTIALS** → **OAuth client ID**
   - Application type: **Web application**
   - Name: `AI Content Detector`
   - **Authorized redirect URIs**，点击 **+ ADD URI**：
     ```
     https://your-project.supabase.co/auth/v1/callback
     ```
     （将 `your-project` 替换为实际的 Supabase 项目 ID）
   - 点击 **Create**

5. 复制生成的：
   - **Client ID**
   - **Client Secret**

#### 5.2 在 Supabase 中配置 Google OAuth

1. 回到 Supabase Dashboard
2. 点击左侧 **Authentication** → **Providers**
3. 找到 **Google**，点击展开
4. 启用 **Enable Sign in with Google**
5. 填写：
   - **Client ID (for OAuth)**: 粘贴 Google Client ID
   - **Client Secret (for OAuth)**: 粘贴 Google Client Secret
6. 点击 **Save**

### 第 6 步：重启开发服务器

```bash
# 停止当前服务器 (Ctrl + C)
npm run dev
```

### 第 7 步：测试登录

1. 访问 http://localhost:3000/login
2. 点击 **Continue with Google**
3. 选择 Google 账号登录
4. 登录成功后会跳转到 `/detect` 页面

---

## 验证配置

### ✅ 检查环境变量
```bash
# 确保 .env.local 中的值已正确填写
cat .env.local
```

### ✅ 检查数据库表
在 Supabase Dashboard → **Table Editor** 中确认表已创建

### ✅ 测试 Google 登录
访问 http://localhost:3000/login 并尝试登录

---

## 常见问题

### Q1: "Invalid supabaseUrl" 错误
**原因：** 环境变量未配置或格式错误

**解决：**
1. 确保 `.env.local` 文件存在于项目根目录
2. 确保 `NEXT_PUBLIC_SUPABASE_URL` 以 `https://` 开头
3. 重启开发服务器

### Q2: Google 登录失败 "redirect_uri_mismatch"
**原因：** Google OAuth 回调 URL 配置错误

**解决：**
1. 检查 Google Cloud Console 中的 Authorized redirect URIs
2. 确保格式为：`https://your-project.supabase.co/auth/v1/callback`
3. 确保没有多余的空格或斜杠

### Q3: 邮箱登录失败 "Email link is invalid or has expired"
**原因：** Supabase 邮箱确认配置问题

**解决：**
1. 在 Supabase Dashboard → **Authentication** → **Email Templates**
2. 检查 Confirm signup 模板中的 {{ .ConfirmationURL }}
3. 或者暂时禁用邮箱确认：**Authentication** → **Settings** → 关闭 "Enable email confirmations"

### Q4: 数据库查询失败 "permission denied"
**原因：** RLS (Row Level Security) 策略问题

**解决：**
1. 重新运行 `docs/supabase-setup.sql`
2. 或在 Supabase Dashboard → **Authentication** → **Policies** 检查策略

---

## 下一步

配置完成后，您可以：
- ✅ 测试登录/注册功能
- ✅ 使用 Dummy API 检测文本
- ✅ 查看检测历史记录（需配置历史记录页面）
- ✅ 开始集成真实的 AI 检测 API

---

## 需要帮助？

如有问题，请检查：
1. [Supabase 官方文档](https://supabase.com/docs)
2. [Next.js 文档](https://nextjs.org/docs)
3. 项目 README.md

或联系项目负责人。
