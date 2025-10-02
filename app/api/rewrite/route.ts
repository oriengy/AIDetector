import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { text, detectionId } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    if (text.length > 50000) {
      return NextResponse.json({ error: 'Text too long (max 50,000 characters)' }, { status: 400 })
    }

    // 验证用户登录
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 检查订阅状态
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('subscription_status', 'active')
      .gte('end_date', new Date().toISOString())
      .single()

    if (!subscription) {
      return NextResponse.json({ error: 'Active subscription required' }, { status: 403 })
    }

    // === DUMMY AI 改写 API ===
    // 随机删除 10% 的行，替换 10% 的行
    const lines = text.split('\n')
    const totalLines = lines.length

    // 计算要删除和替换的行数
    const deleteCount = Math.floor(totalLines * 0.1)
    const replaceCount = Math.floor(totalLines * 0.1)

    // 获取随机删除的行索引
    const deleteIndices = new Set<number>()
    while (deleteIndices.size < deleteCount && deleteIndices.size < totalLines) {
      deleteIndices.add(Math.floor(Math.random() * totalLines))
    }

    // 获取随机替换的行索引（排除已删除的行）
    const replaceIndices = new Set<number>()
    while (replaceIndices.size < replaceCount && replaceIndices.size < totalLines) {
      const idx = Math.floor(Math.random() * totalLines)
      if (!deleteIndices.has(idx)) {
        replaceIndices.add(idx)
      }
    }

    // 处理文本行
    const rewrittenLines = lines
      .map((line, idx) => {
        if (deleteIndices.has(idx)) {
          return null // 标记为删除
        }
        if (replaceIndices.has(idx)) {
          // 简单替换：修改行内容
          return modifyLine(line)
        }
        return line
      })
      .filter(line => line !== null) // 移除被删除的行

    const rewrittenText = rewrittenLines.join('\n')

    // 自动进行二次检测
    const sentences = rewrittenText.split(/[.!?]+/).filter((s) => s.trim().length > 0)
    const sentenceResults = sentences.map((sentence) => {
      // 改写后评分应该更低（20-50）
      const score = Math.floor(Math.random() * 30) + 20
      return {
        text: sentence.trim(),
        score,
      }
    })
    const newScore = sentenceResults.reduce((sum, s) => sum + s.score, 0) / sentenceResults.length

    // 保存改写记录到数据库
    const { data: rewriteRecord } = await supabase
      .from('rewrite_records')
      .insert({
        user_id: user.id,
        original_text: text.substring(0, 1000),
        rewritten_text: rewrittenText.substring(0, 1000),
        detection_id: detectionId || null,
      })
      .select()
      .single()

    return NextResponse.json({
      originalText: text,
      rewrittenText: rewrittenText,
      originalScore: 75, // 假设原始评分
      newScore: Math.round(newScore * 100) / 100,
      recordId: rewriteRecord?.id,
      message: 'Rewrite completed (dummy data)',
    })
  } catch (error: any) {
    console.error('Rewrite error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 辅助函数：修改行内容（dummy 替换）
function modifyLine(line: string): string {
  const modifications = [
    // 替换同义词
    (s: string) => s.replace(/good/gi, 'excellent').replace(/bad/gi, 'poor'),
    // 添加/移除标点
    (s: string) => s.endsWith('.') ? s.slice(0, -1) : s + '.',
    // 改变大小写
    (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(),
    // 添加填充词
    (s: string) => 'Additionally, ' + s,
    // 重新排序简单句子
    (s: string) => {
      const parts = s.split(' and ')
      return parts.length === 2 ? `${parts[1]} and ${parts[0]}` : s
    },
  ]

  // 随机选择一种修改方式
  const modifier = modifications[Math.floor(Math.random() * modifications.length)]
  return modifier(line)
}
