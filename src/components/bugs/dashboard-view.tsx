"use client"

import * as React from "react"
import Link from "next/link"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Activity,
  AlertOctagon,
  ArrowRight,
  Bug as BugIcon,
  CheckCircle2,
  CircleDot,
  Clock,
  Flame,
  Globe,
  Grid3x3,
  Plus,
  Timer,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/bugs/empty-state"
import { StatusBadge } from "@/components/bugs/status-badge"
import { PriorityBadge } from "@/components/bugs/priority-badge"
import { StageBadge } from "@/components/bugs/stage-badge"
import { LabelBadge } from "@/components/bugs/label-badge"
import { useBugStats, useBugTrend, useBugBurndown } from "@/hooks/use-bugs"
import { useBugStore } from "@/store/bug-store"
import { PRIORITY_CONFIG, STATUS_CONFIG, STAGE_CONFIG } from "@/lib/constants"
import type { BugPriority, BugStatus, EnvironmentStage } from "@/lib/types"
import { format, formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

export function DashboardView() {
  const { data: stats, isLoading } = useBugStats()
  const [trendDays, setTrendDays] = React.useState(14)
  const { data: trend, isLoading: trendLoading } = useBugTrend(trendDays)
  const setView = useBugStore((s) => s.setView)
  const selectBug = useBugStore((s) => s.selectBug)
  const openCreateForm = useBugStore((s) => s.openCreateForm)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time overview of bug reports across all environments.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setView("bugs")} className="gap-2">
          <BugIcon className="h-4 w-4" />
          View all bugs
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Reports"
          value={stats?.total}
          icon={BugIcon}
          accent="text-foreground"
          accentBar="bg-foreground"
          loading={isLoading}
          hint="All-time tracked"
        />
        <StatCard
          label="Open"
          value={stats?.open}
          icon={CircleDot}
          accent="text-amber-600 dark:text-amber-400"
          accentBar="bg-stone-400"
          loading={isLoading}
          hint="Awaiting resolution"
        />
        <StatCard
          label="Closed"
          value={stats?.closed}
          icon={CheckCircle2}
          accent="text-emerald-600 dark:text-emerald-400"
          accentBar="bg-stone-300"
          loading={isLoading}
          hint="Resolved & verified"
        />
        <StatCard
          label="Critical"
          value={stats?.critical}
          icon={AlertOctagon}
          accent="text-rose-600 dark:text-rose-400"
          accentBar="bg-red-400"
          loading={isLoading}
          hint="Needs immediate attention"
        />
      </div>

      {/* Trend chart (opened vs closed) */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Activity Trend
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Bugs opened vs closed — last {trendDays} days
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {trend && (
                <div className="flex items-center gap-3 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm bg-red-400/60" />
                    <span className="text-muted-foreground">Opened</span>
                    <span className="font-semibold tabular-nums">{trend.totalOpened}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm bg-stone-400/60" />
                    <span className="text-muted-foreground">Closed</span>
                    <span className="font-semibold tabular-nums">{trend.totalClosed}</span>
                  </div>
                </div>
              )}
              {/* Date range selector */}
              <div className="inline-flex rounded-md border overflow-hidden">
                {([7, 14, 30, 90] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setTrendDays(d)}
                    className={cn(
                      "px-2.5 py-1 text-[11px] font-medium transition-colors",
                      d !== 7 && "border-l",
                      trendDays === d
                        ? "bg-primary text-primary-foreground"
                        : "bg-background hover:bg-accent text-muted-foreground",
                    )}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {trendLoading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={trend?.points ?? []}
                margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
              >
                <defs>
                  <linearGradient id="openedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="closedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                  opacity={0.5}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d: string) => format(new Date(d), "MMM d")}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <Tooltip
                  cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--popover)",
                    color: "var(--popover-foreground)",
                    fontSize: 12,
                  }}
                  labelFormatter={(d: string) => format(new Date(d), "EEEE, MMM d")}
                />
                <Area
                  type="monotone"
                  dataKey="opened"
                  name="Opened"
                  stroke="var(--chart-3)"
                  strokeWidth={2}
                  fill="url(#openedGrad)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
                <Area
                  type="monotone"
                  dataKey="closed"
                  name="Closed"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  fill="url(#closedGrad)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Burndown chart (open bugs over time) */}
      <BurndownCard days={trendDays} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Status bar chart */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              By Status
            </CardTitle>
            <CardDescription className="text-xs">
              Open vs closed distribution
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {isLoading ? (
              <Skeleton className="h-[180px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={stats?.byStatus ?? []} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--popover)",
                      color: "var(--popover-foreground)",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {(stats?.byStatus ?? []).map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Priority donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              By Priority
            </CardTitle>
            <CardDescription className="text-xs">
              Severity breakdown
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {isLoading ? (
              <Skeleton className="h-[180px] w-full" />
            ) : (
              <div className="relative">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart data={stats?.byPriority ?? []} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Pie dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={2} strokeWidth={0}>
                      {(stats?.byPriority ?? []).map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "var(--popover)",
                        color: "var(--popover-foreground)",
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-semibold tabular-nums">
                    {stats?.total ?? 0}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    total
                  </span>
                </div>
              </div>
            )}
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 justify-center">
              {(stats?.byPriority ?? []).map((p) => (
                <div key={p.name} className="flex items-center gap-1.5 text-[11px]">
                  <span
                    className="h-2 w-2 rounded-sm"
                    style={{ background: p.fill }}
                  />
                  <span className="capitalize text-muted-foreground">{p.name}</span>
                  <span className="font-medium tabular-nums">{p.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stage donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BugIcon className="h-4 w-4 text-muted-foreground" />
              By Environment
            </CardTitle>
            <CardDescription className="text-xs">
              Dev / staging / production
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {isLoading ? (
              <Skeleton className="h-[180px] w-full" />
            ) : (
              <div className="relative">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart data={stats?.byStage ?? []} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Pie dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={2} strokeWidth={0}>
                      {(stats?.byStage ?? []).map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "var(--popover)",
                        color: "var(--popover-foreground)",
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-semibold tabular-nums">
                    {stats?.byStage.reduce((a, b) => a + b.value, 0) ?? 0}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    reports
                  </span>
                </div>
              </div>
            )}
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 justify-center">
              {(stats?.byStage ?? []).map((s) => (
                <div key={s.name} className="flex items-center gap-1.5 text-[11px]">
                  <span
                    className="h-2 w-2 rounded-sm"
                    style={{ background: s.fill }}
                  />
                  <span className="capitalize text-muted-foreground">{s.name}</span>
                  <span className="font-medium tabular-nums">{s.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent bugs */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Recent Activity
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Last 5 updated bug reports
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => setView("bugs")}>
              See all
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (stats?.recent ?? []).length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon={BugIcon}
                title="No bug reports yet"
                description="Create your first bug report to see activity here."
                action={{
                  label: "New bug",
                  icon: Plus,
                  onClick: () => openCreateForm(),
                }}
              />
            </div>
          ) : (
            <div className="space-y-1">
              {(stats?.recent ?? []).map((bug) => (
                <button
                  key={bug.id}
                  onClick={() => {
                    setView("bugs")
                    selectBug(bug.id)
                  }}
                  className="w-full text-left group flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors border border-transparent hover:border-border"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {bug.jiraId && (
                        <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                          {bug.jiraId}
                        </span>
                      )}
                      <p className="text-sm font-medium truncate group-hover:text-foreground">
                        {bug.summary}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <StatusBadge status={bug.status} />
                      <PriorityBadge priority={bug.priority} />
                      <StageBadge stage={bug.environmentStage} />
                      {bug.labels.slice(0, 2).map((l) => (
                        <LabelBadge key={l.id} label={l} />
                      ))}
                      {bug.labels.length > 2 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{bug.labels.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0 hidden sm:block">
                    {formatDistanceToNow(new Date(bug.updatedAt), { addSuffix: true })}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform breakdown */}
      <PlatformBreakdownCard stats={stats} loading={isLoading} />

      {/* Assignee workload + Resolution time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AssigneeWorkloadCard stats={stats} loading={isLoading} />
        <ResolutionTimeCard stats={stats} loading={isLoading} />
      </div>

      {/* Priority × Stage heatmap */}
      <PriorityHeatmapCard stats={stats} loading={isLoading} />
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  loading,
  hint,
  accentBar,
}: {
  label: string
  value: number | undefined
  icon: React.ComponentType<{ className?: string }>
  accent: string
  loading?: boolean
  hint?: string
  accentBar?: string
}) {
  return (
    <Card className="overflow-hidden relative group hover:shadow-md transition-shadow">
      {/* Top accent bar */}
      {accentBar && (
        <div className={cn("absolute top-0 left-0 right-0 h-0.5", accentBar)} />
      )}
      <CardHeader className="pb-1.5 pt-4">
        <div className="flex items-center justify-between">
          <CardDescription className="text-[11px] font-semibold uppercase tracking-wider">
            {label}
          </CardDescription>
          <div className={cn("h-7 w-7 rounded-md flex items-center justify-center bg-muted/60")}>
            <Icon className={cn("h-3.5 w-3.5", accent)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className={cn("text-3xl font-semibold tabular-nums", accent)}>
            {value ?? 0}
          </div>
        )}
        {hint && (
          <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>
        )}
      </CardContent>
    </Card>
  )
}

interface PlatformBreakdownCardProps {
  stats: ReturnType<typeof useBugStats>["data"]
  loading: boolean
}

const PLATFORM_COLORS: Record<string, string> = {
  Web: "var(--chart-1)",
  API: "var(--chart-3)",
  Mobile: "var(--chart-2)",
  Desktop: "var(--chart-4)",
}

const PLATFORM_ICONS: Record<string, string> = {
  Web: "🌐",
  API: "🔌",
  Mobile: "📱",
  Desktop: "🖥️",
}

function PlatformBreakdownCard({ stats, loading }: PlatformBreakdownCardProps) {
  const platforms = stats?.byPlatform ?? []
  const total = platforms.reduce((a, p) => a + p.value, 0) || 1

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          Platform Breakdown
        </CardTitle>
        <CardDescription className="text-xs mt-0.5">
          Bug reports grouped by environment platform
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : platforms.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <Globe className="h-7 w-7 mx-auto opacity-40 mb-2" />
            No platform data yet
          </div>
        ) : (
          <div className="space-y-3">
            {/* Horizontal stacked bar */}
            <div className="flex h-3 rounded-full overflow-hidden border bg-muted/30">
              {platforms.map((p) => {
                const width = (p.value / total) * 100
                const color = PLATFORM_COLORS[p.name] ?? "var(--chart-5)"
                return (
                  <div
                    key={p.name}
                    style={{ width: `${width}%`, backgroundColor: color }}
                    className="h-full transition-all hover:opacity-80"
                    title={`${p.name}: ${p.value} (${width.toFixed(1)}%)`}
                  />
                )
              })}
            </div>
            {/* Legend with bars */}
            <div className="space-y-2">
              {platforms
                .sort((a, b) => b.value - a.value)
                .map((p) => {
                  const pct = ((p.value / total) * 100).toFixed(0)
                  const color = PLATFORM_COLORS[p.name] ?? "var(--chart-5)"
                  const icon = PLATFORM_ICONS[p.name] ?? "📦"
                  return (
                    <div
                      key={p.name}
                      className="flex items-center gap-3 group"
                    >
                      <span className="text-base leading-none w-5 text-center">
                        {icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">{p.name}</span>
                          <span className="text-[11px] text-muted-foreground tabular-nums">
                            {p.value} · {pct}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all group-hover:opacity-80"
                            style={{ width: `${pct}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface AssigneeWorkloadCardProps {
  stats: ReturnType<typeof useBugStats>["data"]
  loading: boolean
}

const ASSIGNEE_COLORS = [
  "bg-stone-400",
  "bg-stone-500",
  "bg-stone-600",
  "bg-stone-300",
  "bg-stone-400",
  "bg-stone-500",
  "bg-stone-600",
  "bg-stone-300",
]

function AssigneeWorkloadCard({ stats, loading }: AssigneeWorkloadCardProps) {
  const assignees = stats?.byAssignee ?? []
  const maxTotal = Math.max(1, ...assignees.map((a) => a.total))

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          Assignee Workload
        </CardTitle>
        <CardDescription className="text-xs mt-0.5">
          Open vs closed bugs per assignee
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : assignees.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <Users className="h-7 w-7 mx-auto opacity-40 mb-2" />
            No assignees yet
          </div>
        ) : (
          <div className="space-y-2.5">
            {assignees.slice(0, 6).map((a, idx) => {
              const name = a.name ?? "Unassigned"
              const openPct = (a.open / maxTotal) * 100
              const closedPct = (a.closed / maxTotal) * 100
              const color = ASSIGNEE_COLORS[idx % ASSIGNEE_COLORS.length]
              const initials = name === "Unassigned"
                ? "?"
                : name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase()
              return (
                <div key={name} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn("h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0", color)}>
                        {initials}
                      </span>
                      <span className="text-xs font-medium truncate">{name}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground tabular-nums shrink-0 ml-2">
                      {a.total} total · {a.open} open · {a.closed} closed
                    </span>
                  </div>
                  {/* Stacked bar: open (amber) + closed (emerald) */}
                  <div className="flex h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-stone-400 transition-all"
                      style={{ width: `${openPct}%` }}
                      title={`${a.open} open`}
                    />
                    <div
                      className="h-full bg-stone-300 transition-all"
                      style={{ width: `${closedPct}%` }}
                      title={`${a.closed} closed`}
                    />
                  </div>
                </div>
              )
            })}
            {assignees.length > 6 && (
              <p className="text-[10px] text-muted-foreground text-center pt-1">
                + {assignees.length - 6} more assignees
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ResolutionTimeCardProps {
  stats: ReturnType<typeof useBugStats>["data"]
  loading: boolean
}

function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours < 24) return `${hours.toFixed(1)}h`
  const days = hours / 24
  if (days < 7) return `${days.toFixed(1)}d`
  return `${Math.round(days)}d`
}

function ResolutionTimeCard({ stats, loading }: ResolutionTimeCardProps) {
  const rt = stats?.resolutionTimeHours
  const hasData = rt && rt.count > 0 && rt.avg !== null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Timer className="h-4 w-4 text-muted-foreground" />
          Resolution Time
        </CardTitle>
        <CardDescription className="text-xs mt-0.5">
          Time from creation to close (based on {rt?.count ?? 0} closed bugs)
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : !hasData ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <Timer className="h-7 w-7 mx-auto opacity-40 mb-2" />
            No closed bugs with resolution events yet
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <ResolutionStat
              label="Average"
              value={formatHours(rt!.avg!)}
              accent="text-foreground"
              bg="bg-amber-50 dark:bg-amber-950/30"
              border="border-amber-200 dark:border-amber-900"
            />
            <ResolutionStat
              label="Fastest"
              value={formatHours(rt!.min!)}
              accent="text-emerald-600 dark:text-emerald-400"
              bg="bg-emerald-50 dark:bg-emerald-950/30"
              border="border-emerald-200 dark:border-emerald-900"
            />
            <ResolutionStat
              label="Slowest"
              value={formatHours(rt!.max!)}
              accent="text-rose-600 dark:text-rose-400"
              bg="bg-rose-50 dark:bg-rose-950/30"
              border="border-rose-200 dark:border-rose-900"
            />
          </div>
        )}
        {hasData && (
          <p className="text-[10px] text-muted-foreground text-center mt-3">
            Computed from the first &ldquo;status changed to closed&rdquo; event per bug
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function ResolutionStat({
  label,
  value,
  accent,
  bg,
  border,
}: {
  label: string
  value: string
  accent: string
  bg: string
  border: string
}) {
  return (
    <div className={cn("rounded-lg border p-3 text-center", bg, border)}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </p>
      <p className={cn("text-xl font-bold tabular-nums", accent)}>{value}</p>
    </div>
  )
}

interface PriorityHeatmapCardProps {
  stats: ReturnType<typeof useBugStats>["data"]
  loading: boolean
}

const HEATMAP_PRIORITIES = ["critical", "high", "medium", "low"] as const
const HEATMAP_STAGES = ["dev", "staging", "production"] as const

const PRIORITY_HEAT: Record<string, string> = {
  critical: "bg-red-400",
  high: "bg-orange-300",
  medium: "bg-stone-300",
  low: "bg-stone-200",
}

function PriorityHeatmapCard({ stats, loading }: PriorityHeatmapCardProps) {
  const matrix = stats?.priorityStageMatrix ?? []
  const maxCount = Math.max(1, ...matrix.map((m) => m.count))
  const setView = useBugStore((s) => s.setView)
  const setPriority = useBugStore((s) => s.setPriority)
  const setStage = useBugStore((s) => s.setStage)
  const setPage = useBugStore((s) => s.setPage)

  const getCell = (priority: string, stage: string) => {
    const cell = matrix.find((m) => m.priority === priority && m.stage === stage)
    return cell?.count ?? 0
  }

  const goToFiltered = (priority: string, stage: string) => {
    setPriority(priority as BugPriority)
    setStage(stage as EnvironmentStage)
    setPage(1)
    setView("bugs")
  }

  const goToRow = (priority: string) => {
    setPriority(priority as BugPriority)
    setStage("all")
    setPage(1)
    setView("bugs")
  }

  const goToCol = (stage: string) => {
    setPriority("all")
    setStage(stage as EnvironmentStage)
    setPage(1)
    setView("bugs")
  }

  const rowTotal = (priority: string) =>
    HEATMAP_STAGES.reduce((sum, s) => sum + getCell(priority, s), 0)
  const colTotal = (stage: string) =>
    HEATMAP_PRIORITIES.reduce((sum, p) => sum + getCell(p, stage), 0)
  const grandTotal = HEATMAP_PRIORITIES.reduce((sum, p) => sum + rowTotal(p), 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Grid3x3 className="h-4 w-4 text-muted-foreground" />
          Priority × Stage Heatmap
        </CardTitle>
        <CardDescription className="text-xs mt-0.5">
          Bug count by priority and environment stage ({grandTotal} total)
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : grandTotal === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <Grid3x3 className="h-7 w-7 mx-auto opacity-40 mb-2" />
            No bugs to display
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground p-2 sticky left-0 bg-background">
                    Priority
                  </th>
                  {HEATMAP_STAGES.map((s) => (
                    <th key={s} className="p-2 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <button
                        onClick={() => goToCol(s)}
                        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                        title={`Filter by ${STAGE_CONFIG[s].label} stage`}
                      >
                        <span>{STAGE_CONFIG[s].icon}</span>
                        {STAGE_CONFIG[s].label}
                      </button>
                    </th>
                  ))}
                  <th className="p-2 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-l">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {HEATMAP_PRIORITIES.map((p) => {
                  const rt = rowTotal(p)
                  return (
                    <tr key={p} className="group">
                      <td className="p-2 text-xs font-medium sticky left-0 bg-background">
                        <button
                          onClick={() => goToRow(p)}
                          className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
                          title={`Filter by ${p} priority`}
                        >
                          <span className={cn("h-2 w-2 rounded-full", PRIORITY_CONFIG[p].dot)} />
                          <span className="capitalize">{p}</span>
                        </button>
                      </td>
                      {HEATMAP_STAGES.map((s) => {
                        const count = getCell(p, s)
                        const intensity = count / maxCount
                        const heatColor = PRIORITY_HEAT[p]
                        return (
                          <td key={s} className="p-1.5 text-center">
                            <button
                              onClick={() => count > 0 && goToFiltered(p, s)}
                              disabled={count === 0}
                              className={cn(
                                "h-10 w-full rounded-md flex items-center justify-center font-semibold tabular-nums transition-all",
                                count === 0
                                  ? "bg-muted/30 text-muted-foreground/40 cursor-default"
                                  : "text-white hover:scale-105 hover:shadow-md cursor-pointer",
                              )}
                              style={
                                count > 0
                                  ? {
                                      backgroundColor: heatColor.replace("500", "500"),
                                      opacity: 0.35 + intensity * 0.65,
                                    }
                                  : undefined
                              }
                              title={count > 0 ? `View ${count} ${p} bug${count === 1 ? "" : "s"} in ${s}` : `No ${p} bugs in ${s}`}
                            >
                              {count > 0 ? count : "·"}
                            </button>
                          </td>
                        )
                      })}
                      <td className="p-2 text-center border-l bg-muted/20">
                        <button
                          onClick={() => goToRow(p)}
                          className="font-bold tabular-nums hover:text-primary transition-colors"
                          title={`View all ${p} bugs`}
                        >
                          {rt}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2">
                  <td className="p-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sticky left-0 bg-background">
                    Total
                  </td>
                  {HEATMAP_STAGES.map((s) => (
                    <td key={s} className="p-2 text-center bg-muted/20">
                      <button
                        onClick={() => goToCol(s)}
                        className="font-bold tabular-nums hover:text-primary transition-colors"
                        title={`View all ${s} bugs`}
                      >
                        {colTotal(s)}
                      </button>
                    </td>
                  ))}
                  <td className="p-2 text-center border-l bg-primary/10">
                    <button
                      onClick={() => {
                        setPriority("all")
                        setStage("all")
                        setPage(1)
                        setView("bugs")
                      }}
                      className="font-bold tabular-nums text-primary hover:underline transition-colors"
                      title="View all bugs"
                    >
                      {grandTotal}
                    </button>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface BurndownCardProps {
  days: number
}

function BurndownCard({ days }: BurndownCardProps) {
  const { data, isLoading } = useBugBurndown(days)
  const points = data?.points ?? []
  const currentOpen = data?.currentOpen ?? 0
  const peakOpen = data?.peakOpen ?? 0
  const totalClosed = data?.totalClosed ?? 0

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              Open Bugs Burndown
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Open bug count at end of each day — last {days} days
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 text-[11px] flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-stone-400" />
              <span className="text-muted-foreground">Now open</span>
              <span className="font-semibold tabular-nums">{currentOpen}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-red-400" />
              <span className="text-muted-foreground">Peak</span>
              <span className="font-semibold tabular-nums">{peakOpen}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-stone-300" />
              <span className="text-muted-foreground">Closed</span>
              <span className="font-semibold tabular-nums">{totalClosed}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {isLoading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : points.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <TrendingDown className="h-7 w-7 mx-auto opacity-40 mb-2" />
            No data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={points}
              margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
            >
              <defs>
                <linearGradient id="openBurndownGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-4)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--chart-4)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
                opacity={0.5}
              />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => format(new Date(d), "MMM d")}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <Tooltip
                cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--popover)",
                  color: "var(--popover-foreground)",
                  fontSize: 12,
                }}
                labelFormatter={(d: string) => format(new Date(d), "EEEE, MMM d")}
              />
              <Area
                type="monotone"
                dataKey="open"
                name="Open"
                stroke="var(--chart-4)"
                strokeWidth={2}
                fill="url(#openBurndownGrad)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
