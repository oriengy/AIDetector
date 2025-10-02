-- Supabase 数据库初始化脚本
-- 在 Supabase SQL Editor 中执行此脚本

-- 用户扩展信息表
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 检测记录表
CREATE TABLE IF NOT EXISTS detection_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  score NUMERIC(5,2), -- 0-100
  result JSONB, -- 详细结果（句子级别）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX idx_user_created (user_id, created_at DESC)
);

-- 改写记录表
CREATE TABLE IF NOT EXISTS rewrite_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  rewritten_text TEXT NOT NULL,
  detection_id UUID REFERENCES detection_records(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX idx_user_created (user_id, created_at DESC)
);

-- 订阅状态表（同步自 RevenueCat）
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  revenue_cat_user_id TEXT NOT NULL,
  subscription_status TEXT, -- active, trial, expired, cancelled
  plan_type TEXT, -- monthly, yearly
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
