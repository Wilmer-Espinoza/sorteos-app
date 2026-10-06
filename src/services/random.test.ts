import { describe, expect, it } from 'vitest'
import { cryptoRandomInt, selectParticipants } from './random'
import { createParticipant } from './participants'

describe('selección criptográfica', () => {
  it('siempre produce índices dentro del rango', () => {
    for (let index = 0; index < 500; index += 1) expect(cryptoRandomInt(7)).toBeGreaterThanOrEqual(0)
    for (let index = 0; index < 500; index += 1) expect(cryptoRandomInt(7)).toBeLessThan(7)
  })

  it('selecciona sin reemplazo y no modifica la base maestra', () => {
    const master = Array.from({ length: 10 }, (_, index) => createParticipant(`Persona ${index + 1}`))
    const snapshot = JSON.stringify(master)
    const winners = selectParticipants(master, 5, true, false)
    expect(new Set(winners.map((winner) => winner.id)).size).toBe(5)
    expect(JSON.stringify(master)).toBe(snapshot)
    expect(master).toHaveLength(10)
  })
})
