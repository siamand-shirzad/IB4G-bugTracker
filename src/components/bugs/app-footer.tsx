"use client"

import * as React from "react"
import { Bug as BugIcon } from "lucide-react"
import { APP_NAME, APP_VERSION } from "@/lib/constants"
import { useBugStats } from "@/hooks/use-bugs"
import { cn } from "@/lib/utils"

export function AppFooter() {
  const { data: stats } = useBugStats()

  return (
    <footer className="border-t mt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <BugIcon className="h-2.5 w-2.5" />
            </div>
            <span className="font-medium text-foreground">{APP_NAME}</span>
            <span className="opacity-50">·</span>
            <span className="font-mono text-[11px]">v{APP_VERSION}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="tabular-nums">{stats?.open ?? 0} open</span>
            <span className="tabular-nums">{stats?.closed ?? 0} closed</span>
            <span className="tabular-nums text-destructive">{stats?.critical ?? 0} critical</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
