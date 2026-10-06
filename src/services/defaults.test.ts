import { describe, expect, it } from 'vitest'
import { defaultSettings, normalizeSettings } from './defaults'

describe('configuración de efectos', () => {
  it('usa los tiempos y volúmenes predeterminados solicitados', () => {
    expect(defaultSettings.effects).toMatchObject({
      animationDuration: 6,
      confettiDuration: 4,
      confettiIntensity: 'normal',
      selectionVolume: 60,
      winnerVolume: 80,
      winnerSoundMaxDuration: 4,
    })
  })

  it('migra una configuración anterior sin perder sus preferencias', () => {
    const restored = normalizeSettings({ ...defaultSettings, effects: undefined as never, duration: 'exciting', sound: true })
    expect(restored.effects.animationPreset).toBe('exciting')
    expect(restored.effects.animationDuration).toBe(10)
    expect(restored.effects.selectionSoundEnabled).toBe(true)
    expect(restored.effects.winnerSoundEnabled).toBe(true)
  })

  it('conserva valores personalizados persistidos', () => {
    const restored = normalizeSettings({ ...defaultSettings, effects: { ...defaultSettings.effects, animationPreset: 'custom', animationDuration: 9, confettiDuration: 6, winnerSoundMaxDuration: 5 } })
    expect(restored.effects.animationDuration).toBe(9)
    expect(restored.effects.confettiDuration).toBe(6)
    expect(restored.effects.winnerSoundMaxDuration).toBe(5)
  })
})
