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

    // TODO: 检查订阅状态
    // const { data: subscription } = await supabase
    //   .from('subscriptions')
    //   .select('*')
    //   .eq('user_id', user.id)
    //   .single()
    // if (!subscription || subscription.subscription_status !== 'active') {
    //   return NextResponse.json({ error: 'Subscription required' }, { status: 403 })
    // }

    // === DUMMY AI 改写 API ===
    // 模拟改写逻辑：简单的文本转换
    const rewrittenText = text
      .split(' ')
      .map((word) => {
        // 随机替换一些词汇
        if (Math.random() > 0.7 && word.length > 4) {
          return word
            .split('')
            .map((c, i) => (i === 0 ? c.toUpperCase() : c.toLowerCase()))
            .join('')
        }
        return word
      })
      .join(' ')
      .replace(/\bAI\b/g, 'artificial intelligence')
      .replace(/\bML\b/g, 'machine learning')

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
