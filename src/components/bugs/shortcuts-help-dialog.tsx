"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ShortcutDef } from "@/hooks/use-keyboard-shortcuts"

interface ShortcutsHelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shortcuts: ShortcutDef[]
}

export function ShortcutsHelpDialog({
  open,
  onOpenChange,
  shortcuts,
}: ShortcutsHelpDialogProps) {
  const groups = React.useMemo(() => {
    const order: ShortcutDef["group"][] = ["Navigation", "Actions", "Other"]
    const map = new Map<ShortcutDef["group"], ShortcutDef[]>()
    for (const g of order) map.set(g, [])
    for (const s of shortcuts) {
      const arr = map.get(s.group) ?? []
      arr.push(s)
      map.set(s.group, arr)
    }
    return order.map((g) => ({ group: g, items: map.get(g) ?? [] }))
  }, [shortcuts])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Speed up your workflow with these shortcuts. They work anywhere in the app
            (except when typing in a field).
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] scrollbar-thin pr-3">
          <div className="space-y-5">
            {groups.map(({ group, items }) =>
              items.length === 0 ? null : (
                <div key={group}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    {group}
                  </p>
                  <div className="space-y-1.5">
                    {items.map((s) => (
                      <div
                        key={s.keys}
                        className="flex items-center justify-between gap-3 py-1.5 px-2 rounded-md hover:bg-accent/50"
                      >
                        <span className="text-sm text-muted-foreground">{s.description}</span>
                        <kbd className="rounded border bg-muted px-2 py-1 text-[11px] font-mono font-medium whitespace-nowrap">
                          {s.keys}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
