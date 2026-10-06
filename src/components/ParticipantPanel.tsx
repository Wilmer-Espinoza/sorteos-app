import { ChevronDown, Copy, Download, FileUp, MoreHorizontal, Plus, Search, Shuffle, Trash2, UserPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ListState, Participant, ParticipantList } from '../types'

type Filter = 'all' | 'available' | 'winner' | 'excluded'
type Sort = 'original' | 'az' | 'za' | 'shuffle'

interface ParticipantPanelProps {
  lists: ParticipantList[]
  activeList: ParticipantList
  listState: ListState
  eligibleIds: Set<string>
  duplicateCount: number
  ignoreDuplicates: boolean
  weightedMode: boolean
  onSelectList: (id: string) => void
  onCreateList: () => void
  onDuplicateList: () => void
  onRenameList: () => void
  onDeleteList: () => void
  onAddOne: (name: string) => void
  onAddMany: () => void
  onImport: () => void
  onExport: () => void
  onDeleteParticipant: (participant: Participant) => void
  onToggleExcluded: (participant: Participant) => void
  onIgnoreDuplicates: (value: boolean) => void
  onWeight: (participant: Participant, weight: number) => void
}

const PAGE_SIZE = 60

export function ParticipantPanel(props: ParticipantPanelProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('original')
  const [shuffleSeed, setShuffleSeed] = useState(0)
  const [page, setPage] = useState(1)
  const [newName, setNewName] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  const visible = useMemo(() => {
    const winnerIds = new Set(props.listState.winnerIds)
    const excludedIds = new Set(props.listState.excludedIds)
    let items = props.activeList.participants.filter((participant) => participant.name.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es')))
    items = items.filter((participant) => {
      if (filter === 'available') return props.eligibleIds.has(participant.id)
      if (filter === 'winner') return winnerIds.has(participant.id)
      if (filter === 'excluded') return excludedIds.has(participant.id)
      return true
    })
    if (sort === 'az') items = [...items].sort((a, b) => a.name.localeCompare(b.name, 'es'))
    if (sort === 'za') items = [...items].sort((a, b) => b.name.localeCompare(a.name, 'es'))
    if (sort === 'shuffle') items = [...items].sort((a, b) => visualHash(`${a.id}-${shuffleSeed}`) - visualHash(`${b.id}-${shuffleSeed}`))
    return items
  }, [filter, props.activeList.participants, props.eligibleIds, props.listState, search, shuffleSeed, sort])

  const shown = visible.slice(0, page * PAGE_SIZE)
  const winnerIds = new Set(props.listState.winnerIds)
  const excludedIds = new Set(props.listState.excludedIds)

  function submitOne(event: React.FormEvent) {
    event.preventDefault()
    if (!newName.trim()) return
    props.onAddOne(newName)
    setNewName('')
  }

  return (
    <aside className="participant-panel card">
      <div className="panel-heading">
        <div><p className="eyebrow">Base maestra</p><h2>Participantes</h2><p>{props.activeList.participants.length.toLocaleString('es-EC')} registrados</p></div>
        <button className="icon-button" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Acciones de la base"><MoreHorizontal size={20} /></button>
        {menuOpen && (
          <div className="popover-menu">
            <button type="button" onClick={() => { props.onDuplicateList(); setMenuOpen(false) }}><Copy size={16} />Duplicar base</button>
            <button type="button" onClick={() => { props.onRenameList(); setMenuOpen(false) }}>Renombrar</button>
            <button type="button" onClick={() => { props.onExport(); setMenuOpen(false) }}><Download size={16} />Exportar CSV</button>
            <button className="danger-text" type="button" onClick={() => { props.onDeleteList(); setMenuOpen(false) }}><Trash2 size={16} />Eliminar base</button>
          </div>
        )}
      </div>

      <label className="field-label" htmlFor="list-select">Base de participantes</label>
      <div className="select-row">
        <div className="select-wrap"><select id="list-select" value={props.activeList.id} onChange={(event) => props.onSelectList(event.target.value)}>{props.lists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}</select><ChevronDown size={16} /></div>
        <button className="icon-button icon-button--primary" type="button" onClick={props.onCreateList} aria-label="Crear nueva base"><Plus size={20} /></button>
      </div>

      <div className="search-wrap"><Search size={17} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Buscar participante…" aria-label="Buscar participante" /></div>
      <div className="filter-row" role="group" aria-label="Filtrar participantes">
        {([['all', 'Todos'], ['available', 'Disponibles'], ['winner', 'Ganadores'], ['excluded', 'Excluidos']] as const).map(([value, label]) => <button className={filter === value ? 'active' : ''} type="button" key={value} onClick={() => { setFilter(value); setPage(1) }}>{label}</button>)}
      </div>
      <div className="list-tools">
        <select aria-label="Orden visual" value={sort} onChange={(event) => { const next = event.target.value as Sort; setSort(next); if (next === 'shuffle') setShuffleSeed((value) => value + 1) }}>
          <option value="original">Orden original</option><option value="az">Orden A–Z</option><option value="za">Orden Z–A</option><option value="shuffle">Mezcla visual</option>
        </select>
        <button type="button" className="icon-button" onClick={() => { setSort('shuffle'); setShuffleSeed((value) => value + 1) }} aria-label="Mezclar orden visual"><Shuffle size={17} /></button>
      </div>

      {props.duplicateCount > 0 && <div className="notice"><strong>{props.duplicateCount} posibles duplicados</strong><label><input type="checkbox" checked={props.ignoreDuplicates} onChange={(event) => props.onIgnoreDuplicates(event.target.checked)} /> Ignorar copias al sortear</label></div>}

      <div className="participant-list" role="list" aria-label="Participantes">
        {shown.length === 0 ? <div className="small-empty"><UserPlus size={22} /><span>Sin resultados en este filtro</span></div> : shown.map((participant) => {
          const excluded = excludedIds.has(participant.id)
          const winner = winnerIds.has(participant.id)
          const state = excluded ? 'Excluido' : winner ? 'Ganador' : 'Disponible'
          return <div className={`participant-row ${props.weightedMode ? 'participant-row--weighted' : ''}`} role="listitem" key={participant.id}>
            <span className="avatar">{participant.name.slice(0, 1).toUpperCase()}</span>
            <span className="participant-name" title={participant.name}>{participant.name}</span>
            {props.weightedMode && <input className="weight-input" type="number" min="1" max="1000000" value={participant.weight ?? 1} onChange={(event) => props.onWeight(participant, Math.max(1, Math.floor(Number(event.target.value) || 1)))} aria-label={`Peso de ${participant.name}`} title="Peso relativo" />}
            <button className={`status-badge status-badge--${state.toLowerCase()}`} type="button" onClick={() => props.onToggleExcluded(participant)} title={excluded ? 'Reintegrar participante' : 'Excluir temporalmente'}>{state}</button>
            <button className="row-delete" type="button" onClick={() => props.onDeleteParticipant(participant)} aria-label={`Eliminar a ${participant.name}`}><Trash2 size={15} /></button>
          </div>
        })}
        {shown.length < visible.length && <button className="load-more" type="button" onClick={() => setPage((value) => value + 1)}>Mostrar más ({visible.length - shown.length})</button>}
      </div>

      <form className="quick-add" onSubmit={submitOne}><input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Nombre del participante" aria-label="Nombre del participante" /><button className="icon-button icon-button--primary" type="submit" aria-label="Agregar participante"><Plus size={20} /></button></form>
      <div className="panel-actions"><button className="soft-button" type="button" onClick={props.onAddMany}><UserPlus size={17} />Pegar lista</button><button className="soft-button" type="button" onClick={props.onImport}><FileUp size={17} />Importar</button></div>
    </aside>
  )
}

function visualHash(value: string): number {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0
  return hash
}
