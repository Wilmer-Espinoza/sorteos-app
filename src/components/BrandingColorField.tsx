interface BrandingColorFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
}

export function BrandingColorField({ label, value, onChange }: BrandingColorFieldProps) {
  const valid = /^#[0-9a-f]{6}$/i.test(value)
  return <label className="branding-color-field">
    <span>{label}</span>
    <div><input type="color" value={valid ? value : '#000000'} onChange={(event) => onChange(event.target.value.toUpperCase())} aria-label={`Selector de ${label}`} /><input value={value} onChange={(event) => onChange(event.target.value.toUpperCase())} maxLength={7} aria-label={`Código hexadecimal de ${label}`} className={valid ? '' : 'invalid'} /></div>
  </label>
}
