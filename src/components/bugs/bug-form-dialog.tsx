"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BugForm } from "@/components/bugs/bug-form"
import { useBug, useCreateBug, useUpdateBug, useLabels } from "@/hooks/use-bugs"
import { useBugStore } from "@/store/bug-store"
import { bugKeys } from "@/hooks/use-bugs"
import type { BugInput } from "@/lib/types"

export function BugFormDialog() {
  const { formOpen, formBugId, closeForm } = useBugStore()
  const { data: editingBug, isLoading: bugLoading } = useBug(formBugId)
  const { data: labels = [] } = useLabels()
  const createMut = useCreateBug()
  const updateMut = useUpdateBug(formBugId ?? "")
  const qc = useQueryClient()

  const submitting = createMut.isPending || updateMut.isPending

  const handleSubmit = (input: BugInput) => {
    if (formBugId) {
      updateMut.mutate(input, {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: bugKeys.detail(formBugId) })
          closeForm()
        },
      })
    } else {
      createMut.mutate(input, {
        onSuccess: () => closeForm(),
      })
    }
  }

  return (
    <Dialog open={formOpen} onOpenChange={(o) => !o && closeForm()}>
      <DialogContent className="max-w-2xl max-h-[90vh] gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>
            {formBugId ? "Edit bug report" : "New bug report"}
          </DialogTitle>
          <DialogDescription>
            {formBugId
              ? "Update the bug details. Paste a fresh template to re-parse fields."
              : "Fill in the basics, then paste an IB4G Jira template to auto-extract all structured fields."}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-8rem)] scrollbar-thin">
          <div className="px-6 py-6">
            {formBugId && bugLoading ? (
              <div className="space-y-4">
                <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
                <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
                <div className="h-20 w-full rounded-md bg-muted animate-pulse" />
              </div>
            ) : (
              <BugForm
                initialBug={editingBug ?? null}
                labels={labels}
                onSubmit={handleSubmit}
                onCancel={closeForm}
                submitting={submitting}
              />
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
