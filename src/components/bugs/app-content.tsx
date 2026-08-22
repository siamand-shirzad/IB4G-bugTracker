"use client"

import * as React from "react"
import { Menu, Plus, Bug as BugIcon, Command as CommandIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { AppSidebar } from "@/components/bugs/app-sidebar"
import { DashboardView } from "@/components/bugs/dashboard-view"
import { BugListView } from "@/components/bugs/bug-list-view"
import { BugDetailView } from "@/components/bugs/bug-detail-view"
import { InfoView } from "@/components/bugs/info-view"
import { LabelsView } from "@/components/bugs/labels-view"
import { SettingsView } from "@/components/bugs/settings-view"
import { BugFormDialog } from "@/components/bugs/bug-form-dialog"
import { CommandPalette } from "@/components/bugs/command-palette"
import { ShortcutsHelpDialog } from "@/components/bugs/shortcuts-help-dialog"
import { NotificationBell } from "@/components/bugs/notification-bell"
import { Breadcrumb } from "@/components/bugs/breadcrumb"
import { AppFooter } from "@/components/bugs/app-footer"
import { useBugStore } from "@/store/bug-store"
import { useLabels } from "@/hooks/use-bugs"
import { useIsMobile } from "@/hooks/use-mobile"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"

export function AppContent() {
  const view = useBugStore((s) => s.view)
  const selectedBugId = useBugStore((s) => s.selectedBugId)
  const sidebarCollapsed = useBugStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useBugStore((s) => s.toggleSidebar)
  const mobileSidebarOpen = useBugStore((s) => s.mobileSidebarOpen)
  const setMobileSidebarOpen = useBugStore((s) => s.setMobileSidebarOpen)
  const openCreateForm = useBugStore((s) => s.openCreateForm)

  const isMobile = useIsMobile()

  // Command palette + shortcuts help state
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false)
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false)

  const { shortcuts } = useKeyboardShortcuts({
    onOpenCommandPalette: () => setCommandPaletteOpen(true),
    onShowShortcutsHelp: () => setShortcutsOpen(true),
  })

  // Allow sidebar / other components to open the command palette via custom event
  React.useEffect(() => {
    const handler = () => setCommandPaletteOpen(true)
    window.addEventListener("ib4g:open-command-palette", handler)
    return () => window.removeEventListener("ib4g:open-command-palette", handler)
  }, [])

  // Deep-link support: read ?bug=ID on mount and navigate to the bug detail
  React.useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const bugId = params.get("bug")
    if (bugId) {
      const { setView, selectBug } = useBugStore.getState()
      setView("bugs")
      selectBug(bugId)
      // Clean the URL so a refresh doesn't re-trigger
      const url = new URL(window.location.href)
      url.searchParams.delete("bug")
      window.history.replaceState({}, "", url.toString())
    }
  }, [])

  // Keep labels cache in sync (so badges elsewhere can use it)
  const { data: labels = [] } = useLabels()
  const setLabelsCache = useBugStore((s) => s.setLabelsCache)
  React.useEffect(() => {
    setLabelsCache(labels)
  }, [labels, setLabelsCache])

  const renderView = () => {
    // Bug detail takes precedence over the bugs list when a bug is selected
    if (view === "bugs" && selectedBugId) {
      return <BugDetailView />
    }
    switch (view) {
      case "dashboard":
        return <DashboardView />
      case "bugs":
        return <BugListView />
      case "labels":
        return <LabelsView />
      case "endpoints":
        return <InfoView />
      case "settings":
        return <SettingsView />
      default:
        return <DashboardView />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Desktop sidebar */}
      {!isMobile && (
        <AppSidebar
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          variant="desktop"
        />
      )}

      {/* Mobile sidebar (Sheet) */}
      {isMobile && (
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" className="w-[224px] sm:max-w-[224px] p-0">
            <AppSidebar
              collapsed={false}
              onToggle={() => setMobileSidebarOpen(false)}
              onNavigate={() => setMobileSidebarOpen(false)}
              variant="mobile"
            />
          </SheetContent>
        </Sheet>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        {isMobile && (
          <header className="h-14 flex items-center gap-2 px-3 border-b bg-background shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 flex-1">
              <div className="h-6 w-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
                <BugIcon className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-semibold">IB4G BugTracker</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setCommandPaletteOpen(true)}
            >
              <CommandIcon className="h-4 w-4" />
            </Button>
            <NotificationBell />
            <Button size="sm" className="h-8 gap-1.5" onClick={openCreateForm}>
              <Plus className="h-4 w-4" />
              New
            </Button>
          </header>
        )}

        {/* Scrollable content area + sticky footer */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            <Breadcrumb />
            {renderView()}
          </div>
          <AppFooter />
        </main>
      </div>

      {/* Form dialog (global) */}
      <BugFormDialog />

      {/* Command palette (global) */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onShowShortcuts={() => setShortcutsOpen(true)}
      />

      {/* Keyboard shortcuts help (global) */}
      <ShortcutsHelpDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
        shortcuts={shortcuts}
      />
    </div>
  )
}
