import { Clipboard, Download, Eye, Trash2 } from 'lucide-react'
import type { Draw } from '../types'
import { downloadText, exportDrawsCsv } from '../services/importExport'
import { Modal } from './Modal'

interface HistoryPanelProps {
  history: Draw[]
  onClose: () => void
  onClear: () => void
  onToast: (message: string) => void
}

export function HistoryPanel({ history, onClose, onClear, onToast }: HistoryPanelProps) {
  async function copy(draw: Draw) {
    await navigator.clipboard.writeText(`Sorteo #${String(draw.sequence).padStart(4, '0')} · ${draw.title}\nGanador${draw.winners.length > 1 ? 'es' : ''}: ${draw.winners.map((winner) => winner.participantName).join(', ')}`)
    onToast('Detalle copiado')
  }
  function download(draw: Draw) {
    const content = `Sorteo #${String(draw.sequence).padStart(4, '0')}\n${draw.title}\n${new Date(draw.createdAt).toLocaleString('es-EC')}\nBase: ${draw.listName}\nGanador${draw.winners.length > 1 ? 'es' : ''}: ${draw.winners.map((winner) => winner.participantName).join(', ')}`
    downloadText(content, `sorteo-${String(draw.sequence).padStart(4, '0')}.txt`)
  }
  return <Modal title="Historial de sorteos" description="Los resultados permanecen guardados en este dispositivo hasta que decidas eliminarlos." onClose={onClose} wide>
    <div className="history-toolbar"><span>{history.length} sorteos registrados</span><button className="soft-button" type="button" disabled={history.length === 0} onClick={() => exportDrawsCsv(history)}><Download size={17} />Exportar resultados</button></div>
    {history.length === 0 ? <div className="empty-modal"><Eye size={28} /><h3>Aún no hay resultados</h3><p>Los sorteos realizados aparecerán aquí.</p></div> : <div className="history-list">{[...history].reverse().map((draw) => <article key={draw.id} className="history-item">
      <div className="history-number">#{String(draw.sequence).padStart(4, '0')}</div>
      <div className="history-main"><h3>{draw.title}</h3><p>{new Date(draw.createdAt).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })} · {draw.listName}</p><strong>{draw.winners.map((winner) => winner.participantName).join(' · ')}</strong></div>
      <div className="history-actions"><button className="icon-button" type="button" onClick={() => download(draw)} aria-label={`Descargar sorteo ${draw.sequence}`}><Download size={17} /></button><button className="icon-button" type="button" onClick={() => void copy(draw)} aria-label={`Copiar sorteo ${draw.sequence}`}><Clipboard size={17} /></button></div>
    </article>)}</div>}
    <div className="danger-zone-inline"><span><strong>Limpiar historial</strong><small>No modifica las bases maestras.</small></span><button className="danger-button" type="button" disabled={history.length === 0} onClick={onClear}><Trash2 size={16} />Eliminar historial</button></div>
  </Modal>
}
