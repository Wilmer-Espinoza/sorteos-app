import { useEffect, useRef, useState } from 'react'
import type { AppState, SaveStatus } from '../types'
import { loadState, requestPersistentStorage, saveState } from '../services/database'
import { createInitialState, normalizeSettings } from '../services/defaults'
import { normalizeBranding } from '../branding/defaultBranding'

const SETTINGS_BACKUP = 'sorteos-jornadas-settings-backup'

function normalizeLoadedState(saved: AppState): AppState {
  const fallback = createInitialState()
  const lists = saved.lists?.length ? saved.lists : fallback.lists
  const activeListId = lists.some((list) => list.id === saved.activeListId) ? saved.activeListId : lists[0].id
  return {
    ...fallback,
    ...saved,
    lists,
    activeListId,
    settings: normalizeSettings(saved.settings),
    brandingSettings: normalizeBranding(saved.brandingSettings),
    listStates: Object.fromEntries(lists.map((list) => [list.id, saved.listStates?.[list.id] ?? { excludedIds: [], winnerIds: [] }])),
  }
}

export function usePersistence() {
  const [state, setState] = useState<AppState>(() => createInitialState())
  const [ready, setReady] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const saveTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    let active = true
    loadState()
      .then((saved) => {
        if (!active) return
        if (saved) setState(normalizeLoadedState(saved))
        else {
          const backup = localStorage.getItem(SETTINGS_BACKUP)
          if (backup) setState((current) => ({ ...current, settings: { ...current.settings, ...JSON.parse(backup) } }))
        }
        setReady(true)
        void requestPersistentStorage()
      })
      .catch(() => {
        if (active) {
          setReady(true)
          setSaveStatus('error')
        }
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!ready) return
    setSaveStatus('saving')
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      saveState(state)
        .then(() => {
          localStorage.setItem(SETTINGS_BACKUP, JSON.stringify(state.settings))
          setSaveStatus('saved')
        })
        .catch(() => setSaveStatus('error'))
    }, 350)
    return () => window.clearTimeout(saveTimer.current)
  }, [state, ready])

  return { state, setState, ready, saveStatus }
}
