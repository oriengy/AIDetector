import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 查询用户的有效订阅
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('subscription_status', 'active')
      .gte('end_date', new Date().toISOString())
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 是 "not found" 错误，这是正常的
      throw error
    }

    return NextResponse.json({
      hasSubscription: !!subscription,
      subscription: subscription || null,
    })
  } catch (error: any) {
    console.error('Check subscription error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check subscription' },
      { status: 500 }
    )
  }
}
