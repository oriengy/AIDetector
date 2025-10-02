'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface SentenceResult {
  text: string
  score: number
  start?: number
  end?: number
}

interface DetectionResult {
  score: number
  result: {
    overallScore: number
    sentences: SentenceResult[]
  }
  message?: string
}

export default function DetectPage() {
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isRewriting, setIsRewriting] = useState(false)
  const [rewrittenText, setRewrittenText] = useState('')
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [hasPurchased, setHasPurchased] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // 检查用户登录状态
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user)

      // 如果用户已登录，检查订阅状态
      if (user) {
        await checkSubscription(user.id)
      }
    })

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)

      // 如果用户已登录，检查订阅状态
      if (session?.user) {
        await checkSubscription(session.user.id)
      } else {
        setHasPurchased(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // 检查用户订阅状态
  const checkSubscription = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('subscription_status', 'active')
        .gte('end_date', new Date().toISOString())
        .single()

      if (data && !error) {
        setHasPurchased(true)
      } else {
        setHasPurchased(false)
      }
    } catch (error) {
      console.error('Failed to check subscription:', error)
      setHasPurchased(false)
    }
  }

  // 从 localStorage 恢复文本内容和检测结果
  useEffect(() => {
    const savedText = localStorage.getItem('detectText')
    const savedResult = localStorage.getItem('detectResult')

    if (savedText) {
      setText(savedText)
      localStorage.removeItem('detectText')
    }

    if (savedResult) {
      try {
        setResult(JSON.parse(savedResult))
        localStorage.removeItem('detectResult')
      } catch (e) {
        console.error('Failed to parse saved result:', e)
      }
    }
  }, [])

  // 保存文本到 localStorage（用于登录后恢复）
  useEffect(() => {
    if (text && !user) {
      localStorage.setItem('detectText', text)
    }
  }, [text, user])

  const handleDetect = async () => {
    if (!text.trim()) {
      alert('Please enter some text to detect')
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Detection failed')
      }

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleHumanizerClick = () => {
    // 1. 如果未登录，跳转到登录页
    if (!user) {
      localStorage.setItem('detectText', text)
      localStorage.setItem('detectResult', JSON.stringify(result))
      router.push('/login')
      return
    }

    // 2. 如果已登录但未购买，显示购买弹窗
    if (!hasPurchased) {
      setShowPurchaseModal(true)
      return
    }

    // 3. 如果已购买，执行改写
    handleRewrite()
  }

  const handlePurchase = async () => {
    if (!user) {
      alert('Please login first')
      return
    }

    try {
      // 创建订阅记录（有效期一个月）
      const startDate = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 1) // 一个月后过期

      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          subscription_type: 'free_trial',
          subscription_status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // 订阅创建成功
      setHasPurchased(true)
      setShowPurchaseModal(false)
      alert('Purchase successful! You can now use the AI Humanizer for one month.')

      // 购买成功后自动执行改写
      handleRewrite()
    } catch (error: any) {
      console.error('Purchase failed:', error)
      alert(`Purchase failed: ${error.message}`)
    }
  }

  const handleRewrite = async () => {
    if (!text.trim()) {
      alert('Please enter some text to rewrite')
      return
    }

    setIsRewriting(true)
    setRewrittenText('')

    try {
      const response = await fetch('/api/rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Rewrite failed')
      }

      const data = await response.json()
      setRewrittenText(data.rewrittenText)
      alert(`Rewrite completed!\nOriginal: ${data.originalScore}% AI\nRewritten: ${data.newScore}% AI`)
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setIsRewriting(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'High Risk'
    if (score >= 50) return 'Medium Risk'
    return 'Low Risk'
  }

  const charCount = text.length
  const maxChars = 50000

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">AI Content Detector</h1>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  Logout
                </button>
              </>
            ) : (
              <a href="/login" className="text-sm text-blue-600 hover:text-blue-700 underline">
                Login
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Input */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Enter Text to Detect</h2>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your text here..."
              className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={maxChars}
            />

            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-600">
                {charCount.toLocaleString()} / {maxChars.toLocaleString()} characters
              </span>

              <button
                onClick={handleDetect}
                disabled={isLoading || !text.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Detecting...' : 'Detect AI Content'}
              </button>
            </div>
          </div>

          {/* Right: Results */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Detection Results</h2>

            {!result && !isLoading && (
              <div className="h-96 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="mt-2">Enter text and click detect to see results</p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Analyzing your text...</p>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                {/* Overall Score */}
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-600 mb-2">Overall AI Probability</p>
                  <p className={`text-5xl font-bold ${getScoreColor(result.result.overallScore)}`}>
                    {result.result.overallScore.toFixed(1)}%
                  </p>
                  <p className={`text-sm mt-2 font-medium ${getScoreColor(result.result.overallScore)}`}>
                    {getScoreLabel(result.result.overallScore)}
                  </p>
                  {result.message && (
                    <p className="text-xs text-gray-500 mt-2 italic">{result.message}</p>
                  )}
                </div>

                {/* Sentence Breakdown */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Sentence Analysis</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {result.result.sentences.map((sentence, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs text-gray-500">Sentence {index + 1}</span>
                          <span className={`text-sm font-bold ${getScoreColor(sentence.score)}`}>
                            {sentence.score}%
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{sentence.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rewrite CTA */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900 mb-2">
                    Want to humanize this text and reduce AI detection?
                  </p>
                  <button
                    onClick={handleHumanizerClick}
                    disabled={isRewriting}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRewriting ? 'Rewriting...' : 'Try AI Humanizer (Premium)'}
                  </button>
                </div>

                {/* Rewritten Text Display */}
                {rewrittenText && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-green-900 mb-2">Rewritten Text:</h4>
                    <div className="bg-white rounded p-3 text-sm text-gray-700 whitespace-pre-wrap max-h-60 overflow-y-auto">
                      {rewrittenText}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(rewrittenText)
                        alert('Copied to clipboard!')
                      }}
                      className="mt-2 text-sm text-green-700 hover:text-green-800 underline"
                    >
                      Copy to Clipboard
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">AI Humanizer Premium</h3>
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Get access to our AI Humanizer to make your content undetectable:
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Unlimited rewrites
                </li>
                <li className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Reduce AI detection scores
                </li>
                <li className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Natural human-like text
                </li>
              </ul>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-2xl font-bold text-blue-900">FREE Trial</p>
                <p className="text-sm text-blue-700">Limited time offer - $0</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchase}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Get Started Free
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
