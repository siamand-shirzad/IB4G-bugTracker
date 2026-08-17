"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import {
  Bug as BugIcon,
  Command as CommandIcon,
  CornerDownLeft,
  LayoutDashboard,
  ListChecks,
  Moon,
  Plus,
  Search,
  Tag,
  Info,
  Keyboard,
  Settings,
  Loader2,
} from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { useBugStore } from "@/store/bug-store"
import { useBugStats, useBugSearch } from "@/hooks/use-bugs"
import type { SidebarView } from "@/lib/constants"
import { StatusBadge } from "@/components/bugs/status-badge"
import { PriorityBadge } from "@/components/bugs/priority-badge"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onShowShortcuts?: () => void
}

export function CommandPalette({
  open,
  onOpenChange,
  onShowShortcuts,
}: CommandPaletteProps) {
  const setView = useBugStore((s) => s.setView)
  const selectBug = useBugStore((s) => s.selectBug)
  const openCreateForm = useBugStore((s) => s.openCreateForm)
  const { data: stats } = useBugStats()
  const { theme, setTheme } = useTheme()

  // Track the current search query via the input's value
  const [query, setQuery] = React.useState("")
  const { data: searchResult, isFetching: searchFetching } = useBugSearch(query, 8)
  const recentBugs = stats?.recent ?? []

  const goTo = (view: SidebarView) => {
    selectBug(null)
    setView(view)
    onOpenChange(false)
  }

  // Reset query when palette closes
  React.useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setQuery(""), 200)
      return () => clearTimeout(t)
    }
  }, [open])

  const isSearching = query.trim().length >= 2
  const searchBugs = searchResult?.data ?? []

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command Palette"
      description="Search for a command to run..."
      className="max-w-xl"
      showCloseButton={false}
    >
      <CommandInput
        placeholder="Type a command or search bugs…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[420px] scrollbar-thin">
        <CommandEmpty>
          {isSearching ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              {searchFetching ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Searching…
                </>
              ) : (
                <>
                  <Search className="h-3.5 w-3.5" />
                  No bugs match &ldquo;{query}&rdquo;
                </>
              )}
            </div>
          ) : (
            "No results found."
          )}
        </CommandEmpty>

        {/* When searching, show the search results first and hide other groups */}
        {isSearching ? (
          <CommandGroup
            heading={
              <span className="flex items-center gap-2">
                Search results
                {searchBugs.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1">
                    {searchBugs.length}
                  </Badge>
                )}
              </span>
            }
          >
            {searchBugs.map((bug) => (
              <CommandItem
                key={bug.id}
                value={`search-bug ${bug.summary} ${bug.jiraId ?? ""}`}
                onSelect={() => {
                  selectBug(bug.id)
                  setView("bugs")
                  onOpenChange(false)
                }}
              >
                <BugIcon className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {bug.jiraId && (
                      <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                        {bug.jiraId}
                      </span>
                    )}
                    <span className="truncate text-sm">{bug.summary}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={bug.status} className="text-[10px] py-0" />
                    <PriorityBadge priority={bug.priority} className="text-[10px] py-0" />
                  </div>
                </div>
                <CornerDownLeft className="h-3 w-3 text-muted-foreground opacity-0 group-aria-selected:opacity-100" />
              </CommandItem>
            ))}
          </CommandGroup>
        ) : (
          <>
            <CommandGroup heading="Quick Actions">
              <CommandItem
                onSelect={() => {
                  openCreateForm()
                  onOpenChange(false)
                }}
              >
                <Plus className="h-4 w-4" />
                <span>Create new bug report</span>
                <CommandShortcut>
                  <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium font-mono">
                    N
                  </kbd>
                </CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  window.dispatchEvent(new CustomEvent("ib4g:focus-search"))
                  setView("bugs")
                  onOpenChange(false)
                }}
              >
                <Search className="h-4 w-4" />
                <span>Focus bug search</span>
                <CommandShortcut>
                  <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium font-mono">
                    /
                  </kbd>
                </CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  onShowShortcuts?.()
                  onOpenChange(false)
                }}
              >
                <Keyboard className="h-4 w-4" />
                <span>Keyboard shortcuts help</span>
                <CommandShortcut>
                  <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium font-mono">
                    ?
                  </kbd>
                </CommandShortcut>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Navigation">
              <CommandItem onSelect={() => goTo("dashboard")}>
                <LayoutDashboard className="h-4 w-4" />
                <span>Go to Dashboard</span>
                <CommandShortcut>
                  <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium font-mono">
                    G D
                  </kbd>
                </CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => goTo("bugs")}>
                <ListChecks className="h-4 w-4" />
                <span>Go to Bug Reports</span>
                <CommandShortcut>
                  <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium font-mono">
                    G B
                  </kbd>
                </CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => goTo("labels")}>
                <Tag className="h-4 w-4" />
                <span>Go to Labels</span>
                <CommandShortcut>
                  <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium font-mono">
                    G L
                  </kbd>
                </CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => goTo("endpoints")}>
                <Info className="h-4 w-4" />
                <span>Go to Endpoints</span>
                <CommandShortcut>
                  <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium font-mono">
                    G E
                  </kbd>
                </CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => goTo("settings")}>
                <Settings className="h-4 w-4" />
                <span>Go to Settings</span>
                <CommandShortcut>
                  <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium font-mono">
                    G S
                  </kbd>
                </CommandShortcut>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Appearance">
              <CommandItem
                onSelect={() => {
                  setTheme(theme === "dark" ? "light" : "dark")
                  onOpenChange(false)
                }}
              >
                <Moon className="h-4 w-4" />
                <span>Toggle {theme === "dark" ? "light" : "dark"} mode</span>
              </CommandItem>
            </CommandGroup>

            {recentBugs.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Recent Bugs">
                  {recentBugs.slice(0, 5).map((bug) => (
                    <CommandItem
                      key={bug.id}
                      value={`bug ${bug.summary} ${bug.jiraId ?? ""}`}
                      onSelect={() => {
                        selectBug(bug.id)
                        setView("bugs")
                        onOpenChange(false)
                      }}
                    >
                      <BugIcon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {bug.jiraId && (
                          <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                            {bug.jiraId}
                          </span>
                        )}
                        <span className="truncate text-sm">{bug.summary}</span>
                      </div>
                      <CornerDownLeft className="h-3 w-3 text-muted-foreground opacity-0 group-aria-selected:opacity-100" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </>
        )}
      </CommandList>
      <div className="flex items-center justify-between px-3 py-2 border-t text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CommandIcon className="h-3 w-3" />
          IB4G BugTracker
        </span>
        <span className="flex items-center gap-2">
          {isSearching && searchBugs.length > 0 && (
            <span className="text-emerald-600 dark:text-emerald-400">
              {searchBugs.length} match{searchBugs.length === 1 ? "" : "es"}
            </span>
          )}
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono">↑↓</kbd>
          navigate
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono ml-1">↵</kbd>
          select
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono ml-1">Esc</kbd>
          close
        </span>
      </div>
    </CommandDialog>
  )
}
