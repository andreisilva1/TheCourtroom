import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiLong } from '../api/client'
import PersonaAvatar from '../components/PersonaAvatar'
import type { Persona } from '../types'

interface AceAttorneyMessage {
  speaker: "user" | "persona"
  message: string
  name: string
  typing?: boolean
}

type ArenaState = "active" | "evaluating" | "result"

export default function AceAttorneyArena() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as { persona: Persona; debate_id?: string; theme?: string; loading?: boolean } | null

  const [debate_id, setDebateId] = useState<string | null>(state?.debate_id ?? null)
  const [persona, setPersona] = useState<Persona | null>(state?.persona ?? null)
  const [theme, setTheme] = useState(state?.theme ?? "")

  const [messages, setMessages] = useState<AceAttorneyMessage[]>([])
  const [opening_message, setOpeningMessage] = useState("")
  const [user_input, setUserInput] = useState("")
  const [responding, setResponding] = useState(false)
  const [user_message_count, setUserMessageCount] = useState(0)
  const [arena_state, setArenaState] = useState<ArenaState>("active")
  const [objection_result, setObjectionResult] = useState<{
    won: boolean
    reason: string
    example_refutation: string
  } | null>(null)
  const [glow_state, setGlowState] = useState<"user" | "waiting" | "none">("none")
  const [showing_intro, setShowingIntro] = useState(true)
  const [should_load_debate, setShouldLoadDebate] = useState(state?.loading || false)

  const messages_ref = useRef<HTMLDivElement>(null)

  // Load debate from backend if not yet loaded
  useEffect(() => {
    if (should_load_debate && !state?.theme) {
      const loadDebate = async () => {
        try {
          const response = await apiLong.post('/ace-attorney/start', {
            persona_id: state?.persona?.id,
          })
          const { data } = response

          setOpeningMessage(data.theme)
          setDebateId(data.debate_id)
          setShouldLoadDebate(false)

          // Show intro (VS animation) then display persona's opening fallacy
          setTimeout(() => {
            setShowingIntro(false)
            setMessages([{
              speaker: "persona",
              name: persona?.name || "Opponent",
              message: `I believe: ${data.theme}`,
            }])
            setGlowState("user")
          }, 3000)
        } catch (err: any) {
          console.error("Failed to load debate:", err)

          // Check if error is because LLM is initializing
          if (err.response?.data?.status === "initializing") {
            // Retry after 2 seconds
            setTimeout(() => loadDebate(), 2000)
          } else {
            setShouldLoadDebate(false)
          }
        }
      }

      loadDebate()
    } else if (state?.theme && !should_load_debate) {
      // Theme already loaded from state
      setOpeningMessage(state.theme)
      setTimeout(() => {
        setShowingIntro(false)
        setMessages([{
          speaker: "persona",
          name: persona?.name || "Opponent",
          message: `I believe: ${state.theme}`,
        }])
        setGlowState("user")
      }, 3000)
    }
  }, [should_load_debate, state?.theme, state?.persona?.id, persona?.name])

  // Auto-scroll to bottom
  useEffect(() => {
    if (messages_ref.current) {
      messages_ref.current.scrollTop = messages_ref.current.scrollHeight
    }
  }, [messages, arena_state])

  if (!state || !persona) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3 bg-[#1a1a3e]">
        <p className="text-sm text-[#888888]">No active trial.</p>
        <button
          onClick={() => navigate('/')}
          className="font-mono text-xs text-blue-400 hover:underline"
        >
          go back →
        </button>
      </div>
    )
  }

  async function handleSubmitArgument() {
    if (!user_input.trim() || responding || !debate_id) return

    setResponding(true)
    setGlowState("waiting")
    const current_input = user_input

    try {
      setUserInput("")

      const response = await apiLong.post('/ace-attorney/argue', {
        debate_id,
        user_argument: current_input,
      })

      const { data } = response

      // Add user message
      setMessages(prev => [...prev, {
        speaker: "user",
        name: "You",
        message: current_input,
      }])

      // Add typing indicator for persona
      setMessages(prev => [...prev, {
        speaker: "persona",
        name: persona?.name || "Opponent",
        message: "",
        typing: true,
      }])

      // Simulate typing delay
      const typing_delay = Math.min(1500, Math.max(500, data.persona_response.length * 10))
      await new Promise(r => setTimeout(r, typing_delay))

      // Replace typing indicator with actual response
      setMessages(prev => [...prev.slice(0, -1), {
        speaker: "persona",
        name: persona?.name || "Opponent",
        message: data.persona_response,
      }])

      setUserMessageCount(data.message_count)

      // Check if auto-objection triggered
      if (data.auto_objection_triggered) {
        setGlowState("none")
        await handleAutoObjection(data.message_count)
      } else {
        setGlowState("user")
      }
    } catch (error) {
      console.error("Argument error:", error)
      setGlowState("user")
    } finally {
      setResponding(false)
    }
  }

  async function handleAutoObjection(message_count: number) {
    setArenaState("evaluating")
    setGlowState("none")

    // Wait a bit before showing evaluation
    await new Promise(r => setTimeout(r, 2000))

    // Auto-submit objection with collected arguments
    const all_user_messages = messages
      .filter(m => m.speaker === "user")
      .map(m => m.message)

    await submitObjection(all_user_messages)
  }

  async function handleManualObjection() {
    setArenaState("evaluating")
    setGlowState("none")

    // Collect all user arguments
    const all_user_messages = messages
      .filter(m => m.speaker === "user")
      .map(m => m.message)

    await submitObjection(all_user_messages)
  }

  async function submitObjection(user_arguments: string[]) {
    try {
      const response = await apiLong.post('/ace-attorney/objection', {
        debate_id,
        user_arguments,
      })

      const { data } = response

      setObjectionResult({
        won: data.won,
        reason: data.reason,
        example_refutation: data.example_refutation || "",
      })

      setArenaState("result")
    } catch (error) {
      console.error("Objection error:", error)
      setArenaState("active")
    }
  }

  // Intro Screen (VS style)
  if (showing_intro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1a3e] to-[#0d0f1d] flex items-center justify-center text-white overflow-hidden">
        <style>{`
          @keyframes slideInLeft {
            from {
              transform: translateX(-100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          @keyframes pulse-vs {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
          .slide-in-left {
            animation: slideInLeft 0.8s ease-out;
          }
          .slide-in-right {
            animation: slideInRight 0.8s ease-out;
          }
          .pulse-vs {
            animation: pulse-vs 1s infinite;
          }
        `}</style>

        <div className="flex items-center justify-center gap-12 w-full px-8">
          {/* User Side */}
          <div className="slide-in-left flex flex-col items-center">
            <div className="w-32 h-32 rounded-lg bg-blue-600 flex items-center justify-center border-4 border-blue-400 mb-4">
              <div className="text-5xl">⚖️</div>
            </div>
            <p className="font-black text-2xl text-blue-400">YOU</p>
            <p className="text-xs text-[#AAAAAA] mt-2">Attorney</p>
          </div>

          {/* VS */}
          <div className="pulse-vs">
            <p className="font-black text-6xl text-[#E8001A]">VS</p>
          </div>

          {/* Persona Side */}
          <div className="slide-in-right flex flex-col items-center">
            <div className="w-32 h-32 rounded-lg bg-red-900 flex items-center justify-center border-4 border-[#E8001A] mb-4 overflow-hidden">
              {persona && <PersonaAvatar persona={persona} size={128} />}
            </div>
            <p className="font-black text-2xl text-[#E8001A]">{persona?.name.toUpperCase()}</p>
            <p className="text-xs text-[#AAAAAA] mt-2">Defendant</p>
          </div>
        </div>

        {/* Loading indicator */}
        <div className="absolute bottom-12 text-center">
          <p className="text-sm text-[#AAAAAA] mb-3">Preparing trial...</p>
          <div className="flex justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#E8001A] animate-bounce"></div>
            <div className="w-2 h-2 rounded-full bg-[#E8001A] animate-bounce" style={{ animationDelay: "0.2s" }}></div>
            <div className="w-2 h-2 rounded-full bg-[#E8001A] animate-bounce" style={{ animationDelay: "0.4s" }}></div>
          </div>
        </div>
      </div>
    )
  }

  // Active Debate Arena
  if (arena_state === "active") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1a3e] to-[#0d0f1d] text-white">
        {/* Header */}
        <div className="border-b-2 border-[#E8001A] bg-black bg-opacity-50 px-8 py-6">
          <h1 className="text-5xl font-black text-[#E8001A]">TRIAL IN PROGRESS</h1>
          <p className="text-[#AAAAAA] mt-2 italic">"{theme}"</p>
          <p className="text-xs text-[#888888] mt-2">Your arguments: {user_message_count}/10</p>
        </div>

        <div className="h-[calc(100vh-160px)] flex flex-col">
          {/* Personas */}
          <div className="flex justify-between px-8 py-4 gap-8">
            {/* User (Attorney) */}
            <div className="flex flex-col items-center">
              <div className={`relative w-32 h-32 rounded-lg overflow-hidden border-4 border-blue-500 bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center ${
                glow_state === "user" ? "animate-pulse shadow-lg shadow-blue-500" : ""
              }`}>
                <div className="text-5xl">⚖️</div>
              </div>
              <p className="mt-3 font-black text-blue-400">YOU</p>
            </div>

            {/* Persona */}
            <div className="flex flex-col items-center">
              <div className={`relative w-32 h-32 rounded-lg overflow-hidden border-4 border-[#E8001A] bg-black bg-opacity-40 flex items-center justify-center ${
                glow_state === "waiting" ? "animate-pulse shadow-lg shadow-[#E8001A]" : ""
              }`}>
                <PersonaAvatar persona={persona} size={128} />
              </div>
              <p className="mt-3 font-black text-[#E8001A]">{persona.name.toUpperCase()}</p>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={messages_ref}
            className="flex-1 overflow-y-auto px-8 py-4 space-y-4"
          >
            {messages.map((msg, idx) => (
              <div key={idx} className={`p-4 rounded border-l-4 ${
                msg.speaker === "user"
                  ? "bg-blue-900 bg-opacity-30 border-blue-400 text-blue-200"
                  : "bg-red-900 bg-opacity-30 border-[#E8001A] text-red-200"
              }`}>
                <p className={`font-bold text-sm mb-2 ${
                  msg.speaker === "user" ? "text-blue-300" : "text-[#E8001A]"
                }`}>
                  {msg.name}
                </p>
                {msg.typing ? (
                  <div className="flex gap-1 items-center">
                    <span className="text-sm text-[#AAAAAA]">typing</span>
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                    </span>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed">{msg.message}</p>
                )}
              </div>
            ))}

            {responding && persona && (
              <div className="text-[#888888] text-sm italic">
                {persona.name} is preparing response...
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="px-8 py-4 bg-black bg-opacity-50 border-t-2 border-[#333333]">
            <div className="flex gap-3 mb-3">
              <input
                type="text"
                value={user_input}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !responding && handleSubmitArgument()}
                placeholder="Present your argument..."
                className="flex-1 bg-black bg-opacity-70 border-2 border-blue-500 rounded px-4 py-3 text-sm text-white placeholder-[#666666] focus:outline-none focus:border-blue-400"
                disabled={responding}
              />
              <button
                onClick={handleSubmitArgument}
                disabled={responding || !user_input.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {responding ? "..." : "Submit"}
              </button>
            </div>

            {/* OBJECTION Button */}
            {user_message_count >= 3 && (
              <button
                onClick={handleManualObjection}
                disabled={responding}
                className="w-full py-3 bg-[#E8001A] hover:bg-red-700 text-white font-black text-lg rounded transition-colors disabled:opacity-50"
              >
                OBJECTION! ({user_message_count}/10)
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Evaluating State
  if (arena_state === "evaluating") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1a3e] to-[#0d0f1d] flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-3xl font-black text-[#E8001A] mb-8">O juiz está avaliando o caso</p>
          <div className="flex justify-center gap-2 mb-8">
            <span className="text-2xl animate-bounce">.</span>
            <span className="text-2xl animate-bounce" style={{ animationDelay: "0.2s" }}>.</span>
            <span className="text-2xl animate-bounce" style={{ animationDelay: "0.4s" }}>.</span>
          </div>
        </div>
      </div>
    )
  }

  // Result State
  if (arena_state === "result" && objection_result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1a3e] to-[#0d0f1d] flex items-center justify-center text-white p-8">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-12">
            <p className="text-2xl font-black mb-4">O juiz decidiu que você</p>
            <div className="flex justify-center gap-2 mb-8">
              <span className="text-2xl animate-bounce">.</span>
              <span className="text-2xl animate-bounce" style={{ animationDelay: "0.2s" }}>.</span>
              <span className="text-2xl animate-bounce" style={{ animationDelay: "0.4s" }}>.</span>
            </div>
          </div>

          <div className={`text-center py-12 rounded-lg mb-12 ${
            objection_result.won
              ? "bg-green-900 bg-opacity-30 border-2 border-green-500"
              : "bg-red-900 bg-opacity-30 border-2 border-[#E8001A]"
          }`}>
            <p className={`text-6xl font-black mb-4 ${
              objection_result.won ? "text-green-400" : "text-[#E8001A]"
            }`}>
              {objection_result.won ? "GANHOU!" : "PERDEU!"}
            </p>
            <p className="text-sm text-[#AAAAAA]">{objection_result.reason}</p>
          </div>

          <div className="bg-black bg-opacity-50 rounded-lg p-6 border-2 border-[#333333]">
            <p className="text-sm text-[#AAAAAA] mb-2">A falácia era:</p>
            <p className="text-lg font-bold text-white mb-6 italic">"{theme}"</p>

            {!objection_result.won && (
              <>
                <p className="text-sm text-[#AAAAAA] mb-2">Uma possível refutação seria:</p>
                <p className="text-sm text-white leading-relaxed">{objection_result.example_refutation}</p>
              </>
            )}
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full mt-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded transition-colors"
          >
            Return to Lobby
          </button>
        </div>
      </div>
    )
  }

  return null
}
