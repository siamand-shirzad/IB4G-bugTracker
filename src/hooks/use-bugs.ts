"use client"

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  keepPreviousData,
} from "@tanstack/react-query"
import { toast } from "sonner"
import { useNotificationStore } from "@/store/notification-store"
import type {
  Bug,
  BugComment,
  BugEvent,
  BugFilters,
  BugInput,
  BugListResponse,
  BugStats,
  BulkAction,
  ImportItem,
  Label,
  TrendPoint,
} from "@/lib/types"

// ---- Query keys ----
export const bugKeys = {
  all: ["bugs"] as const,
  lists: () => [...bugKeys.all, "list"] as const,
  list: (filters: BugFilters) => [...bugKeys.lists(), filters] as const,
  details: () => [...bugKeys.all, "detail"] as const,
  detail: (id: string) => [...bugKeys.details(), id] as const,
  stats: () => [...bugKeys.all, "stats"] as const,
}

export const labelKeys = {
  all: ["labels"] as const,
  list: () => [...labelKeys.all, "list"] as const,
}

// ---- Bug list ----
export function useBugList(filters: BugFilters) {
  return useQuery<BugListResponse>({
    queryKey: bugKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.search) params.set("search", filters.search)
      if (filters.status && filters.status !== "all") params.set("status", filters.status)
      if (filters.priority && filters.priority !== "all") params.set("priority", filters.priority)
      if (filters.platform && filters.platform !== "all") params.set("platform", filters.platform)
      if (filters.stage && filters.stage !== "all") params.set("stage", filters.stage)
      if (filters.assignee) params.set("assignee", filters.assignee)
      if (filters.labelId && filters.labelId !== "all") params.set("labelId", filters.labelId)
      if (filters.page) params.set("page", String(filters.page))
      if (filters.pageSize) params.set("pageSize", String(filters.pageSize))
      const res = await fetch(`/api/bugs?${params.toString()}`)
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Failed to fetch bugs")
      }
      return res.json()
    },
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  })
}

// ---- Bug detail ----
export function useBug(id: string | null) {
  return useQuery<Bug>({
    queryKey: id ? bugKeys.detail(id) : ["bugs", "detail", "none"],
    queryFn: async () => {
      const res = await fetch(`/api/bugs/${id}`)
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Failed to fetch bug")
      }
      return res.json()
    },
    enabled: Boolean(id),
  })
}

// ---- Stats ----
export function useBugStats() {
  return useQuery<BugStats>({
    queryKey: bugKeys.stats(),
    queryFn: async () => {
      const res = await fetch("/api/bugs/stats")
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Failed to fetch stats")
      }
      return res.json()
    },
    staleTime: 15_000,
  })
}

// ---- Create bug ----
export function useCreateBug() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: BugInput) => {
      const res = await fetch("/api/bugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Failed to create bug")
      }
      return res.json()
    },
    onSuccess: (bug: Bug) => {
      qc.invalidateQueries({ queryKey: bugKeys.all })
      toast.success("Bug report created")
      useNotificationStore.getState().addNotification({
        type: "bug_created",
        title: "Bug report created",
        description: bug.summary,
        bugId: bug.id,
      })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ---- Update bug ----
export function useUpdateBug(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<BugInput>) => {
      const res = await fetch(`/api/bugs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Failed to update bug")
      }
      return res.json()
    },
    onSuccess: (updated: Bug) => {
      qc.setQueryData(bugKeys.detail(id), updated)
      qc.invalidateQueries({ queryKey: bugKeys.lists() })
      qc.invalidateQueries({ queryKey: bugKeys.stats() })
      // Detect status change for a special "bug_closed" notification
      const prevData = qc.getQueryData<Bug>(bugKeys.detail(id))
      if (prevData && prevData.status === "open" && updated.status === "closed") {
        useNotificationStore.getState().addNotification({
          type: "bug_closed",
          title: "Bug closed",
          description: updated.summary,
          bugId: updated.id,
        })
      }
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ---- Delete bug ----
export function useDeleteBug() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/bugs/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Failed to delete bug")
      }
      return id
    },
    onSuccess: (id) => {
      qc.removeQueries({ queryKey: bugKeys.detail(id) })
      qc.invalidateQueries({ queryKey: bugKeys.lists() })
      qc.invalidateQueries({ queryKey: bugKeys.stats() })
      toast.success("Bug report deleted")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ---- Labels list ----
export function useLabels() {
  return useQuery<Label[]>({
    queryKey: labelKeys.list(),
    queryFn: async () => {
      const res = await fetch("/api/labels")
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Failed to fetch labels")
      }
      return res.json()
    },
    staleTime: 30_000,
  })
}

// ---- Create label ----
export function useCreateLabel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { name: string; color?: string }) => {
      const res = await fetch("/api/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Failed to create label")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: labelKeys.all })
      toast.success("Label created")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ---- Update label ----
export function useUpdateLabel(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { name?: string; color?: string }) => {
      const res = await fetch(`/api/labels/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Failed to update label")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: labelKeys.all })
      toast.success("Label updated")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ---- Delete label ----
export function useDeleteLabel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/labels/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Failed to delete label")
      }
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: labelKeys.all })
      qc.invalidateQueries({ queryKey: bugKeys.all })
      toast.success("Label deleted")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ---- App info ----
