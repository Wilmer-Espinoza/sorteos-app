import { Check, Clock3, HardDrive, Maximize, Minimize, Settings as SettingsIcon } from 'lucide-react'
import type { BrandingSettings } from '../branding/brandingTypes'
import { getLogoVisibility } from '../branding/brandingVisibility'
import type { SaveStatus } from '../types'

interface HeaderProps {
  saveStatus: SaveStatus
  branding: BrandingSettings
  presentation: boolean
  onHistory: () => void
  onSettings: () => void
  onFullscreen: () => void
}

export function Header({ saveStatus, branding, presentation, onHistory, onSettings, onFullscreen }: HeaderProps) {
  const status = saveStatus === 'saving' ? 'Guardando…' : saveStatus === 'error' ? 'No se pudo guardar' : 'Guardado en este dispositivo'
  const logos = getLogoVisibility(branding, 'header')
  return (
    <header className="app-header">
      <div className="brand-lockup">
        {logos.primary && <img className={`brand-primary-logo brand-primary-logo--${branding.header.primaryLogoSize}`} src={branding.logos.primary.src} alt="Jornadas Académicas" />}
        {(branding.header.showTitle || branding.header.showSubtitle) && <div className="brand-copy">
          {branding.header.showTitle && <h1>{branding.appName}</h1>}
          {branding.header.showSubtitle && <p>{branding.subtitle}</p>}
        </div>}
        {(logos.epunemi || logos.institutional) && <div className="header-logo-row">{logos.epunemi && <img src={branding.logos.epunemi.src} alt="EPUNEMI" />}{logos.institutional && <img src={branding.logos.institutional.src} alt="UNEMI EPUNEMI" />}</div>}
      </div>
      <div className="header-actions">
        <span className={`save-status save-status--${saveStatus}`} title={status}>
          {saveStatus === 'saved' ? <Check size={15} /> : <HardDrive size={15} />} <span>{status}</span>
        </span>
        <button className="soft-button" type="button" onClick={onHistory}><Clock3 size={18} /><span>Historial</span></button>
        <button className="presentation-button" type="button" onClick={onFullscreen}>{presentation ? <Minimize size={18} /> : <Maximize size={18} />}<span>{presentation ? 'Salir de pantalla completa' : 'Pantalla completa'}</span></button>
        <button className="icon-button" type="button" onClick={onSettings} aria-label="Abrir configuración"><SettingsIcon size={20} /></button>
      </div>
    </header>
  )
}
