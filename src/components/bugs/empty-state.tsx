"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    icon?: LucideIcon
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 text-muted-foreground",
        className,
      )}
    >
      <div className="relative">
        <div className="absolute inset-0 blur-xl bg-primary/10 rounded-full" aria-hidden />
        <div className="relative h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center border">
          <Icon className="h-7 w-7 opacity-50" />
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">{description}</p>
        )}
      </div>
      {action && (
        <Button size="sm" variant="outline" className="gap-2 mt-1" onClick={action.onClick}>
          {action.icon && <action.icon className="h-4 w-4" />}
          {action.label}
        </Button>
      )}
    </div>
  )
}
