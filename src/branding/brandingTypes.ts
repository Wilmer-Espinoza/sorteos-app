export type LogoSize = 'small' | 'medium' | 'large'
export type WinnerSize = 'normal' | 'large' | 'xlarge'
export type WinnerBarStyle = 'solid' | 'split' | 'gradient'
export type WinnerIconSize = 'small' | 'medium' | 'large' | 'xlarge'
export type WinnerIconShape = 'circle' | 'rounded' | 'none'
export type WinnerElementSize = 'small' | 'medium' | 'large'
export type WinnerSpacing = 'compact' | 'normal' | 'spacious'
export type WinnerCardWidth = 'compact' | 'standard' | 'wide'
export type HomeCardShadow = 'none' | 'soft' | 'medium'
export type BrandingPreset = 'jornadas' | 'custom'

export interface BrandingImage {
  src: string
  name: string
  mimeType: string
  isCustom: boolean
}

export interface BrandingColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  success: string
  winner: string
}

export interface BrandingHeader {
  showPrimaryLogo: boolean
  showEpunemiLogo: boolean
  showInstitutionalLogo: boolean
  showTitle: boolean
  showSubtitle: boolean
  primaryLogoSize: LogoSize
}

export interface BrandingPresentation {
  showPrimaryLogo: boolean
  showInstitutionalLogos: boolean
  showDrawTitle: boolean
  showEligibleCount: boolean
  showConfetti: boolean
  showDrawNumber: boolean
  showDate: boolean
  showTime: boolean
  winnerSize: WinnerSize
  homeWinnerCard: {
    widthPercent: number
    height: number
    padding: number
    borderRadius: number
    shadow: HomeCardShadow
    contentScale: number
  }
  winnerView: {
    showTopBar: boolean
    topBarPrimary: string
    topBarSecondary: string
    topBarHeight: number
    topBarStyle: WinnerBarStyle
    showPrimaryLogo: boolean
    showInstitutionalLogos: boolean
    showIcon: boolean
    showLabel: boolean
    showDrawTitle: boolean
    showCardBorder: boolean
    showCardShadow: boolean
    iconSize: WinnerIconSize
    iconColor: string
    iconBackground: string
    iconBorderColor: string
    iconShape: WinnerIconShape
    subtitleSize: WinnerElementSize
    metadataSize: WinnerElementSize
    logoSize: WinnerElementSize
    spacing: WinnerSpacing
    cardWidth: WinnerCardWidth
    borderRadius: number
    padding: number
    primaryLogoScale: number
    iconSizePx: number
    winnerLabelSize: number
    winnerNameSize: number
    drawTitleSize: number
    metadataLabelSize: number
    metadataValueSize: number
    epunemiLogoScale: number
    institutionalLogoScale: number
    buttonSize: WinnerElementSize
    buttonTextSize: number
    controlsScale: number
    gapAfterLogo: number
    gapIconLabel: number
    gapLabelName: number
    gapNameTitle: number
    gapTitleMetadata: number
    gapMetadataLogos: number
  }
}

export interface BrandingSettings {
  preset: BrandingPreset
  appName: string
  subtitle: string
  organizationName: string
  footerText: string
  logos: {
    primary: BrandingImage
    epunemi: BrandingImage
    institutional: BrandingImage
  }
  colors: BrandingColors
  header: BrandingHeader
  presentation: BrandingPresentation
}
