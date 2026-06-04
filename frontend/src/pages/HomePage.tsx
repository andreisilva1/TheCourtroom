import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadPersonas, createPersona as createPersonaAPI, getTaskStatus, apiLong } from '../api/client'
import PersonaCard from '../components/PersonaCard'
import type { Persona } from '../types'

interface DebateHistory {
  debate_id: string
  status: "won_manual" | "won_auto" | "lost" | "active"
  persona_name: string
  fallacy_theme: string
  fallacy_example_refutation?: string
  created_at?: string
}

export default function HomePage() {
  const navigate = useNavigate()
  const [personas, setPersonas] = useState<Persona[]>([])
  const [debates, setDebates] = useState<DebateHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [show_create_modal, setShowCreateModal] = useState(false)
  const [persona_name, setPersonaName] = useState("")
  const [creating, setCreating] = useState(false)
  const [active_tab, setActiveTab] = useState<"opponents" | "history">("opponents")
  const [system_ready, setSystemReady] = useState(true)
  const [system_message, setSystemMessage] = useState("")

  useEffect(() => {
    loadPersonasData()
    loadDebateHistory()
    checkSystemHealth()

    // Poll health every 5 seconds
    const healthInterval = setInterval(checkSystemHealth, 5000)
    return () => clearInterval(healthInterval)
  }, [])

  async function checkSystemHealth() {
    try {
      const response = await apiLong.get('/health')
      const { data } = response

      setSystemReady(data.ready)
      setSystemMessage(data.message)
    } catch (err) {
      setSystemReady(false)
      setSystemMessage("Unable to connect to backend")
    }
  }

  async function loadPersonasData() {
    try {
      const { personas } = await loadPersonas()
      setPersonas(personas)
    } catch (err) {
      setError("Failed to load personas")
      console.error(err)
    }
  }

  async function loadDebateHistory() {
    try {
      const response = await apiLong.get('/debates/history')
      const { data } = response
      setDebates(data.debates || [])
    } catch (err) {
      console.error("Failed to load debate history:", err)
    }
  }

  async function startTrial(persona: Persona) {
    // Navigate immediately with loading state
    navigate('/ace-attorney', {
      state: {
        persona,
        debate_id: null,
        theme: null,
        loading: true,
      },
    })
  }

  async function handleCreatePersona() {
    if (!persona_name.trim()) return

    setCreating(true)
    try {
      const result = await createPersonaAPI(persona_name)

      if (result && 'task_id' in result) {
        let completed = false
        let attempts = 0
        const max_attempts = 60

        while (!completed && attempts < max_attempts) {
          await new Promise(r => setTimeout(r, 1000))
          try {
            const status = await getTaskStatus(result.task_id)

            if (status && 'state' in status && status.state === 'SUCCESS') {
              completed = true
              setPersonaName("")
              setShowCreateModal(false)
              await loadPersonasData()
              setError("")
            }
          } catch (e) {
            console.log("Polling failed, reloading personas...", e)
            attempts = max_attempts
          }

          attempts++
        }

        if (!completed) {
          setPersonaName("")
          setShowCreateModal(false)
          await loadPersonasData()
        }
      }
    } catch (err) {
      console.error(err)
      setError("Failed to create persona")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1a3e] to-[#0d0f1d] text-white">
      {/* System Status Banner */}
      {!system_ready && (
        <div className="bg-yellow-900 bg-opacity-40 border-b-2 border-yellow-500 px-8 py-4">
          <div className="flex items-center gap-3 max-w-7xl mx-auto">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: "0.2s" }}></span>
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: "0.4s" }}></span>
            </div>
            <span className="text-yellow-300 font-semibold">{system_message}</span>
            <span className="text-xs text-yellow-400 ml-auto">Initializing AI models...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b-2 border-[#E8001A] bg-black bg-opacity-50 px-8 py-6">
        <h1 className="text-5xl font-black text-[#E8001A]">ARGUMENT ATTORNEY</h1>
        <p className="text-[#AAAAAA] mt-2">Challenge personas to expose their fallacious arguments</p>
      </div>

      {/* Tabs */}
      <div className="border-b-2 border-[#333333] bg-black bg-opacity-30 px-8 flex gap-8">
        <button
          onClick={() => setActiveTab("opponents")}
          className={`py-4 font-black text-lg border-b-4 transition-colors ${
            active_tab === "opponents"
              ? "text-[#E8001A] border-[#E8001A]"
              : "text-[#AAAAAA] border-transparent hover:text-white"
          }`}
        >
          CHOOSE OPPONENT
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`py-4 font-black text-lg border-b-4 transition-colors ${
            active_tab === "history"
              ? "text-[#E8001A] border-[#E8001A]"
              : "text-[#AAAAAA] border-transparent hover:text-white"
          }`}
        >
          TRIAL HISTORY
        </button>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        {error && (
          <div className="mb-6 p-4 bg-red-900 bg-opacity-30 border-2 border-red-500 rounded text-red-300">
            {error}
          </div>
        )}

        {/* OPPONENTS TAB */}
        {active_tab === "opponents" && (
          <div>
            {/* Instructions */}
            <div className="mb-12 p-6 bg-blue-900 bg-opacity-20 border-2 border-blue-500 rounded-lg">
              <h2 className="text-xl font-black text-blue-400 mb-3">HOW TO PLAY</h2>
              <ul className="space-y-2 text-sm text-[#CCCCCC]">
                <li>✓ Choose a persona to challenge</li>
                <li>✓ They will propose a position based on their personality</li>
                <li>✓ Their argument contains a hidden flaw—can you find it?</li>
                <li>✓ Present evidence and logic to expose the fallacy</li>
                <li>✓ After 3 arguments, click OBJECTION! when you're ready</li>
                <li>✓ Auto-OBJECTION triggers at 10 arguments</li>
              </ul>
            </div>

            {/* Create button */}
            <div className="flex justify-end mb-8">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded transition-colors"
              >
                + CREATE PERSONA
              </button>
            </div>

            {/* Personas Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="text-4xl mb-4">⚖️</div>
                  <p className="text-[#AAAAAA]">Preparing trials...</p>
                </div>
              </div>
            ) : personas.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-[#AAAAAA] mb-4">No personas available yet</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded"
                >
                  Create your first persona
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {personas.map((persona) => (
                  <div
                    key={persona.id}
                    onClick={() => system_ready && startTrial(persona)}
                    className={`relative group ${system_ready ? "cursor-pointer" : "cursor-not-allowed opacity-50 pointer-events-none"}`}
                  >
                    <PersonaCard persona={persona} />

                    {/* Tooltip when hovering and system not ready */}
                    {!system_ready && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-yellow-900 border border-yellow-500 rounded text-xs text-yellow-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                        ⏳ {system_message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {active_tab === "history" && (
          <div>
            <h2 className="text-2xl font-black text-white mb-8">COMPLETED TRIALS</h2>

            {debates.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#AAAAAA]">No trials completed yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {debates
                  .filter(d => d.status !== "active")
                  .map((debate) => (
                    <div
                      key={debate.debate_id}
                      className="p-6 bg-black bg-opacity-50 border-2 border-[#333333] rounded-lg hover:border-[#E8001A] transition-colors cursor-pointer"
                      onClick={() => navigate(`/debate/${debate.debate_id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-black text-white mb-2">
                            {debate.persona_name}
                          </h3>
                          <p className="text-sm text-[#AAAAAA] mb-3">
                            Fallacy: "{debate.fallacy_theme}"
                          </p>

                          {debate.status.includes("won") ? (
                            <div className="text-green-400 font-bold text-sm">
                              ✓ OBJECTION SUSTAINED
                            </div>
                          ) : (
                            <div className="text-[#E8001A] font-bold text-sm">
                              ✗ OBJECTION FAILED
                            </div>
                          )}

                          {debate.fallacy_example_refutation && debate.status === "lost" && (
                            <p className="mt-3 text-xs text-[#888888] italic">
                              "A possible refutation: {debate.fallacy_example_refutation}"
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <div
                            className={`text-sm font-bold px-3 py-1 rounded ${
                              debate.status.includes("won")
                                ? "bg-green-900 bg-opacity-30 text-green-400"
                                : "bg-red-900 bg-opacity-30 text-[#E8001A]"
                            }`}
                          >
                            {debate.status === "won_manual" ? "Manual" : "Auto"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 p-6 bg-black bg-opacity-50 border-t-2 border-[#333333] rounded-lg text-center text-sm text-[#888888]">
          <p>Built with Ollama LLM • Qdrant Vector DB • React + TypeScript</p>
        </div>
      </div>

      {/* Create Persona Modal */}
      {show_create_modal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-[#1a1a3e] border-2 border-blue-500 rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-black text-blue-400 mb-6">CREATE NEW PERSONA</h3>

            {error && (
              <div className="mb-4 p-3 bg-red-900 bg-opacity-30 border-2 border-red-500 rounded text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#CCCCCC] mb-2">
                  Persona Name
                </label>
                <input
                  type="text"
                  value={persona_name}
                  onChange={(e) => setPersonaName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !creating) handleCreatePersona()
                  }}
                  placeholder="e.g., Steve Jobs, Marie Curie..."
                  className="w-full bg-black bg-opacity-50 border-2 border-blue-500 rounded px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-blue-400"
                  disabled={creating}
                  autoFocus
                />
              </div>

              <p className="text-xs text-[#888888]">
                The persona will be created with a personality quiz and knowledge base.
                This may take a minute or two.
              </p>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setPersonaName("")
                    setError("")
                  }}
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-[#333333] hover:bg-[#444444] text-white font-bold rounded transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePersona}
                  disabled={creating || !persona_name.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded transition-colors disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
