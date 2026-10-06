import { useState } from 'react'
import { Modal } from './Modal'

interface AddParticipantsModalProps {
  onClose: () => void
  onAdd: (names: string[]) => void
}

export function AddParticipantsModal({ onClose, onAdd }: AddParticipantsModalProps) {
  const [value, setValue] = useState('')
  const names = value.split(/\r?\n/).map((name) => name.trim().replace(/\s+/g, ' ')).filter(Boolean)
  return <Modal title="Agregar participantes" description="Pega una persona por línea. La base maestra se guardará automáticamente." onClose={onClose}>
    <label className="field"><span>Participantes</span><textarea rows={12} value={value} onChange={(event) => setValue(event.target.value)} placeholder={'Juan Pérez\nMaría López\nCarlos Suárez'} autoFocus /></label>
    <div className="modal-footer"><span className="muted">{names.length} nombres válidos</span><button className="primary-button" type="button" disabled={names.length === 0} onClick={() => { onAdd(names); onClose() }}>Agregar participantes</button></div>
  </Modal>
}
