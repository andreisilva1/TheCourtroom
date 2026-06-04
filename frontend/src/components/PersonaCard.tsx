import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Persona } from '../types'
import PersonaAvatar from './PersonaAvatar'

const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  PHILOSOPHER:  { bg: '#EDE9FE', text: '#7C3AED' },
  ATHLETE:      { bg: '#D1FAE5', text: '#065F46' },
  'TECH TITAN': { bg: '#DBEAFE', text: '#1E40AF' },
  HISTORICAL:   { bg: '#FEF3C7', text: '#92400E' },
  FICTIONAL:    { bg: '#FCE7F3', text: '#9D174D' },
  TECHNOLOGY:   { bg: '#CFFAFE', text: '#155E75' },
}

function getCategoryStyle(category?: string) {
  if (!category) return { bg: '#F3F4F6', text: '#6B7280' }
  return CATEGORY_STYLES[category.toUpperCase()] ?? { bg: '#F3F4F6', text: '#6B7280' }
}

const STATUS_MESSAGES = [
  'Resolving identity...',
  'Collecting sources...',
  'Building semantic memory...',
  'Indexing references...',
  'Constructing persona...',
  'Preparing debate profile...',
]

function LoadingPersonaCard({ persona }: { persona: Persona }) {
  const startIndex = persona.id.charCodeAt(0) % STATUS_MESSAGES.length
  const [msgIndex, setMsgIndex] = useState(startIndex)
  const borderColor = persona.color || '#6366F1'

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex(i => (i + 1) % STATUS_MESSAGES.length)
    }, 2500)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden select-none border-2 border-dashed border-pulse"
      style={{ borderColor: `${borderColor}4D` }}
    >
      {/* Colored shimmer band */}
      <div className="h-24 w-full shimmer-bg" />

      {/* Avatar area */}
      <div className="flex flex-col items-center px-4 pb-4">
        <div className="-mt-9 z-10 relative">
          <div className="w-[68px] h-[68px] rounded-full shimmer-bg border-4 border-white shadow-sm" />
        </div>

        <div className="mt-2 text-center w-full">
          {/* Name skeleton */}
          <div className="mx-auto mt-1 h-4 w-28 rounded-full shimmer-bg" />

          {/* Status badge */}
          <div className="mt-2 flex items-center justify-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#CCCCCC]" />
            <span className="font-mono text-xs text-[#888888]">Building</span>
          </div>

          {/* Cycling status message */}
          <p className="mt-2 font-mono text-[11px] text-[#AAAAAA] leading-relaxed min-h-[16px]">
            {STATUS_MESSAGES[msgIndex]}
          </p>
        </div>

        <div className="mt-3 pt-3 border-t border-[#EBEBEB] w-full flex items-center justify-between">
          <span className="font-mono text-[10px] text-[#BBBBBB]">
            {persona.max_references != null ? `${persona.max_references} references requested` : ''}
          </span>
          <button
            disabled
            className="text-[#CCCCCC] font-medium text-sm cursor-not-allowed"
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PersonaCard({ persona }: { persona: Persona }) {
  const navigate = useNavigate()
  const accent = persona.color || '#60a5fa'
  const catStyle = getCategoryStyle(persona.category)
  const isLoading = persona.loaded === false

  if (isLoading) {
    return <LoadingPersonaCard persona={persona} />
  }

  return (
    <div
      className="reveal-up bg-white rounded-2xl border border-[#EBEBEB] shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] hover:-translate-y-1 cursor-pointer"
      onClick={() => navigate('/confront', { state: { preselect: persona } })}
    >
      {/* Colored header band */}
      <div
        className="h-24 w-full"
        style={{ background: `${accent}26` }}
      />

      {/* Avatar overlapping */}
      <div className="flex flex-col items-center px-4 pb-4">
        <div className="-mt-9 shadow-md rounded-full relative z-10">
          <div className="relative">
            <PersonaAvatar persona={persona} size={68} />
            <div className="absolute top-1 right-0.5 flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
            </div>
          </div>
        </div>

        <div className="mt-2 text-center w-full">
          <div className="font-semibold text-base text-[#111111] leading-tight">{persona.name}</div>

          {/* Ready badge */}
          <div className="mt-1 flex items-center justify-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="font-mono text-[10px] text-green-600 font-medium">Ready</span>
          </div>

          {persona.category && (
            <span
              className="mt-1.5 rounded-full text-xs font-medium px-2 py-0.5 inline-block"
              style={{ background: catStyle.bg, color: catStyle.text }}
            >
              {persona.category}
            </span>
          )}

          <p className="text-xs text-[#888888] mt-2 leading-relaxed line-clamp-2">
            {persona.description || ' '}
          </p>
        </div>

        <div className="mt-3 pt-3 border-t border-[#EBEBEB] w-full flex items-center justify-between">
          <div className="flex gap-3">
            {persona.battles != null && (
              <span className="font-mono text-xs text-[#888888]">
                <span className="font-semibold text-[#111111]">{persona.battles}</span> battles
              </span>
            )}
            {persona.wins != null && (
              <span className="font-mono text-xs text-[#888888]">
                <span className="font-semibold" style={{ color: accent }}>{persona.wins}</span> wins
              </span>
            )}
          </div>
          <button
            className="text-[#E8001A] font-medium text-sm hover:underline"
            onClick={e => { e.stopPropagation(); navigate('/confront', { state: { preselect: persona } }) }}
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}
