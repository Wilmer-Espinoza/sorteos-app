import { ImageUp, RotateCcw } from 'lucide-react'
import type { BrandingImage } from '../branding/brandingTypes'
import { readBrandingImage } from '../branding/brandingService'

interface BrandingLogoFieldProps {
  label: string
  image: BrandingImage
  original: BrandingImage
  hidden?: boolean
  onChange: (image: BrandingImage) => void
  onError: (message: string) => void
}

export function BrandingLogoField({ label, image, original, hidden = false, onChange, onError }: BrandingLogoFieldProps) {
  async function chooseFile(file?: File) {
    if (!file) return
    try { onChange(await readBrandingImage(file)) }
    catch (reason) { onError(reason instanceof Error ? reason.message : 'No se pudo cargar el logo.') }
  }
  return <article className="branding-logo-field">
    <div className="branding-logo-preview">{hidden ? <span>Oculto globalmente</span> : <img src={image.src} alt={`Vista previa: ${label}`} />}</div>
    <div className="branding-logo-copy"><strong>{label}</strong><small>{image.name}{image.isCustom ? ' · personalizado' : ' · original'}</small></div>
    <div className="branding-logo-actions">
      <label className="mini-button"><ImageUp size={15} />Cambiar<input type="file" accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => void chooseFile(event.target.files?.[0])} /></label>
      <button className="mini-button" type="button" disabled={!image.isCustom} onClick={() => onChange(original)}><RotateCcw size={15} />Original</button>
    </div>
  </article>
}
