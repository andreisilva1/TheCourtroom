import { useState } from 'react'
import { createPersona } from '../api/client'
import type { Persona, PersonaOption } from '../types'

interface Props {
  onClose: () => void
  onCreated: (persona: Persona) => void
}

const PERSONA_COLORS = ['#60a5fa', '#ef4444', '#a78bfa', '#34d399', '#fb923c', '#f472b6']

function pickColor(name: string) {
  return PERSONA_COLORS[name.charCodeAt(0) % PERSONA_COLORS.length]
}

type Step = 'form' | 'disambiguating'

export default function CreatePersonaModal({ onClose, onCreated }: Props) {
  const [step,     setStep]     = useState<Step>('form')
  const [name,     setName]     = useState('')
  const [maxRefs,  setMaxRefs]  = useState(100)
  const [error,    setError]    = useState('')
  const [options,  setOptions]  = useState<PersonaOption[]>([])
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(resolvedName?: string) {
    const finalName = resolvedName ?? name.trim()
    if (!finalName) return setError('Enter a name.')
    setError('')
    setLoading(true)
    try {
      const result = await createPersona(finalName, maxRefs)
      if (Array.isArray(result)) {
        setOptions(result)
        setStep('disambiguating')
        setLoading(false)
      } else {
        onCreated({
          id: result.persona_id,
          name: result.persona_name,
          description: '',
          indexed: false,
          loaded: false,
          max_references: result.max_references,
          color: pickColor(result.persona_name),
        })
      }
    } catch {
      setError('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-[#888888] tracking-widest uppercase">New Persona</span>
          <button onClick={onClose} className="font-mono text-xs text-[#888888] hover:text-[#111111] transition-colors">✕</button>
        </div>

        {step === 'form' && (
          <>
            <div className="space-y-4">
              <div>
                <label className="font-mono text-xs text-[#888888] uppercase tracking-wide block mb-1.5">Name</label>
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. Nietzsche, Batman, PostgreSQL..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  className="w-full text-sm bg-[#F9F9F7] border border-[#EBEBEB] rounded-lg px-3 py-2.5 text-[#111111] placeholder-[#888888] focus:outline-none focus:border-[#E8001A] focus:ring-1 focus:ring-[#E8001A]/20 transition-colors"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-mono text-xs text-[#888888] uppercase tracking-wide">Max references</label>
                  <span className="font-mono text-xs text-[#111111] font-semibold">{maxRefs}</span>
                </div>
                <input
                  type="range" min={10} max={500} step={10} value={maxRefs}
                  onChange={e => setMaxRefs(Number(e.target.value))}
                  className="w-full accent-[#E8001A]"
                />
                <div className="flex justify-between font-mono text-xs text-[#888888] mt-0.5">
                  <span>10</span><span>500</span>
                </div>
              </div>
            </div>
            {error && <p className="font-mono text-xs text-[#E8001A]">{error}</p>}
            <button
              onClick={() => handleSubmit()}
              disabled={!name.trim() || loading}
              className="w-full py-3 text-sm font-semibold bg-[#E8001A] text-white rounded-xl hover:bg-[#c40016] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create persona'}
            </button>
          </>
        )}

        {step === 'disambiguating' && (
          <>
            <p className="text-sm text-[#888888]">
              Multiple matches for <span className="text-[#111111] font-semibold">"{name}"</span>. Pick one:
            </p>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {options.map(opt => (
                <button
                  key={opt.name}
                  onClick={() => handleSubmit(opt.name)}
                  className="w-full text-left px-3 py-2.5 rounded-lg border border-transparent hover:border-[#EBEBEB] hover:bg-[#F9F9F7] transition-all"
                >
                  <div className="text-sm text-[#111111] font-medium">{opt.name}</div>
                  <div className="text-xs text-[#888888] mt-0.5 line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: opt.description }} />
                </button>
              ))}
            </div>
            <button onClick={() => setStep('form')} className="font-mono text-xs text-[#888888] hover:text-[#111111] transition-colors">
              ← back
            </button>
          </>
        )}
      </div>
    </div>
  )
}
