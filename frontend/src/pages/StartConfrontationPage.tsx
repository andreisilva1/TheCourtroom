import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import VSAnimation from '../components/VSAnimation'
import CreatePersonaModal from '../components/CreatePersonaModal'
import PersonaAvatar from '../components/PersonaAvatar'
import { loadPersonas, argueBattle } from '../api/client'
import type { Persona, DebateMode } from '../types'

const MODES: { id: DebateMode; label: string }[] = [
  { id: 'SERIOUS',      label: 'Serious'      },
  { id: 'CHAOTIC',      label: 'Chaotic'      },
  { id: 'ACADEMIC',     label: 'Academic'     },
  { id: 'STREET_FIGHT', label: 'Street Fight' },
  { id: 'COURTROOM',    label: 'Courtroom'    },
  { id: 'PODCAST',      label: 'Podcast'      },
]

const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  PHILOSOPHER:  { bg: '#EDE9FE', text: '#7C3AED' },
  ATHLETE:      { bg: '#D1FAE5', text: '#065F46' },
  'TECH TITAN': { bg: '#DBEAFE', text: '#1E40AF' },
  HISTORICAL:   { bg: '#FEF3C7', text: '#92400E' },
  FICTIONAL:    { bg: '#FCE7F3', text: '#9D174D' },
  TECHNOLOGY:   { bg: '#CFFAFE', text: '#155E75' },
}

function getCatStyle(cat?: string) {
  if (!cat) return { bg: '#F3F4F6', text: '#6B7280' }
  return CATEGORY_STYLES[cat.toUpperCase()] ?? { bg: '#F3F4F6', text: '#6B7280' }
}

