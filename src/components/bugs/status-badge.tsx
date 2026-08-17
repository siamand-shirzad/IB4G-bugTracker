"use client"

import { Badge } from "@/components/ui/badge"
import { STATUS_CONFIG } from "@/lib/constants"
import type { BugStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

export function StatusBadge({
  status,
  className,
}: {
  status: BugStatus
  className?: string
}) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-medium capitalize border",
        config.badge,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}
