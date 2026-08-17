"use client"

import * as React from "react"
import {
  AlertCircle,
  ArrowLeft,
  Bug as BugIcon,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCopy,
  Cpu,
  FileCode2,
  FileDown,
  FlaskConical,
  GitBranch,
  Globe,
  Hammer,
  Layers,
  ListChecks,
  Loader2,
  Monitor,
  Pencil,
  Printer,
  Share2,
  ShieldAlert,
  Smartphone,
  Terminal,
  Trash2,
  User,
  X,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/bugs/status-badge"
import { PriorityBadge } from "@/components/bugs/priority-badge"
import { StageBadge } from "@/components/bugs/stage-badge"
import { LabelBadge } from "@/components/bugs/label-badge"
import { RelatedBugsCard } from "@/components/bugs/related-bugs-card"
import { CommentsSection } from "@/components/bugs/comments-section"
import { useBug, useBugComments, useDeleteBug, useUpdateBug } from "@/hooks/use-bugs"
import { useBugStore } from "@/store/bug-store"
import {
  PRIORITY_CONFIG,
  STAGE_CONFIG,
  STATUS_CONFIG,
} from "@/lib/constants"
import type { BugPriority, BugStatus, EnvironmentStage } from "@/lib/types"
import { format } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { reconstructTemplate } from "@/lib/template-parser"
import { downloadBugAsMarkdown } from "@/lib/bug-export"

export function BugDetailView() {
  const bugId = useBugStore((s) => s.selectedBugId)
  const selectBug = useBugStore((s) => s.selectBug)
  const setView = useBugStore((s) => s.setView)
  const openEditForm = useBugStore((s) => s.openEditForm)
  const { data: bug, isLoading } = useBug(bugId)
  const { data: commentsData } = useBugComments(bugId)
  const updateMut = useUpdateBug(bugId ?? "")
  const deleteMut = useDeleteBug()

  const [quickEdit, setQuickEdit] = React.useState(false)

  const handleBack = () => {
    selectBug(null)
    setView("bugs")
  }

  const handleDelete = () => {
    if (!bugId) return
    deleteMut.mutate(bugId, {
      onSuccess: () => handleBack(),
    })
  }

  const handleCopyTemplate = () => {
    if (!bug) return
    const text = reconstructTemplate(bug)
    navigator.clipboard?.writeText(text)
    toast.success("Template copied to clipboard")
  }

  const handleShare = async () => {
    if (!bug) return
    const url = `${window.location.origin}/?bug=${bug.id}`
    try {
      if (navigator.share) {
        await navigator.share({
          title: bug.summary,
          text: `${bug.jiraId ? bug.jiraId + " — " : ""}${bug.summary}`,
          url,
        })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success("Bug link copied to clipboard")
      }
    } catch {
      // user cancelled share — no toast
    }
  }

  const handleExportMarkdown = () => {
    if (!bug) return
    const comments = (commentsData?.data ?? []).map((c) => ({
      author: c.author,
      body: c.body,
      createdAt: c.createdAt,
    }))
    downloadBugAsMarkdown(bug, comments)
    toast.success("Markdown downloaded")
  }

  const handleCopyJson = async () => {
    if (!bug) return
    const json = JSON.stringify(bug, null, 2)
    try {
      await navigator.clipboard.writeText(json)
      toast.success("Bug JSON copied to clipboard")
    } catch {
      toast.error("Failed to copy JSON")
    }
  }

  const handleCopyCurl = async () => {
    if (!bug) return
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
    const curl = `curl -X GET '${origin}/api/bugs/${bug.id}' \\
  -H 'Accept: application/json' | jq .`
    try {
      await navigator.clipboard.writeText(curl)
      toast.success("cURL command copied to clipboard")
    } catch {
      toast.error("Failed to copy cURL")
    }
  }

  if (!bugId) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <div className="text-center">
          <BugIcon className="h-10 w-10 mx-auto opacity-40 mb-3" />
          <p className="text-sm">Select a bug report to view details.</p>
        </div>
      </div>
    )
  }

  if (isLoading || !bug) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-2">
        <Button variant="ghost" size="sm" className="gap-1 shrink-0 no-print" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            {bug.jiraId && (
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {bug.jiraId}
              </span>
            )}
            <span className="text-xs text-muted-foreground font-mono">{bug.id}</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight break-words">
            {bug.summary}
          </h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <StatusBadge status={bug.status} />
            <PriorityBadge priority={bug.priority} />
            <StageBadge stage={bug.environmentStage} />
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 no-print">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <FileDown className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export bug report</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExportMarkdown}>
                <FileDown className="h-3.5 w-3.5 mr-2" />
                Download as Markdown (.md)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyJson}>
                <ClipboardCopy className="h-3.5 w-3.5 mr-2" />
                Copy as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyCurl}>
                <Terminal className="h-3.5 w-3.5 mr-2" />
                Copy as cURL
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyTemplate}>
                <ClipboardCopy className="h-3.5 w-3.5 mr-2" />
                Copy IB4G template
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.print()}>
                <Printer className="h-3.5 w-3.5 mr-2" />
                Print / Save as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openEditForm(bug.id)}>
            <Pencil className="h-4 w-4" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this bug report?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The bug report and all its details will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main content (9 cards) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Overview breadcrumb */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap items-center gap-1.5 text-sm">
                <Crumb label={bug.overviewLoginCondition} icon={<User className="h-3.5 w-3.5" />} />
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                <Crumb label={bug.overviewPlatform} icon={<Globe className="h-3.5 w-3.5" />} />
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                <Crumb label={bug.overviewModule} />
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                <Crumb label={bug.overviewTrigger} icon={<Hammer className="h-3.5 w-3.5" />} />
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                <Crumb label={bug.overviewIssue} icon={<AlertCircle className="h-3.5 w-3.5" />} highlight="bad" />
              </div>
            </CardContent>
          </Card>

          {/* Environment */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                Environment
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <EnvField label="Page" value={bug.envPage} icon={<Layers className="h-3.5 w-3.5" />} />
                <EnvField label="Platform" value={bug.envPlatform} icon={<Globe className="h-3.5 w-3.5" />} />
                <EnvField label="OS" value={bug.envOS} icon={<Cpu className="h-3.5 w-3.5" />} />
                <EnvField label="Browser" value={bug.envBrowser} icon={bug.envPlatform === "Mobile" ? <Smartphone className="h-3.5 w-3.5" /> : <Monitor className="h-3.5 w-3.5" />} />
              </div>
            </CardContent>
          </Card>

          {/* Preconditions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                Preconditions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {bug.preconditions.length > 0 ? (
                <ul className="space-y-1.5">
                  {bug.preconditions.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-stone-400 shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyText />
              )}
            </CardContent>
          </Card>

          {/* Steps to Reproduce */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-muted-foreground" />
                Steps to Reproduce
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {bug.stepsToReproduce.length > 0 ? (
                <ol className="space-y-2">
                  {bug.stepsToReproduce.map((s, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="flex items-center justify-center h-5 w-5 rounded-full bg-muted text-[11px] font-semibold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{s}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <EmptyText />
              )}
            </CardContent>
          </Card>

          {/* Actual Result (red) */}
          <Card className="border-rose-200 dark:border-rose-900/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-rose-700 dark:text-rose-400">
                <AlertCircle className="h-4 w-4" />
                Actual Result
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {bug.actualResult || <span className="text-muted-foreground italic">Not specified</span>}
              </p>
            </CardContent>
          </Card>

          {/* Expected Result (green) */}
          <Card className="border-emerald-200 dark:border-emerald-900/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Expected Result
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {bug.expectedResult || <span className="text-muted-foreground italic">Not specified</span>}
              </p>
            </CardContent>
          </Card>

          {/* Impact Analysis */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                Impact Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <ImpactSection
                title="User Impact"
                icon={<User className="h-3.5 w-3.5" />}
                content={bug.userImpact}
                accent="violet"
              />
              <Separator />
              <ImpactSection
                title="Business Impact"
                icon={<TrendingIcon />}
                content={bug.businessImpact}
                accent="amber"
              />
              <Separator />
              <ImpactSection
                title="QA Impact"
                icon={<FlaskConical className="h-3.5 w-3.5" />}
                content={bug.qaImpact}
                accent="cyan"
              />
            </CardContent>
          </Card>

          {/* Technical Notes (code block) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Terminal className="h-4 w-4 text-muted-foreground" />
                Technical Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {bug.technicalNotes ? (
                <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap bg-muted/60 dark:bg-muted/30 border rounded-lg p-3 overflow-x-auto scrollbar-thin">
                  {bug.technicalNotes}
                </pre>
              ) : (
                <EmptyText />
              )}
            </CardContent>
          </Card>

          {/* Discussion / comments */}
          <CommentsSection bugId={bug.id} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4 no-print">
          {/* Properties (Quick Edit) */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Properties</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => setQuickEdit((v) => !v)}
                >
                  {quickEdit ? (
                    <>
                      <X className="h-3.5 w-3.5" />
                      Done
                    </>
                  ) : (
                    <>
                      <Pencil className="h-3.5 w-3.5" />
                      Quick Edit
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <PropRow label="Status">
                {quickEdit ? (
                  <Select
                    value={bug.status}
                    onValueChange={(v) => updateMut.mutate({ status: v as BugStatus })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(STATUS_CONFIG).map((s) => (
                        <SelectItem key={s} value={s} className="text-xs capitalize">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <StatusBadge status={bug.status} />
                )}
              </PropRow>
              <PropRow label="Priority">
                {quickEdit ? (
                  <Select
                    value={bug.priority}
                    onValueChange={(v) => updateMut.mutate({ priority: v as BugPriority })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(PRIORITY_CONFIG).map((p) => (
                        <SelectItem key={p} value={p} className="text-xs capitalize">
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <PriorityBadge priority={bug.priority} />
                )}
              </PropRow>
              <PropRow label="Stage">
                {quickEdit ? (
                  <Select
                    value={bug.environmentStage}
                    onValueChange={(v) => updateMut.mutate({ environmentStage: v as EnvironmentStage })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(STAGE_CONFIG).map((s) => (
                        <SelectItem key={s} value={s} className="text-xs capitalize">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <StageBadge stage={bug.environmentStage} />
                )}
              </PropRow>
              <PropRow label="Assignee">
                <span className="text-sm">{bug.assignee || <span className="text-muted-foreground italic">Unassigned</span>}</span>
              </PropRow>
            </CardContent>
          </Card>

          {/* Labels */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                Labels
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {bug.labels.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {bug.labels.map((l) => (
                    <LabelBadge key={l.id} label={l} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No labels</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileCode2 className="h-4 w-4 text-muted-foreground" />
                Quick Info
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <InfoRow
                icon={<Calendar className="h-3.5 w-3.5" />}
                label="Created"
                value={format(new Date(bug.createdAt), "MMM d, yyyy 'at' HH:mm")}
              />
              <InfoRow
                icon={<Calendar className="h-3.5 w-3.5" />}
                label="Updated"
                value={format(new Date(bug.updatedAt), "MMM d, yyyy 'at' HH:mm")}
              />
              <InfoRow
                icon={<User className="h-3.5 w-3.5" />}
                label="Reporter"
                value={bug.reporter}
              />
              <InfoRow
                icon={<FileCode2 className="h-3.5 w-3.5" />}
                label="Bug ID"
                value={<span className="font-mono text-[11px]">{bug.id}</span>}
              />
            </CardContent>
          </Card>

          {/* Related bugs */}
          <RelatedBugsCard
            bugId={bug.id}
            bugSummary={bug.summary}
            bugLabels={bug.labels}
          />
        </div>
      </div>
    </div>
  )
}

function Crumb({
  label,
  icon,
  highlight,
}: {
  label: string | null
  icon?: React.ReactNode
  highlight?: "bad" | "good"
}) {
  if (!label) return <span className="text-muted-foreground italic text-sm">—</span>
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border",
        highlight === "bad" &&
          "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900",
        highlight === "good" &&
          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
        !highlight && "bg-muted text-foreground border-border",
      )}
    >
      {icon}
      {label}
    </span>
  )
}

function EnvField({
  label,
  value,
  icon,
}: {
  label: string
  value: string | null
  icon?: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="text-sm font-medium truncate">
        {value || <span className="text-muted-foreground italic">—</span>}
      </p>
    </div>
  )
}

function ImpactSection({
  title,
  icon,
  content,
  accent,
}: {
  title: string
  icon: React.ReactNode
  content: string | null
  accent: "violet" | "amber" | "cyan"
}) {
  const accentClasses = {
    violet: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    cyan: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300",
  }
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold", accentClasses[accent])}>
          {icon}
          {title}
        </span>
      </div>
      {content ? (
        <ul className="space-y-1 ml-1">
          {content.split("\n").filter(Boolean).map((line, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-2 h-1 w-1 rounded-full bg-muted-foreground shrink-0" />
              <span className="leading-relaxed">{line.replace(/^[-*]\s*/, "")}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground italic ml-1">Not specified</p>
      )}
    </div>
  )
}

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center">{children}</div>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="font-medium text-right truncate max-w-[60%]">{value}</span>
    </div>
  )
}

function EmptyText() {
  return <p className="text-sm text-muted-foreground italic">Not specified</p>
}

function TrendingIcon() {
  return <span className="text-[11px]">📈</span>
}
