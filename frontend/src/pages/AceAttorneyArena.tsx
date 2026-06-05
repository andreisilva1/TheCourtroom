import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { loadPersonas, startDebate, argue, objection } from '../api/client'
import PersonaAvatar from '../components/PersonaAvatar'
import type { Persona } from '../types'

interface ChatMessage {
  speaker: 'user' | 'persona'
  name: string
  message: string
  typing?: boolean
}

type Phase = 'intro' | 'active' | 'evaluating' | 'result'

interface Verdict {
  won: boolean
  reason: string
  example_refutation: string
}

const MAX_ARGUMENTS = 10
const MIN_ARGUMENTS_TO_OBJECT = 3

export default function AceAttorneyArena() {
  const { persona_id } = useParams<{ persona_id: string }>()
  const navigate = useNavigate()

  const [persona, setPersona] = useState<Persona | null>(null)
  const [debateId, setDebateId] = useState<string | null>(null)
  const [theme, setTheme] = useState('')

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [userInput, setUserInput] = useState('')
  const [responding, setResponding] = useState(false)
  const [argumentCount, setArgumentCount] = useState(0)
  const [phase, setPhase] = useState<Phase>('intro')
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [error, setError] = useState('')

  const messagesRef = useRef<HTMLDivElement>(null)

  const initDebate = useCallback(async () => {
    if (!persona_id) return
    try {
      const all = await loadPersonas()
      const found = all.find(p => p.id === persona_id) ?? null
      setPersona(found)

      const data = await startDebate(persona_id)

      if (data.error || !data.debate_id) {
        if (data.status === 'initializing') {
          setTimeout(initDebate, 2500)
          return
        }
        setError(data.error || 'Failed to convene the trial.')
        return
      }

      setDebateId(data.debate_id)
      setTheme(data.theme || '')
      setPhase('active')
      setMessages([{
        speaker: 'persona',
        name: data.persona_name || found?.name || 'Defendant',
        message: data.opening || `I believe: ${data.theme}`,
      }])
    } catch (err) {
      console.error('Failed to start debate', err)
      setError('Failed to convene the trial. Please go back and try again.')
    }
  }, [persona_id])

  useEffect(() => { initDebate() }, [initDebate])

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages])

  const userArguments = () => messages.filter(m => m.speaker === 'user').map(m => m.message)

  const handleSubmit = async () => {
    if (!userInput.trim() || responding || !debateId) return

    const argument = userInput.trim()
    setUserInput('')
    setResponding(true)

    setMessages(prev => [
      ...prev,
      { speaker: 'user', name: 'You', message: argument },
      { speaker: 'persona', name: persona?.name || 'Defendant', message: '', typing: true },
    ])

    try {
      const data = await argue(debateId, argument)

      if (data.error) {
        setMessages(prev => prev.slice(0, -1))
        setError(data.error)
        return
      }

      setMessages(prev => [
        ...prev.slice(0, -1),
        {
          speaker: 'persona',
          name: data.persona_name || persona?.name || 'Defendant',
          message: data.persona_response || 'I stand by my position.',
        },
      ])
      setArgumentCount(data.message_count ?? argumentCount + 1)

      if (data.auto_objection_triggered) {
        await runObjection()
      }
    } catch (err) {
      console.error('Argue error', err)
      setMessages(prev => prev.slice(0, -1))
      setError('Something went wrong sending your argument.')
    } finally {
      setResponding(false)
    }
  }

  const runObjection = async () => {
    if (!debateId) return
    setPhase('evaluating')
    try {
      const data = await objection(debateId, userArguments())
      if (data.error) {
        setError(data.error)
        setPhase('active')
        return
      }
      setVerdict({
        won: !!data.won,
        reason: data.reason || '',
        example_refutation: data.example_refutation || '',
      })
      setPhase('result')
    } catch (err) {
      console.error('Objection error', err)
      setError('Failed to evaluate your objection.')
      setPhase('active')
    }
  }

  // ── Error ──
  if (error) {
    return (
      <div className="min-h-screen courtroom-bg flex flex-col items-center justify-center gap-4">
        <p className="relative z-[1] text-court-red-bright italic text-lg">{error}</p>
        <button onClick={() => navigate('/')} className="relative z-[1] font-mono text-sm text-gold-bright hover:underline">
          ← back to the courtroom
        </button>
      </div>
    )
  }

  // ── Intro / preparing ──
  if (phase === 'intro') {
    return (
      <div className="min-h-screen courtroom-bg flex flex-col items-center justify-center overflow-hidden">
        <div className="vs-flash absolute inset-0 bg-white z-[5] pointer-events-none" />
        <div className="relative z-[2] flex items-center justify-center gap-0 w-full px-8">
          <div className="slide-l flex-1 flex flex-col items-center gap-4">
            <div className="w-[200px] h-[200px] rounded-xl flex items-center justify-center text-[92px] bg-gradient-to-br from-[#1c4e80] to-[#0b2540] border-[5px] border-court-blue-bright shadow-[0_0_40px_rgba(74,163,255,.5)]">⚖️</div>
            <div className="font-title font-bold text-[34px] tracking-[3px] text-court-blue-bright">YOU</div>
            <div className="italic text-[#cbb990] -mt-2">Prosecutor</div>
          </div>
          <div className="vs-badge text-[130px] z-[3]">VS</div>
          <div className="slide-r flex-1 flex flex-col items-center gap-4">
            <div className="w-[200px] h-[200px] rounded-xl overflow-hidden flex items-center justify-center bg-[radial-gradient(circle,#5a2018,#1a0a07)] border-[5px] border-court-red-bright shadow-[0_0_40px_rgba(255,45,68,.5)]">
              {persona ? <PersonaAvatar persona={persona} size={200} /> : <span className="text-[92px]">🎭</span>}
            </div>
            <div className="font-title font-bold text-[34px] tracking-[3px] text-court-red-bright text-center">{(persona?.name || '...').toUpperCase()}</div>
            <div className="italic text-[#cbb990] -mt-2">Defendant</div>
          </div>
        </div>
        <div className="absolute bottom-10 z-[2] text-center w-full">
          <p className="italic text-[#cbb990] mb-2.5">Preparing the trial…</p>
          <div>
            <span className="bounce-dot inline-block w-2.5 h-2.5 rounded-full bg-court-red-bright mx-1" />
            <span className="bounce-dot inline-block w-2.5 h-2.5 rounded-full bg-court-red-bright mx-1" />
            <span className="bounce-dot inline-block w-2.5 h-2.5 rounded-full bg-court-red-bright mx-1" />
          </div>
        </div>
      </div>
    )
  }

  // ── Evaluating ──
  if (phase === 'evaluating') {
    return (
      <div className="min-h-screen courtroom-bg flex items-center justify-center">
        <div className="relative z-[1] text-center">
          <p className="font-title font-bold text-3xl tracking-wide text-gold-bright mb-6">The judge is weighing your case…</p>
          <div>
            <span className="bounce-dot inline-block text-4xl text-gold-bright mx-1">.</span>
            <span className="bounce-dot inline-block text-4xl text-gold-bright mx-1">.</span>
            <span className="bounce-dot inline-block text-4xl text-gold-bright mx-1">.</span>
          </div>
        </div>
      </div>
    )
  }

  // ── Result ──
  if (phase === 'result' && verdict) {
    return (
      <div className="min-h-screen courtroom-bg flex items-center justify-center p-6">
        <div className="relative z-[1] max-w-[640px] w-full text-center">
          <div className={`stamp-in inline-block font-title font-bold italic text-[88px] leading-none tracking-[4px] px-7 py-7 mb-7 border-8 rounded-2xl ${
            verdict.won
              ? 'text-court-green border-court-green [text-shadow:0_0_20px_rgba(46,139,80,.6)]'
              : 'text-court-red-bright border-court-red-bright [text-shadow:0_0_20px_rgba(255,45,68,.6)]'
          }`}>
            {verdict.won ? 'CASE WON' : 'NOT PROVEN'}
          </div>
          <p className="italic text-lg text-[#cbb990] mb-7">{verdict.reason}</p>

          <div className="bg-black/45 border border-wood-light rounded-xl p-6 text-left mb-6">
            <div className="font-mono text-[11px] uppercase tracking-wide text-gold">The fallacy on trial</div>
            <div className="text-lg italic my-1.5 mb-4">"{theme}"</div>
            {!verdict.won && verdict.example_refutation && (
              <>
                <div className="font-mono text-[11px] uppercase tracking-wide text-gold">A refutation that would have won</div>
                <div className="text-lg mt-1.5 leading-relaxed">{verdict.example_refutation}</div>
              </>
            )}
          </div>

          <button
            onClick={() => navigate('/')}
            className="font-title font-semibold tracking-wide uppercase text-sm text-ink bg-gold px-8 py-3.5 rounded-md shadow-[0_4px_0_#9a751f] active:translate-y-1 active:shadow-none transition-all"
          >
            ↺ Return to the Courtroom
          </button>
        </div>
      </div>
    )
  }

  // ── Active debate ──
  const canObject = argumentCount >= MIN_ARGUMENTS_TO_OBJECT

  return (
    <div className="min-h-screen courtroom-bg flex flex-col">
      {/* Header */}
      <div className="relative z-[1] text-center pt-5 pb-4 px-4 border-b-2 border-gold bg-gradient-to-b from-black/50 to-transparent">
        <h1 className="font-title font-bold text-3xl tracking-[4px] text-court-red-bright [text-shadow:0_0_18px_rgba(255,45,68,.5)]">TRIAL IN SESSION</h1>
        <p className="italic text-parchment mt-1.5 text-lg">"{theme}"</p>
        <div className="mt-2.5">
          {Array.from({ length: MAX_ARGUMENTS }).map((_, i) => (
            <span
              key={i}
              className={`inline-block text-base mx-0.5 ${i < argumentCount ? '' : 'grayscale opacity-40'}`}
            >
              ⚖️
            </span>
          ))}
        </div>
      </div>

      {/* Combatants */}
      <div className="relative z-[1] flex justify-center gap-20 py-4.5 pt-4 pb-4">
        <div className="text-center">
          <div className={`w-24 h-24 rounded-[10px] mx-auto mb-2 flex items-center justify-center text-5xl bg-gradient-to-br from-[#1c4e80] to-[#0b2540] border-4 border-court-blue-bright ${!responding ? 'speaking-glow' : ''}`}>⚖️</div>
          <div className="font-title font-semibold tracking-wide text-court-blue-bright">YOU</div>
        </div>
        <div className="text-center">
          <div className={`w-24 h-24 rounded-[10px] mx-auto mb-2 overflow-hidden flex items-center justify-center bg-[radial-gradient(circle,#5a2018,#1a0a07)] border-4 border-court-red-bright ${responding ? 'speaking-glow' : ''}`}>
            {persona && <PersonaAvatar persona={persona} size={96} />}
          </div>
          <div className="font-title font-semibold tracking-wide text-court-red-bright">{(persona?.name || 'Defendant').toUpperCase()}</div>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesRef} className="relative z-[1] flex-1 overflow-y-auto max-w-[900px] w-full mx-auto px-6 py-2.5">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`rise border-l-4 rounded-lg px-4.5 py-3.5 px-5 mb-3.5 ${
              msg.speaker === 'user'
                ? 'bg-court-blue/[.16] border-court-blue-bright'
                : 'bg-court-red/[.16] border-court-red-bright'
            }`}
          >
            <div className={`font-title font-semibold tracking-wide text-[13px] mb-1.5 ${msg.speaker === 'user' ? 'text-court-blue-bright' : 'text-court-red-bright'}`}>
              {msg.name}
            </div>
            {msg.typing ? (
              <div className="flex gap-1 items-center text-[#cbb990] text-base">
                objecting
                <span className="bounce-dot inline-block w-1.5 h-1.5 rounded-full bg-current ml-0.5" />
                <span className="bounce-dot inline-block w-1.5 h-1.5 rounded-full bg-current" />
                <span className="bounce-dot inline-block w-1.5 h-1.5 rounded-full bg-current" />
              </div>
            ) : (
              <div className="text-[17px] leading-relaxed text-parchment">{msg.message}</div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="relative z-[1] max-w-[900px] w-full mx-auto px-6 pt-4 pb-7">
        <div className="flex gap-2.5 mb-3">
          <input
            type="text"
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !responding && handleSubmit()}
            placeholder="Present your argument, counselor..."
            disabled={responding}
            className="flex-1 bg-black/50 border-2 border-court-blue text-parchment placeholder:text-[#8a7a5e] rounded-md px-4 py-3 text-base focus:outline-none focus:border-court-blue-bright font-serif"
          />
          <button
            onClick={handleSubmit}
            disabled={responding || !userInput.trim()}
            className="font-title font-semibold tracking-wide uppercase text-white px-6 rounded-md bg-gradient-to-b from-court-blue-bright to-court-blue shadow-[0_4px_0_#1a466f] disabled:opacity-50"
          >
            {responding ? '…' : 'Submit'}
          </button>
        </div>
        {canObject && (
          <button
            onClick={runObjection}
            disabled={responding}
            className="objection-shake w-full font-title font-bold italic text-[28px] tracking-[3px] uppercase text-white border-[3px] border-white py-3.5 rounded-lg bg-gradient-to-b from-court-red-bright to-court-red shadow-[0_5px_0_#7a0f1c,0_8px_20px_rgba(192,24,42,.5)] active:translate-y-1 active:shadow-[0_1px_0_#7a0f1c] disabled:opacity-50 transition-transform"
          >
            OBJECTION! ({argumentCount}/{MAX_ARGUMENTS})
          </button>
        )}
      </div>
    </div>
  )
}
