import { useState, useEffect, useCallback } from 'react'
import PersonaCard from '../components/PersonaCard'
import {
  checkHealth, loadPersonas, createPersona, getTaskStatus,
} from '../api/client'
import type { Persona } from '../types'

export default function HomePage() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [systemReady, setSystemReady] = useState(false)
  const [filter, setFilter] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const refreshPersonas = useCallback(async () => {
    try {
      const data = await loadPersonas()
      setPersonas(data)
    } catch (err) {
      console.error('Failed to load personas', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    const poll = async () => {
      const ready = await checkHealth()
      if (!active) return
      setSystemReady(ready)
      if (!ready) setTimeout(poll, 3000)
    }
    poll()
    return () => { active = false }
  }, [])

  useEffect(() => { refreshPersonas() }, [refreshPersonas])

  useEffect(() => {
    const anyBuilding = personas.some(p => p.loaded === false)
    if (!anyBuilding) return
    const id = setInterval(refreshPersonas, 3000)
    return () => clearInterval(id)
  }, [personas, refreshPersonas])

  const handleCreate = async () => {
    if (!newName.trim() || creating) return
    setCreating(true)
    setCreateError('')

    try {
      const result = await createPersona(newName.trim())

      if (result.needs_selection) {
        setCreateError('No defendant found by that name. Try a more specific one.')
        setCreating(false)
        return
      }

      setNewName('')
      setShowModal(false)
      await refreshPersonas()

      if (result.task_id) {
        const taskId = result.task_id
        const poll = setInterval(async () => {
          const status = await getTaskStatus(taskId)
          if (status.state === 'SUCCESS' || status.state === 'FAILURE') {
            clearInterval(poll)
            refreshPersonas()
          }
        }, 3000)
      }
    } catch (err) {
      console.error('Create persona failed', err)
      setCreateError('Failed to summon defendant. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const filtered = personas.filter(
    p => !filter || p.name.toLowerCase().includes(filter.toLowerCase()),
  )

  return (
    <div className="min-h-screen courtroom-bg">
      {/* Header */}
      <div className="relative z-[1] text-center pt-16 pb-9 px-6">
        <div className="crest-sway inline-block text-5xl mb-2 drop-shadow-[0_0_18px_rgba(212,162,58,.6)]">⚖️</div>
        <h1 className="font-title font-bold text-[76px] leading-none tracking-[6px] text-parchment [text-shadow:0_2px_0_#000,0_0_30px_rgba(212,162,58,.35)]">
          THE <span className="text-gold-bright">COURTROOM</span>
        </h1>
        <p className="italic text-xl text-[#cbb990] mt-1.5">
          Pick a defendant. Dismantle their hot take. Object before time runs out.
        </p>
        <div className="w-[220px] h-[3px] mx-auto mt-5 bg-gradient-to-r from-transparent via-gold to-transparent" />
      </div>

      {/* System initializing banner */}
      {!systemReady && (
        <div className="relative z-[1] max-w-[1200px] mx-auto px-8 mb-5">
          <div className="inline-flex items-center gap-2.5 rounded-md px-4 py-2.5 bg-gold/10 border border-gold/40 font-mono text-xs text-gold-bright">
            <span className="pulse-dot w-2 h-2 rounded-full bg-gold" />
            The court is assembling its witnesses… defendants unlock when ready.
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="relative z-[1] max-w-[1200px] mx-auto px-8 mb-7 flex items-center justify-between gap-4">
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Search defendants..."
          className="font-mono text-xs bg-black/35 border border-wood-light text-parchment placeholder:text-[#8a7a5e] px-3.5 py-2.5 rounded-md w-60 focus:outline-none focus:border-gold"
        />
        <button
          onClick={() => setShowModal(true)}
          className="font-title font-semibold tracking-[1.5px] uppercase text-[13px] text-white px-[22px] py-3 rounded-md bg-gradient-to-b from-court-red-bright to-court-red shadow-[0_4px_0_#7a0f1c,0_6px_14px_rgba(0,0,0,.4)] active:translate-y-[3px] active:shadow-[0_1px_0_#7a0f1c] transition-all"
        >
          + Summon defendant
        </button>
      </div>

      {/* Grid */}
      <div className="relative z-[1] max-w-[1200px] mx-auto px-8 pb-20 grid grid-cols-4 gap-[22px]">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[260px] rounded-[10px] border border-wood-light bg-[#160d07] shimmer" />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-4 py-20 text-center text-[#8a7a5e] italic text-lg">
            The courtroom is empty.{' '}
            <button onClick={() => setShowModal(true)} className="text-gold-bright underline">
              Summon your first defendant.
            </button>
          </div>
        ) : (
          filtered.map(p => <PersonaCard key={p.id} persona={p} disabled={!systemReady} />)
        )}
      </div>

      {/* Create modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => !creating && setShowModal(false)}
        >
          <div
            className="courtroom-bg rounded-xl p-6 w-full max-w-md border border-wood-light shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative z-[1]">
              <h2 className="font-title font-bold text-2xl tracking-wide text-parchment mb-1">Summon a defendant</h2>
              <p className="text-sm text-[#cbb990] italic mb-4">
                The court will pull their record from different sources and build a case file.
              </p>
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="e.g. Steve Jobs"
                disabled={creating}
                className="w-full bg-black/40 border border-wood-light text-parchment placeholder:text-[#8a7a5e] rounded-md px-3.5 py-2.5 mb-3 focus:outline-none focus:border-gold"
              />
              {createError && <p className="text-sm text-court-red-bright mb-3">{createError}</p>}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={creating}
                  className="px-4 py-2 text-sm text-[#cbb990] hover:bg-white/5 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !newName.trim()}
                  className="font-title font-semibold tracking-wide uppercase text-sm text-white px-5 py-2 rounded-md bg-gradient-to-b from-court-red-bright to-court-red disabled:opacity-50"
                >
                  {creating ? 'Summoning…' : 'Summon'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
