import type { Persona } from '../types'

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

interface Props {
  persona: Persona
  size?: number
  className?: string
}

export default function PersonaAvatar({ persona, size = 72, className = '' }: Props) {
  const accent = persona.color || '#60a5fa'
  const src = persona.image
    ? `data:image/png;base64,${persona.image}`
    : persona.image_url ?? null

  if (src) {
    return (
      <img
        src={src}
        alt={persona.name}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold text-white ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.28,
        background: `linear-gradient(135deg, ${accent}, ${accent}CC)`,
      }}
    >
      {initials(persona.name)}
    </div>
  )
}
