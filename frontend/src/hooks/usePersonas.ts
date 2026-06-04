import { useState, useEffect } from 'react'
import { loadPersonas } from '../api/client'
import type { Persona } from '../types'

export function usePersonas() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    function fetch() {
      loadPersonas()
        .then(res => {
          if (!mounted) return
          setPersonas(res.personas)
          setLoading(false)
        })
        .catch(() => {
          if (!mounted) return
          setError('Could not reach server.')
          setLoading(false)
        })
    }

    fetch()
    const id = setInterval(fetch, 2000)
    return () => { mounted = false; clearInterval(id) }
  }, [])

  return { personas, setPersonas, loading, error }
}
