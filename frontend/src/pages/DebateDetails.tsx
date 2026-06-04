import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiLong } from '../api/client'

interface DebateMessage {
  persona_id: string
  is_user_message: boolean
  role: string
  message: string
}

interface DebateDetail {
  debate_id: string
  status: string
  topic: string
  fallacy_theme: string
  fallacy_type: string
  fallacy_hidden_flaw: string
  example_refutation?: string
  messages: DebateMessage[]
  objection_message_number?: number
  user_message_count: number
}

export default function DebateDetails() {
  const { debate_id } = useParams<{ debate_id: string }>()
  const navigate = useNavigate()
  const [debate, setDebate] = useState<DebateDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadDebateDetails()
  }, [debate_id])

  async function loadDebateDetails() {
    if (!debate_id) return

    try {
      const response = await apiLong.get(`/debates/${debate_id}/details`)
      const { data } = response
      setDebate(data)
    } catch (err) {
      console.error("Failed to load debate details:", err)
      setError("Failed to load debate details")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1a3e] to-[#0d0f1d] flex items-center justify-center text-white">
        <p className="text-[#AAAAAA]">Loading debate details...</p>
      </div>
    )
  }

  if (error || !debate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1a3e] to-[#0d0f1d] flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-[#E8001A] mb-4">{error || "Debate not found"}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded"
          >
            Back to lobby
          </button>
        </div>
      </div>
    )
  }

  const user_won = debate.status.includes("won")

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1a3e] to-[#0d0f1d] text-white">
      {/* Header */}
      <div className="border-b-2 border-[#E8001A] bg-black bg-opacity-50 px-8 py-6">
        <h1 className="text-4xl font-black text-[#E8001A]">TRIAL RECORD</h1>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Fallacy Section */}
        <div className="mb-12 p-8 bg-black bg-opacity-50 border-2 border-[#333333] rounded-lg">
          <h2 className="text-xl font-black text-[#E8001A] mb-4">THE FALLACY</h2>
          <p className="text-lg font-bold text-white mb-3">"{debate.fallacy_theme}"</p>
          <p className="text-sm text-[#AAAAAA] mb-3">
            <span className="text-[#888888]">Type:</span> {debate.fallacy_type}
          </p>
          <p className="text-sm text-[#CCCCCC]">
            <span className="text-[#888888]">Hidden flaw:</span> {debate.fallacy_hidden_flaw}
          </p>
        </div>

        {/* Result Section */}
        <div
          className={`mb-12 p-8 rounded-lg border-2 ${
            user_won
              ? "bg-green-900 bg-opacity-20 border-green-500"
              : "bg-red-900 bg-opacity-20 border-[#E8001A]"
          }`}
        >
          <h2 className="text-2xl font-black mb-4">
            <span className={user_won ? "text-green-400" : "text-[#E8001A]"}>
              {user_won ? "OBJECTION SUSTAINED ✓" : "OBJECTION FAILED ✗"}
            </span>
          </h2>
          <p className="text-sm text-[#CCCCCC]">
            {user_won ? (
              "You successfully refuted the fallacy and exposed the flaw in their argument!"
            ) : (
              "Your arguments were not sufficient to refute the fallacy."
            )}
          </p>

          {!user_won && debate.example_refutation && (
            <div className="mt-4 p-4 bg-black bg-opacity-40 rounded border-l-4 border-yellow-500">
              <p className="text-xs text-[#888888] mb-2">A possible refutation:</p>
              <p className="text-sm text-white leading-relaxed">
                {debate.example_refutation}
              </p>
            </div>
          )}
        </div>

        {/* Messages Section */}
        <div className="mb-12">
          <h2 className="text-xl font-black text-white mb-6">TRIAL TRANSCRIPT</h2>
          <div className="space-y-4">
            {debate.messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-4 rounded border-l-4 ${
                  msg.is_user_message
                    ? "bg-blue-900 bg-opacity-30 border-blue-400"
                    : "bg-red-900 bg-opacity-30 border-[#E8001A]"
                }`}
              >
                <p className={`font-bold text-sm mb-2 ${
                  msg.is_user_message ? "text-blue-300" : "text-[#E8001A]"
                }`}>
                  {msg.is_user_message ? "YOU" : "OPPONENT"}
                  {debate.objection_message_number === idx + 1 && (
                    <span className="ml-2 text-yellow-400">(OBJECTION HERE)</span>
                  )}
                </p>
                <p className="text-sm leading-relaxed text-[#CCCCCC]">
                  {msg.message}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-12">
          <div className="p-4 bg-black bg-opacity-50 border-2 border-[#333333] rounded">
            <p className="text-xs text-[#888888] mb-1">Total User Arguments</p>
            <p className="text-2xl font-black text-white">{debate.user_message_count}</p>
          </div>
          <div className="p-4 bg-black bg-opacity-50 border-2 border-[#333333] rounded">
            <p className="text-xs text-[#888888] mb-1">Objection at Message</p>
            <p className="text-2xl font-black text-white">
              {debate.objection_message_number || "N/A"}
            </p>
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded transition-colors"
        >
          Back to Lobby
        </button>
      </div>
    </div>
  )
}
