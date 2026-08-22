"use client"

import { Badge } from "@/components/ui/badge"
import { PRIORITY_CONFIG } from "@/lib/constants"
import type { BugPriority } from "@/lib/types"
import { cn } from "@/lib/utils"

export function PriorityBadge({
  priority,
  className,
}: {
  priority: BugPriority
  className?: string
}) {
  const config = PRIORITY_CONFIG[priority]
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
