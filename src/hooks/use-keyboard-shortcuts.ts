"use client"

import * as React from "react"
import { useBugStore } from "@/store/bug-store"
import type { SidebarView } from "@/lib/constants"

interface ShortcutHandlers {
  onOpenCommandPalette?: () => void
  onShowShortcutsHelp?: () => void
}

export interface ShortcutDef {
  keys: string
  description: string
  group: "Navigation" | "Actions" | "Other"
  action: () => void
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const setView = useBugStore((s) => s.setView)
  const selectBug = useBugStore((s) => s.selectBug)
  const openCreateForm = useBugStore((s) => s.openCreateForm)
  const closeForm = useBugStore((s) => s.closeForm)
  const formOpen = useBugStore((s) => s.formOpen)
  const selectedBugId = useBugStore((s) => s.selectedBugId)

  // Keep latest handlers in a ref so the effect doesn't re-bind on every render
  const handlersRef = React.useRef(handlers)
  React.useEffect(() => {
    handlersRef.current = handlers
  })

  const goTo = React.useCallback(
    (view: SidebarView) => {
      selectBug(null)
      setView(view)
    },
    [selectBug, setView],
  )

  const shortcuts: ShortcutDef[] = [
    {
      keys: "⌘K / Ctrl+K",
      description: "Open command palette",
      group: "Other",
      action: () => handlersRef.current.onOpenCommandPalette?.(),
    },
    {
      keys: "n",
      description: "Create new bug report",
      group: "Actions",
      action: () => openCreateForm(),
    },
    {
      keys: "/",
      description: "Focus the search box (in Bug Reports)",
      group: "Actions",
      action: () =>
        window.dispatchEvent(new CustomEvent("ib4g:focus-search")),
    },
    {
      keys: "] / [",
      description: "Cycle assignee filter (next / prev)",
      group: "Actions",
      action: () =>
        window.dispatchEvent(new CustomEvent("ib4g:cycle-assignee", { detail: { direction: "next" } })),
    },
    {
      keys: "?",
      description: "Show this shortcuts help",
      group: "Other",
      action: () => handlersRef.current.onShowShortcutsHelp?.(),
    },
    {
      keys: "g d",
      description: "Go to Dashboard",
      group: "Navigation",
      action: () => goTo("dashboard"),
    },
    {
      keys: "g b",
      description: "Go to Bug Reports",
      group: "Navigation",
      action: () => goTo("bugs"),
    },
    {
      keys: "g l",
      description: "Go to Labels",
      group: "Navigation",
      action: () => goTo("labels"),
    },
    {
      keys: "g e",
      description: "Go to Endpoints",
      group: "Navigation",
      action: () => goTo("endpoints"),
    },
    {
      keys: "g s",
      description: "Go to Settings",
      group: "Navigation",
      action: () => goTo("settings"),
    },
    {
      keys: "Esc",
      description: "Close dialogs / go back",
      group: "Other",
      action: () => {
        if (formOpen) {
          closeForm()
        } else if (selectedBugId) {
          selectBug(null)
          setView("bugs")
        }
      },
    },
  ]

  // "g d" / "g b" / "g l" / "g e" two-key sequences
  const gPressed = React.useRef(false)
  const gTimeout = React.useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Command palette takes priority
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        handlersRef.current.onOpenCommandPalette?.()
        return
      }

      const target = e.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      const isEditable =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target?.isContentEditable

      // Escape works everywhere
      if (e.key === "Escape") {
        if (formOpen) {
          closeForm()
        } else if (selectedBugId) {
          selectBug(null)
          setView("bugs")
        }
        return
      }

      // Single-letter shortcuts only fire when not typing
      if (isEditable || e.metaKey || e.ctrlKey || e.altKey) return

      const key = e.key.toLowerCase()

      // "g" prefix
      if (key === "g") {
        gPressed.current = true
        if (gTimeout.current) clearTimeout(gTimeout.current)
        gTimeout.current = setTimeout(() => {
          gPressed.current = false
        }, 800)
        return
      }
      if (gPressed.current) {
        const map: Record<string, () => void> = {
          d: () => goTo("dashboard"),
          b: () => goTo("bugs"),
          l: () => goTo("labels"),
          e: () => goTo("endpoints"),
          s: () => goTo("settings"),
        }
        if (map[key]) {
          e.preventDefault()
          map[key]()
          gPressed.current = false
          if (gTimeout.current) clearTimeout(gTimeout.current)
          return
        }
        gPressed.current = false
      }

      if (key === "n") {
        e.preventDefault()
        openCreateForm()
      } else if (key === "/") {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent("ib4g:focus-search"))
      } else if (key === "?") {
        e.preventDefault()
        handlersRef.current.onShowShortcutsHelp?.()
      } else if (key === "[" || key === "]") {
        // Cycle assignees (only on the bugs list view)
        const state = useBugStore.getState()
        if (state.view !== "bugs" || state.selectedBugId) return
        e.preventDefault()
        window.dispatchEvent(
          new CustomEvent("ib4g:cycle-assignee", { detail: { direction: key === "]" ? "next" : "prev" } })
        )
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [formOpen, selectedBugId, openCreateForm, closeForm, selectBug, setView, goTo])

  return { shortcuts }
}
