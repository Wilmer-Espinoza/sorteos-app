import type { ListState, Participant } from '../types'

export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function canonicalName(value: string): string {
  return normalizeName(value).toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function createParticipant(name: string, metadata?: Record<string, string>): Participant {
  return {
    id: crypto.randomUUID(),
    name: normalizeName(name),
    metadata,
    weight: 1,
    createdAt: new Date().toISOString(),
  }
}

export function countDuplicates(participants: readonly Participant[]): number {
  const seen = new Set<string>()
  let duplicates = 0
  participants.forEach((participant) => {
    const key = canonicalName(participant.name)
    if (seen.has(key)) duplicates += 1
    else seen.add(key)
  })
  return duplicates
}

export function getEligibleParticipants(
  masterParticipants: readonly Participant[],
  listState: ListState,
  excludePreviousWinners: boolean,
  ignoreDuplicates: boolean,
): Participant[] {
  const excluded = new Set(listState.excludedIds)
  const winners = new Set(listState.winnerIds)
  const seenNames = new Set<string>()
  return masterParticipants.filter((participant) => {
    if (excluded.has(participant.id)) return false
    if (excludePreviousWinners && winners.has(participant.id)) return false
    if (!ignoreDuplicates) return true
    const key = canonicalName(participant.name)
    if (seenNames.has(key)) return false
    seenNames.add(key)
    return true
  })
}
