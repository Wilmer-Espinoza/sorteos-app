import Papa from 'papaparse'
import { normalizeBranding } from '../branding/defaultBranding'
import type { AppState, Draw, ImportPreview, Participant, ParticipantList } from '../types'
import { createParticipant, normalizeName } from './participants'
import { normalizeSettings } from './defaults'

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function exportBackup(state: AppState): void {
  const payload = { exportedAt: new Date().toISOString(), application: 'Sorteos Jornadas Académicas', ...state }
  downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' }), 'backup-sorteos-jornadas.json')
}

export async function readBackup(file: File): Promise<AppState> {
  const parsed = JSON.parse(await file.text()) as Partial<AppState>
  if (parsed.version !== 1 || !Array.isArray(parsed.lists) || !Array.isArray(parsed.history) || !parsed.settings) {
    throw new Error('El archivo no es un respaldo válido de esta aplicación.')
  }
  return {
    ...parsed,
    settings: normalizeSettings(parsed.settings),
    brandingSettings: normalizeBranding(parsed.brandingSettings),
  } as AppState
}

export function exportParticipantsCsv(list: ParticipantList): void {
  const rows = list.participants.map((participant) => ({
    nombre: participant.name,
    estado_registro: 'Base maestra',
    ...participant.metadata,
  }))
  const csv = Papa.unparse(rows)
  downloadBlob(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }), `participantes-${safeFilename(list.name)}.csv`)
}

export async function exportParticipantsXlsx(list: ParticipantList): Promise<void> {
  const XLSX = await import('xlsx')
  const rows = list.participants.map((participant) => ({ nombre: participant.name, ...participant.metadata }))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Participantes')
  XLSX.writeFile(workbook, `participantes-${safeFilename(list.name)}.xlsx`)
}

export function exportDrawsCsv(history: readonly Draw[]): void {
  const rows = history.flatMap((draw) => draw.winners.map((winner) => ({
    numero_sorteo: draw.sequence,
    fecha: new Date(draw.createdAt).toLocaleDateString('es-EC'),
    hora: new Date(draw.createdAt).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
    sorteo: draw.title,
    participante: winner.participantName,
    base: draw.listName,
  })))
  const csv = Papa.unparse(rows)
  downloadBlob(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }), 'resultados-sorteos.csv')
}

export async function parseImportFile(file: File): Promise<ImportPreview> {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension === 'txt') {
    const names = (await file.text()).split(/\r?\n/).map(normalizeName).filter(Boolean)
    return { fileName: file.name, headers: ['Nombre'], rows: names.map((name) => ({ Nombre: name })) }
  }
  if (extension === 'csv') {
    const text = await file.text()
    const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true })
    if (parsed.errors.length && parsed.data.length === 0) throw new Error(parsed.errors[0].message)
    const headers = parsed.meta.fields?.filter(Boolean) ?? []
    if (headers.length === 0) {
      const values = Papa.parse<string[]>(text, { skipEmptyLines: true }).data
      return { fileName: file.name, headers: ['Nombre'], rows: values.map((row) => ({ Nombre: row[0] ?? '' })) }
    }
    return { fileName: file.name, headers, rows: parsed.data }
  }
  if (extension === 'xlsx' || extension === 'xls') {
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet, { defval: '' })
    const headers = rows.length > 0 ? Object.keys(rows[0]) : []
    return { fileName: file.name, headers, rows }
  }
  throw new Error('Formato no compatible. Usa TXT, CSV, XLSX o XLS.')
}

export function previewToParticipants(preview: ImportPreview, nameColumn: string): Participant[] {
  return preview.rows
    .map((row) => {
      const name = normalizeName(String(row[nameColumn] ?? ''))
      if (!name) return null
      const metadata = Object.fromEntries(Object.entries(row).filter(([key, value]) => key !== nameColumn && String(value).trim()))
      return createParticipant(name, metadata)
    })
    .filter((participant): participant is Participant => participant !== null)
}

export function downloadText(text: string, filename: string): void {
  downloadBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), filename)
}

export function safeFilename(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'archivo'
}
