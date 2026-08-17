"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface SettingsStore {
  // Display preferences
  defaultPageSize: number
  defaultGroupBy: "none" | "assignee" | "priority" | "stage" | "status"
  defaultTrendDays: 7 | 14 | 30 | 90

  // Notification preferences
  notifyOnBugCreated: boolean
  notifyOnBugClosed: boolean
  notifyOnCommentAdded: boolean
  notifyOnBulkAction: boolean

  // Actions
  setDefaultPageSize: (n: number) => void
  setDefaultGroupBy: (g: SettingsStore["defaultGroupBy"]) => void
  setDefaultTrendDays: (d: SettingsStore["defaultTrendDays"]) => void
  setNotifyOnBugCreated: (v: boolean) => void
  setNotifyOnBugClosed: (v: boolean) => void
  setNotifyOnCommentAdded: (v: boolean) => void
  setNotifyOnBulkAction: (v: boolean) => void
  resetSettings: () => void
}

const DEFAULT_SETTINGS = {
  defaultPageSize: 10,
  defaultGroupBy: "none" as const,
  defaultTrendDays: 14 as const,
  notifyOnBugCreated: true,
  notifyOnBugClosed: true,
  notifyOnCommentAdded: true,
  notifyOnBulkAction: true,
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      setDefaultPageSize: (defaultPageSize) => set({ defaultPageSize }),
      setDefaultGroupBy: (defaultGroupBy) => set({ defaultGroupBy }),
      setDefaultTrendDays: (defaultTrendDays) => set({ defaultTrendDays }),
      setNotifyOnBugCreated: (notifyOnBugCreated) => set({ notifyOnBugCreated }),
      setNotifyOnBugClosed: (notifyOnBugClosed) => set({ notifyOnBugClosed }),
      setNotifyOnCommentAdded: (notifyOnCommentAdded) => set({ notifyOnCommentAdded }),
      setNotifyOnBulkAction: (notifyOnBulkAction) => set({ notifyOnBulkAction }),
      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: "ib4g:settings",
    },
  ),
)
