import { describe, expect, it } from 'vitest'
import { countDuplicates, createParticipant, getEligibleParticipants, normalizeName } from './participants'

describe('base maestra y elegibilidad', () => {
  it('conserva tildes y normaliza espacios', () => {
    expect(normalizeName('  María   José López  ')).toBe('María José López')
  })

  it('excluye ganadores sin borrar participantes', () => {
    const master = ['José Pérez', 'María Torres', 'Ángel Oñate'].map((name) => createParticipant(name))
    const before = master.map((participant) => participant.id)
    const eligible = getEligibleParticipants(master, { excludedIds: [], winnerIds: [master[1].id] }, true, false)
    expect(eligible.map((participant) => participant.name)).toEqual(['José Pérez', 'Ángel Oñate'])
    expect(master.map((participant) => participant.id)).toEqual(before)
    expect(master).toHaveLength(3)
  })

  it('detecta e ignora copias únicamente en elegibilidad', () => {
    const master = ['María López', 'Maria Lopez', 'Carlos Ruiz'].map((name) => createParticipant(name))
    expect(countDuplicates(master)).toBe(1)
    expect(getEligibleParticipants(master, { excludedIds: [], winnerIds: [] }, false, true)).toHaveLength(2)
    expect(master).toHaveLength(3)
  })
})
