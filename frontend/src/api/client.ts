import axios from 'axios'
import type {
  LoadPersonasResponse, ArgueResponse, TurnResponse, DebateMode,
  PersonaOption, CreatePersonaTaskResponse, TaskStatus,
} from '../types'

const api     = axios.create({ baseURL: '/', timeout: 15000 })
export const apiLong = axios.create({ baseURL: '/', timeout: 35000 })

export async function loadPersonas(wait = false): Promise<LoadPersonasResponse> {
  const client = wait ? apiLong : api
  const { data } = await client.get('/load_personas', { params: wait ? { wait: '1' } : undefined })
  const personas = Array.isArray(data) ? data : (data.personas ?? [])
  return { personas }
}

export async function argueBattle(
  personaAId: string,
  personaBId: string,
  topic: string,
  mode: DebateMode = 'SERIOUS',
): Promise<ArgueResponse> {
  const { data } = await api.post<ArgueResponse>('/argue_battle', {
    persona_a_id: personaAId,
    persona_b_id: personaBId,
    topic,
    mode,
  })
  return data
}

export async function battleTurn(
  battleId: string,
  _speakerId: string,
  _turn: number,
): Promise<TurnResponse> {
  const { data } = await api.post<TurnResponse>('/battle_turn', { battle_id: battleId })
  return data
}

export async function createPersona(
  name: string,
  maxReferences: number = 100,
): Promise<PersonaOption[] | CreatePersonaTaskResponse> {
  const { data } = await api.post('/create_persona', null, {
    params: { persona_name: name, max_references: maxReferences },
  })
  return data
}

export async function getTaskStatus(taskId: string): Promise<TaskStatus> {
  const { data } = await api.get<TaskStatus>(`/task/${taskId}`)
  return data
}
