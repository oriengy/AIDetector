-- 为 subscriptions 表启用 RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 策略1: 用户只能查看自己的订阅记录
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 策略2: 禁止用户直接创建订阅（必须通过服务端 API）
-- 只允许 service_role 创建订阅
CREATE POLICY "Only service role can create subscriptions"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (false);  -- 用户无法直接创建

-- 策略3: 禁止用户修改订阅
CREATE POLICY "Users cannot update subscriptions"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (false);

-- 策略4: 禁止用户删除订阅
CREATE POLICY "Users cannot delete subscriptions"
  ON subscriptions
  FOR DELETE
  TO authenticated
  USING (false);

-- 为 detection_records 表启用 RLS
ALTER TABLE detection_records ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的检测记录
CREATE POLICY "Users can view their own detection records"
  ON detection_records
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 禁止用户直接创建检测记录（必须通过 API）
CREATE POLICY "Only service role can create detection records"
  ON detection_records
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- 为 rewrite_records 表启用 RLS
ALTER TABLE rewrite_records ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的改写记录
CREATE POLICY "Users can view their own rewrite records"
  ON rewrite_records
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 禁止用户直接创建改写记录（必须通过 API）
CREATE POLICY "Only service role can create rewrite records"
  ON rewrite_records
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- 为 users 表启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的用户记录
CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 用户可以更新自己的部分字段（如用户名等）
CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (OLD.detection_count IS NOT DISTINCT FROM NEW.detection_count)
    AND (OLD.rewrite_count IS NOT DISTINCT FROM NEW.rewrite_count)
  );  -- 防止用户修改统计字段
