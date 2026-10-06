import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Participant, ParticipantList, Draw, AppState, Winner } from './types'
import { Header } from './components/Header'
import { ParticipantPanel } from './components/ParticipantPanel'
import { DrawConfiguration } from './components/DrawConfiguration'
import { DrawStage } from './components/DrawStage'
import { AddParticipantsModal } from './components/AddParticipantsModal'
import { ImportModal } from './components/ImportModal'
import { HistoryPanel } from './components/HistoryPanel'
import { SettingsModal } from './components/SettingsModal'
import { BackupModal } from './components/BackupModal'
import { ConfirmDialog, type DialogVariant } from './components/ConfirmDialog'
import { usePersistence } from './hooks/usePersistence'
import { createEmptyList, createInitialState } from './services/defaults'
import { clearDatabase } from './services/database'
import { countDuplicates, createParticipant, getEligibleParticipants, normalizeName } from './services/participants'
import { selectParticipants } from './services/random'
import { exportParticipantsCsv } from './services/importExport'
import { playWinnerSound, primeAudio, stopAllSounds, stopSelectionSound } from './services/sound'
import { applyBrandingVariables } from './branding/brandingService'
import type { BrandingSettings } from './branding/brandingTypes'
import { getLogoVisibility } from './branding/brandingVisibility'
import './styles/app.css'

type ModalName = 'add' | 'import' | 'history' | 'settings' | 'backup' | null

interface AppDialogState {
  title: string
  description: string
  detail?: string
  confirmLabel?: string
  variant?: DialogVariant
  loadingLabel?: string
  input?: { label: string; defaultValue?: string; placeholder?: string; requiredValue?: string }
  onConfirm: (value: string) => void | Promise<void>
}

