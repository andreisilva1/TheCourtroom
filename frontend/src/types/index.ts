export interface Persona {
  id: string
  name: string
  image?: string | null
  image_url?: string | null
  loaded?: boolean
  color?: string
}

export interface PersonaOption {
  name: string
  description: string
}

export interface CreatePersonaResponse {
  needs_selection: boolean
  options?: PersonaOption[]
  task_id?: string
  persona_id?: string
  persona_name?: string
  status?: string
}

export interface TaskStatus {
  state: 'PENDING' | 'PROGRESS' | 'SUCCESS' | 'FAILURE'
  current?: number
  total?: number
  persona_id?: string
}

export interface StartDebateResponse {
  debate_id?: string
  persona_name?: string
  persona_id?: string
  theme?: string
  fallacy_type?: string
  opening?: string
  error?: string
  status?: string
}

export interface ArgueResponse {
  debate_id?: string
  message_count?: number
  can_object?: boolean
  auto_objection_triggered?: boolean
  persona_response?: string
  persona_name?: string
  error?: string
}

export interface DebateHistoryEntry {
  debate_id: string
  persona_id: string
  persona_name: string
  persona_image?: string | null
  fallacy_theme: string
  fallacy_type?: string
  status?: string
  user_message_count: number
  example_refutation?: string | null
}

export interface ObjectionResponse {
  debate_id?: string
  won?: boolean
  reason?: string
  example_refutation?: string
  fallacy_theme?: string
  fallacy_type?: string
  error?: string
}
