-- ============================================
-- Supabase 表级权限配置
-- ============================================
-- 这些配置限制不同角色对表的访问权限

-- 1. 撤销 public 角色的所有默认权限
REVOKE ALL ON subscriptions FROM PUBLIC;
REVOKE ALL ON detection_records FROM PUBLIC;
REVOKE ALL ON rewrite_records FROM PUBLIC;
REVOKE ALL ON users FROM PUBLIC;

-- 2. 撤销 authenticated 角色的所有默认权限
REVOKE ALL ON subscriptions FROM authenticated;
REVOKE ALL ON detection_records FROM authenticated;
REVOKE ALL ON rewrite_records FROM authenticated;
REVOKE ALL ON users FROM authenticated;

-- 3. 只授予 authenticated 角色 SELECT 权限
-- Subscriptions 表：只读
GRANT SELECT ON subscriptions TO authenticated;

-- Detection Records 表：只读
GRANT SELECT ON detection_records TO authenticated;

-- Rewrite Records 表：只读
GRANT SELECT ON rewrite_records TO authenticated;

-- Users 表：读和部分更新
GRANT SELECT, UPDATE ON users TO authenticated;

-- 4. Service Role 保留所有权限（用于后端 API）
-- Service Role 默认拥有所有权限，不需要额外授予

-- ============================================
-- 说明：
-- ============================================
-- PUBLIC: 未登录用户（匿名）
-- authenticated: 已登录用户（使用 anon key）
-- service_role: 后端 API（使用 service_role key）
--
-- 组合 RLS + 表级权限实现：
-- 1. 表级权限：限制操作类型（SELECT/INSERT/UPDATE/DELETE）
-- 2. RLS 策略：限制可以访问哪些行数据
--
-- 例如：
-- - authenticated 只有 SELECT 权限 → 无法 INSERT
-- - RLS 策略限制只能查看 user_id = auth.uid() 的行
-- - 结果：用户只能查看自己的数据，且无法插入新数据
-- ============================================
