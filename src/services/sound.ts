import type { SoundAsset } from '../types'

let audioContext: AudioContext | null = null
let winnerAudio: HTMLAudioElement | null = null
let winnerStopTimer: number | undefined
let winnerFadeTimer: number | undefined
const selectionOscillators = new Set<OscillatorNode>()

function getAudioContext(): AudioContext {
  audioContext ??= new AudioContext()
  return audioContext
}

export function primeAudio(): void {
  try {
    const context = getAudioContext()
    if (context.state === 'suspended') void context.resume()
  } catch { /* El navegador puede bloquear audio hasta otra interacción. */ }
}

export function playTick(volumePercent: number): void {
  if (volumePercent <= 0) return
  const context = getAudioContext()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.value = 360
  const volume = Math.max(0.001, Math.min(1, volumePercent / 100) * 0.055)
  gain.gain.setValueAtTime(volume, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.045)
  oscillator.connect(gain).connect(context.destination)
  selectionOscillators.add(oscillator)
  oscillator.onended = () => { selectionOscillators.delete(oscillator); oscillator.disconnect(); gain.disconnect() }
  oscillator.start()
  oscillator.stop(context.currentTime + 0.05)
}

export function stopSelectionSound(): void {
  selectionOscillators.forEach((oscillator) => {
    try { oscillator.stop() } catch { /* Ya finalizó. */ }
  })
  selectionOscillators.clear()
}

export function playWinnerSound(asset: SoundAsset, volumePercent: number, maxDurationSeconds: number): void {
  stopWinnerSound()
  if (volumePercent <= 0 || maxDurationSeconds <= 0) return
  const audio = new Audio(asset.src)
  winnerAudio = audio
  audio.loop = false
  audio.volume = Math.min(1, Math.max(0, volumePercent / 100))
  const maxMs = maxDurationSeconds * 1000
  const fadeMs = Math.min(350, Math.max(120, maxMs * 0.15))
  const initialVolume = audio.volume

  const beginFade = () => {
    const started = performance.now()
    winnerFadeTimer = window.setInterval(() => {
      if (!winnerAudio || winnerAudio !== audio) return
      const ratio = Math.min(1, (performance.now() - started) / fadeMs)
      audio.volume = initialVolume * (1 - ratio)
      if (ratio >= 1) stopWinnerSound()
    }, 35)
  }

  audio.addEventListener('ended', stopWinnerSound, { once: true })
  void audio.play().then(() => {
    winnerStopTimer = window.setTimeout(beginFade, Math.max(0, maxMs - fadeMs))
  }).catch(() => {
    if (winnerAudio === audio) winnerAudio = null
  })
}

export function stopWinnerSound(): void {
  window.clearTimeout(winnerStopTimer)
  window.clearInterval(winnerFadeTimer)
  winnerStopTimer = undefined
  winnerFadeTimer = undefined
  if (winnerAudio) {
    winnerAudio.pause()
    winnerAudio.currentTime = 0
    winnerAudio = null
  }
}

export function stopAllSounds(): void {
  stopSelectionSound()
  stopWinnerSound()
}

const AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg']
const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg']

export function readSoundFile(file: File): Promise<SoundAsset> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!AUDIO_TYPES.includes(file.type) && !AUDIO_EXTENSIONS.includes(extension)) throw new Error('Formato no compatible. Usa MP3, WAV u OGG.')
  if (file.size > 8 * 1024 * 1024) throw new Error('El archivo de sonido supera el máximo de 8 MB.')
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ src: String(reader.result), name: file.name, mimeType: file.type || `audio/${extension}`, isCustom: true })
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de sonido.'))
    reader.readAsDataURL(file)
  })
}
