import { useState } from 'react'

const KEY = 'argumentai_building_tasks'

export interface BuildingTask {
  task_id: string
  persona_name: string
  started_at: number
}

function readStorage(): BuildingTask[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

function writeStorage(tasks: BuildingTask[]) {
  localStorage.setItem(KEY, JSON.stringify(tasks))
}

export function useBuildingTasks() {
  const [tasks, setTasks] = useState<BuildingTask[]>(readStorage)

  function addTask(task_id: string, persona_name: string) {
    const next = [...readStorage().filter(t => t.task_id !== task_id),
                  { task_id, persona_name, started_at: Date.now() }]
    writeStorage(next)
    setTasks(next)
  }

  function removeTask(task_id: string) {
    const next = readStorage().filter(t => t.task_id !== task_id)
    writeStorage(next)
    setTasks(next)
  }

  function refresh() {
    setTasks(readStorage())
  }

  return { tasks, addTask, removeTask, refresh }
}