export function useAppInfo() {
  return useQuery({
    queryKey: ["app-info"],
    queryFn: async () => {
      const res = await fetch("/api/info")
      if (!res.ok) throw new Error("Failed to fetch app info")
      return res.json()
    },
    staleTime: Infinity,
  })
}

// ---- Bug activity events ----
export function useBugEvents(bugId: string | null) {
  return useQuery<BugEvent[]>({
    queryKey: bugId ? [...bugKeys.detail(bugId), "events"] : ["bugs", "events", "none"],
    queryFn: async () => {
      const res = await fetch(`/api/bugs/${bugId}/events`)
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Failed to fetch events")
      }
      return res.json()
    },
    enabled: Boolean(bugId),
    staleTime: 5_000,
  })
}

// ---- Bulk action ----
export function useBulkAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (action: BulkAction) => {
      const res = await fetch("/api/bugs/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Failed to apply bulk action")
      }
      return res.json()
    },
    onSuccess: (data: { affected: number; action: string }) => {
      qc.invalidateQueries({ queryKey: bugKeys.all })
      toast.success(`Applied to ${data.affected} bug${data.affected === 1 ? "" : "s"}`)
      useNotificationStore.getState().addNotification({
        type: "bulk_action",
        title: `Bulk ${data.action} applied`,
        description: `${data.affected} bug${data.affected === 1 ? "" : "s"} updated`,
      })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ---- Trend (opened vs closed over time) ----
export function useBugTrend(days = 14) {
  return useQuery<{ points: TrendPoint[]; totalOpened: number; totalClosed: number }>({
    queryKey: [...bugKeys.all, "trend", days],
    queryFn: async () => {
      const res = await fetch(`/api/bugs/trend?days=${days}`)
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Failed to fetch trend")
      }
      return res.json()
    },
    staleTime: 30_000,
  })
}

// ---- Export (CSV/JSON download) ----
export function useExportBugs() {
  return useMutation({
    mutationFn: async ({ format, limit }: { format: "csv" | "json"; limit?: number }) => {
      const params = new URLSearchParams({ format })
      if (limit) params.set("limit", String(limit))
      const res = await fetch(`/api/bugs/export?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to export bugs")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const cd = res.headers.get("Content-Disposition") || ""
      const match = cd.match(/filename="?([^"]+)"?/)
      a.download = match ? match[1] : `ib4g-bugs.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      return true
    },
    onSuccess: () => toast.success("Export downloaded"),
    onError: (e: Error) => toast.error(e.message),
  })
}

// ---- Import (JSON) ----
export function useImportBugs() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (bugs: ImportItem[]) => {
      const res = await fetch("/api/bugs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bugs }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Failed to import bugs")
      }
      return res.json()
    },
    onSuccess: (data: { created: number; skipped: number }) => {
      qc.invalidateQueries({ queryKey: bugKeys.all })
      qc.invalidateQueries({ queryKey: labelKeys.all })
      if (data.skipped > 0) {
        toast.warning(`Imported ${data.created}, skipped ${data.skipped}`)
      } else {
        toast.success(`Imported ${data.created} bug${data.created === 1 ? "" : "s"}`)
      }
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ---- Search bugs (for command palette "search all" mode) ----
export function useBugSearch(query: string, limit = 10) {
  return useQuery<{ data: Bug[]; q: string; total: number }>({
    queryKey: [...bugKeys.all, "search", query, limit],
    queryFn: async () => {
      const params = new URLSearchParams({ q: query, limit: String(limit) })
      const res = await fetch(`/api/bugs/search?${params.toString()}`)
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Failed to search bugs")
      }
      return res.json()
    },
    enabled: query.trim().length >= 2,
    staleTime: 15_000,
  })
}

