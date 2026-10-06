import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { createInitialState } from './defaults'
import { parseImportFile, previewToParticipants, readBackup } from './importExport'

function textFile(name: string, content: string, type: string): File {
  return { name, type, text: async () => content, arrayBuffer: async () => new TextEncoder().encode(content).buffer } as unknown as File
}

function binaryFile(name: string, bytes: ArrayBuffer, type: string): File {
  return { name, type, text: async () => new TextDecoder().decode(bytes), arrayBuffer: async () => bytes } as unknown as File
}

describe('importación y respaldos', () => {
  it('importa CSV y conserva columnas adicionales como metadatos', async () => {
    const file = textFile('participantes.csv', 'Nombre,Correo\nMaría Pérez,maria@example.com\nJosé Oñate,jose@example.com', 'text/csv')
    const preview = await parseImportFile(file)
    const participants = previewToParticipants(preview, 'Nombre')
    expect(participants.map((participant) => participant.name)).toEqual(['María Pérez', 'José Oñate'])
    expect(participants[0].metadata?.Correo).toBe('maria@example.com')
  })

  it('importa una hoja XLSX y permite elegir la columna', async () => {
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{ Nombre: 'Ana Torres', Carrera: 'Software' }, { Nombre: 'Bruno Díaz', Carrera: 'Educación' }]), 'Participantes')
    const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
    const file = binaryFile('participantes.xlsx', bytes, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    const preview = await parseImportFile(file)
    const participants = previewToParticipants(preview, 'Nombre')
    expect(participants).toHaveLength(2)
    expect(participants[1].name).toBe('Bruno Díaz')
    expect(participants[1].metadata?.Carrera).toBe('Educación')
  })

  it('valida y recupera un respaldo de la aplicación', async () => {
    const state = createInitialState()
    const file = textFile('backup-sorteos-jornadas.json', JSON.stringify(state), 'application/json')
    const restored = await readBackup(file)
    expect(restored.version).toBe(1)
    expect(restored.lists[0].name).toBe('Base principal')
  })

  it('restaura el branding incluido en el respaldo general', async () => {
    const state = createInitialState()
    state.brandingSettings.colors.primary = '#E26A24'
    const restored = await readBackup(textFile('backup.json', JSON.stringify(state), 'application/json'))
    expect(restored.brandingSettings.colors.primary).toBe('#E26A24')
  })

  it('completa la identidad predeterminada al abrir un respaldo anterior', async () => {
    const state = createInitialState()
    const legacy = { ...state, brandingSettings: undefined }
    const restored = await readBackup(textFile('backup-antiguo.json', JSON.stringify(legacy), 'application/json'))
    expect(restored.brandingSettings.appName).toBe('Sorteos Jornadas Académicas')
    expect(restored.brandingSettings.logos.epunemi.src).toContain('logo-epunemi.svg')
  })
})
