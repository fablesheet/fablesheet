// Online storage: calls the Fablesheet server REST API.
import type { CharacterBase } from '@fablesheet/core'

const BASE = (import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001') + '/api'

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(`${init?.method ?? 'GET'} ${path} → ${res.status}`)
  if (res.status === 204) return undefined as T
  return res.json()
}

export async function backendCreate(character: Omit<CharacterBase, 'id'>): Promise<CharacterBase> {
  return req<CharacterBase>('/characters', { method: 'POST', body: JSON.stringify(character) })
}

export async function backendGetAll(): Promise<CharacterBase[]> {
  return req<CharacterBase[]>('/characters')
}

export async function backendGetOne(id: string): Promise<CharacterBase> {
  return req<CharacterBase>(`/characters/${id}`)
}

export async function backendUpdate(id: string, character: CharacterBase): Promise<CharacterBase> {
  return req<CharacterBase>(`/characters/${id}`, { method: 'PUT', body: JSON.stringify(character) })
}

export async function backendDelete(id: string): Promise<void> {
  return req<void>(`/characters/${id}`, { method: 'DELETE' })
}

/** Quick reachability check — resolves true if the backend responds. */
export async function isBackendReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/characters`, { method: 'HEAD', signal: AbortSignal.timeout(3000) })
    return res.ok || res.status < 500
  } catch {
    return false
  }
}
