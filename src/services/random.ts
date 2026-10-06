import type { Participant } from '../types'

const UINT32_RANGE = 0x1_0000_0000

/** Returns an unbiased integer in [0, maxExclusive) using rejection sampling. */
export function cryptoRandomInt(maxExclusive: number): number {
  if (!Number.isSafeInteger(maxExclusive) || maxExclusive <= 0 || maxExclusive > UINT32_RANGE) {
    throw new RangeError('El límite debe ser un entero entre 1 y 2^32')
  }
  const limit = UINT32_RANGE - (UINT32_RANGE % maxExclusive)
  const sample = new Uint32Array(1)
  do {
    crypto.getRandomValues(sample)
  } while (sample[0] >= limit)
  return sample[0] % maxExclusive
}

export function cryptoShuffle<T>(values: readonly T[]): T[] {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = cryptoRandomInt(index + 1)
    ;[result[index], result[target]] = [result[target], result[index]]
  }
  return result
}

function weightedPick(pool: readonly Participant[]): Participant {
  const weights = pool.map((participant) => Math.max(1, Math.floor(participant.weight ?? 1)))
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  if (total > 0xffff_ffff) throw new RangeError('La suma de pesos es demasiado grande')
  let cursor = cryptoRandomInt(total)
  for (let index = 0; index < pool.length; index += 1) {
    if (cursor < weights[index]) return pool[index]
    cursor -= weights[index]
  }
  return pool[pool.length - 1]
}

export function selectParticipants(
  eligible: readonly Participant[],
  count: number,
  withoutReplacement: boolean,
  weighted: boolean,
): Participant[] {
  if (!Number.isSafeInteger(count) || count < 1) throw new RangeError('Cantidad de ganadores inválida')
  if (eligible.length === 0 || (withoutReplacement && count > eligible.length)) {
    throw new RangeError('No hay suficientes participantes disponibles')
  }
  const pool = [...eligible]
  const selected: Participant[] = []
  for (let index = 0; index < count; index += 1) {
    const winner = weighted ? weightedPick(pool) : pool[cryptoRandomInt(pool.length)]
    selected.push(winner)
    if (withoutReplacement) pool.splice(pool.findIndex((item) => item.id === winner.id), 1)
  }
  return selected
}
