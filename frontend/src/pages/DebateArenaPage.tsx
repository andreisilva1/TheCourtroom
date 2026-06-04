import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import FighterCard from '../components/FighterCard'
import ArgumentCard from '../components/ArgumentCard'
import { battleTurn } from '../api/client'
import type { Argument, Persona, DebateMode } from '../types'

interface ArenaState {
  battle_id: string
  starts_with: string
  first_argument: Argument
  persona_a: Persona
  persona_b: Persona
  topic: string
  mode: DebateMode
}

export default function DebateArenaPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state    = location.state as ArenaState | null

  const [args, setArgs]               = useState<Argument[]>([])
  const [activeSpeaker, setActiveSpeaker] = useState('')
  const [loading, setLoading]         = useState(false)
  const [round, setRound]             = useState(1)
  const [shaking, setShaking]         = useState<string | null>(null)
  const feedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!state) return
    setArgs([state.first_argument])
    setActiveSpeaker(state.first_argument.speaker_id)
  }, [])

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [args])

  if (!state) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3 bg-[#FAFAF9]">
        <p className="text-sm text-[#888888]">No active battle.</p>
        <button
          onClick={() => navigate('/confront')}
          className="font-mono text-xs text-[#E8001A] hover:underline"
        >
          start one →
        </button>
      </div>
    )
  }

  const { battle_id, persona_a, persona_b, topic } = state
  const nextSpeakerId   = activeSpeaker === persona_a.id ? persona_b.id : persona_a.id
  const nextSpeakerName = nextSpeakerId === persona_a.id ? persona_a.name : persona_b.name
  const turnsA = args.filter(a => a.speaker_id === persona_a.id).length
  const turnsB = args.filter(a => a.speaker_id === persona_b.id).length

  async function handleNextTurn() {
    if (loading) return
    setLoading(true)
    const nextRound = round + 1
    try {
      const result = await battleTurn(battle_id, nextSpeakerId, nextRound)
      setArgs(prev => [...prev, {
        speaker_id: result.speaker_id,
        content: result.content,
        turn: result.turn,
        confidence: result.confidence,
        impact: result.impact,
        retrieved_context: result.retrieved_context,
        rhetorical_style: result.rhetorical_style,
      }])
      setActiveSpeaker(result.speaker_id)
      setRound(nextRound)
      if ((result.impact ?? 0) > 80) {
        const target = result.speaker_id === persona_a.id ? persona_b.id : persona_a.id
        setShaking(target)
        setTimeout(() => setShaking(null), 500)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#FAFAF9]">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-3 bg-white shadow-sm flex items-center justify-between border-b border-[#EBEBEB]">
        <button
          onClick={() => navigate('/confront')}
          className="font-mono text-xs text-[#888888] hover:text-[#111111] transition-colors"
        >
          ← back
        </button>
        <p className="text-xs text-[#888888] italic truncate max-w-sm">"{topic}"</p>
        <span className="font-mono text-xs text-[#888888]">round {round}</span>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Fighter A */}
        <div className="w-40 flex-shrink-0 p-3 bg-white border-r border-[#EBEBEB]">
          <FighterCard
            persona={persona_a}
            side="left"
            isActive={activeSpeaker === persona_a.id}
            isShaking={shaking === persona_a.id}
            turnCount={turnsA}
          />
        </div>

        {/* Argument feed */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div ref={feedRef} className="flex-1 overflow-y-auto py-4 space-y-2">
            {args.map(arg => (
              <ArgumentCard
                key={`${arg.speaker_id}-${arg.turn}`}
                argument={arg}
                personaA={persona_a}
                personaB={persona_b}
              />
            ))}
            {loading && (
              <div className="px-6 py-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#888888] animate-pulse" />
                <span className="font-mono text-xs text-[#888888] italic animate-pulse">
                  {nextSpeakerName} is thinking...
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 bg-white border-t border-[#EBEBEB] px-6 py-4 flex items-center justify-between">
            <span className="font-mono text-sm text-[#888888]">
              {persona_a.name.split(' ')[0]}{' '}
              <span className="font-semibold text-[#111111]">{turnsA}</span>
              <span className="mx-2">·</span>
              {persona_b.name.split(' ')[0]}{' '}
              <span className="font-semibold text-[#111111]">{turnsB}</span>
            </span>
            <button
              onClick={handleNextTurn}
              disabled={loading}
              className="text-sm px-6 py-2 bg-[#E8001A] text-white font-semibold rounded-lg hover:bg-[#c40016] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Thinking...' : 'Next round →'}
            </button>
          </div>
        </div>

        {/* Fighter B */}
        <div className="w-40 flex-shrink-0 p-3 bg-white border-l border-[#EBEBEB]">
          <FighterCard
            persona={persona_b}
            side="right"
            isActive={activeSpeaker === persona_b.id}
            isShaking={shaking === persona_b.id}
            turnCount={turnsB}
          />
        </div>
      </div>
    </div>
  )
}
