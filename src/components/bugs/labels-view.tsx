"use client"

import * as React from "react"
import {
  Check,
  Loader2,
  Pencil,
  Plus,
  Tag,
  Trash2,
  X,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { LabelBadge } from "@/components/bugs/label-badge"
import {
  useCreateLabel,
  useDeleteLabel,
  useLabels,
  useUpdateLabel,
} from "@/hooks/use-bugs"
import { LABEL_COLORS, LABEL_COLOR_MAP } from "@/lib/constants"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function LabelsView() {
  const { data: labels = [], isLoading } = useLabels()
  const createMut = useCreateLabel()
  const deleteMut = useDeleteLabel()

  const [createOpen, setCreateOpen] = React.useState(false)
  const [newName, setNewName] = React.useState("")
  const [newColor, setNewColor] = React.useState<string>("neutral")
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

  const handleCreate = () => {
    if (!newName.trim()) return
    createMut.mutate(
      { name: newName.trim(), color: newColor },
      {
        onSuccess: () => {
          setCreateOpen(false)
          setNewName("")
          setNewColor("neutral")
        },
      },
    )
  }

  const deletingLabel = labels.find((l) => l.id === deleteId)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Labels</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {labels.length} label{labels.length === 1 ? "" : "s"} · used to categorize bug reports.
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New label
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : labels.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Tag className="h-10 w-10 mx-auto opacity-40 mb-3" />
            <p className="text-sm font-medium">No labels yet</p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              Create labels like <code className="font-mono">ui</code>,{" "}
              <code className="font-mono">api</code>, or{" "}
              <code className="font-mono">regression</code> to organize bugs.
            </p>
            <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Create first label
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {labels.map((label) => (
            <LabelCard
              key={label.id}
              label={label}
              onDelete={() => setDeleteId(label.id)}
            />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New label</DialogTitle>
            <DialogDescription>
              Give your label a name and a color. Names must be unique.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Name
              </label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. regression"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newName.trim()) handleCreate()
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {LABEL_COLORS.map((c) => {
                  const palette = LABEL_COLOR_MAP[c]
                  const active = newColor === c
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className={cn(
                        "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all",
                        palette.dot,
                        active
                          ? "border-foreground scale-110"
                          : "border-transparent opacity-70 hover:opacity-100",
                      )}
                      title={c}
                    >
                      {active && <Check className="h-3.5 w-3.5 text-white" />}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="p-3 rounded-lg border bg-muted/30">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Preview</p>
              <LabelBadge label={{ name: newName || "label-name", color: newColor }} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || createMut.isPending}>
              {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete label?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingLabel && (
                <>
                  The label{" "}
                  <Badge variant="outline" className="mx-1">
                    {deletingLabel.name}
                  </Badge>
                  will be removed from all bug reports. This cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) deleteMut.mutate(deleteId, { onSuccess: () => setDeleteId(null) })
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function LabelCard({
  label,
  onDelete,
}: {
  label: { id: string; name: string; color: string }
  onDelete: () => void
}) {
  const [editing, setEditing] = React.useState(false)
  const [name, setName] = React.useState(label.name)
  const [color, setColor] = React.useState(label.color)
  const updateMut = useUpdateLabel(label.id)

  const handleSave = () => {
    if (!name.trim() || (name === label.name && color === label.color)) {
      setEditing(false)
      setName(label.name)
      setColor(label.color)
      return
    }
    updateMut.mutate(
      { name: name.trim(), color },
      { onSuccess: () => setEditing(false) },
    )
  }

  const handleCancel = () => {
    setEditing(false)
    setName(label.name)
    setColor(label.color)
  }

  if (editing) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Color</label>
            <div className="flex flex-wrap gap-1.5">
              {LABEL_COLORS.map((c) => {
                const palette = LABEL_COLOR_MAP[c]
                const active = color === c
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                      palette.dot,
                      active ? "border-foreground scale-110" : "border-transparent opacity-70",
                    )}
                  >
                    {active && <Check className="h-3 w-3 text-white" />}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={handleCancel}>
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
            <Button size="sm" className="h-7 gap-1" onClick={handleSave} disabled={updateMut.isPending}>
              {updateMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="group">
      <CardContent className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className={cn("h-3 w-3 rounded-full shrink-0", LABEL_COLOR_MAP[label.color]?.dot ?? LABEL_COLOR_MAP.neutral.dot)} />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{label.name}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label.color}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
