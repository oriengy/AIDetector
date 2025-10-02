import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    if (text.length > 50000) {
      return NextResponse.json({ error: 'Text too long (max 50,000 characters)' }, { status: 400 })
    }

    // 验证用户（可选：游客模式）
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // TODO: 检查用户配额（免费用户每日 5 次）

    // === DUMMY AI 检测 API ===
    // 模拟检测逻辑：根据文本特征生成假数据
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)
    const sentenceResults = sentences.map((sentence, index) => {
      // 模拟 AI 检测评分（随机 50-95）
      const score = Math.floor(Math.random() * 45) + 50
      return {
        text: sentence.trim(),
        score,
        start: text.indexOf(sentence),
        end: text.indexOf(sentence) + sentence.length,
      }
    })

    // 计算整体评分（句子评分的平均值）
    const overallScore = sentenceResults.reduce((sum, s) => sum + s.score, 0) / sentenceResults.length

    const result = {
      sentences: sentenceResults,
      overallScore: Math.round(overallScore * 100) / 100,
    }

    // 保存检测记录到数据库
    if (user) {
      await supabase.from('detection_records').insert({
        user_id: user.id,
        content: text.substring(0, 1000), // 只保存前 1000 字符
        score: result.overallScore,
        result: result,
      })
    }

    return NextResponse.json({
      score: result.overallScore,
      result: result,
      message: 'Detection completed (dummy data)',
    })
  } catch (error: any) {
    console.error('Detection error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