// ---- Global activity feed (recent events across ALL bugs) with infinite scroll ----
type ActivityEvent = {
  id: string
  bugId: string
  type: string
  summary: string
  actor: string
  createdAt: string
  bugSummary: string
  jiraId: string | null
}

type ActivityPage = {
  events: ActivityEvent[]
  hasMore: boolean
  nextCursor: string | null
}

export function useGlobalActivity(limit = 15) {
  return useInfiniteQuery<ActivityPage>({
    queryKey: [...bugKeys.all, "activity", limit],
    queryFn: async (ctx) => {
      const params = new URLSearchParams({ limit: String(limit) })
      const pageParam = ctx.pageParam as string | undefined
      if (pageParam) params.set("before", pageParam)
      const res = await fetch(`/api/bugs/activity?${params.toString()}`)
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Failed to fetch activity")
      }
      return res.json()
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined,
    staleTime: 15_000,
  })
}

// ---- Related bugs (same module / platform / labels) ----
export function useRelatedBugs(bugId: string | null, limit = 5) {
  return useQuery<{ data: Bug[] }>({
    queryKey: bugId ? [...bugKeys.detail(bugId), "related"] : ["bugs", "related", "none"],
    queryFn: async () => {
      const res = await fetch(`/api/bugs/${bugId}/related?limit=${limit}`)
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Failed to fetch related bugs")
      }
      return res.json()
    },
    enabled: Boolean(bugId),
    staleTime: 30_000,
  })
}

// ---- Bug comments (discussion thread) ----
export function useBugComments(bugId: string | null) {
  return useQuery<{ data: BugComment[] }>({
    queryKey: bugId ? [...bugKeys.detail(bugId), "comments"] : ["bugs", "comments", "none"],
    queryFn: async () => {
      const res = await fetch(`/api/bugs/${bugId}/comments`)
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Failed to fetch comments")
      }
      return res.json()
    },
    enabled: Boolean(bugId),
    staleTime: 10_000,
  })
}

export function useCreateComment(bugId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { body: string; author?: string }) => {
      const res = await fetch(`/api/bugs/${bugId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Failed to add comment")
      }
      return res.json()
    },
    onSuccess: (comment: BugComment) => {
      qc.invalidateQueries({ queryKey: [...bugKeys.detail(bugId), "comments"] })
      toast.success("Comment added")
      useNotificationStore.getState().addNotification({
        type: "comment_added",
        title: `Comment by ${comment.author}`,
        description: comment.body.slice(0, 80) + (comment.body.length > 80 ? "…" : ""),
        bugId,
      })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteComment(bugId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (commentId: string) => {
      const res = await fetch(`/api/bugs/${bugId}/comments/${commentId}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Failed to delete comment")
      }
      return commentId
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...bugKeys.detail(bugId), "comments"] })
      toast.success("Comment deleted")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateComment(bugId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ commentId, body }: { commentId: string; body: string }) => {
      const res = await fetch(`/api/bugs/${bugId}/comments/${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Failed to update comment")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...bugKeys.detail(bugId), "comments"] })
      toast.success("Comment updated")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ---- Assignees list (for the filter dropdown) ----
export function useAssignees() {
  return useQuery<{ assignees: { name: string; total: number; open: number; closed: number }[] }>({
    queryKey: [...bugKeys.all, "assignees"],
    queryFn: async () => {
      const res = await fetch("/api/bugs/assignees")
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Failed to fetch assignees")
      }
      return res.json()
    },
    staleTime: 60_000,
  })
}

// ---- Burndown (open bugs over time) ----
export function useBugBurndown(days = 30) {
  return useQuery<{ points: { date: string; open: number; closed: number }[]; currentOpen: number; peakOpen: number; totalClosed: number }>({
    queryKey: [...bugKeys.all, "burndown", days],
    queryFn: async () => {
      const res = await fetch(`/api/bugs/burndown?days=${days}`)
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Failed to fetch burndown")
      }
      return res.json()
    },
    staleTime: 30_000,
  })
}
