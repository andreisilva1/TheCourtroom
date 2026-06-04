import { useState } from 'react'
import PersonaCard from '../components/PersonaCard'
import CreatePersonaModal from '../components/CreatePersonaModal'
import { usePersonas } from '../hooks/usePersonas'
import type { Persona } from '../types'

export default function PersonasPage() {
  const { personas, setPersonas, loading } = usePersonas()
  const [showCreate, setShowCreate] = useState(false)

  function handleCreated(persona: Persona) {
    setPersonas(prev => [{ ...persona, loaded: false }, ...prev])
    setShowCreate(false)
  }

  const buildingCount = personas.filter(p => p.loaded === false).length

  return (
    <div className="p-8 min-h-screen bg-[#FAFAF9]">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="font-black text-3xl text-[#111111]">Personas</h2>
          <p className="text-[#888888] text-sm mt-1">All reconstructed entities.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="text-sm px-5 py-2.5 bg-[#E8001A] text-white font-semibold rounded-lg hover:bg-[#c40016] transition-colors"
        >
          + Create persona
        </button>
      </div>

      {!loading && buildingCount > 0 && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-white rounded-lg border border-[#EBEBEB] w-fit shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="font-mono text-xs text-[#888888]">
            Building {buildingCount} persona{buildingCount !== 1 ? 's' : ''}… updates automatically
          </span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 bg-white rounded-2xl border border-[#EBEBEB] animate-pulse" />
          ))}
        </div>
      ) : personas.length === 0 ? (
        <div className="py-24 text-center space-y-3">
          <p className="text-[#888888] font-mono text-sm">No personas yet.</p>
          <button onClick={() => setShowCreate(true)} className="text-[#E8001A] font-semibold text-sm underline">
            Create the first one
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {personas.map(p => <PersonaCard key={p.id} persona={p} />)}
        </div>
      )}

      {showCreate && (
        <CreatePersonaModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
    </div>
  )
}
