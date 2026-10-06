import { Database, Download, FileAudio, MonitorUp, Palette, Play, RotateCcw, SlidersHorizontal, Trophy, Upload, Volume2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { BrandingSettings } from '../branding/brandingTypes'
import { defaultBranding } from '../branding/defaultBranding'
import { exportBranding, importBranding } from '../branding/brandingService'
import { getLogoVisibility } from '../branding/brandingVisibility'
import type { Participant, Settings } from '../types'
import { defaultSettings } from '../services/defaults'
import { playWinnerSound, primeAudio, readSoundFile, stopAllSounds } from '../services/sound'
import { BrandingColorField } from './BrandingColorField'
import { BrandingLogoField } from './BrandingLogoField'
import { Confetti } from './Confetti'
import { DrawAnimation } from './DrawAnimation'
import { Modal } from './Modal'
import { ConfirmDialog } from './ConfirmDialog'

type SettingsTab = 'general' | 'appearance' | 'draw' | 'presentation' | 'data'

interface SettingsModalProps {
  settings: Settings
  branding: BrandingSettings
  onSettings: (settings: Settings) => void
  onBranding: (branding: BrandingSettings) => void
  onDataZone: () => void
  onToast: (message: string) => void
  onClose: () => void
}

export function SettingsModal({ settings, branding, onSettings, onBranding, onDataZone, onToast, onClose }: SettingsModalProps) {
  const [tab, setTab] = useState<SettingsTab>('general')
  const [testAnimation, setTestAnimation] = useState(false)
  const [testConfetti, setTestConfetti] = useState(false)
  const [confirmRestore, setConfirmRestore] = useState(false)
  const [pendingBranding, setPendingBranding] = useState<BrandingSettings | null>(null)
  const patchSettings = (value: Partial<Settings>) => onSettings({ ...settings, ...value })
  const patchEffects = (value: Partial<Settings['effects']>) => patchSettings({ effects: { ...settings.effects, ...value } })
  const patchBranding = (value: Partial<BrandingSettings>) => onBranding({ ...branding, ...value, preset: 'custom' })
  const patchColors = (key: keyof BrandingSettings['colors'], value: string) => patchBranding({ colors: { ...branding.colors, [key]: value } })
  const patchHeader = (value: Partial<BrandingSettings['header']>) => patchBranding({ header: { ...branding.header, ...value } })
  const patchPresentation = (value: Partial<BrandingSettings['presentation']>) => patchBranding({ presentation: { ...branding.presentation, ...value } })
  const patchHomeWinnerCard = (value: Partial<BrandingSettings['presentation']['homeWinnerCard']>) => patchPresentation({ homeWinnerCard: { ...branding.presentation.homeWinnerCard, ...value } })
  const patchWinnerView = (value: Partial<BrandingSettings['presentation']['winnerView']>) => patchPresentation({ winnerView: { ...branding.presentation.winnerView, ...value } })
  const previewLogos = getLogoVisibility(branding, 'preview')
  const homePreviewLogos = getLogoVisibility(branding, 'winner')
  const winnerPreviewLogos = getLogoVisibility(branding, 'presentationWinner')

  useEffect(() => () => stopAllSounds(), [])

  function changeAnimationPreset(preset: Settings['effects']['animationPreset']) {
    const seconds = preset === 'fast' ? 3 : preset === 'normal' ? 6 : preset === 'exciting' ? 10 : settings.effects.animationDuration
    patchSettings({ duration: preset === 'custom' ? settings.duration : preset, effects: { ...settings.effects, animationPreset: preset, animationDuration: seconds } })
  }

  function setSoundEnabled(key: 'selectionSoundEnabled' | 'winnerSoundEnabled', enabled: boolean) {
    const effects = { ...settings.effects, [key]: enabled }
    patchSettings({ sound: effects.selectionSoundEnabled || effects.winnerSoundEnabled, effects })
  }

  async function loadWinnerSound(file?: File) {
    if (!file) return
    try {
      const winnerSound = await readSoundFile(file)
      patchSettings({ sound: true, effects: { ...settings.effects, winnerSoundEnabled: true, winnerSound } })
      onToast('Sonido de ganador actualizado')
    } catch (reason) { onToast(reason instanceof Error ? reason.message : 'No se pudo cargar el sonido') }
  }

  function testWinnerSound() {
    primeAudio()
    playWinnerSound(settings.effects.winnerSound, settings.effects.winnerVolume, settings.effects.winnerSoundMaxDuration)
  }

  function restoreAll() {
    onBranding(structuredClone(defaultBranding))
    setConfirmRestore(false)
    onToast('Identidad visual restaurada')
  }

  function resetWinnerSizing() {
    const original = defaultBranding.presentation.winnerView
    patchWinnerView({
      primaryLogoScale: original.primaryLogoScale,
      iconSizePx: original.iconSizePx,
      winnerLabelSize: original.winnerLabelSize,
      winnerNameSize: original.winnerNameSize,
      drawTitleSize: original.drawTitleSize,
      metadataLabelSize: original.metadataLabelSize,
      metadataValueSize: original.metadataValueSize,
      epunemiLogoScale: original.epunemiLogoScale,
      institutionalLogoScale: original.institutionalLogoScale,
      buttonSize: original.buttonSize,
      buttonTextSize: original.buttonTextSize,
      controlsScale: original.controlsScale,
      spacing: original.spacing,
      gapAfterLogo: original.gapAfterLogo,
      gapIconLabel: original.gapIconLabel,
      gapLabelName: original.gapLabelName,
      gapNameTitle: original.gapNameTitle,
      gapTitleMetadata: original.gapTitleMetadata,
      gapMetadataLogos: original.gapMetadataLogos,
    })
    onToast('Tamaños de la vista del ganador restablecidos')
  }

  function resetHomeWinnerCard() {
    patchHomeWinnerCard(structuredClone(defaultBranding.presentation.homeWinnerCard))
    onToast('Tarjeta del Home restablecida')
  }

  async function loadBranding(file?: File) {
    if (!file) return
    try { setPendingBranding(await importBranding(file)) }
    catch (reason) { onToast(reason instanceof Error ? reason.message : 'No se pudo importar la configuración visual') }
  }

  return <><Modal title="Configuración" description="Personaliza la identidad, el sorteo y la experiencia de auditorio." onClose={onClose} wide>
    <nav className="settings-tabs" aria-label="Secciones de configuración">
      <button type="button" className={tab === 'general' ? 'active' : ''} onClick={() => setTab('general')}>General</button>
      <button type="button" className={tab === 'appearance' ? 'active' : ''} onClick={() => setTab('appearance')}>Apariencia</button>
      <button type="button" className={tab === 'draw' ? 'active' : ''} onClick={() => setTab('draw')}>Sorteo</button>
      <button type="button" className={tab === 'presentation' ? 'active' : ''} onClick={() => setTab('presentation')}>Presentación</button>
      <button type="button" className={tab === 'data' ? 'active' : ''} onClick={() => setTab('data')}>Datos</button>
    </nav>

    <div className="settings-layout">
      <div className="settings-editor">
        {tab === 'general' && <section className="settings-pane">
          <PaneTitle icon={<SlidersHorizontal size={19} />} title="Textos de marca" description="Se actualizan inmediatamente en la interfaz." />
          <div className="settings-form-grid">
            <label className="field"><span>Nombre de la aplicación</span><input value={branding.appName} onChange={(event) => patchBranding({ appName: event.target.value })} /></label>
            <label className="field"><span>Subtítulo</span><input value={branding.subtitle} onChange={(event) => patchBranding({ subtitle: event.target.value })} /></label>
            <label className="field"><span>Nombre institucional</span><input value={branding.organizationName} onChange={(event) => patchBranding({ organizationName: event.target.value })} /></label>
            <label className="field"><span>Texto de pie de página</span><input value={branding.footerText} onChange={(event) => patchBranding({ footerText: event.target.value })} /></label>
          </div>
          <div className="settings-subsection"><h4>Encabezado</h4>
            <SwitchRow label="Mostrar nombre de la aplicación" checked={branding.header.showTitle} onChange={(value) => patchHeader({ showTitle: value })} />
            <SwitchRow label="Mostrar subtítulo" checked={branding.header.showSubtitle} onChange={(value) => patchHeader({ showSubtitle: value })} />
            <label className="field"><span>Tamaño del logo principal</span><select value={branding.header.primaryLogoSize} onChange={(event) => patchHeader({ primaryLogoSize: event.target.value as BrandingSettings['header']['primaryLogoSize'] })}><option value="small">Pequeño</option><option value="medium">Mediano</option><option value="large">Grande</option></select></label>
          </div>
        </section>}

        {tab === 'appearance' && <section className="settings-pane">
          <PaneTitle icon={<Palette size={19} />} title="Identidad visual" description={`Preset: ${branding.preset === 'jornadas' ? 'Jornadas Académicas' : 'Personalizado'}`} />
          <label className="field branding-preset"><span>Preset de identidad</span><select value={branding.preset} onChange={(event) => event.target.value === 'jornadas' ? onBranding(structuredClone(defaultBranding)) : patchBranding({ preset: 'custom' })}><option value="jornadas">Jornadas Académicas</option><option value="custom">Personalizado</option></select></label>
          <div className="settings-subsection settings-subsection--first"><h4>Mostrar globalmente</h4>
            <SwitchRow label="Logo Jornadas Académicas" checked={branding.header.showPrimaryLogo} onChange={(value) => patchHeader({ showPrimaryLogo: value })} />
            <SwitchRow label="Logo EPUNEMI" checked={branding.header.showEpunemiLogo} onChange={(value) => patchHeader({ showEpunemiLogo: value })} />
            <SwitchRow label="Logo UNEMI / EPUNEMI" checked={branding.header.showInstitutionalLogo} onChange={(value) => patchHeader({ showInstitutionalLogo: value })} />
          </div>
          <div className="branding-colors">
            <BrandingColorField label="Color principal" value={branding.colors.primary} onChange={(value) => patchColors('primary', value)} />
            <BrandingColorField label="Color secundario" value={branding.colors.secondary} onChange={(value) => patchColors('secondary', value)} />
            <BrandingColorField label="Color de acento" value={branding.colors.accent} onChange={(value) => patchColors('accent', value)} />
            <BrandingColorField label="Fondo" value={branding.colors.background} onChange={(value) => patchColors('background', value)} />
            <BrandingColorField label="Superficie" value={branding.colors.surface} onChange={(value) => patchColors('surface', value)} />
            <BrandingColorField label="Texto principal" value={branding.colors.text} onChange={(value) => patchColors('text', value)} />
            <BrandingColorField label="Éxito" value={branding.colors.success} onChange={(value) => patchColors('success', value)} />
            <BrandingColorField label="Ganador" value={branding.colors.winner} onChange={(value) => patchColors('winner', value)} />
          </div>
          <div className="branding-logos">
            <BrandingLogoField label="Logo principal" image={branding.logos.primary} original={defaultBranding.logos.primary} hidden={!previewLogos.primary} onChange={(image) => patchBranding({ logos: { ...branding.logos, primary: image } })} onError={onToast} />
            <BrandingLogoField label="Logo secundario / EPUNEMI" image={branding.logos.epunemi} original={defaultBranding.logos.epunemi} hidden={!previewLogos.epunemi} onChange={(image) => patchBranding({ logos: { ...branding.logos, epunemi: image } })} onError={onToast} />
            <BrandingLogoField label="Logo institucional UNEMI / EPUNEMI" image={branding.logos.institutional} original={defaultBranding.logos.institutional} hidden={!previewLogos.institutional} onChange={(image) => patchBranding({ logos: { ...branding.logos, institutional: image } })} onError={onToast} />
          </div>
          <div className="branding-portability"><button className="soft-button" type="button" onClick={() => { exportBranding(branding); onToast('Configuración visual exportada') }}><Download size={16} />Exportar configuración visual</button><label className="soft-button file-button"><Upload size={16} />Importar configuración visual<input type="file" accept=".json,application/json" onChange={(event) => { void loadBranding(event.target.files?.[0]); event.target.value = '' }} /></label></div>
          <button className="restore-branding" type="button" onClick={() => setConfirmRestore(true)}><RotateCcw size={17} />Restaurar identidad de Jornadas Académicas</button>
        </section>}

        {tab === 'draw' && <section className="settings-pane">
          <PaneTitle icon={<SlidersHorizontal size={19} />} title="Comportamiento del sorteo" description="Preferencias operativas y de celebración." />
          <div className="effect-section"><h4>Animación</h4>
            <SwitchRow label="Animación de selección" checked={settings.animation} onChange={(value) => patchSettings({ animation: value })} />
            <label className="field"><span>Preset de duración</span><select value={settings.effects.animationPreset} onChange={(event) => changeAnimationPreset(event.target.value as Settings['effects']['animationPreset'])}><option value="fast">Rápido · 3 segundos</option><option value="normal">Normal · 6 segundos</option><option value="exciting">Emocionante · 10 segundos</option><option value="custom">Personalizado</option></select></label>
            <RangeNumberField label="Duración de la animación" value={settings.effects.animationDuration} min={2} max={20} step={0.5} suffix="s" onChange={(animationDuration) => patchEffects({ animationDuration, animationPreset: 'custom' })} />
            <button className="effect-test-button" type="button" onClick={() => { stopAllSounds(); primeAudio(); setTestAnimation(true) }} disabled={testAnimation || !settings.animation}><Play size={16} />Probar animación</button>
            {testAnimation && <div className="settings-animation-preview"><DrawAnimation participants={PREVIEW_PARTICIPANTS} winnerName="María Fernanda Torres" durationMs={settings.effects.animationDuration * 1000} sound={settings.effects.selectionSoundEnabled} volume={settings.effects.selectionVolume} onComplete={() => setTestAnimation(false)} /></div>}
          </div>

          <div className="effect-section"><h4>Confeti</h4>
            <SwitchRow label="Mostrar confeti" checked={settings.confetti} onChange={(value) => patchSettings({ confetti: value })} />
            <RangeNumberField label="Duración del confeti" value={settings.effects.confettiDuration} min={1} max={10} step={0.5} suffix="s" onChange={(confettiDuration) => patchEffects({ confettiDuration })} />
            <label className="field"><span>Intensidad</span><select value={settings.effects.confettiIntensity} onChange={(event) => patchEffects({ confettiIntensity: event.target.value as Settings['effects']['confettiIntensity'] })}><option value="subtle">Sutil</option><option value="normal">Normal</option><option value="celebration">Celebración</option></select></label>
            <button className="effect-test-button" type="button" onClick={() => setTestConfetti(true)} disabled={testConfetti || !settings.confetti}><Play size={16} />Probar confeti</button>
          </div>

          <div className="effect-section"><h4>Sonido</h4>
            <SwitchRow label="Sonido durante la selección" checked={settings.effects.selectionSoundEnabled} onChange={(value) => setSoundEnabled('selectionSoundEnabled', value)} />
            <RangeNumberField label="Volumen de selección" value={settings.effects.selectionVolume} min={0} max={100} step={5} suffix="%" onChange={(selectionVolume) => patchEffects({ selectionVolume })} />
            <SwitchRow label="Sonido al anunciar ganador" checked={settings.effects.winnerSoundEnabled} onChange={(value) => setSoundEnabled('winnerSoundEnabled', value)} />
            <RangeNumberField label="Volumen del ganador" value={settings.effects.winnerVolume} min={0} max={100} step={5} suffix="%" onChange={(winnerVolume) => patchEffects({ winnerVolume })} />
            <RangeNumberField label="Duración máxima del sonido" value={settings.effects.winnerSoundMaxDuration} min={1} max={10} step={0.5} suffix="s" onChange={(winnerSoundMaxDuration) => patchEffects({ winnerSoundMaxDuration })} />
            <div className="sound-file-row"><FileAudio size={19} /><span><strong>Sonido de ganador</strong><small>{settings.effects.winnerSound.name}</small></span><div><button className="mini-button" type="button" onClick={testWinnerSound}><Volume2 size={14} />Reproducir</button><label className="mini-button"><Upload size={14} />Cambiar<input type="file" accept=".mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg" onChange={(event) => void loadWinnerSound(event.target.files?.[0])} /></label><button className="mini-button" type="button" onClick={() => patchEffects({ winnerSound: structuredClone(defaultSettings.effects.winnerSound) })}><RotateCcw size={14} />Original</button></div></div>
          </div>

          <div className="effect-section"><h4>Comportamiento</h4><SwitchRow label="Excluir ganadores anteriores" checked={settings.excludePreviousWinners} onChange={(value) => patchSettings({ excludePreviousWinners: value })} /></div>
        </section>}

        {tab === 'presentation' && <section className="settings-pane">
          <PaneTitle icon={<MonitorUp size={19} />} title="Modo presentación" description="Define qué verá el público en el auditorio." />
          <p className="settings-note">La visibilidad global siempre tiene prioridad. Presentación solamente puede restringirla.</p>
          <div className="settings-subsection settings-subsection--first"><h4>Pantalla de sorteo</h4>
            <SwitchRow label="Mostrar logo principal en presentación" checked={branding.presentation.showPrimaryLogo} disabled={!branding.header.showPrimaryLogo} onChange={(value) => patchPresentation({ showPrimaryLogo: value })} />
            <SwitchRow label="Mostrar logos institucionales en presentación" checked={branding.presentation.showInstitutionalLogos} disabled={!branding.header.showEpunemiLogo && !branding.header.showInstitutionalLogo} onChange={(value) => patchPresentation({ showInstitutionalLogos: value })} />
            <SwitchRow label="Mostrar nombre del sorteo" checked={branding.presentation.showDrawTitle} onChange={(value) => patchPresentation({ showDrawTitle: value })} />
            <SwitchRow label="Mostrar contador de participantes" checked={branding.presentation.showEligibleCount} onChange={(value) => patchPresentation({ showEligibleCount: value })} />
            <SwitchRow label="Mostrar confeti" checked={branding.presentation.showConfetti} onChange={(value) => patchPresentation({ showConfetti: value })} />
          </div>
          <div className="settings-subsection winner-view-settings"><h4>Vista del ganador</h4>
            <div className="settings-form-grid">
              <SwitchRow label="Mostrar logo principal" checked={branding.presentation.winnerView.showPrimaryLogo} disabled={!branding.header.showPrimaryLogo || !branding.presentation.showPrimaryLogo} onChange={(value) => patchWinnerView({ showPrimaryLogo: value })} />
              <SwitchRow label="Mostrar logos institucionales" checked={branding.presentation.winnerView.showInstitutionalLogos} disabled={(!branding.header.showEpunemiLogo && !branding.header.showInstitutionalLogo) || !branding.presentation.showInstitutionalLogos} onChange={(value) => patchWinnerView({ showInstitutionalLogos: value })} />
              <SwitchRow label="Mostrar icono de ganador" checked={branding.presentation.winnerView.showIcon} onChange={(value) => patchWinnerView({ showIcon: value })} />
              <SwitchRow label="Mostrar etiqueta GANADOR" checked={branding.presentation.winnerView.showLabel} onChange={(value) => patchWinnerView({ showLabel: value })} />
              <SwitchRow label="Mostrar nombre del sorteo" checked={branding.presentation.winnerView.showDrawTitle} onChange={(value) => patchWinnerView({ showDrawTitle: value })} />
              <SwitchRow label="Mostrar número" checked={branding.presentation.showDrawNumber} onChange={(value) => patchPresentation({ showDrawNumber: value })} />
              <SwitchRow label="Mostrar fecha" checked={branding.presentation.showDate} onChange={(value) => patchPresentation({ showDate: value })} />
              <SwitchRow label="Mostrar hora" checked={branding.presentation.showTime} onChange={(value) => patchPresentation({ showTime: value })} />
              <SwitchRow label="Mostrar borde de tarjeta" checked={branding.presentation.winnerView.showCardBorder} onChange={(value) => patchWinnerView({ showCardBorder: value })} />
              <SwitchRow label="Mostrar sombra de tarjeta" checked={branding.presentation.winnerView.showCardShadow} onChange={(value) => patchWinnerView({ showCardShadow: value })} />
            </div>
          </div>
          <div className="settings-subsection home-card-settings"><h4>Tarjeta del Home</h4>
            <p className="settings-note">Estos valores afectan únicamente el resultado de la vista principal. Fullscreen conserva su composición independiente.</p>
            <RangeNumberField label="Ancho de la tarjeta" value={branding.presentation.homeWinnerCard.widthPercent} min={60} max={100} step={1} suffix="%" onChange={(widthPercent) => patchHomeWinnerCard({ widthPercent })} />
            <RangeNumberField label="Alto de la tarjeta" value={branding.presentation.homeWinnerCard.height} min={300} max={700} step={10} suffix="px" onChange={(height) => patchHomeWinnerCard({ height })} />
            <RangeNumberField label="Padding interno" value={branding.presentation.homeWinnerCard.padding} min={12} max={72} step={2} suffix="px" onChange={(padding) => patchHomeWinnerCard({ padding })} />
            <RangeNumberField label="Radio de borde" value={branding.presentation.homeWinnerCard.borderRadius} min={0} max={40} step={1} suffix="px" onChange={(borderRadius) => patchHomeWinnerCard({ borderRadius })} />
            <RangeNumberField label="Escala general del contenido" value={branding.presentation.homeWinnerCard.contentScale} min={80} max={120} step={5} suffix="%" onChange={(contentScale) => patchHomeWinnerCard({ contentScale })} />
            <label className="field"><span>Sombra</span><select value={branding.presentation.homeWinnerCard.shadow} onChange={(event) => patchHomeWinnerCard({ shadow: event.target.value as BrandingSettings['presentation']['homeWinnerCard']['shadow'] })}><option value="none">Sin sombra</option><option value="soft">Suave</option><option value="medium">Media</option></select></label>
            <button className="restore-branding" type="button" onClick={resetHomeWinnerCard}><RotateCcw size={16} />Restablecer tarjeta del Home</button>
          </div>
          <div className="settings-subsection"><h4>Barra superior</h4>
            <SwitchRow label="Mostrar barra superior" checked={branding.presentation.winnerView.showTopBar} onChange={(value) => patchWinnerView({ showTopBar: value })} />
            <div className="settings-form-grid">
              <BrandingColorField label="Color principal" value={branding.presentation.winnerView.topBarPrimary} onChange={(topBarPrimary) => patchWinnerView({ topBarPrimary })} />
              <BrandingColorField label="Color secundario" value={branding.presentation.winnerView.topBarSecondary} onChange={(topBarSecondary) => patchWinnerView({ topBarSecondary })} />
              <label className="field"><span>Estilo</span><select value={branding.presentation.winnerView.topBarStyle} onChange={(event) => patchWinnerView({ topBarStyle: event.target.value as BrandingSettings['presentation']['winnerView']['topBarStyle'] })}><option value="solid">Sólida</option><option value="split">Dividida</option><option value="gradient">Degradado suave</option></select></label>
              <RangeNumberField label="Altura de la barra" value={branding.presentation.winnerView.topBarHeight} min={3} max={24} step={1} suffix="px" onChange={(topBarHeight) => patchWinnerView({ topBarHeight })} />
            </div>
          </div>
          <div className="settings-subsection"><h4>Icono de ganador</h4>
            <div className="settings-form-grid">
              <label className="field"><span>Forma del contenedor</span><select value={branding.presentation.winnerView.iconShape} onChange={(event) => patchWinnerView({ iconShape: event.target.value as BrandingSettings['presentation']['winnerView']['iconShape'] })}><option value="circle">Círculo</option><option value="rounded">Redondeado</option><option value="none">Sin fondo</option></select></label>
              <BrandingColorField label="Color del icono" value={branding.presentation.winnerView.iconColor} onChange={(iconColor) => patchWinnerView({ iconColor })} />
              <BrandingColorField label="Fondo del icono" value={branding.presentation.winnerView.iconBackground} onChange={(iconBackground) => patchWinnerView({ iconBackground })} />
              <BrandingColorField label="Borde del icono" value={branding.presentation.winnerView.iconBorderColor} onChange={(iconBorderColor) => patchWinnerView({ iconBorderColor })} />
            </div>
          </div>
          <div className="settings-subsection winner-sizing"><h4>Tamaños · Básico</h4>
            <RangeNumberField label="Logo principal" value={branding.presentation.winnerView.primaryLogoScale} min={50} max={200} step={5} suffix="%" onChange={(primaryLogoScale) => patchWinnerView({ primaryLogoScale })} />
            <RangeNumberField label="Icono ganador" value={branding.presentation.winnerView.iconSizePx} min={32} max={160} step={2} suffix="px" onChange={(iconSizePx) => patchWinnerView({ iconSizePx })} />
            <RangeNumberField label="Nombre del ganador" value={branding.presentation.winnerView.winnerNameSize} min={32} max={140} step={2} suffix="px" onChange={(winnerNameSize) => patchWinnerView({ winnerNameSize })} />
            <RangeNumberField label="Nombre del sorteo" value={branding.presentation.winnerView.drawTitleSize} min={12} max={48} step={1} suffix="px" onChange={(drawTitleSize) => patchWinnerView({ drawTitleSize })} />
            <RangeNumberField label="Logo EPUNEMI" value={branding.presentation.winnerView.epunemiLogoScale} min={50} max={200} step={5} suffix="%" onChange={(epunemiLogoScale) => patchWinnerView({ epunemiLogoScale })} />
            <RangeNumberField label="Logo UNEMI / institucional" value={branding.presentation.winnerView.institutionalLogoScale} min={50} max={200} step={5} suffix="%" onChange={(institutionalLogoScale) => patchWinnerView({ institutionalLogoScale })} />
            <label className="field"><span>Espaciado general</span><select value={branding.presentation.winnerView.spacing} onChange={(event) => patchWinnerView({ spacing: event.target.value as BrandingSettings['presentation']['winnerView']['spacing'] })}><option value="compact">Compacto</option><option value="normal">Normal</option><option value="spacious">Amplio</option></select></label>
            <details className="winner-advanced"><summary>Opciones avanzadas</summary><div>
              <RangeNumberField label={'Etiqueta "GANADOR"'} value={branding.presentation.winnerView.winnerLabelSize} min={10} max={40} step={1} suffix="px" onChange={(winnerLabelSize) => patchWinnerView({ winnerLabelSize })} />
              <RangeNumberField label="Etiquetas de información" value={branding.presentation.winnerView.metadataLabelSize} min={9} max={24} step={1} suffix="px" onChange={(metadataLabelSize) => patchWinnerView({ metadataLabelSize })} />
              <RangeNumberField label="Valores de información" value={branding.presentation.winnerView.metadataValueSize} min={12} max={36} step={1} suffix="px" onChange={(metadataValueSize) => patchWinnerView({ metadataValueSize })} />
              <label className="field"><span>Tamaño del botón</span><select value={branding.presentation.winnerView.buttonSize} onChange={(event) => patchWinnerView({ buttonSize: event.target.value as BrandingSettings['presentation']['winnerView']['buttonSize'] })}><option value="small">Pequeño</option><option value="medium">Normal</option><option value="large">Grande</option></select></label>
              <RangeNumberField label="Texto del botón" value={branding.presentation.winnerView.buttonTextSize} min={12} max={26} step={1} suffix="px" onChange={(buttonTextSize) => patchWinnerView({ buttonTextSize })} />
              <RangeNumberField label="Controles inferiores" value={branding.presentation.winnerView.controlsScale} min={75} max={150} step={5} suffix="%" onChange={(controlsScale) => patchWinnerView({ controlsScale })} />
              <RangeNumberField label="Espacio después del logo" value={branding.presentation.winnerView.gapAfterLogo} min={0} max={64} step={2} suffix="px" onChange={(gapAfterLogo) => patchWinnerView({ gapAfterLogo })} />
              <RangeNumberField label="Espacio trofeo → GANADOR" value={branding.presentation.winnerView.gapIconLabel} min={0} max={48} step={2} suffix="px" onChange={(gapIconLabel) => patchWinnerView({ gapIconLabel })} />
              <RangeNumberField label="Espacio GANADOR → nombre" value={branding.presentation.winnerView.gapLabelName} min={0} max={48} step={2} suffix="px" onChange={(gapLabelName) => patchWinnerView({ gapLabelName })} />
              <RangeNumberField label="Espacio nombre → sorteo" value={branding.presentation.winnerView.gapNameTitle} min={0} max={48} step={2} suffix="px" onChange={(gapNameTitle) => patchWinnerView({ gapNameTitle })} />
              <RangeNumberField label="Espacio sorteo → información" value={branding.presentation.winnerView.gapTitleMetadata} min={0} max={56} step={2} suffix="px" onChange={(gapTitleMetadata) => patchWinnerView({ gapTitleMetadata })} />
              <RangeNumberField label="Espacio información → logos" value={branding.presentation.winnerView.gapMetadataLogos} min={0} max={64} step={2} suffix="px" onChange={(gapMetadataLogos) => patchWinnerView({ gapMetadataLogos })} />
            </div></details>
            <button className="restore-branding" type="button" onClick={resetWinnerSizing}><RotateCcw size={16} />Restablecer tamaños</button>
          </div>
        </section>}

        {tab === 'data' && <section className="settings-pane">
          <PaneTitle icon={<Database size={19} />} title="Datos y almacenamiento" description="Respaldos, participantes y almacenamiento local." />
          <button className="data-zone-link" type="button" onClick={onDataZone}><Database size={19} /><span><strong>Abrir zona de datos</strong><small>Exportar, restaurar, reintegrar o eliminar datos locales</small></span></button>
        </section>}
      </div>

      <aside className="branding-live-preview" aria-label="Vista previa de identidad">
        {testConfetti && <Confetti duration={settings.effects.confettiDuration} intensity={settings.effects.confettiIntensity} onComplete={() => setTestConfetti(false)} />}
        <span className="preview-label">Vista previa en tiempo real</span>
        {tab === 'presentation' ? <><span className="preview-section-label">Home</span><HomeWinnerPreview branding={branding} logos={homePreviewLogos} /><span className="preview-section-label">Fullscreen</span><WinnerPreview branding={branding} logos={winnerPreviewLogos} /></> : <>
          {previewLogos.primary && <img src={branding.logos.primary.src} alt="Vista previa del logo principal" />}
          {branding.header.showTitle && <h3>{branding.appName || 'Nombre de la aplicación'}</h3>}
          {branding.header.showSubtitle && <p>{branding.subtitle || 'Subtítulo'}</p>}
          <div className="preview-winner"><small>Ganador</small><strong>Juan Pérez</strong></div>
          <button type="button" tabIndex={-1}>Botón de ejemplo</button>
          {(previewLogos.epunemi || previewLogos.institutional) && <div className="preview-logo-row">{previewLogos.epunemi && <img src={branding.logos.epunemi.src} alt="EPUNEMI" />}{previewLogos.institutional && <img src={branding.logos.institutional.src} alt="UNEMI EPUNEMI" />}</div>}
        </>}
      </aside>
    </div>
  </Modal>
  {confirmRestore && <ConfirmDialog title="Restaurar identidad visual" description="¿Deseas restaurar la identidad original de Jornadas Académicas?" detail="Los participantes, las bases y el historial no se modificarán." confirmLabel="Restaurar identidad" variant="warning" icon={<RotateCcw size={22} />} onCancel={() => setConfirmRestore(false)} onConfirm={restoreAll} />}
  {pendingBranding && <ConfirmDialog title="Importar configuración visual" description="La configuración importada reemplazará la identidad visual actual." detail="Los participantes, las bases y el historial no se modificarán." confirmLabel="Importar configuración" variant="warning" onCancel={() => setPendingBranding(null)} onConfirm={() => { onBranding(pendingBranding); setPendingBranding(null); onToast('Configuración visual importada') }} />}
  </>
}

function PaneTitle({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return <div className="settings-pane__title">{icon}<div><h3>{title}</h3><p>{description}</p></div></div>
}

function SwitchRow({ label, checked, disabled = false, onChange }: { label: string; checked: boolean; disabled?: boolean; onChange: (value: boolean) => void }) {
  return <label className={`switch-row ${disabled ? 'switch-row--disabled' : ''}`}><span>{label}</span><input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} /></label>
}

function RangeNumberField({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (value: number) => void }) {
  const update = (next: number) => onChange(Math.min(max, Math.max(min, Number.isFinite(next) ? next : min)))
  const unit = suffix === '%' ? 'porcentaje' : suffix === 's' ? 'segundos' : 'píxeles'
  return <div className="range-number-field"><div><span>{label}</span><output>{value}{suffix}</output></div><div><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => update(Number(event.target.value))} /><input type="number" min={min} max={max} step={step} value={value} onChange={(event) => update(Number(event.target.value))} aria-label={`${label} en ${unit}`} /></div></div>
}

