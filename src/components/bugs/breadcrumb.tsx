"use client"

import * as React from "react"
import { ChevronRight, Home } from "lucide-react"
import { useBugStore } from "@/store/bug-store"
import { useBug } from "@/hooks/use-bugs"
import { SIDEBAR_ITEMS } from "@/lib/constants"
import { cn } from "@/lib/utils"

export function Breadcrumb() {
  const view = useBugStore((s) => s.view)
  const selectedBugId = useBugStore((s) => s.selectedBugId)
  const setView = useBugStore((s) => s.setView)
  const selectBug = useBugStore((s) => s.selectBug)
  const { data: bug } = useBug(selectedBugId)

  // Find the current view's label
  const currentView = SIDEBAR_ITEMS.find((item) => item.id === view)
  if (!currentView) return null

  // Bug detail: Bug Reports > [summary]
  if (view === "bugs" && selectedBugId) {
    const summary = bug?.summary ?? "Loading…"
    const truncated = summary.length > 50 ? summary.slice(0, 50) + "…" : summary
    return (
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
        <button
          onClick={() => { selectBug(null); setView("bugs") }}
          className="hover:text-foreground transition-colors"
        >
          Bug Reports
        </button>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <span className="text-foreground font-medium truncate max-w-[300px]">
          {truncated}
        </span>
      </nav>
    )
  }

  // Single-level views
  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
      <span className="text-foreground font-medium">{currentView.label}</span>
    </nav>
  )
}
