import { ListChecks, Minimize, Play, ShieldCheck, Sparkles, Users, Volume2, VolumeX } from 'lucide-react'
import { useRef, type CSSProperties } from 'react'
import { toPng } from 'html-to-image'
import type { Draw, DrawEffectsSettings, Participant, Winner } from '../types'
import { Confetti } from './Confetti'
import { DrawAnimation } from './DrawAnimation'
import { WinnerCard } from './WinnerCard'
import type { BrandingSettings } from '../branding/brandingTypes'
import { getLogoVisibility } from '../branding/brandingVisibility'

interface DrawStageProps {
  eligible: Participant[]
  isDrawing: boolean
  activeWinner: Winner | null
  currentDraw: Draw | null
  drawTitle: string
  revealPosition: number
  durationMs: number
  showConfetti: boolean
  confetti: boolean
  sound: boolean
  effects: DrawEffectsSettings
  branding: BrandingSettings
  presentation: boolean
  error: string
  onStart: () => void
  onAnimationComplete: () => void
  onNext: () => void
  onResetStage: () => void
  onHistory: () => void
  onToast: (message: string) => void
  onExitPresentation: () => void
  onToggleSound: () => void
  onToggleConfetti: () => void
  onConfettiComplete: () => void
}

export function DrawStage(props: DrawStageProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const activeWinner = props.activeWinner
  const draw = props.currentDraw
  const total = draw?.winners.length ?? 0
  const presentationLogos = getLogoVisibility(props.branding, 'presentation')
  const hasPresentationLogos = presentationLogos.primary || presentationLogos.epunemi || presentationLogos.institutional
  const presentationStyle = props.presentation ? { '--presentation-controls-scale': props.branding.presentation.winnerView.controlsScale / 100 } as CSSProperties : undefined

  async function copyResult() {
    if (!activeWinner) return
    await navigator.clipboard.writeText(`🎉 Ganador del sorteo: ${activeWinner.participantName}`)
    props.onToast('Resultado copiado')
  }

  async function shareResult() {
    if (!activeWinner || !draw) return
    const text = `🎉 Ganador del sorteo: ${activeWinner.participantName} · ${draw.title}`
    if (navigator.share) await navigator.share({ title: 'Resultado del sorteo', text })
    else { await navigator.clipboard.writeText(text); props.onToast('Resultado copiado para compartir') }
  }

  async function downloadResult() {
    if (!cardRef.current || !activeWinner) return
    const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, backgroundColor: props.branding.colors.surface })
    const link = document.createElement('a')
    link.download = `ganador-${activeWinner.participantName.toLocaleLowerCase('es').replace(/[^a-z0-9]+/g, '-')}.png`
    link.href = dataUrl
    link.click()
  }

  return (
    <section className={`draw-stage card ${props.presentation ? 'draw-stage--presentation' : ''} ${props.presentation && (!hasPresentationLogos || activeWinner) ? 'draw-stage--no-brandbar' : ''} ${props.presentation && activeWinner ? 'draw-stage--winner' : ''}`} style={presentationStyle} aria-live="polite">
      {props.showConfetti && activeWinner && (!props.presentation || props.branding.presentation.showConfetti) && <Confetti duration={props.effects.confettiDuration} intensity={props.effects.confettiIntensity} onComplete={props.onConfettiComplete} />}
      {props.presentation && <>{!activeWinner && (presentationLogos.primary || presentationLogos.epunemi || presentationLogos.institutional) && <div className="presentation-brandbar">{presentationLogos.primary && <img className="presentation-primary-logo" src={props.branding.logos.primary.src} alt="Jornadas Académicas" />}{(presentationLogos.epunemi || presentationLogos.institutional) && <div>{presentationLogos.epunemi && <img src={props.branding.logos.epunemi.src} alt="EPUNEMI" />}{presentationLogos.institutional && <img src={props.branding.logos.institutional.src} alt={props.branding.organizationName} />}</div>}</div>}<div className="presentation-controls"><button type="button" onClick={props.onToggleSound} aria-label={props.sound ? 'Desactivar sonido' : 'Activar sonido'} aria-pressed={props.sound}>{props.sound ? <Volume2 size={18} /> : <VolumeX size={18} />}</button><button type="button" onClick={props.onToggleConfetti} aria-label={props.confetti ? 'Desactivar confeti' : 'Activar confeti'} aria-pressed={props.confetti}><Sparkles size={18} /></button><button type="button" onClick={props.onExitPresentation}><Minimize size={18} /><span>Salir</span></button></div></>}
      {props.presentation && !activeWinner && props.branding.presentation.showDrawTitle && <h1 className="presentation-draw-title">{draw?.title ?? props.drawTitle}</h1>}
      {props.isDrawing && draw && activeWinner ? (
        <DrawAnimation participants={props.eligible} winnerName={activeWinner.participantName} durationMs={props.durationMs} sound={props.sound && props.effects.selectionSoundEnabled} volume={props.effects.selectionVolume} onComplete={props.onAnimationComplete} />
      ) : activeWinner && draw ? (
        <WinnerCard ref={cardRef} draw={draw} winner={activeWinner} position={props.revealPosition + 1} total={total} branding={props.branding} presentation={props.presentation} hasNext={props.revealPosition < total - 1} onNext={props.onNext} onAnotherDraw={props.onResetStage} onHistory={props.onHistory} onShare={() => void shareResult()} onCopy={() => void copyResult()} onDownload={() => void downloadResult()} />
      ) : (
        <div className="ready-state">
          <div className="stage-icon"><ListChecks size={34} /></div>
          <p className="eyebrow">Sorteo preparado</p>
          {(!props.presentation || props.branding.presentation.showEligibleCount) && <><h2>{props.eligible.length.toLocaleString('es-EC')}</h2><p className="available-label"><Users size={18} /> participantes disponibles</p></>}
          <button className="draw-button" type="button" onClick={props.onStart} disabled={props.eligible.length === 0}><Play size={20} fill="currentColor" />Realizar sorteo</button>
          {props.error && <p className="validation-error" role="alert">{props.error}</p>}
          {!props.presentation && <p className="fair-note"><ShieldCheck size={16} /> Igual probabilidad mediante <code>crypto.getRandomValues()</code></p>}
        </div>
      )}
    </section>
  )
}
