import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Persona } from '../types'
import PersonaAvatar from './PersonaAvatar'

const STATUS_MESSAGES = [
  'Resolving identity...',
  'Collecting sources...',
  'Building semantic memory...',
  'Indexing references...',
  'Constructing persona...',
]

function BuildingCard({ persona }: { persona: Persona }) {
  const [i, setI] = useState(persona.id.charCodeAt(0) % STATUS_MESSAGES.length)

  useEffect(() => {
    const id = setInterval(() => setI(x => (x + 1) % STATUS_MESSAGES.length), 2500)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="rounded-[10px] overflow-hidden border border-wood-light bg-gradient-to-b from-[#20140c] to-[#160d07] select-none">
      <div className="h-[180px] shimmer" />
      <div className="text-center font-title font-semibold text-lg tracking-wide pt-3.5 pb-1 text-parchment/50">
        {persona.name}
      </div>
      <div className="text-center font-mono text-[10px] tracking-widest text-gold pb-4">
        ⚙ BUILDING CASE FILE…
        <div className="mt-1 text-parchment/30 normal-case tracking-normal">{STATUS_MESSAGES[i]}</div>
      </div>
    </div>
  )
}

interface Props {
  persona: Persona
  disabled?: boolean
}

export default function PersonaCard({ persona, disabled = false }: Props) {
  const navigate = useNavigate()

  if (persona.loaded === false) {
    return <BuildingCard persona={persona} />
  }

  const handleClick = () => {
    if (disabled) return
    navigate(`/ace-attorney/${persona.id}`)
  }

  return (
    <div
      onClick={handleClick}
      title={disabled ? 'The court is still assembling…' : `Challenge ${persona.name}`}
      className={`group reveal-up relative rounded-[10px] overflow-hidden border border-wood-light bg-gradient-to-b from-[#20140c] to-[#160d07] shadow-[0_8px_20px_rgba(0,0,0,.5)] transition-all duration-200 ${
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer hover:-translate-y-2 hover:border-gold hover:shadow-[0_16px_34px_rgba(192,24,42,.35)]'
      }`}
    >
      {/* gold inner frame on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-[10px] ring-2 ring-gold/0 group-hover:ring-gold/60 transition" />

      {/* portrait */}
      <div className="h-[180px] flex items-center justify-center bg-[radial-gradient(circle_at_50%_35%,#3a2718,#160d07)] grayscale-[.5] group-hover:grayscale-0 transition">
        <PersonaAvatar persona={persona} size={120} />
      </div>

      <div className="text-center font-title font-semibold text-lg tracking-wide pt-3.5 pb-1.5 text-parchment">
        {persona.name}
      </div>
      <div className="text-center font-mono text-[10px] tracking-widest text-court-green pb-4">
        ● READY
      </div>

      {/* challenge banner on hover */}
      {!disabled && (
        <div className="absolute bottom-0 left-0 right-0 pt-7 pb-3 text-center font-title font-bold tracking-[2px] uppercase text-sm text-white bg-gradient-to-t from-court-red to-transparent translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition">
          Challenge ▸
        </div>
      )}
    </div>
  )
}
