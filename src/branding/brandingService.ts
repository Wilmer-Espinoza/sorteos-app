import type { BrandingImage, BrandingSettings } from './brandingTypes'
import { normalizeBranding } from './defaultBranding'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
const MAX_LOGO_SIZE = 8 * 1024 * 1024

export function readBrandingImage(file: File): Promise<BrandingImage> {
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Formato no compatible. Usa PNG, JPG, JPEG, WEBP o SVG.')
  if (file.size > MAX_LOGO_SIZE) throw new Error('El logo supera el máximo de 8 MB.')
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ src: String(reader.result), name: file.name, mimeType: file.type, isCustom: true })
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'))
    reader.readAsDataURL(file)
  })
}

export function exportBranding(branding: BrandingSettings): void {
  const payload = JSON.stringify({ application: 'Sorteos Jornadas Académicas', exportedAt: new Date().toISOString(), brandingSettings: branding }, null, 2)
  const url = URL.createObjectURL(new Blob([payload], { type: 'application/json;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'branding-jornadas.json'
  link.click()
  URL.revokeObjectURL(url)
}

export async function importBranding(file: File): Promise<BrandingSettings> {
  const parsed = JSON.parse(await file.text()) as { brandingSettings?: Partial<BrandingSettings> }
  if (!parsed.brandingSettings?.colors || !parsed.brandingSettings?.logos) throw new Error('El archivo no contiene una configuración visual válida.')
  return normalizeBranding({ ...parsed.brandingSettings, preset: 'custom' })
}

export function applyBrandingVariables(branding: BrandingSettings): void {
  const root = document.documentElement
  const entries: Record<string, string> = {
    '--brand-primary': branding.colors.primary,
    '--brand-secondary': branding.colors.secondary,
    '--brand-accent': branding.colors.accent,
    '--brand-background': branding.colors.background,
    '--brand-surface': branding.colors.surface,
    '--brand-text': branding.colors.text,
    '--brand-success': branding.colors.success,
    '--brand-winner': branding.colors.winner,
  }
  Object.entries(entries).forEach(([property, value]) => root.style.setProperty(property, value))
}
