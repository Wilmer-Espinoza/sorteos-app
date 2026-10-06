import { describe, expect, it } from 'vitest'
import { defaultBranding } from './defaultBranding'
import { getLogoVisibility } from './brandingVisibility'

describe('visibilidad centralizada de logos', () => {
  it('prioriza el apagado global aunque presentación esté activa', () => {
    const branding = structuredClone(defaultBranding)
    branding.header.showPrimaryLogo = false
    branding.presentation.showPrimaryLogo = true
    expect(getLogoVisibility(branding, 'header').primary).toBe(false)
    expect(getLogoVisibility(branding, 'presentation').primary).toBe(false)
    expect(getLogoVisibility(branding, 'winner').primary).toBe(false)
  })

  it('permite restringir el logo principal solamente en presentación', () => {
    const branding = structuredClone(defaultBranding)
    branding.header.showPrimaryLogo = true
    branding.presentation.showPrimaryLogo = false
    expect(getLogoVisibility(branding, 'header').primary).toBe(true)
    expect(getLogoVisibility(branding, 'presentation').primary).toBe(false)
  })

  it('aplica la regla global a EPUNEMI y al logo institucional', () => {
    const branding = structuredClone(defaultBranding)
    branding.header.showEpunemiLogo = false
    branding.header.showInstitutionalLogo = false
    branding.presentation.showInstitutionalLogos = true
    expect(getLogoVisibility(branding, 'presentation')).toEqual({ primary: true, epunemi: false, institutional: false })
    expect(getLogoVisibility(branding, 'preview').epunemi).toBe(false)
    expect(getLogoVisibility(branding, 'export').institutional).toBe(false)
  })
})
