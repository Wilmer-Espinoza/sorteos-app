import type { BrandingSettings } from '../branding/brandingTypes'

export interface Participant {
  id: string
  name: string
  metadata?: Record<string, string>
  weight?: number
  createdAt: string
}

export interface ParticipantList {
  id: string
  name: string
  participants: Participant[]
  createdAt: string
  updatedAt: string
}

export interface Winner {
  participantId: string
  participantName: string
  selectedAt: string
}

export interface Draw {
  id: string
  sequence: number
  title: string
  listId: string
  listName: string
  winners: Winner[]
  eligibleCount: number
  createdAt: string
}

export interface ListState {
  excludedIds: string[]
  winnerIds: string[]
}

export type DrawDuration = 'fast' | 'normal' | 'exciting'
export type RevealMode = 'automatic' | 'presentation'
export type AnimationPreset = DrawDuration | 'custom'
export type ConfettiIntensity = 'subtle' | 'normal' | 'celebration'

export interface SoundAsset {
  src: string
  name: string
  mimeType: string
  isCustom: boolean
}

export interface DrawEffectsSettings {
  animationPreset: AnimationPreset
  animationDuration: number
  confettiDuration: number
  confettiIntensity: ConfettiIntensity
  selectionSoundEnabled: boolean
  selectionVolume: number
  winnerSoundEnabled: boolean
  winnerSoundMaxDuration: number
  winnerVolume: number
  winnerSound: SoundAsset
}

export interface Settings {
  primaryColor: string
  showSecondaryLogo: boolean
  confetti: boolean
  sound: boolean
  animation: boolean
  duration: DrawDuration
  excludePreviousWinners: boolean
  allowRepeatedWinners: boolean
  ignoreDuplicates: boolean
  weightedMode: boolean
  revealMode: RevealMode
  effects: DrawEffectsSettings
}

export interface AppState {
  version: 1
  lists: ParticipantList[]
  activeListId: string
  listStates: Record<string, ListState>
  history: Draw[]
  settings: Settings
  brandingSettings: BrandingSettings
  drawTitle: string
  winnerCount: number
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface ImportPreview {
  fileName: string
  headers: string[]
  rows: Record<string, string>[]
}

