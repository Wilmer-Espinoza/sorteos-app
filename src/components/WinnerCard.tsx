import { Copy, Download, History, Redo2, Share2, Trophy } from 'lucide-react'
import { forwardRef, type CSSProperties } from 'react'
import type { Draw, Winner } from '../types'
import type { BrandingSettings } from '../branding/brandingTypes'
import { getLogoVisibility } from '../branding/brandingVisibility'

interface WinnerCardProps {
  draw: Draw
  winner: Winner
  position: number
  total: number
  branding: BrandingSettings
  presentation?: boolean
  hasNext: boolean
  onNext: () => void
  onAnotherDraw: () => void
  onHistory: () => void
  onShare: () => void
  onCopy: () => void
  onDownload: () => void
}

export const WinnerCard = forwardRef<HTMLDivElement, WinnerCardProps>(function WinnerCard({ draw, winner, position, total, branding, presentation = false, hasNext, onNext, onAnotherDraw, onHistory, onShare, onCopy, onDownload }, ref) {
  const date = new Date(winner.selectedAt)
  const view = branding.presentation.winnerView
  const home = branding.presentation.homeWinnerCard
  const logos = getLogoVisibility(branding, presentation ? 'presentationWinner' : 'winner')
  const showDrawNumber = !presentation || branding.presentation.showDrawNumber
  const showDate = !presentation || branding.presentation.showDate
  const showTime = !presentation || branding.presentation.showTime
  const spacingFactor = view.spacing === 'compact' ? .72 : view.spacing === 'spacious' ? 1.3 : 1
  const primaryLogoScale = view.primaryLogoScale / 100
  const cardStyle = {
    '--winner-bar-primary': view.topBarPrimary,
    '--winner-bar-secondary': view.topBarSecondary,
    '--winner-bar-height': `${view.topBarHeight}px`,
    '--winner-icon-color': view.iconColor,
    '--winner-icon-background': view.iconBackground,
    '--winner-icon-border': view.iconBorderColor,
    '--winner-card-radius': `${view.borderRadius}px`,
    '--winner-card-padding': `${view.padding}px`,
    '--winner-primary-logo-width': `${820 * primaryLogoScale}px`,
    '--winner-primary-logo-viewport-width': `${68 * primaryLogoScale}vw`,
    '--winner-primary-logo-height': `${150 * primaryLogoScale}px`,
    '--winner-primary-logo-viewport-height': `${13 * primaryLogoScale}vh`,
    '--winner-icon-size': `${view.iconSizePx}px`,
    '--winner-label-size': `${view.winnerLabelSize}px`,
    '--winner-name-size': `${view.winnerNameSize}px`,
    '--winner-name-fit-width': `${88 * Math.min(1, 1.65 / Math.max(1, winner.participantName.length))}vw`,
    '--winner-title-size': `${view.drawTitleSize}px`,
    '--winner-metadata-label-size': `${view.metadataLabelSize}px`,
    '--winner-metadata-value-size': `${view.metadataValueSize}px`,
    '--winner-epunemi-width': `${285 * view.epunemiLogoScale / 100}px`,
    '--winner-institutional-width': `${285 * view.institutionalLogoScale / 100}px`,
    '--winner-button-text-size': `${view.buttonTextSize}px`,
    '--winner-gap-after-logo': `${view.gapAfterLogo * spacingFactor}px`,
    '--winner-gap-icon-label': `${view.gapIconLabel * spacingFactor}px`,
    '--winner-gap-label-name': `${view.gapLabelName * spacingFactor}px`,
    '--winner-gap-name-title': `${view.gapNameTitle * spacingFactor}px`,
    '--winner-gap-title-metadata': `${view.gapTitleMetadata * spacingFactor}px`,
    '--winner-gap-metadata-logos': `${view.gapMetadataLogos * spacingFactor}px`,
    '--home-card-width': `${home.widthPercent}%`,
    '--home-card-height': `${home.height}px`,
    '--home-card-padding': `${home.padding}px`,
    '--home-card-radius': `${home.borderRadius}px`,
    '--home-content-scale': home.contentScale / 100,
  } as CSSProperties
  return (
    <div className={`winner-wrap winner-wrap--${view.cardWidth} ${presentation ? 'winner-wrap--presentation' : 'winner-wrap--home'}`} style={cardStyle}>
      <article className={`winner-card winner-card--${presentation ? branding.presentation.winnerSize : 'normal'} winner-card--spacing-${view.spacing} ${presentation && !view.showCardBorder ? 'winner-card--no-border' : ''} ${presentation && !view.showCardShadow ? 'winner-card--no-shadow' : ''} ${!presentation ? `winner-card--home-shadow-${home.shadow}` : ''}`} ref={ref}>
        {view.showTopBar && <div className={`winner-top-bar winner-top-bar--${view.topBarStyle}`} aria-hidden="true" />}
        <div className="winner-card__content">
          {logos.primary && <img className="winner-card__primary-logo" src={branding.logos.primary.src} alt="Jornadas Académicas" />}
          {view.showIcon && <div className={`trophy trophy--${view.iconSize} trophy--${view.iconShape}`}><Trophy /></div>}
          {view.showLabel && <p className="eyebrow">Ganador {total > 1 ? `${position} de ${total}` : ''}</p>}
          <h2>{winner.participantName}</h2>
          {view.showDrawTitle && <p className={`winner-title winner-title--${view.subtitleSize}`}>{draw.title}</p>}
          {(showDrawNumber || showDate || showTime) && <dl className={`winner-metadata winner-metadata--${view.metadataSize}`}>{showDrawNumber && <div><dt>Número</dt><dd>#{String(draw.sequence).padStart(4, '0')}</dd></div>}{showDate && <div><dt>Fecha</dt><dd>{date.toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })}</dd></div>}{showTime && <div><dt>Hora</dt><dd>{date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}</dd></div>}</dl>}
          {(logos.epunemi || logos.institutional) && <div className={`winner-card__logos winner-card__logos--${view.logoSize}`}>{logos.epunemi && <img className="winner-card__logo--epunemi" src={branding.logos.epunemi.src} alt="EPUNEMI" />}{logos.institutional && <img className="winner-card__logo--institutional" src={branding.logos.institutional.src} alt={branding.organizationName} />}</div>}
        </div>
      </article>
      <div className={`winner-actions ${presentation ? `winner-actions--${view.buttonSize}` : 'winner-actions--normal'}`}>
        {hasNext ? <button className="primary-button" type="button" onClick={onNext}>Siguiente ganador <Redo2 size={18} /></button> : <button className="primary-button" type="button" onClick={onAnotherDraw}>Realizar otro sorteo <Redo2 size={18} /></button>}
        {!presentation && <><button className="soft-button" type="button" onClick={onHistory}><History size={17} />Historial</button><button className="soft-button" type="button" onClick={onShare}><Share2 size={17} />Compartir</button><button className="soft-button" type="button" onClick={onCopy}><Copy size={17} />Copiar</button><button className="soft-button" type="button" onClick={onDownload}><Download size={17} />PNG</button></>}
      </div>
    </div>
  )
})
