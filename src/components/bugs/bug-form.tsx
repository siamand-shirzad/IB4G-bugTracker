"use client"

import * as React from "react"
import { Type, Link as LinkIcon, FileText, Sparkles, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { STAGE_CONFIG, PRIORITY_CONFIG, DEFAULT_TEMPLATE } from "@/lib/constants"
import { parseTemplate } from "@/lib/template-parser"
import type { Bug, BugInput, BugPriority, EnvironmentStage, Label as LabelType } from "@/lib/types"
import { cn } from "@/lib/utils"

interface BugFormProps {
  initialBug?: Bug | null
  labels: LabelType[]
  onSubmit: (input: BugInput) => void
  onCancel: () => void
  submitting?: boolean
}

export function BugForm({
  initialBug,
  labels,
  onSubmit,
  onCancel,
  submitting,
}: BugFormProps) {
  const [summary, setSummary] = React.useState(initialBug?.summary ?? "")
  const [jiraId, setJiraId] = React.useState(initialBug?.jiraId ?? "")
  const [stage, setStage] = React.useState<EnvironmentStage>(
    initialBug?.environmentStage ?? "dev",
  )
  const [priority, setPriority] = React.useState<BugPriority>(
    initialBug?.priority ?? "medium",
  )
  const [overview, setOverview] = React.useState("")
  const [selectedLabelIds, setSelectedLabelIds] = React.useState<string[]>(
    initialBug?.labels?.map((l) => l.id) ?? [],
  )
  const [parsedPreview, setParsedPreview] = React.useState<{
    summary: string
    jiraId: string | null
    fields: { label: string; value: string | null }[]
  } | null>(null)

  // Reconstruct overview from initialBug on first mount (edit mode)
  React.useEffect(() => {
    if (initialBug) {
      // We don't auto-fill overview on edit; user can paste again if needed
      return
    }
  }, [initialBug])

  // Live-parse overview as user types/pastes
  React.useEffect(() => {
    if (!overview.trim()) {
      setParsedPreview(null)
      return
    }
    const parsed = parseTemplate(overview)
    const fields = [
      { label: "Login Condition", value: parsed.overviewLoginCondition },
      { label: "Platform", value: parsed.overviewPlatform },
      { label: "Module", value: parsed.overviewModule },
      { label: "Trigger", value: parsed.overviewTrigger },
      { label: "Issue", value: parsed.overviewIssue },
      { label: "Env Page", value: parsed.envPage },
      { label: "Env OS", value: parsed.envOS },
      { label: "Env Browser", value: parsed.envBrowser },
      { label: "Preconditions", value: parsed.preconditions.length ? `${parsed.preconditions.length} item(s)` : null },
      { label: "Steps", value: parsed.stepsToReproduce.length ? `${parsed.stepsToReproduce.length} step(s)` : null },
      { label: "Actual Result", value: parsed.actualResult ? `${parsed.actualResult.slice(0, 50)}…` : null },
      { label: "Expected Result", value: parsed.expectedResult ? `${parsed.expectedResult.slice(0, 50)}…` : null },
      { label: "User Impact", value: parsed.userImpact ? "✓" : null },
      { label: "Business Impact", value: parsed.businessImpact ? "✓" : null },
      { label: "QA Impact", value: parsed.qaImpact ? "✓" : null },
      { label: "Technical Notes", value: parsed.technicalNotes ? "✓" : null },
    ].filter((f) => f.value)
    setParsedPreview({
      summary: parsed.summary,
      jiraId: parsed.jiraId,
      fields,
    })
    // Auto-fill summary + jiraId if empty
    if (parsed.summary && !summary) setSummary(parsed.summary)
    if (parsed.jiraId && !jiraId) setJiraId(parsed.jiraId)
  }, [overview])

  const toggleLabel = (id: string) => {
    setSelectedLabelIds((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!summary.trim()) return
    const input: BugInput = {
      summary: summary.trim(),
      jiraId: jiraId.trim() || null,
      environmentStage: stage,
      priority,
      reporter: initialBug?.reporter ?? "Anonymous",
      assignee: initialBug?.assignee ?? null,
      status: initialBug?.status ?? "open",
      labelIds: selectedLabelIds,
    }
    if (overview.trim()) {
      input.overview = overview
    }
    onSubmit(input)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* TITLE */}
      <div className="space-y-2">
        <Label htmlFor="bug-title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Title <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="bug-title"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="e.g. Cannot login with valid credentials"
            className="pl-9"
            required
            autoFocus
          />
        </div>
      </div>

      {/* JIRA TASK ID */}
      <div className="space-y-2">
        <Label htmlFor="bug-jira" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Jira Task ID
        </Label>
        <div className="relative">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="bug-jira"
            value={jiraId}
            onChange={(e) => setJiraId(e.target.value)}
            placeholder="e.g. IB4G-1234"
            className="pl-9 font-mono"
          />
        </div>
      </div>

      {/* ENVIRONMENT STAGE */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Environment Stage
        </Label>
        <ToggleGroup
          type="single"
          value={stage}
          onValueChange={(v) => v && setStage(v as EnvironmentStage)}
          className="grid grid-cols-3 gap-2"
        >
          {(Object.keys(STAGE_CONFIG) as EnvironmentStage[]).map((s) => {
            const cfg = STAGE_CONFIG[s]
            return (
              <ToggleGroupItem
                key={s}
                value={s}
                aria-label={cfg.label}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 border rounded-lg data-[state=on]:bg-accent data-[state=on]:border-foreground/20",
                )}
              >
                <span className="text-base leading-none">{cfg.icon}</span>
                <span className="text-xs font-medium">{cfg.label}</span>
              </ToggleGroupItem>
            )
          })}
        </ToggleGroup>
      </div>

      {/* PRIORITY */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Priority
        </Label>
        <ToggleGroup
          type="single"
          value={priority}
          onValueChange={(v) => v && setPriority(v as BugPriority)}
          className="grid grid-cols-4 gap-2"
        >
          {(Object.keys(PRIORITY_CONFIG) as BugPriority[]).map((p) => {
            const cfg = PRIORITY_CONFIG[p]
            const Icon = cfg.icon
            return (
              <ToggleGroupItem
                key={p}
                value={p}
                aria-label={cfg.label}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2 border rounded-lg data-[state=on]:bg-accent data-[state=on]:border-foreground/20",
                  cfg.badge.split(" ").filter((c) => !c.startsWith("border")).join(" "),
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                <span className="text-xs font-medium">{cfg.label}</span>
                <Icon className="h-3 w-3" />
              </ToggleGroupItem>
            )
          })}
        </ToggleGroup>
      </div>

      {/* DESCRIPTIVE OVERVIEW (template) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="bug-overview" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Descriptive Overview
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
                <Sparkles className="h-3.5 w-3.5" />
                Template
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-3 border-b">
                <p className="text-xs font-medium">IB4G Jira Template</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Paste this format and fields auto-parse.
                </p>
              </div>
              <ScrollArea className="h-64">
                <pre className="p-3 text-[11px] leading-relaxed font-mono whitespace-pre-wrap text-muted-foreground">
                  {DEFAULT_TEMPLATE}
                </pre>
              </ScrollArea>
              <div className="p-2 border-t flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="h-7 text-xs flex-1"
                  onClick={() => setOverview(DEFAULT_TEMPLATE)}
                >
                  Use template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => navigator.clipboard?.writeText(DEFAULT_TEMPLATE)}
                >
                  Copy
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="relative">
          <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Textarea
            id="bug-overview"
            value={overview}
            onChange={(e) => setOverview(e.target.value)}
            placeholder="Paste your IB4G Jira template here — sections like ## Overview, ## Steps to Reproduce, etc. will be auto-parsed."
            className="pl-9 min-h-[160px] font-mono text-xs leading-relaxed resize-y scrollbar-thin"
          />
        </div>
        {parsedPreview && (
          <div className="rounded-lg border bg-muted/40 p-3 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Auto-parsed {parsedPreview.fields.length} field(s)
                {parsedPreview.jiraId && (
                  <span className="ml-2 text-muted-foreground">
                    · Jira ID: <span className="font-mono">{parsedPreview.jiraId}</span>
                  </span>
                )}
              </p>
            </div>
            {parsedPreview.fields.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {parsedPreview.fields.map((f) => (
                  <div key={f.label} className="flex items-center gap-1.5 text-xs">
                    <span className="text-muted-foreground">{f.label}:</span>
                    <span className="font-medium truncate">{f.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No structured sections detected yet. Make sure you use{" "}
                <code className="font-mono">## Section Name</code> headers.
              </p>
            )}
          </div>
        )}
      </div>

      {/* LABELS */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Labels
        </Label>
        {labels.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            No labels yet. Create some from the Labels page.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {labels.map((label) => {
              const active = selectedLabelIds.includes(label.id)
              return (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label.id)}
                  className={cn(
                    "rounded-full transition-all",
                    active ? "ring-2 ring-offset-1 ring-offset-background ring-foreground/40 scale-105" : "opacity-70 hover:opacity-100",
                  )}
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full px-2.5 py-0.5 font-medium border cursor-pointer",
                      LABEL_BG(label.color),
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", LABEL_DOT(label.color))} />
                    {label.name}
                  </Badge>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ACTIONS */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting || !summary.trim()}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {initialBug ? "Save changes" : "Create bug"}
        </Button>
      </div>
    </form>
  )
}

// local helpers to avoid importing label-badge (which has onClick semantics)
function LABEL_BG(color: string) {
  const map: Record<string, string> = {
    neutral: "bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800/40 dark:text-stone-300 dark:border-stone-700",
    rose: "bg-rose-50 text-rose-600 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-300/70 dark:border-rose-900/40",
    orange: "bg-orange-50 text-orange-600 border-orange-200/50 dark:bg-orange-950/20 dark:text-orange-300/70 dark:border-orange-900/40",
    amber: "bg-amber-50 text-amber-600 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-300/70 dark:border-amber-900/40",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-300/70 dark:border-emerald-900/40",
    teal: "bg-teal-50 text-teal-600 border-teal-200/50 dark:bg-teal-950/20 dark:text-teal-300/70 dark:border-teal-900/40",
    cyan: "bg-cyan-50 text-cyan-600 border-cyan-200/50 dark:bg-cyan-950/20 dark:text-cyan-300/70 dark:border-cyan-900/40",
    violet: "bg-violet-50 text-violet-600 border-violet-200/50 dark:bg-violet-950/20 dark:text-violet-300/70 dark:border-violet-900/40",
    fuchsia: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200/50 dark:bg-fuchsia-950/20 dark:text-fuchsia-300/70 dark:border-fuchsia-900/40",
    slate: "bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800/40 dark:text-stone-300 dark:border-stone-700",
  }
  return map[color] ?? map.neutral
}
function LABEL_DOT(color: string) {
  const map: Record<string, string> = {
    neutral: "bg-stone-400",
    rose: "bg-rose-300",
    orange: "bg-orange-300",
    amber: "bg-amber-300",
    emerald: "bg-emerald-300",
    teal: "bg-teal-300",
    cyan: "bg-cyan-300",
    violet: "bg-violet-300",
    fuchsia: "bg-fuchsia-300",
    slate: "bg-stone-400",
  }
  return map[color] ?? map.neutral
}
