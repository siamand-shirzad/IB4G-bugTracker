"use client"

import { create } from "zustand"
import type {
  BugFilters,
  BugPriority,
  BugStatus,
  EnvironmentStage,
  Label,
} from "@/lib/types"
import type { SidebarView } from "@/lib/constants"

interface BugStore {
  // Navigation
  view: SidebarView
  setView: (v: SidebarView) => void

  // Selected bug (for detail view)
  selectedBugId: string | null
  selectBug: (id: string | null) => void

  // Sidebar collapse (desktop)
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void

  // Mobile sidebar open
  mobileSidebarOpen: boolean
  setMobileSidebarOpen: (v: boolean) => void

  // Filters (for bug list)
  filters: BugFilters
  groupBy: "none" | "assignee" | "priority" | "stage" | "status"
  setGroupBy: (g: "none" | "assignee" | "priority" | "stage" | "status") => void
  setSearch: (s: string) => void
  setStatus: (s: BugStatus | "all") => void
  setPriority: (p: BugPriority | "all") => void
  setPlatform: (p: string | "all") => void
  setStage: (s: EnvironmentStage | "all") => void
  setAssignee: (a: string | "all") => void
  setLabelId: (id: string | "all") => void
  setPage: (p: number) => void
  setPageSize: (n: number) => void
  resetFilters: () => void

  // Labels cache (populated by hooks, used by badges)
  labelsCache: Label[]
  setLabelsCache: (labels: Label[]) => void

  // Form dialog
  formOpen: boolean
  formBugId: string | null // null = create mode, id = edit mode
  openCreateForm: () => void
  openEditForm: (id: string) => void
  closeForm: () => void
}

const DEFAULT_FILTERS: BugFilters = {
  search: "",
  status: "all",
  priority: "all",
  platform: "all",
  stage: "all",
  labelId: "all",
  page: 1,
  pageSize: 10,
}

export const useBugStore = create<BugStore>((set) => ({
  view: "dashboard",
  setView: (view) =>
    set({ view, selectedBugId: view === "bugs" ? null : null }),

  selectedBugId: null,
  selectBug: (id) => set({ selectedBugId: id }),

  sidebarCollapsed: true,
  toggleSidebar: () =>
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

  mobileSidebarOpen: false,
  setMobileSidebarOpen: (mobileSidebarOpen) => set({ mobileSidebarOpen }),

  filters: DEFAULT_FILTERS,
  groupBy: "none",
  setGroupBy: (groupBy) => set({ groupBy }),
  setSearch: (search) =>
    set((s) => ({ filters: { ...s.filters, search, page: 1 } })),
  setStatus: (status) =>
    set((s) => ({ filters: { ...s.filters, status, page: 1 } })),
  setPriority: (priority) =>
    set((s) => ({ filters: { ...s.filters, priority, page: 1 } })),
  setPlatform: (platform) =>
    set((s) => ({ filters: { ...s.filters, platform, page: 1 } })),
  setStage: (stage) =>
    set((s) => ({ filters: { ...s.filters, stage, page: 1 } })),
  setAssignee: (assignee) =>
    set((s) => ({ filters: { ...s.filters, assignee: assignee === "all" ? undefined : assignee, page: 1 } })),
  setLabelId: (labelId) =>
    set((s) => ({ filters: { ...s.filters, labelId, page: 1 } })),
  setPage: (page) => set((s) => ({ filters: { ...s.filters, page } })),
  setPageSize: (pageSize) =>
    set((s) => ({ filters: { ...s.filters, pageSize, page: 1 } })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  labelsCache: [],
  setLabelsCache: (labelsCache) => set({ labelsCache }),

  formOpen: false,
  formBugId: null,
  openCreateForm: () => set({ formOpen: true, formBugId: null }),
  openEditForm: (id) => set({ formOpen: true, formBugId: id }),
  closeForm: () => set({ formOpen: false, formBugId: null }),
}))
