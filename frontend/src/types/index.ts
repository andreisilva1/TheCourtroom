export interface Persona {
  id: string
  name: string
  description: string
  image?: string
  image_url?: string
  indexed: boolean
  loaded?: boolean
  max_references?: number
  battles?: number
  wins?: number
  category?: string
  style?: string
  color?: string
}

export interface Argument {
  speaker_id: string
  content: string
  turn: number
  confidence?: number
  impact?: number
  retrieved_context?: string[]
  rhetorical_style?: string
}

export interface BattleState {
  battle_id: string
  persona_a: Persona
  persona_b: Persona
  topic: string
  mode: DebateMode
  arguments: Argument[]
  active_speaker: string
  status: 'active' | 'ended'
  round: number
}

export type DebateMode = 'SERIOUS' | 'CHAOTIC' | 'ACADEMIC' | 'STREET_FIGHT' | 'COURTROOM' | 'PODCAST'

export interface LoadPersonasResponse {
  personas: Persona[]
}

export interface ArgueResponse {
  battle_id: string
  starts_with: string
  message: Argument
}

export interface TurnResponse {
  speaker_id: string
  content: string
  turn: number
  confidence?: number
  impact?: number
  retrieved_context?: string[]
  rhetorical_style?: string
}

export interface PersonaOption {
  name: string
  description: string
}

export interface CreatePersonaTaskResponse {
  task_id: string
  persona_id: string
  persona_name: string
  max_references: number
}

export interface TaskStatus {
  state: 'PENDING' | 'PROGRESS' | 'SUCCESS' | 'FAILURE'
  current?: number
  total?: number
  persona_id?: string
  persona_name?: string
}

export interface ActivityItem {
  id: string
  persona_a: string
  persona_b: string
  topic: string
  result: string
  winner?: string
  time: string
  rounds: number
}
