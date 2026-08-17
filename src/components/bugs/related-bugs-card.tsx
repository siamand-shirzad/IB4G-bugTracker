"use client"

import * as React from "react"
import {
  ArrowRight,
  Bug as BugIcon,
  Link2,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/bugs/status-badge"
import { PriorityBadge } from "@/components/bugs/priority-badge"
import { StageBadge } from "@/components/bugs/stage-badge"
import { LabelBadge } from "@/components/bugs/label-badge"
import { useRelatedBugs } from "@/hooks/use-bugs"
import { useBugStore } from "@/store/bug-store"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface RelatedBugsCardProps {
  bugId: string
  bugSummary: string
  bugLabels: { id: string; name: string; color: string }[]
}

export function RelatedBugsCard({ bugId, bugSummary, bugLabels }: RelatedBugsCardProps) {
  const { data, isLoading } = useRelatedBugs(bugId, 5)
  const selectBug = useBugStore((s) => s.selectBug)
  const related = data?.data ?? []

  const handleClick = (id: string) => {
    selectBug(id)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              Related Bugs
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Shared module, platform, stage, or labels
            </CardDescription>
          </div>
          {related.length > 0 && (
            <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {related.length} match{related.length === 1 ? "" : "es"}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : related.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <BugIcon className="h-7 w-7 text-muted-foreground opacity-40 mb-2" />
            <p className="text-xs font-medium text-muted-foreground">No related bugs found</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">
              This bug doesn&apos;t share module, platform, stage, or labels with others.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {related.map((bug) => {
              const sharedLabels = bug.labels.filter((l) =>
                bugLabels.some((bl) => bl.id === l.id),
              )
              return (
                <button
                  key={bug.id}
                  onClick={() => handleClick(bug.id)}
                  className="w-full text-left group flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent transition-colors border border-transparent hover:border-border"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {bug.jiraId && (
                        <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                          {bug.jiraId}
                        </span>
                      )}
                      <span className="text-sm font-medium truncate group-hover:text-foreground">
                        {bug.summary}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <StatusBadge status={bug.status} className="text-[10px]" />
                      <PriorityBadge priority={bug.priority} className="text-[10px]" />
                      <StageBadge stage={bug.environmentStage} className="text-[10px]" />
                      {sharedLabels.slice(0, 2).map((l) => (
                        <LabelBadge key={l.id} label={l} />
                      ))}
                      {sharedLabels.length > 2 && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                          +{sharedLabels.length - 2} shared
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(bug.updatedAt), { addSuffix: true })}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
