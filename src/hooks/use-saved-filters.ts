"use client"

import * as React from "react"
import { useBugStore } from "@/store/bug-store"
import type { BugFilters, SavedFilter } from "@/lib/types"

const STORAGE_KEY = "ib4g:saved-filters"

function loadFromStorage(): SavedFilter[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as SavedFilter[]
  } catch {
    return []
  }
}

function saveToStorage(filters: SavedFilter[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
  } catch {
    // ignore quota errors
  }
}

export function useSavedFilters() {
  const filters = useBugStore((s) => s.filters)
  const setSearch = useBugStore((s) => s.setSearch)
  const setStatus = useBugStore((s) => s.setStatus)
  const setPriority = useBugStore((s) => s.setPriority)
  const setPlatform = useBugStore((s) => s.setPlatform)
  const setStage = useBugStore((s) => s.setStage)
  const setPage = useBugStore((s) => s.setPage)
  const setLabelId = useBugStore((s) => s.setLabelId)

  const [savedFilters, setSavedFilters] = React.useState<SavedFilter[]>([])

  React.useEffect(() => {
    setSavedFilters(loadFromStorage())
  }, [])

  const persist = React.useCallback((next: SavedFilter[]) => {
    setSavedFilters(next)
    saveToStorage(next)
  }, [])

  const saveCurrentFilter = React.useCallback(
    (name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return
      const sf: SavedFilter = {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `sf-${Date.now()}`,
        name: trimmed,
        filters: { ...filters },
        createdAt: new Date().toISOString(),
      }
      persist([sf, ...savedFilters.filter((s) => s.name !== trimmed)])
    },
    [filters, persist, savedFilters],
  )

  const deleteSavedFilter = React.useCallback(
    (id: string) => {
      persist(savedFilters.filter((s) => s.id !== id))
    },
    [persist, savedFilters],
  )

  const applySavedFilter = React.useCallback(
    (f: BugFilters) => {
      setSearch(f.search ?? "")
      setStatus(f.status ?? "all")
      setPriority(f.priority ?? "all")
      setPlatform(f.platform ?? "all")
      setStage(f.stage ?? "all")
      setLabelId(f.labelId ?? "all")
      setPage(f.page ?? 1)
    },
    [setSearch, setStatus, setPriority, setPlatform, setStage, setLabelId, setPage],
  )

  return {
    savedFilters,
    saveCurrentFilter,
    deleteSavedFilter,
    applySavedFilter,
  }
}
