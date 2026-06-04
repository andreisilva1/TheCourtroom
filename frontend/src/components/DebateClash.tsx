import { useEffect, useState } from 'react'
import PersonaAvatar from './PersonaAvatar'
import type { Persona } from '../types'

const CLASH_MESSAGES = [
  'Debating...',
  'Exchanging arguments...',
  'Building counter-argument...',
  'Gathering thoughts...',
]

export default function DebateClash({ personaA, personaB }: { personaA: Persona; personaB: Persona }) {
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex(i => (i + 1) % CLASH_MESSAGES.length)
    }, 1500)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#111111] via-[#1a1a1a] to-[#111111] flex items-center justify-center overflow-hidden">
      {/* Background grid effect */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(232, 0, 26, 0.1) 25%, rgba(232, 0, 26, 0.1) 26%, transparent 27%, transparent 74%, rgba(232, 0, 26, 0.1) 75%, rgba(232, 0, 26, 0.1) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(232, 0, 26, 0.1) 25%, rgba(232, 0, 26, 0.1) 26%, transparent 27%, transparent 74%, rgba(232, 0, 26, 0.1) 75%, rgba(232, 0, 26, 0.1) 76%, transparent 77%, transparent)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-8">
        {/* Personas face-off */}
        <div className="flex items-center justify-between w-full max-w-4xl gap-8 mb-12">
          {/* Persona A - Left */}
          <div className="flex flex-col items-center gap-4 animate-pulse">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-[#2563EB] shadow-[0_0_30px_#2563EB] bg-white flex items-center justify-center">
                <PersonaAvatar persona={personaA} size={120} />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#2563EB] text-white font-bold px-3 py-1 rounded-full text-sm whitespace-nowrap">
                Defender
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-white">{personaA.name}</h3>
            </div>
          </div>

          {/* VS Center */}
          <div className="flex flex-col items-center gap-6 flex-shrink-0">
            <div className="text-5xl font-black text-[#E8001A] animate-bounce" style={{ animationDuration: '0.8s' }}>
              VS
            </div>
            <div className="w-1 h-24 bg-gradient-to-b from-[#E8001A] to-transparent rounded-full" />
          </div>

          {/* Persona B - Right */}
          <div className="flex flex-col items-center gap-4 animate-pulse" style={{ animationDelay: '0.3s' }}>
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-[#E8001A] shadow-[0_0_30px_#E8001A] bg-white flex items-center justify-center">
                <PersonaAvatar persona={personaB} size={120} />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#E8001A] text-white font-bold px-3 py-1 rounded-full text-sm whitespace-nowrap">
                Attacker
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-white">{personaB.name}</h3>
            </div>
          </div>
        </div>

        {/* Status message */}
        <div className="mt-12 text-center">
          <p className="font-mono text-sm text-[#888888] mb-4 min-h-[20px]">
            {CLASH_MESSAGES[msgIndex]}
          </p>
          <div className="flex justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#E8001A] animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-[#E8001A] animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 rounded-full bg-[#E8001A] animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      </div>

      {/* Animated lines effect */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute left-1/4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#2563EB] via-transparent to-transparent opacity-20 animate-pulse" />
        <div className="absolute right-1/4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#E8001A] via-transparent to-transparent opacity-20 animate-pulse" style={{ animationDelay: '0.3s' }} />
      </div>
    </div>
  )
}
