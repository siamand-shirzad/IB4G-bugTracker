"use client"

import * as React from "react"
import {
  AlertCircle,
  ChevronDown,
  CircleDot,
  GitBranch,
  History,
  Plus,
  Sparkles,
  Tags,
  Trash2,
  User,
  Pencil,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useGlobalActivity } from "@/hooks/use-bugs"
import { useBugStore } from "@/store/bug-store"
import type { BugEventType } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface GlobalActivityFeedProps {
  limit?: number
}

const EVENT_META: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; color: string; dot: string }
> = {
  created: { icon: Plus, color: "text-stone-500 dark:text-stone-400", dot: "bg-stone-400" },
  status_changed: { icon: CircleDot, color: "text-stone-500 dark:text-stone-400", dot: "bg-stone-400" },
  priority_changed: { icon: AlertCircle, color: "text-red-500/70 dark:text-red-400/70", dot: "bg-red-400" },
  stage_changed: { icon: GitBranch, color: "text-stone-500 dark:text-stone-400", dot: "bg-stone-500" },
  assignee_changed: { icon: User, color: "text-stone-500 dark:text-stone-400", dot: "bg-stone-500" },
  labels_changed: { icon: Tags, color: "text-stone-500 dark:text-stone-400", dot: "bg-stone-400" },
  summary_changed: { icon: Pencil, color: "text-stone-500 dark:text-stone-400", dot: "bg-stone-500" },
  details_updated: { icon: Sparkles, color: "text-stone-500 dark:text-stone-400", dot: "bg-stone-400" },
  deleted: { icon: Trash2, color: "text-red-500/70 dark:text-red-400/70", dot: "bg-red-400" },
}

export function GlobalActivityFeed({ limit = 15 }: GlobalActivityFeedProps) {
  const { data, isLoading, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } = useGlobalActivity(limit)
  const setView = useBugStore((s) => s.setView)
  const selectBug = useBugStore((s) => s.selectBug)

  // Flatten infinite query pages into a single events array
  const events = React.useMemo(() => {
    const all: Array<{
      id: string
      bugId: string
      type: string
      summary: string
      actor: string
      createdAt: string
      bugSummary: string
      jiraId: string | null
    }> = []
    for (const page of data?.pages ?? []) {
      all.push(...page.events)
    }
    // De-duplicate by id (in case of overlap)
    const seen = new Set<string>()
    return all.filter((e) => {
      if (seen.has(e.id)) return false
      seen.add(e.id)
      return true
    })
  }, [data])

  const handleClick = (bugId: string) => {
    selectBug(bugId)
    setView("bugs")
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              Global Activity
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Most recent changes across all bug reports
            </CardDescription>
          </div>
          {isFetching && !isLoading && !isFetchingNextPage && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex-1 min-h-0">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <History className="h-8 w-8 text-muted-foreground opacity-40 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">No activity yet</p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              Changes to bug reports will appear here.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[360px] scrollbar-thin pr-3">
            <ol className="relative space-y-1">
              <div
                className="absolute left-[13px] top-2 bottom-2 w-px bg-border"
                aria-hidden
              />
              {events.map((event, idx) => {
                const meta = EVENT_META[event.type] ?? EVENT_META.details_updated
                const Icon = meta.icon
                return (
                  <li key={event.id}>
                    <button
                      onClick={() => handleClick(event.bugId)}
                      className="relative w-full text-left flex items-start gap-3 pl-0.5 py-1.5 rounded-md hover:bg-accent/60 transition-colors group animate-fade-in"
                      style={{ animationDelay: `${Math.min(idx * 25, 250)}ms` }}
                    >
                      <div
                        className={cn(
                          "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background border-2",
                          meta.dot.replace("bg-", "border-"),
                        )}
                      >
                        <div className={cn("h-2.5 w-2.5 rounded-full", meta.dot)} />
                      </div>
                      <div className="flex-1 min-w-0 pb-1">
                        <p className="text-sm leading-snug">
                          <Icon className={cn("inline-block h-3.5 w-3.5 mr-1.5 -mt-0.5", meta.color)} />
                          <span className="text-muted-foreground">{event.summary}</span>
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
                          {event.jiraId && (
                            <span className="font-mono">{event.jiraId}</span>
                          )}
                          <span className="truncate">
                            {event.bugSummary}
                          </span>
                          <span aria-hidden>·</span>
                          <span className="whitespace-nowrap">
                            {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ol>
            {/* Load more button */}
            {hasNextPage && (
              <div className="pt-2 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1.5 w-full"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                  Load older events
                </Button>
              </div>
            )}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
