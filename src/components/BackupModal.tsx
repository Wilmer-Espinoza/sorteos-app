import { ArchiveRestore, DatabaseBackup, Download, FileDown, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { AppState, ParticipantList } from '../types'
import { exportBackup, exportParticipantsCsv, exportParticipantsXlsx, readBackup } from '../services/importExport'
import { Modal } from './Modal'
import { ConfirmDialog } from './ConfirmDialog'

interface BackupModalProps {
  state: AppState
  activeList: ParticipantList
  onRestore: (state: AppState) => void
  onResetStates: () => void
  onDeleteLocal: () => void
  onClose: () => void
  onToast: (message: string) => void
}

export function BackupModal(props: BackupModalProps) {
  const [pendingRestore, setPendingRestore] = useState<AppState | null>(null)

  async function restore(file: File | undefined) {
    if (!file) return
    try {
      setPendingRestore(await readBackup(file))
    } catch (reason) { props.onToast(reason instanceof Error ? reason.message : 'No se pudo restaurar el respaldo') }
  }
  return <><Modal title="Zona de datos" description="Mantén una copia externa para protegerte ante el borrado manual de datos del navegador." onClose={props.onClose}>
    <div className="data-grid">
      <button type="button" onClick={() => { exportBackup(props.state); props.onToast('Respaldo exportado') }}><DatabaseBackup size={22} /><span><strong>Exportar respaldo</strong><small>Descarga bases, historial y configuración en JSON.</small></span></button>
      <label className="data-upload"><ArchiveRestore size={22} /><span><strong>Restaurar respaldo</strong><small>Reemplaza los datos después de confirmar.</small></span><input type="file" accept=".json,application/json" onChange={(event) => { void restore(event.target.files?.[0]); event.target.value = '' }} /></label>
      <button type="button" onClick={() => exportParticipantsCsv(props.activeList)}><FileDown size={22} /><span><strong>Exportar participantes CSV</strong><small>Base maestra activa, sin eliminar registros.</small></span></button>
      <button type="button" onClick={() => void exportParticipantsXlsx(props.activeList)}><Download size={22} /><span><strong>Exportar participantes Excel</strong><small>Archivo XLSX de la base activa.</small></span></button>
      <button type="button" onClick={props.onResetStates}><RotateCcw size={22} /><span><strong>Restablecer estados</strong><small>Reintegra ganadores y excluidos; conserva los nombres.</small></span></button>
    </div>
    <div className="danger-zone"><div><strong>Eliminar datos locales</strong><p>Borra bases, historial y configuración de este navegador. Esta acción no se puede deshacer sin un respaldo.</p></div><button className="danger-button" type="button" onClick={props.onDeleteLocal}><Trash2 size={17} />Eliminar datos locales</button></div>
  </Modal>
  {pendingRestore && <ConfirmDialog title="Restaurar respaldo" description="Este respaldo reemplazará las bases, la configuración, la identidad visual y el historial actuales." detail="Verifica que hayas exportado una copia reciente si deseas conservar el estado actual." confirmLabel="Restaurar respaldo" loadingLabel="Restaurando…" variant="warning" onCancel={() => setPendingRestore(null)} onConfirm={() => { props.onRestore(pendingRestore); setPendingRestore(null); props.onToast('Respaldo restaurado correctamente'); props.onClose() }} />}
  </>
}
