"use client"

import { Badge } from "@/components/ui/badge"
import { STAGE_CONFIG } from "@/lib/constants"
import type { EnvironmentStage } from "@/lib/types"
import { cn } from "@/lib/utils"

export function StageBadge({
  stage,
  className,
}: {
  stage: EnvironmentStage
  className?: string
}) {
  const config = STAGE_CONFIG[stage]
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-medium capitalize border",
        config.badge,
        className,
      )}
    >
      <span className="text-xs leading-none">{config.icon}</span>
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label}
    </Badge>
  )
}
