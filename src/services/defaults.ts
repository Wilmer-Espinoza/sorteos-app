import type { AppState, DrawDuration, ParticipantList, Settings } from '../types'
import { defaultBranding } from '../branding/defaultBranding'

export const defaultSettings: Settings = {
  primaryColor: '#285b91',
  showSecondaryLogo: true,
  confetti: true,
  sound: false,
  animation: true,
  duration: 'normal',
  excludePreviousWinners: true,
  allowRepeatedWinners: false,
  ignoreDuplicates: false,
  weightedMode: false,
  revealMode: 'automatic',
  effects: {
    animationPreset: 'normal',
    animationDuration: 6,
    confettiDuration: 4,
    confettiIntensity: 'normal',
    selectionSoundEnabled: false,
    selectionVolume: 60,
    winnerSoundEnabled: false,
    winnerSoundMaxDuration: 4,
    winnerVolume: 80,
    winnerSound: {
      src: './assets/winner-chime.wav',
      name: 'Sonido original de ganador',
      mimeType: 'audio/wav',
      isCustom: false,
    },
  },
}

const PRESET_SECONDS: Record<DrawDuration, number> = { fast: 3, normal: 6, exciting: 10 }

export function normalizeSettings(value?: Partial<Settings>): Settings {
  const legacyPreset = value?.duration && value.duration in PRESET_SECONDS ? value.duration : defaultSettings.effects.animationPreset
  const legacyDuration = legacyPreset in PRESET_SECONDS ? PRESET_SECONDS[legacyPreset as DrawDuration] : defaultSettings.effects.animationDuration
  const legacySound = value?.sound ?? defaultSettings.sound
  return {
    ...defaultSettings,
    ...value,
    effects: {
      ...defaultSettings.effects,
      animationPreset: legacyPreset,
      animationDuration: legacyDuration,
      selectionSoundEnabled: legacySound,
      winnerSoundEnabled: legacySound,
      ...value?.effects,
      winnerSound: { ...defaultSettings.effects.winnerSound, ...value?.effects?.winnerSound },
    },
  }
}

export function createEmptyList(name = 'Base principal'): ParticipantList {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name,
    participants: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function createInitialState(): AppState {
  const list = createEmptyList()
  return {
    version: 1,
    lists: [list],
    activeListId: list.id,
    listStates: { [list.id]: { excludedIds: [], winnerIds: [] } },
    history: [],
    settings: structuredClone(defaultSettings),
    brandingSettings: structuredClone(defaultBranding),
    drawTitle: 'Sorteo de premios · Jornadas Académicas',
    winnerCount: 1,
  }
}
