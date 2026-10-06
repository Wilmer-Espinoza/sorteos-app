import { useEffect, useState } from 'react'
import type { Participant } from '../types'
import { cryptoRandomInt } from '../services/random'
import { playTick, stopSelectionSound } from '../services/sound'

interface DrawAnimationProps {
  participants: readonly Participant[]
  winnerName: string
  durationMs: number
  sound: boolean
  volume: number
  onComplete: () => void
}

export function DrawAnimation({ participants, winnerName, durationMs, sound, volume, onComplete }: DrawAnimationProps) {
  const [names, setNames] = useState(() => makeWindow(participants))
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let cancelled = false
    const started = performance.now()
    let timer = 0
    let revealTimer = 0
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const effectiveDuration = reducedMotion ? Math.min(durationMs, 1200) : durationMs
    const advance = () => {
      if (cancelled) return
      const elapsed = performance.now() - started
      const ratio = Math.min(1, elapsed / effectiveDuration)
      setProgress(ratio)
      if (ratio >= 1) {
        setNames(makeWinnerWindow(participants, winnerName))
        stopSelectionSound()
        revealTimer = window.setTimeout(onComplete, reducedMotion ? 80 : 300)
        return
      }
      setNames(makeWindow(participants))
      if (sound && ratio > 0.2) playTick(volume)
      const delay = reducedMotion ? 180 : 55 + Math.pow(ratio, 3) * 360
      timer = window.setTimeout(advance, delay)
    }
    advance()
    return () => { cancelled = true; window.clearTimeout(timer); window.clearTimeout(revealTimer); stopSelectionSound() }
  }, [durationMs, onComplete, participants, sound, volume, winnerName])

  return (
    <div className="draw-animation">
      <p className="eyebrow pulse-dot">Seleccionando ganador</p>
      <div className="name-reel" aria-live="polite" aria-label="Selección en curso">
        <div className="selection-band" />
        {names.map((name, index) => <div key={`${name}-${index}-${progress}`} className={index === 2 ? 'active' : ''}><span title={name}>{name}</span></div>)}
      </div>
      <div className="progress-track"><span style={{ width: `${Math.max(6, progress * 100)}%` }} /></div>
    </div>
  )
}

function makeWindow(participants: readonly Participant[]): string[] {
  if (participants.length === 0) return ['—', '—', '—', '—', '—']
  return Array.from({ length: 5 }, () => participants[cryptoRandomInt(participants.length)].name)
}

function makeWinnerWindow(participants: readonly Participant[], winnerName: string): string[] {
  const values = makeWindow(participants)
  values[2] = winnerName
  return values
}
