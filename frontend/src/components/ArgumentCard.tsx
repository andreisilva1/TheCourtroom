import type { Argument, Persona } from '../types'

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

interface Props {
  argument: Argument
  personaA: Persona
  personaB: Persona
}

export default function ArgumentCard({ argument, personaA, personaB }: Props) {
  const isA = argument.speaker_id === personaA.id
  const persona = isA ? personaA : personaB
  const accent = persona.color || (isA ? '#2563EB' : '#E8001A')
  const enterClass = isA ? 'arg-from-left' : 'arg-from-right'

  return (
    <div className={`${enterClass} px-6 py-2`}>
      <div
        className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden flex flex-row gap-3 p-4"
        style={{ borderLeft: `3px solid ${accent}` }}
      >
        {/* Small avatar circle */}
        <div
          className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white text-xs"
          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}CC)` }}
        >
          {initials(persona.name)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm" style={{ color: accent }}>
              {persona.name}
            </span>
            <span className="font-mono text-xs bg-[#F3F4F6] text-[#888888] px-1.5 py-0.5 rounded">
              #{argument.turn}
            </span>
          </div>
          <p className="text-sm text-[#111111] leading-relaxed">{argument.content}</p>
        </div>
      </div>
    </div>
  )
}
