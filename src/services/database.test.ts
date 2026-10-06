import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { clearDatabase, loadState, saveState } from './database'
import { createInitialState } from './defaults'
import { createParticipant } from './participants'

describe('persistencia IndexedDB', () => {
  afterEach(async () => clearDatabase())

  it('guarda y recupera una base completa', async () => {
    const state = createInitialState()
    state.lists[0].participants = Array.from({ length: 10 }, (_, index) => createParticipant(`Persona ${index + 1}`))
    await saveState(state)
    const restored = await loadState()
    expect(restored?.lists[0].participants).toHaveLength(10)
    expect(restored?.lists[0].participants[9].name).toBe('Persona 10')
  })

  it('conserva colores, textos y logos personalizados dentro de IndexedDB', async () => {
    const state = createInitialState()
    state.brandingSettings = {
      ...state.brandingSettings,
      preset: 'custom',
      appName: 'Evento personalizado',
      colors: { ...state.brandingSettings.colors, primary: '#E26A24' },
      logos: {
        ...state.brandingSettings.logos,
        primary: {
          src: 'data:image/png;base64,iVBORw0KGgo=',
          name: 'logo-personalizado.png',
          mimeType: 'image/png',
          isCustom: true,
        },
      },
    }
    state.settings.effects = {
      ...state.settings.effects,
      animationPreset: 'custom',
      animationDuration: 9,
      confettiDuration: 6,
      winnerSoundMaxDuration: 5,
      winnerSound: { src: 'data:audio/wav;base64,UklGRg==', name: 'sonido.wav', mimeType: 'audio/wav', isCustom: true },
    }

    await saveState(state)
    const restored = await loadState()

    expect(restored?.brandingSettings.appName).toBe('Evento personalizado')
    expect(restored?.brandingSettings.colors.primary).toBe('#E26A24')
    expect(restored?.brandingSettings.logos.primary.name).toBe('logo-personalizado.png')
    expect(restored?.brandingSettings.logos.primary.src).toMatch(/^data:image\/png;base64,/)
    expect(restored?.settings.effects.animationDuration).toBe(9)
    expect(restored?.settings.effects.confettiDuration).toBe(6)
    expect(restored?.settings.effects.winnerSound.src).toMatch(/^data:audio\/wav;base64,/)
  })
})
