import type { Persona } from '../types'
import PersonaAvatar from './PersonaAvatar'

interface Props {
  persona: Persona
  side: 'left' | 'right'
  isActive: boolean
  isShaking?: boolean
  turnCount?: number
}

export default function FighterCard({ persona, side, isActive, isShaking, turnCount = 0 }: Props) {
  const accent = persona.color || (side === 'left' ? '#2563EB' : '#E8001A')

  return (
    <div
      className={`bg-white rounded-2xl p-5 flex flex-col items-center gap-3 h-full transition-all duration-500 ${isShaking ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
      style={{
        opacity: isActive ? 1 : 0.3,
        boxShadow: isActive
          ? `0 0 0 2px ${accent}, 0 8px 32px ${accent}30`
          : undefined,
      }}
    >
      <div className={isActive ? 'breathe' : ''}>
        <PersonaAvatar persona={persona} size={96} />
      </div>

      <div className="text-center">
        <div className="font-semibold text-sm leading-tight" style={{ color: accent }}>
          {persona.name}
        </div>
        {persona.category && (
          <div className="font-mono text-xs text-[#888888] mt-0.5 uppercase tracking-wide">
            {persona.category}
          </div>
        )}
      </div>

      <div className="font-mono text-xs text-[#888888]">
        {turnCount} {turnCount === 1 ? 'turn' : 'turns'}
      </div>

      {isActive && (
        <div className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: accent }}
          />
          <span className="font-mono text-xs text-[#888888] italic">speaking...</span>
        </div>
      )}
    </div>
  )
}
