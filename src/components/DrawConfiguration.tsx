import { Info, Minus, Plus, RotateCcw, Scale } from 'lucide-react'
import type { Settings } from '../types'

interface DrawConfigurationProps {
  title: string
  winnerCount: number
  settings: Settings
  disabled: boolean
  onTitle: (value: string) => void
  onWinnerCount: (value: number) => void
  onSettings: (settings: Settings) => void
  onResetEligibility: () => void
  onUndo: () => void
  canUndo: boolean
}

export function DrawConfiguration({ title, winnerCount, settings, disabled, onTitle, onWinnerCount, onSettings, onResetEligibility, onUndo, canUndo }: DrawConfigurationProps) {
  const patch = (value: Partial<Settings>) => onSettings({ ...settings, ...value })
  const soundEnabled = settings.effects.selectionSoundEnabled || settings.effects.winnerSoundEnabled
  const changePreset = (preset: Settings['effects']['animationPreset']) => {
    const seconds = preset === 'fast' ? 3 : preset === 'normal' ? 6 : preset === 'exciting' ? 10 : settings.effects.animationDuration
    patch({ duration: preset === 'custom' ? settings.duration : preset, effects: { ...settings.effects, animationPreset: preset, animationDuration: seconds } })
  }
  return (
    <section className="draw-config card">
      <div className="section-title-row"><div><p className="eyebrow">Preparación</p><h2>Configuración del sorteo</h2></div><span className="fairness"><Scale size={15} /> Selección criptográfica</span></div>
      <div className="config-grid">
        <label className="field"><span>Nombre del sorteo</span><input value={title} onChange={(event) => onTitle(event.target.value)} disabled={disabled} /></label>
        <div className="field"><span>Cantidad de ganadores</span><div className="stepper"><button type="button" onClick={() => onWinnerCount(Math.max(1, winnerCount - 1))} disabled={disabled || winnerCount <= 1} aria-label="Reducir ganadores"><Minus size={17} /></button><output aria-live="polite">{winnerCount}</output><button type="button" onClick={() => onWinnerCount(winnerCount + 1)} disabled={disabled} aria-label="Aumentar ganadores"><Plus size={17} /></button></div></div>
        <label className="field"><span>Ritmo</span><select value={settings.effects.animationPreset} onChange={(event) => changePreset(event.target.value as Settings['effects']['animationPreset'])} disabled={disabled}><option value="fast">Rápida · 3 s</option><option value="normal">Normal · 6 s</option><option value="exciting">Emocionante · 10 s</option><option value="custom">Personalizado · {settings.effects.animationDuration} s</option></select></label>
        <label className="field"><span>Revelación</span><select value={settings.revealMode} onChange={(event) => patch({ revealMode: event.target.value as Settings['revealMode'] })} disabled={disabled}><option value="automatic">Automática</option><option value="presentation">Presentación manual</option></select></label>
      </div>
      <div className="option-row">
        <label className="check"><input type="checkbox" checked={settings.excludePreviousWinners} onChange={(event) => patch({ excludePreviousWinners: event.target.checked, allowRepeatedWinners: event.target.checked ? false : settings.allowRepeatedWinners })} disabled={disabled} /><span>Excluir ganadores anteriores</span></label>
        <label className="check"><input type="checkbox" checked={settings.allowRepeatedWinners} onChange={(event) => patch({ allowRepeatedWinners: event.target.checked, excludePreviousWinners: event.target.checked ? false : settings.excludePreviousWinners })} disabled={disabled} /><span>Permitir repetidos</span></label>
        <label className="check"><input type="checkbox" checked={settings.weightedMode} onChange={(event) => patch({ weightedMode: event.target.checked })} disabled={disabled} /><span>Probabilidades personalizadas</span></label>
        <label className="check"><input type="checkbox" checked={settings.confetti} onChange={(event) => patch({ confetti: event.target.checked })} disabled={disabled} /><span>Mostrar confeti</span></label>
        <label className="check"><input type="checkbox" checked={soundEnabled} onChange={(event) => patch({ sound: event.target.checked, effects: { ...settings.effects, selectionSoundEnabled: event.target.checked, winnerSoundEnabled: event.target.checked } })} disabled={disabled} /><span>Reproducir sonido</span></label>
        <label className="check"><input type="checkbox" checked={settings.animation} onChange={(event) => patch({ animation: event.target.checked })} disabled={disabled} /><span>Mostrar animación</span></label>
      </div>
      {settings.weightedMode && <p className="warning-line"><Info size={15} /> Modo avanzado activo: las probabilidades dependen del peso asignado a cada participante.</p>}
      <div className="subtle-actions"><button type="button" onClick={onResetEligibility} disabled={disabled}><RotateCcw size={16} /> Reintegrar todos</button><button type="button" onClick={onUndo} disabled={disabled || !canUndo}>Deshacer último sorteo</button></div>
    </section>
  )
}
