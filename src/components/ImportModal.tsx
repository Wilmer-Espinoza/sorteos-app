import { FileSpreadsheet, Upload } from 'lucide-react'
import { useState } from 'react'
import type { ImportPreview, Participant } from '../types'
import { parseImportFile, previewToParticipants } from '../services/importExport'
import { Modal } from './Modal'

interface ImportModalProps {
  onClose: () => void
  onImport: (participants: Participant[]) => void
}

export function ImportModal({ onClose, onImport }: ImportModalProps) {
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [column, setColumn] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function chooseFile(file: File | undefined) {
    if (!file) return
    setLoading(true); setError('')
    try {
      const result = await parseImportFile(file)
      setPreview(result)
      setColumn(result.headers.find((header) => /nombre|name|participante/i.test(header)) ?? result.headers[0] ?? '')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo leer el archivo')
    } finally { setLoading(false) }
  }

  const participants = preview && column ? previewToParticipants(preview, column) : []
  return <Modal title="Importar participantes" description="Acepta TXT, CSV, XLSX y XLS. Puedes elegir la columna que contiene el nombre." onClose={onClose}>
    <label className="drop-zone"><Upload size={28} /><strong>{loading ? 'Leyendo archivo…' : 'Seleccionar archivo'}</strong><span>TXT, CSV o Excel</span><input type="file" accept=".txt,.csv,.xlsx,.xls" onChange={(event) => void chooseFile(event.target.files?.[0])} /></label>
    {error && <p className="validation-error" role="alert">{error}</p>}
    {preview && <div className="import-preview">
      <div className="file-summary"><FileSpreadsheet size={20} /><span><strong>{preview.fileName}</strong><small>{preview.rows.length} filas detectadas</small></span></div>
      <label className="field"><span>Columna con los nombres</span><select value={column} onChange={(event) => setColumn(event.target.value)}>{preview.headers.map((header) => <option key={header}>{header}</option>)}</select></label>
      <div className="preview-list">{participants.slice(0, 5).map((participant) => <span key={participant.id}>{participant.name}</span>)}{participants.length > 5 && <small>y {participants.length - 5} más…</small>}</div>
    </div>}
    <div className="modal-footer"><span className="muted">{participants.length} participantes listos</span><button className="primary-button" type="button" disabled={participants.length === 0} onClick={() => { onImport(participants); onClose() }}>Importar a la base</button></div>
  </Modal>
}
