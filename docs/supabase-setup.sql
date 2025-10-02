-- Supabase 数据库初始化脚本
-- 在 Supabase SQL Editor 中执行此脚本

-- 检测记录表（使用 bigint 主键）
CREATE TABLE IF NOT EXISTS detection_records (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  score NUMERIC(5,2), -- 0-100
  result JSONB, -- 详细结果（句子级别）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_detection_user_created ON detection_records(user_id, created_at DESC);

-- 改写记录表（使用 bigint 主键）
CREATE TABLE IF NOT EXISTS rewrite_records (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  rewritten_text TEXT NOT NULL,
  detection_id BIGINT REFERENCES detection_records(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rewrite_user_created ON rewrite_records(user_id, created_at DESC);

-- 订阅状态表（使用 bigint 主键）
CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  revenue_cat_user_id TEXT NOT NULL,
  subscription_status TEXT, -- active, trial, expired, cancelled
  plan_type TEXT, -- monthly, yearly
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
