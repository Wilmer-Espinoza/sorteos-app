import { useEffect, useMemo } from 'react'
import type { ConfettiIntensity } from '../types'

interface ConfettiProps {
  duration: number
  intensity: ConfettiIntensity
  onComplete?: () => void
}

export function Confetti({ duration, intensity, onComplete }: ConfettiProps) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const effectiveDuration = reducedMotion ? Math.min(1.2, duration) : duration
  const count = reducedMotion ? 10 : intensity === 'subtle' ? 18 : intensity === 'celebration' ? 56 : 34
  const pieces = useMemo(() => Array.from({ length: count }, (_, index) => ({
    left: `${(index * 29 + 7) % 100}%`,
    delay: `${(index % 7) * Math.min(0.08, effectiveDuration / 18)}s`,
    color: ['var(--brand-primary)', 'var(--brand-secondary)', 'var(--brand-success)', 'var(--brand-accent)'][index % 4],
    rotate: `${(index * 47) % 180}deg`,
  })), [count, effectiveDuration])

  useEffect(() => {
    if (!onComplete) return
    const timer = window.setTimeout(onComplete, effectiveDuration * 1000 + 120)
    return () => window.clearTimeout(timer)
  }, [effectiveDuration, onComplete])

  return <div className="confetti" style={{ '--confetti-duration': `${effectiveDuration}s` } as React.CSSProperties} aria-hidden="true">{pieces.map((piece, index) => <i key={index} style={{ left: piece.left, animationDelay: piece.delay, background: piece.color, rotate: piece.rotate }} />)}</div>
}