export default function App() {
  const { state, setState, ready, saveStatus } = usePersistence()
  const [modal, setModal] = useState<ModalName>(null)
  const [dialog, setDialog] = useState<AppDialogState | null>(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [presentation, setPresentation] = useState(false)
  const [currentDraw, setCurrentDraw] = useState<Draw | null>(null)
  const [drawPool, setDrawPool] = useState<Participant[]>([])
  const [revealPosition, setRevealPosition] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const activeList = state.lists.find((list) => list.id === state.activeListId) ?? state.lists[0]
  const listState = state.listStates[activeList?.id] ?? { excludedIds: [], winnerIds: [] }
  const eligible = useMemo(() => activeList ? getEligibleParticipants(activeList.participants, listState, state.settings.excludePreviousWinners, state.settings.ignoreDuplicates) : [], [activeList, listState, state.settings.excludePreviousWinners, state.settings.ignoreDuplicates])
  const eligibleIds = useMemo(() => new Set(eligible.map((participant) => participant.id)), [eligible])
  const activeWinner = currentDraw?.winners[revealPosition] ?? null
  const soundEnabled = state.settings.effects.selectionSoundEnabled || state.settings.effects.winnerSoundEnabled

  useEffect(() => {
    applyBrandingVariables(state.brandingSettings)
    document.title = state.brandingSettings.appName || 'Sorteos Jornadas Académicas'
    const fullscreenChange = () => {
      const value = Boolean(document.fullscreenElement)
      setPresentation(value)
      document.body.classList.toggle('presentation-mode', value)
    }
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && presentation && !document.fullscreenElement) exitPresentation()
    }
    document.addEventListener('fullscreenchange', fullscreenChange)
    document.addEventListener('keydown', keydown)
    return () => { document.removeEventListener('fullscreenchange', fullscreenChange); document.removeEventListener('keydown', keydown) }
  }, [state.brandingSettings, presentation])

  useEffect(() => () => stopAllSounds(), [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const completeAnimation = useCallback(() => {
    stopSelectionSound()
    setIsDrawing(false)
    setShowConfetti(state.settings.confetti)
    if (state.settings.effects.winnerSoundEnabled) playWinnerSound(state.settings.effects.winnerSound, state.settings.effects.winnerVolume, state.settings.effects.winnerSoundMaxDuration)
  }, [state.settings.confetti, state.settings.effects])

  useEffect(() => {
    if (!currentDraw || isDrawing || state.settings.revealMode !== 'automatic' || revealPosition >= currentDraw.winners.length - 1) return
    const timer = window.setTimeout(() => {
      setShowConfetti(false)
      setRevealPosition((value) => value + 1)
      if (state.settings.animation) setIsDrawing(true)
      else {
        setShowConfetti(state.settings.confetti)
        if (state.settings.effects.winnerSoundEnabled) playWinnerSound(state.settings.effects.winnerSound, state.settings.effects.winnerVolume, state.settings.effects.winnerSoundMaxDuration)
      }
    }, Math.max(2800, state.settings.confetti ? state.settings.effects.confettiDuration * 1000 + 250 : 2800))
    return () => window.clearTimeout(timer)
  }, [currentDraw, isDrawing, revealPosition, state.settings.animation, state.settings.confetti, state.settings.effects, state.settings.revealMode])

  if (!ready || !activeList) return <div className="loading-screen"><span>Cargando datos guardados…</span></div>

  function updateState(mutator: (current: AppState) => AppState) {
    setState(mutator)
  }

  function updateActiveList(mutator: (list: ParticipantList) => ParticipantList) {
    updateState((current) => ({ ...current, lists: current.lists.map((list) => list.id === current.activeListId ? mutator(list) : list) }))
  }

  function addParticipants(participants: Participant[]) {
    if (participants.length === 0) return
    updateActiveList((list) => ({ ...list, participants: [...list.participants, ...participants], updatedAt: new Date().toISOString() }))
    setToast(`${participants.length} participante${participants.length === 1 ? '' : 's'} agregado${participants.length === 1 ? '' : 's'}`)
  }

  function startDraw() {
    if (isDrawing) return
    setError('')
    if (!state.drawTitle.trim()) { setError('Escribe un nombre para el sorteo.'); return }
    if (eligible.length < state.winnerCount) { setError(`Solicitaste ${state.winnerCount} ganadores, pero solamente hay ${eligible.length} participantes disponibles.`); return }
    stopAllSounds()
    if (soundEnabled) primeAudio()
    const selected = selectParticipants(eligible, state.winnerCount, !state.settings.allowRepeatedWinners, state.settings.weightedMode)
    const createdAt = new Date().toISOString()
    const sequence = state.history.reduce((maximum, draw) => Math.max(maximum, draw.sequence), 0) + 1
    const winners: Winner[] = selected.map((participant, index) => ({ participantId: participant.id, participantName: participant.name, selectedAt: new Date(Date.now() + index).toISOString() }))
    const draw: Draw = { id: crypto.randomUUID(), sequence, title: state.drawTitle.trim(), listId: activeList.id, listName: activeList.name, winners, eligibleCount: eligible.length, createdAt }
    setDrawPool([...eligible])
    setCurrentDraw(draw)
    setRevealPosition(0)
    setShowConfetti(false)
    setIsDrawing(state.settings.animation)
    updateState((current) => ({
      ...current,
      history: [...current.history, draw],
      listStates: {
        ...current.listStates,
        [activeList.id]: {
          ...current.listStates[activeList.id],
          winnerIds: Array.from(new Set([...(current.listStates[activeList.id]?.winnerIds ?? []), ...winners.map((winner) => winner.participantId)])),
        },
      },
    }))
    if (!state.settings.animation) completeAnimation()
  }

  function nextWinner() {
    if (!currentDraw || revealPosition >= currentDraw.winners.length - 1) return
    stopAllSounds()
    setShowConfetti(false)
    setRevealPosition((value) => value + 1)
    if (state.settings.animation) setIsDrawing(true)
    else completeAnimation()
  }

  function resetStage() {
    stopAllSounds()
    setCurrentDraw(null); setDrawPool([]); setRevealPosition(0); setIsDrawing(false); setShowConfetti(false); setError('')
  }

  async function togglePresentation() {
    if (presentation) { await exitPresentation(); return }
    setPresentation(true)
    document.body.classList.add('presentation-mode')
    try {
      if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen()
      else setToast('Modo presentación activado dentro de la página')
    } catch { setToast('Modo presentación activado como alternativa a pantalla completa') }
  }

  async function exitPresentation() {
    stopAllSounds()
    if (document.fullscreenElement && document.exitFullscreen) {
      try { await document.exitFullscreen() } catch { /* React state still exits the fallback layout. */ }
    }
    setPresentation(false)
    document.body.classList.remove('presentation-mode')
  }

  function updateBranding(brandingSettings: BrandingSettings) {
    updateState((current) => ({ ...current, brandingSettings }))
  }

  function createList() {
    setDialog({
      title: 'Crear base de participantes',
      description: 'Asigna un nombre para identificar la nueva base.',
      confirmLabel: 'Crear base',
      input: { label: 'Nombre de la base', defaultValue: 'Nueva base', placeholder: 'Ej. Invitados' },
      onConfirm: (name) => {
        const list = createEmptyList(name)
        updateState((current) => ({ ...current, lists: [...current.lists, list], activeListId: list.id, listStates: { ...current.listStates, [list.id]: { excludedIds: [], winnerIds: [] } } }))
        resetStage(); setDialog(null); setToast('Base creada')
      },
    })
  }

  function duplicateList() {
    const now = new Date().toISOString()
    const idMap = new Map<string, string>()
    const participants = activeList.participants.map((participant) => { const id = crypto.randomUUID(); idMap.set(participant.id, id); return { ...participant, id, createdAt: now } })
    const duplicate: ParticipantList = { ...activeList, id: crypto.randomUUID(), name: `${activeList.name} · copia`, participants, createdAt: now, updatedAt: now }
    updateState((current) => ({ ...current, lists: [...current.lists, duplicate], activeListId: duplicate.id, listStates: { ...current.listStates, [duplicate.id]: { excludedIds: [], winnerIds: [] } } }))
    resetStage(); setToast('Base duplicada')
  }

  function renameList() {
    setDialog({
      title: 'Renombrar base',
      description: 'Escribe el nuevo nombre de la base de participantes.',
      confirmLabel: 'Guardar nombre',
      input: { label: 'Nombre de la base', defaultValue: activeList.name },
      onConfirm: (name) => { updateActiveList((list) => ({ ...list, name, updatedAt: new Date().toISOString() })); setDialog(null); setToast('Nombre de la base actualizado') },
    })
  }

  function deleteList() {
    if (state.lists.length === 1) { setToast('Debe existir al menos una base. Puedes vaciarla manualmente o eliminar todos los datos desde Configuración.'); return }
    setDialog({
      title: 'Eliminar base',
      description: `¿Deseas eliminar la base “${activeList.name}”?`,
      detail: 'Esta acción eliminará la base guardada en este dispositivo y no se puede deshacer.',
      confirmLabel: 'Eliminar base',
      variant: 'danger',
      onConfirm: () => {
        updateState((current) => {
          const lists = current.lists.filter((list) => list.id !== activeList.id)
          const listStates = { ...current.listStates }; delete listStates[activeList.id]
          return { ...current, lists, activeListId: lists[0].id, listStates }
        })
        resetStage(); setDialog(null); setToast('Base eliminada')
      },
    })
  }

  function deleteParticipant(participant: Participant) {
    setDialog({
      title: 'Eliminar participante',
      description: `¿Deseas eliminar a “${participant.name}” de la base maestra?`,
      detail: 'Sus apariciones en el historial se conservarán.',
      confirmLabel: 'Eliminar participante',
      variant: 'danger',
      onConfirm: () => {
        updateState((current) => ({
          ...current,
          lists: current.lists.map((list) => list.id === activeList.id ? { ...list, participants: list.participants.filter((item) => item.id !== participant.id), updatedAt: new Date().toISOString() } : list),
          listStates: { ...current.listStates, [activeList.id]: { excludedIds: (current.listStates[activeList.id]?.excludedIds ?? []).filter((id) => id !== participant.id), winnerIds: (current.listStates[activeList.id]?.winnerIds ?? []).filter((id) => id !== participant.id) } },
        }))
        setDialog(null); setToast('Participante eliminado')
      },
    })
  }

  function toggleExcluded(participant: Participant) {
    updateState((current) => {
      const currentListState = current.listStates[activeList.id] ?? { excludedIds: [], winnerIds: [] }
      const excluded = currentListState.excludedIds.includes(participant.id)
      return { ...current, listStates: { ...current.listStates, [activeList.id]: { ...currentListState, excludedIds: excluded ? currentListState.excludedIds.filter((id) => id !== participant.id) : [...currentListState.excludedIds, participant.id] } } }
    })
  }

  function resetEligibility() {
    setDialog({
      title: 'Reintegrar participantes',
      description: '¿Deseas reintegrar ganadores y participantes excluidos?',
      detail: 'La base maestra y el historial no se modificarán.',
      confirmLabel: 'Reintegrar',
      variant: 'warning',
      onConfirm: () => { updateState((current) => ({ ...current, listStates: { ...current.listStates, [activeList.id]: { excludedIds: [], winnerIds: [] } } })); setDialog(null); setToast('Todos los participantes volvieron a estar disponibles') },
    })
  }

  function undoLastDraw() {
    const last = state.history.at(-1)
    if (!last) return
    setDialog({
      title: 'Deshacer último sorteo',
      description: `¿Deseas deshacer el sorteo #${String(last.sequence).padStart(4, '0')}?`,
      detail: 'El resultado se quitará del historial y sus ganadores volverán a calcularse según los sorteos restantes.',
      confirmLabel: 'Deshacer sorteo',
      variant: 'warning',
      onConfirm: () => {
        const remaining = state.history.slice(0, -1)
        const remainingWinnerIds = remaining.filter((draw) => draw.listId === last.listId).flatMap((draw) => draw.winners.map((winner) => winner.participantId))
        updateState((current) => ({ ...current, history: remaining, listStates: { ...current.listStates, [last.listId]: { ...(current.listStates[last.listId] ?? { excludedIds: [] }), winnerIds: Array.from(new Set(remainingWinnerIds)) } } }))
        if (currentDraw?.id === last.id) resetStage()
        setDialog(null); setToast('Último sorteo deshecho')
      },
    })
  }

  function clearHistory() {
    setDialog({
      title: 'Eliminar historial',
      description: '¿Deseas eliminar todos los sorteos del historial?',
      detail: 'Las bases maestras no serán modificadas.',
      confirmLabel: 'Eliminar historial',
      variant: 'danger',
      onConfirm: () => { updateState((current) => ({ ...current, history: [], listStates: Object.fromEntries(current.lists.map((list) => [list.id, { ...(current.listStates[list.id] ?? { excludedIds: [] }), winnerIds: [] }])) })); resetStage(); setDialog(null); setToast('Historial eliminado') },
    })
  }

  function deleteLocalData() {
    setDialog({
      title: 'Eliminar datos locales',
      description: 'Esta acción eliminará las bases, el historial y la configuración guardados en este dispositivo.',
      detail: 'No se puede deshacer sin un respaldo. Escribe ELIMINAR para continuar.',
      confirmLabel: 'Eliminar todos los datos',
      loadingLabel: 'Eliminando…',
      variant: 'danger',
      input: { label: 'Confirmación', placeholder: 'ELIMINAR', requiredValue: 'ELIMINAR' },
      onConfirm: async () => {
        await clearDatabase()
        localStorage.removeItem('sorteos-jornadas-settings-backup')
        setState(createInitialState())
        setModal(null); resetStage(); setDialog(null); setToast('Datos locales eliminados')
      },
    })
  }

  function restoreState(restored: AppState) {
    setState(restored); resetStage()
  }

  return (
    <div className={`app-shell ${presentation ? 'app-shell--presentation' : ''}`}>
      {!presentation && <Header saveStatus={saveStatus} branding={state.brandingSettings} presentation={presentation} onHistory={() => setModal('history')} onSettings={() => setModal('settings')} onFullscreen={() => void togglePresentation()} />}
      <main className={`workspace ${presentation ? 'workspace--presentation' : ''}`}>
        {!presentation && <ParticipantPanel lists={state.lists} activeList={activeList} listState={listState} eligibleIds={eligibleIds} duplicateCount={countDuplicates(activeList.participants)} ignoreDuplicates={state.settings.ignoreDuplicates} weightedMode={state.settings.weightedMode} onSelectList={(id) => { updateState((current) => ({ ...current, activeListId: id })); resetStage() }} onCreateList={createList} onDuplicateList={duplicateList} onRenameList={renameList} onDeleteList={deleteList} onAddOne={(name) => addParticipants([createParticipant(normalizeName(name))])} onAddMany={() => setModal('add')} onImport={() => setModal('import')} onExport={() => exportParticipantsCsv(activeList)} onDeleteParticipant={deleteParticipant} onToggleExcluded={toggleExcluded} onIgnoreDuplicates={(value) => updateState((current) => ({ ...current, settings: { ...current.settings, ignoreDuplicates: value } }))} onWeight={(participant, weight) => updateActiveList((list) => ({ ...list, participants: list.participants.map((item) => item.id === participant.id ? { ...item, weight } : item), updatedAt: new Date().toISOString() }))} />}
        <div className="draw-column">
          <DrawStage eligible={drawPool.length ? drawPool : eligible} isDrawing={isDrawing} activeWinner={activeWinner} currentDraw={currentDraw} drawTitle={state.drawTitle} revealPosition={revealPosition} durationMs={state.settings.effects.animationDuration * 1000} showConfetti={showConfetti} confetti={state.settings.confetti} sound={soundEnabled} effects={state.settings.effects} branding={state.brandingSettings} presentation={presentation} error={error} onStart={startDraw} onAnimationComplete={completeAnimation} onNext={nextWinner} onResetStage={resetStage} onHistory={() => setModal('history')} onToast={setToast} onExitPresentation={() => void exitPresentation()} onToggleSound={() => updateState((current) => { const enabled = !(current.settings.effects.selectionSoundEnabled || current.settings.effects.winnerSoundEnabled); return { ...current, settings: { ...current.settings, sound: enabled, effects: { ...current.settings.effects, selectionSoundEnabled: enabled, winnerSoundEnabled: enabled } } } })} onToggleConfetti={() => { setShowConfetti(!state.settings.confetti && Boolean(activeWinner)); updateState((current) => ({ ...current, settings: { ...current.settings, confetti: !current.settings.confetti } })) }} onConfettiComplete={() => setShowConfetti(false)} />
          {!presentation && <DrawConfiguration title={state.drawTitle} winnerCount={state.winnerCount} settings={state.settings} disabled={isDrawing} onTitle={(value) => updateState((current) => ({ ...current, drawTitle: value }))} onWinnerCount={(value) => updateState((current) => ({ ...current, winnerCount: Math.max(1, Math.min(100, value)) }))} onSettings={(settings) => updateState((current) => ({ ...current, settings }))} onResetEligibility={resetEligibility} onUndo={undoLastDraw} canUndo={state.history.length > 0} />}
        </div>
      </main>
      {!presentation && <footer className="app-footer"><span>{state.brandingSettings.footerText}</span>{getLogoVisibility(state.brandingSettings, 'header').institutional && <img src={state.brandingSettings.logos.institutional.src} alt={state.brandingSettings.organizationName} />}</footer>}

      {modal === 'add' && <AddParticipantsModal onClose={() => setModal(null)} onAdd={(names) => addParticipants(names.map((name) => createParticipant(name)))} />}
      {modal === 'import' && <ImportModal onClose={() => setModal(null)} onImport={addParticipants} />}
      {modal === 'history' && <HistoryPanel history={state.history} onClose={() => setModal(null)} onClear={clearHistory} onToast={setToast} />}
      {modal === 'settings' && <SettingsModal settings={state.settings} branding={state.brandingSettings} onSettings={(settings) => updateState((current) => ({ ...current, settings }))} onBranding={updateBranding} onDataZone={() => setModal('backup')} onToast={setToast} onClose={() => setModal(null)} />}
      {modal === 'backup' && <BackupModal state={state} activeList={activeList} onRestore={restoreState} onResetStates={resetEligibility} onDeleteLocal={deleteLocalData} onClose={() => setModal(null)} onToast={setToast} />}
      {dialog && <ConfirmDialog key={`${dialog.title}-${dialog.input?.defaultValue ?? ''}`} {...dialog} onCancel={() => setDialog(null)} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}