function WinnerPreview({ branding, logos }: { branding: BrandingSettings; logos: ReturnType<typeof getLogoVisibility> }) {
  const view = branding.presentation.winnerView
  const style = { '--winner-bar-primary': view.topBarPrimary, '--winner-bar-secondary': view.topBarSecondary, '--winner-bar-height': `${view.topBarHeight}px`, '--winner-icon-color': view.iconColor, '--winner-icon-background': view.iconBackground, '--winner-icon-border': view.iconBorderColor, '--winner-card-radius': `${Math.min(view.borderRadius, 32)}px`, '--preview-gap-logo': `${view.gapAfterLogo * .22}px`, '--preview-gap-icon': `${view.gapIconLabel * .22}px`, '--preview-gap-label': `${view.gapLabelName * .22}px`, '--preview-gap-name': `${view.gapNameTitle * .22}px`, '--preview-gap-title': `${view.gapTitleMetadata * .22}px`, '--preview-gap-meta': `${view.gapMetadataLogos * .22}px` } as React.CSSProperties
  return <div className={`winner-preview-card ${view.showCardBorder ? '' : 'winner-card--no-border'} ${view.showCardShadow ? '' : 'winner-card--no-shadow'}`} style={style}>
    {view.showTopBar && <div className={`winner-top-bar winner-top-bar--${view.topBarStyle}`} />}
    {logos.primary && <img className="winner-preview-primary" style={{ width: `${Math.min(100, 70 * view.primaryLogoScale / 100)}%` }} src={branding.logos.primary.src} alt="Vista previa del logo principal" />}
    {view.showIcon && <div className={`trophy trophy--${view.iconShape}`} style={{ width: Math.min(88, Math.max(28, view.iconSizePx * .55)), height: Math.min(88, Math.max(28, view.iconSizePx * .55)) }}><Trophy /></div>}
    {view.showLabel && <small style={{ fontSize: Math.max(7, view.winnerLabelSize * .55) }}>Ganador</small>}<strong style={{ fontSize: Math.max(15, view.winnerNameSize * .24) }}>Juan Pérez</strong>
    {view.showDrawTitle && <p style={{ fontSize: Math.max(8, view.drawTitleSize * .48) }}>Sorteo de premios</p>}
    {(branding.presentation.showDrawNumber || branding.presentation.showDate || branding.presentation.showTime) && <div className="winner-preview-meta">{branding.presentation.showDrawNumber && <span><small style={{ fontSize: Math.max(6, view.metadataLabelSize * .5) }}>Número</small><b style={{ fontSize: Math.max(8, view.metadataValueSize * .5) }}>#0001</b></span>}{branding.presentation.showDate && <span><small style={{ fontSize: Math.max(6, view.metadataLabelSize * .5) }}>Fecha</small><b style={{ fontSize: Math.max(8, view.metadataValueSize * .5) }}>5 oct 2026</b></span>}{branding.presentation.showTime && <span><small style={{ fontSize: Math.max(6, view.metadataLabelSize * .5) }}>Hora</small><b style={{ fontSize: Math.max(8, view.metadataValueSize * .5) }}>20:30</b></span>}</div>}
    {(logos.epunemi || logos.institutional) && <div className="preview-logo-row">{logos.epunemi && <img style={{ width: `${Math.min(65, 40 * view.epunemiLogoScale / 100)}%` }} src={branding.logos.epunemi.src} alt="EPUNEMI" />}{logos.institutional && <img style={{ width: `${Math.min(65, 40 * view.institutionalLogoScale / 100)}%` }} src={branding.logos.institutional.src} alt="UNEMI EPUNEMI" />}</div>}
    <button className={`winner-preview-button winner-preview-button--${view.buttonSize}`} type="button" tabIndex={-1} style={{ fontSize: Math.max(8, view.buttonTextSize * .55) }}>Realizar otro sorteo</button>
  </div>
}

function HomeWinnerPreview({ branding, logos }: { branding: BrandingSettings; logos: ReturnType<typeof getLogoVisibility> }) {
  const home = branding.presentation.homeWinnerCard
  const view = branding.presentation.winnerView
  const style = { width: `${home.widthPercent}%`, height: `${Math.min(220, 130 + (home.height - 300) * .15)}px`, padding: `${Math.max(8, home.padding * .3)}px`, borderRadius: `${home.borderRadius * .55}px`, '--home-preview-scale': home.contentScale / 100 } as React.CSSProperties
  return <div className={`home-winner-preview winner-card--home-shadow-${home.shadow}`} style={style}>
    <div>{logos.primary && <img src={branding.logos.primary.src} alt="Logo principal" />}{view.showIcon && <Trophy />}{view.showLabel && <small>Ganador</small>}<strong>Juan Pérez</strong>{view.showDrawTitle && <p>Sorteo de premios</p>}<span>#0001 · 5 oct 2026 · 20:30</span>{(logos.epunemi || logos.institutional) && <div>{logos.epunemi && <img src={branding.logos.epunemi.src} alt="EPUNEMI" />}{logos.institutional && <img src={branding.logos.institutional.src} alt="UNEMI EPUNEMI" />}</div>}</div>
  </div>
}

const PREVIEW_PARTICIPANTS: Participant[] = ['Juan Pérez', 'María López', 'Carlos Ruiz', 'Andrea Torres', 'María Fernanda Torres'].map((name, index) => ({ id: `preview-${index}`, name, createdAt: '2026-01-01T00:00:00.000Z' }))
