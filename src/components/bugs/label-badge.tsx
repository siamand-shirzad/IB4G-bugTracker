"use client"

import { Badge } from "@/components/ui/badge"
import { LABEL_COLOR_MAP } from "@/lib/constants"
import type { Label } from "@/lib/types"
import { cn } from "@/lib/utils"

export function LabelBadge({
  label,
  className,
  onClick,
  active,
}: {
  label: Pick<Label, "name" | "color">
  className?: string
  onClick?: () => void
  active?: boolean
}) {
  const palette = LABEL_COLOR_MAP[label.color] ?? LABEL_COLOR_MAP.neutral
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-full px-2.5 py-0.5 font-medium border transition-colors",
        palette.badge,
        onClick && "cursor-pointer hover:opacity-80",
        active && "ring-2 ring-offset-1 ring-offset-background",
        className,
      )}
      onClick={onClick}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", palette.dot)} />
      {label.name}
    </Badge>
  )
}
