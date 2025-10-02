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
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // 检查用户登录状态
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

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
                    onClick={() => router.push('/rewrite')}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Try AI Humanizer (Premium)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