// ─── Fighter slot ────────────────────────────────────────────────────────────
function FighterSlot({
  persona,
  side,
  isActive,
  onClick,
  onClear,
}: {
  persona: Persona | null
  side: 'A' | 'B'
  isActive: boolean
  onClick: () => void
  onClear: () => void
}) {
  const accent = side === 'A' ? '#2563EB' : '#E8001A'
  const label  = side === 'A' ? 'Combatant A' : 'Combatant B'

  return (
    <div className="flex-1 flex flex-col items-center gap-3">
      <span className="font-mono text-xs text-[#888888] tracking-widest uppercase">{label}</span>

      <div
        onClick={onClick}
        className="relative w-full cursor-pointer transition-all duration-200"
        style={{ maxWidth: 200 }}
      >
        {persona ? (
          <div
            className="rounded-2xl overflow-hidden bg-white transition-all duration-300"
            style={{
              boxShadow: isActive
                ? `0 0 0 3px ${accent}, 0 12px 40px ${accent}30`
                : `0 0 0 2px ${accent}40, 0 4px 16px rgba(0,0,0,0.08)`,
            }}
          >
            {/* Avatar area */}
            <div
              className="relative h-36 flex items-center justify-center"
              style={{ background: `${persona.color || accent}15` }}
            >
              <PersonaAvatar persona={persona} size={96} />
              {isActive && (
                <div
                  className="absolute inset-0 rounded-t-2xl pointer-events-none"
                  style={{ boxShadow: `inset 0 0 0 2px ${accent}` }}
                />
              )}
            </div>
            {/* Info */}
            <div className="px-3 py-2.5">
              <div className="font-semibold text-sm text-[#111111] truncate">{persona.name}</div>
              {persona.category && (
                <span
                  className="mt-1 rounded-full text-xs font-medium px-2 py-0.5 inline-block"
                  style={{ background: getCatStyle(persona.category).bg, color: getCatStyle(persona.category).text }}
                >
                  {persona.category}
                </span>
              )}
            </div>
            {/* Clear button */}
            <button
              onClick={e => { e.stopPropagation(); onClear() }}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/80 flex items-center justify-center text-[#888888] hover:text-[#111111] hover:bg-white shadow-sm transition-all text-xs"
            >
              ✕
            </button>
          </div>
        ) : (
          <div
            className="rounded-2xl border-2 border-dashed h-48 flex flex-col items-center justify-center gap-2 transition-all duration-200"
            style={{
              borderColor: isActive ? accent : '#EBEBEB',
              background: isActive ? `${accent}06` : 'transparent',
            }}
          >
            <div
              className="w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center text-lg"
              style={{ borderColor: isActive ? accent : '#D0D0CB', color: isActive ? accent : '#AAAAAA' }}
            >
              ?
            </div>
            <span
              className="font-mono text-xs tracking-widest uppercase"
              style={{ color: isActive ? accent : '#AAAAAA' }}
            >
              {isActive ? 'selecting...' : 'empty slot'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Character tile ──────────────────────────────────────────────────────────
function CharacterTile({
  persona,
  isSelectedA,
  isSelectedB,
  onClick,
}: {
  persona: Persona
  isSelectedA: boolean
  isSelectedB: boolean
  onClick: () => void
}) {
  const accent         = persona.color || '#60a5fa'
  const selectedAccent = isSelectedA ? '#2563EB' : isSelectedB ? '#E8001A' : null
  const badge          = isSelectedA ? 'A' : isSelectedB ? 'B' : null
  const isLoading      = persona.loaded === false

  return (
    <button
      onClick={isLoading ? undefined : onClick}
      disabled={isLoading}
      className="relative rounded-2xl overflow-hidden bg-white transition-all duration-200 hover:-translate-y-0.5 text-left group border border-[#EBEBEB] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      style={{
        boxShadow: selectedAccent
          ? `0 0 0 2px ${selectedAccent}`
          : '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      {/* Avatar area — fills top ~65% */}
      <div
        className="h-20 flex items-center justify-center relative"
        style={{ background: isLoading ? '#F3F3F1' : `${accent}18` }}
      >
        {isLoading ? (
          <div className="w-[52px] h-[52px] rounded-full shimmer-bg" />
        ) : (
          <PersonaAvatar persona={persona} size={52} />
        )}

        {badge && (
          <div
            className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs text-white"
            style={{ background: selectedAccent! }}
          >
            {badge}
          </div>
        )}

        {!isLoading && persona.indexed && (
          <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-500 border border-white" />
        )}
      </div>

      {/* Name */}
      <div className="px-2 py-1.5">
        <div className="font-semibold text-xs text-[#111111] truncate leading-tight">{persona.name}</div>
        {isLoading ? (
          <div className="font-mono text-[9px] text-[#AAAAAA] mt-0.5">building...</div>
        ) : persona.category ? (
          <div className="font-mono text-[9px] text-[#888888] mt-0.5 truncate">{persona.category}</div>
        ) : null}
      </div>
    </button>
  )
}

// ─── Create tile ──────────────────────────────────────────────────────────────
function CreateTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border-2 border-dashed border-[#E8001A]/30 bg-[#E8001A]/5 hover:bg-[#E8001A]/10 hover:border-[#E8001A]/60 transition-all duration-200 flex flex-col items-center justify-center gap-2 min-h-[116px]"
    >
      <div className="w-9 h-9 rounded-full bg-[#E8001A]/15 flex items-center justify-center text-[#E8001A] text-xl">
        +
      </div>
      <div className="font-semibold text-xs text-[#E8001A]">Create</div>
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function StartConfrontationPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const preselect = location.state?.preselect as Persona | undefined

  const [personas,   setPersonas]   = useState<Persona[]>([])
  const [personaA,   setPersonaA]   = useState<Persona | null>(preselect || null)
  const [personaB,   setPersonaB]   = useState<Persona | null>(null)
  const [activeSlot, setActiveSlot] = useState<'A' | 'B'>(preselect ? 'B' : 'A')
  const [topic,      setTopic]      = useState('')
  const [mode,       setMode]       = useState<DebateMode>('SERIOUS')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [createFor,  setCreateFor]  = useState<'A' | 'B' | null>(null)
  const [search,     setSearch]     = useState('')

  useEffect(() => { loadPersonas().then(r => setPersonas(r.personas)) }, [])

  function selectPersona(p: Persona) {
    if (activeSlot === 'A') {
      setPersonaA(p)
      if (!personaB) setActiveSlot('B')
    } else {
      setPersonaB(p)
      if (!personaA) setActiveSlot('A')
    }
  }

  function handlePersonaCreated(persona: Persona) {
    setPersonas(prev => [persona, ...prev])
    selectPersona(persona)
    setCreateFor(null)
  }

  async function handleStart() {
    if (!personaA || !personaB) return setError('Select two combatants first.')
    if (personaA.id === personaB.id) return setError('They have to be different.')
    if (!topic.trim()) return setError('Enter a battle topic.')
    setError('')
    setLoading(true)
    try {
      const battle = await argueBattle(personaA.id, personaB.id, topic.trim(), mode)
      navigate('/arena', {
        state: {
          battle_id:      battle.battle_id,
          starts_with:    battle.starts_with,
          first_argument: battle.message,
          persona_a:      personaA,
          persona_b:      personaB,
          topic:          topic.trim(),
          mode,
        },
      })
    } catch {
      setError('Something broke. Try again.')
      setLoading(false)
    }
  }

  const canStart = !!personaA && !!personaB && !!topic.trim() && personaA.id !== personaB.id

  const filtered = personas.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="h-screen flex flex-col overflow-hidden bg-[#FAFAF9]">

        {/* ── STAGE ── */}
        <div className="flex-shrink-0 bg-white border-b border-[#EBEBEB] shadow-sm">
          <div className="max-w-4xl mx-auto px-8 py-6 flex items-center gap-6">

            <FighterSlot
              persona={personaA}
              side="A"
              isActive={activeSlot === 'A'}
              onClick={() => setActiveSlot('A')}
              onClear={() => { setPersonaA(null); setActiveSlot('A') }}
            />

            <div className="flex flex-col items-center gap-4 flex-shrink-0">
              <VSAnimation size="lg" />
              <div className="w-full max-w-xs space-y-2.5">
                <textarea
                  rows={2}
                  placeholder="What are they arguing about?"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="w-full text-sm bg-[#FAFAF9] border border-[#EBEBEB] rounded-xl px-4 py-2.5 text-[#111111] placeholder-[#888888] focus:outline-none focus:border-[#E8001A] focus:ring-1 focus:ring-[#E8001A]/20 resize-none transition-colors"
                />
                <div className="flex flex-wrap gap-1.5">
                  {MODES.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      className="rounded-full text-xs font-medium px-2.5 py-1 border transition-all"
                      style={
                        mode === m.id
                          ? { background: '#E8001A', color: '#fff', borderColor: '#E8001A' }
                          : { background: 'transparent', color: '#888888', borderColor: '#EBEBEB' }
                      }
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                {error && <p className="font-mono text-xs text-[#E8001A]">{error}</p>}
                <button
                  onClick={handleStart}
                  disabled={!canStart || loading}
                  className="w-full py-3 text-sm font-bold bg-[#E8001A] text-white rounded-xl hover:bg-[#c40016] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {loading ? 'Loading...' : 'Start battle'}
                </button>
              </div>
            </div>

            <FighterSlot
              persona={personaB}
              side="B"
              isActive={activeSlot === 'B'}
              onClick={() => setActiveSlot('B')}
              onClear={() => { setPersonaB(null); setActiveSlot('B') }}
            />
          </div>
        </div>

        {/* ── CHARACTER GRID ── */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Grid header */}
          <div className="flex-shrink-0 px-8 pt-5 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-bold text-xl text-[#111111]">
                Select {activeSlot === 'A' ? 'first' : 'second'} combatant
              </span>
              <span
                className="font-mono text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{
                  background: activeSlot === 'A' ? '#2563EB20' : '#E8001A20',
                  color: activeSlot === 'A' ? '#2563EB' : '#E8001A',
                }}
              >
                Slot {activeSlot}
              </span>
            </div>
            <input
              type="text"
              placeholder="Search personas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="font-mono text-xs bg-white border border-[#EBEBEB] rounded-lg px-3 py-1.5 text-[#111111] placeholder-[#888888] focus:outline-none focus:border-[#E8001A] transition-colors w-44"
            />
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto px-8 pb-6">
            <div className="grid grid-cols-7 gap-2">
              <CreateTile onClick={() => setCreateFor(activeSlot)} />
              {filtered.map(p => (
                <CharacterTile
                  key={p.id}
                  persona={p}
                  isSelectedA={personaA?.id === p.id}
                  isSelectedB={personaB?.id === p.id}
                  onClick={() => selectPersona(p)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {createFor && (
        <CreatePersonaModal
          onClose={() => setCreateFor(null)}
          onCreated={handlePersonaCreated}
        />
      )}
    </>
  )
}
