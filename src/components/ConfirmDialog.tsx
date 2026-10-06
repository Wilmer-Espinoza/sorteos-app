import { AlertTriangle, Info, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export type DialogVariant = 'normal' | 'warning' | 'danger'

interface DialogInput {
  label: string
  defaultValue?: string
  placeholder?: string
  requiredValue?: string
}

interface ConfirmDialogProps {
  title: string
  description: string
  detail?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: DialogVariant
  icon?: ReactNode
  input?: DialogInput
  loadingLabel?: string
  onCancel: () => void
  onConfirm: (value: string) => void | Promise<void>
}

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'

export function ConfirmDialog({ title, description, detail, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', variant = 'normal', icon, input, loadingLabel = 'Procesando…', onCancel, onConfirm }: ConfirmDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef<HTMLElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const [value, setValue] = useState(input?.defaultValue ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const canConfirm = !loading && (!input || (input.requiredValue ? value === input.requiredValue : value.trim().length > 0))

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    window.requestAnimationFrame(() => (inputRef.current ?? cancelRef.current)?.focus())
    return () => previous?.focus()
  }, [])

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape' && !loading) {
      event.preventDefault()
      event.stopPropagation()
      onCancel()
      return
    }
    if (event.key !== 'Tab') return
    const focusable = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable.at(-1) ?? first
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }

  async function submitDecision() {
    if (!canConfirm) return
    setLoading(true)
    setError('')
    try { await onConfirm(value.trim()) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo completar la operación'); setLoading(false) }
  }

  const target = document.fullscreenElement ?? document.body
  return createPortal(
    <div className="confirm-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !loading && onCancel()}>
      <section ref={panelRef} className={`confirm-dialog confirm-dialog--${variant}`} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} onKeyDown={handleKeyDown}>
        <div className="confirm-dialog__icon" aria-hidden="true">{icon ?? (variant === 'normal' ? <Info size={22} /> : <AlertTriangle size={22} />)}</div>
        <div className="confirm-dialog__body">
          <div className="confirm-dialog__heading"><h2 id={titleId}>{title}</h2><button type="button" className="icon-button" onClick={onCancel} disabled={loading} aria-label={`Cerrar ${title}`}><X size={18} /></button></div>
          <p id={descriptionId}>{description}</p>
          {detail && <p className="confirm-dialog__detail">{detail}</p>}
          {input && <label className="field confirm-dialog__input"><span>{input.label}</span><input ref={inputRef} value={value} placeholder={input.placeholder} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && canConfirm) { event.preventDefault(); void submitDecision() } }} autoComplete="off" /></label>}
          {error && <p className="validation-error" role="alert">{error}</p>}
          <div className="confirm-dialog__actions">
            <button ref={cancelRef} className="soft-button" type="button" onClick={onCancel} disabled={loading}>{cancelLabel}</button>
            <button className={variant === 'danger' ? 'danger-button' : 'primary-button'} type="button" onClick={() => void submitDecision()} disabled={!canConfirm}>{loading ? loadingLabel : confirmLabel}</button>
          </div>
        </div>
      </section>
    </div>,
    target,
  )
}
