import type { BrandingSettings } from './brandingTypes'

export type BrandingContext = 'header' | 'presentation' | 'presentationWinner' | 'winner' | 'preview' | 'export'

export interface LogoVisibility {
  primary: boolean
  epunemi: boolean
  institutional: boolean
}

/**
 * La visibilidad del encabezado funciona como permiso global. Los contextos
 * de presentación pueden restringir ese permiso, pero nunca volver a activar
 * un logo deshabilitado globalmente.
 */
export function getLogoVisibility(branding: BrandingSettings, context: BrandingContext): LogoVisibility {
  const globalVisibility: LogoVisibility = {
    primary: branding.header.showPrimaryLogo,
    epunemi: branding.header.showEpunemiLogo,
    institutional: branding.header.showInstitutionalLogo,
  }

  if (context === 'header' || context === 'preview') return globalVisibility

  const winnerVisibility = context === 'winner' || context === 'export'
  const presentationVisibility = context === 'presentation' || context === 'presentationWinner'
  const winnerRestriction = winnerVisibility || context === 'presentationWinner'

  return {
    primary: globalVisibility.primary && (!presentationVisibility || branding.presentation.showPrimaryLogo) && (!winnerRestriction || branding.presentation.winnerView.showPrimaryLogo),
    epunemi: globalVisibility.epunemi && (!presentationVisibility || branding.presentation.showInstitutionalLogos) && (!winnerRestriction || branding.presentation.winnerView.showInstitutionalLogos),
    institutional: globalVisibility.institutional && (!presentationVisibility || branding.presentation.showInstitutionalLogos) && (!winnerRestriction || branding.presentation.winnerView.showInstitutionalLogos),
  }
}
