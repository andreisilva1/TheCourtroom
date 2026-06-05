import axios from 'axios'
import type {
  Persona, CreatePersonaResponse, TaskStatus,
  StartDebateResponse, ArgueResponse, ObjectionResponse,
} from '../types'

// API port is baked at build time (VITE_API_PORT, from docker-compose / .env),
// defaulting to 8001. The host stays dynamic so it works on localhost and on a
// remote host alike.
const apiPort = import.meta.env.VITE_API_PORT || '8001'
const apiBaseURL = `${window.location.protocol}//${window.location.hostname}:${apiPort}`

const api = axios.create({ baseURL: apiBaseURL, timeout: 15000 })
const apiLong = axios.create({ baseURL: apiBaseURL, timeout: 210000 })

export async function checkHealth(): Promise<boolean> {
  try {
    const { data } = await api.get('/health')
    return data?.ready === true
  } catch {
    return false
  }
}

export async function loadPersonas(): Promise<Persona[]> {
  const { data } = await api.get<Persona[]>('/load_personas')
  return Array.isArray(data) ? data : []
}

export async function createPersona(
  name: string,
): Promise<CreatePersonaResponse> {
  const { data } = await api.post<CreatePersonaResponse>('/create_persona', null, {
    params: { persona_name: name },
  })
  return data
}

export async function getTaskStatus(taskId: string): Promise<TaskStatus> {
  const { data } = await api.get<TaskStatus>(`/task/${taskId}`)
  return data
}

export async function startDebate(personaId: string): Promise<StartDebateResponse> {
  const { data } = await apiLong.post<StartDebateResponse>('/ace-attorney/start', {
    persona_id: personaId,
  })
  return data
}

export async function argue(debateId: string, userArgument: string): Promise<ArgueResponse> {
  const { data } = await apiLong.post<ArgueResponse>('/ace-attorney/argue', {
    debate_id: debateId,
    user_argument: userArgument,
  })
  return data
}

export async function objection(debateId: string, userArguments: string[]): Promise<ObjectionResponse> {
  const { data } = await apiLong.post<ObjectionResponse>('/ace-attorney/objection', {
    debate_id: debateId,
    user_arguments: userArguments,
  })
  return data
}
