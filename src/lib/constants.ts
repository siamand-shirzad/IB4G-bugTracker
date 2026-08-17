import {
  AlertTriangle,
  Bug as BugIcon,
  CheckCircle2,
  CircleDot,
  LayoutDashboard,
  ListChecks,
  Info,
  Settings,
  Tag,
  type LucideIcon,
} from "lucide-react"
import type {
  BugPriority,
  BugStatus,
  EnvironmentStage,
} from "@/lib/types"

// ---- App meta ----
export const APP_NAME = "IB4G BugTracker"
export const APP_VERSION = "1.0.0"
export const APP_FRAMEWORK = "Next.js 16 (App Router)"
export const APP_DATABASE = "SQLite"
export const APP_ORM = "Prisma 6"
export const APP_TEMPLATE = "IB4G Jira Bug Report Template"

// ---- Status config ----
export const STATUS_CONFIG: Record<
  BugStatus,
  { label: string; icon: LucideIcon; badge: string; dot: string }
> = {
  open: {
    label: "Open",
    icon: CircleDot,
    badge: "bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800/40 dark:text-stone-300 dark:border-stone-700",
    dot: "bg-stone-400",
  },
  closed: {
    label: "Closed",
    icon: CheckCircle2,
    badge: "bg-stone-100 text-stone-500 border-stone-200 dark:bg-stone-800/40 dark:text-stone-400 dark:border-stone-700",
    dot: "bg-stone-300",
  },
}

// ---- Priority config ----
export const PRIORITY_CONFIG: Record<
  BugPriority,
  {
    label: string
    icon: LucideIcon
    badge: string
    dot: string
    order: number
  }
> = {
  low: {
    label: "Low",
    icon: CircleDot,
    badge: "bg-stone-100 text-stone-500 border-stone-200 dark:bg-stone-800/40 dark:text-stone-400 dark:border-stone-700",
    dot: "bg-stone-300",
    order: 0,
  },
  medium: {
    label: "Medium",
    icon: CircleDot,
    badge: "bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800/40 dark:text-stone-300 dark:border-stone-700",
    dot: "bg-stone-400",
    order: 1,
  },
  high: {
    label: "High",
    icon: AlertTriangle,
    badge: "bg-orange-50 text-orange-600 border-orange-200/60 dark:bg-orange-950/30 dark:text-orange-300/80 dark:border-orange-900/50",
    dot: "bg-orange-400",
    order: 2,
  },
  critical: {
    label: "Critical",
    icon: AlertTriangle,
    badge: "bg-red-50 text-red-600 border-red-200/60 dark:bg-red-950/30 dark:text-red-300/80 dark:border-red-900/50",
    dot: "bg-red-400",
    order: 3,
  },
}

export const PRIORITY_ORDER: BugPriority[] = ["critical", "high", "medium", "low"]

// ---- Stage config ----
export const STAGE_CONFIG: Record<
  EnvironmentStage,
  { label: string; icon: string; badge: string; dot: string }
> = {
  dev: {
    label: "Dev",
    icon: "💻",
    badge: "bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800/40 dark:text-stone-300 dark:border-stone-700",
    dot: "bg-stone-400",
  },
  staging: {
    label: "Staging",
    icon: "🧪",
    badge: "bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800/40 dark:text-stone-300 dark:border-stone-700",
    dot: "bg-stone-400",
  },
  production: {
    label: "Production",
    icon: "🚀",
    badge: "bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800/40 dark:text-stone-300 dark:border-stone-700",
    dot: "bg-stone-400",
  },
}

// ---- Label color palette ----
export const LABEL_COLORS = [
  "neutral",
  "rose",
  "orange",
  "amber",
  "emerald",
  "teal",
  "cyan",
  "violet",
  "fuchsia",
  "slate",
] as const

export const LABEL_COLOR_MAP: Record<
  string,
  { badge: string; dot: string }
> = {
  neutral: {
    badge: "bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800/40 dark:text-stone-300 dark:border-stone-700",
    dot: "bg-stone-400",
  },
  rose: {
    badge: "bg-rose-50 text-rose-600 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-300/70 dark:border-rose-900/40",
    dot: "bg-rose-300",
  },
  orange: {
    badge: "bg-orange-50 text-orange-600 border-orange-200/50 dark:bg-orange-950/20 dark:text-orange-300/70 dark:border-orange-900/40",
    dot: "bg-orange-300",
  },
  amber: {
    badge: "bg-amber-50 text-amber-600 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-300/70 dark:border-amber-900/40",
    dot: "bg-amber-300",
  },
  emerald: {
    badge: "bg-emerald-50 text-emerald-600 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-300/70 dark:border-emerald-900/40",
    dot: "bg-emerald-300",
  },
  teal: {
    badge: "bg-teal-50 text-teal-600 border-teal-200/50 dark:bg-teal-950/20 dark:text-teal-300/70 dark:border-teal-900/40",
    dot: "bg-teal-300",
  },
  cyan: {
    badge: "bg-cyan-50 text-cyan-600 border-cyan-200/50 dark:bg-cyan-950/20 dark:text-cyan-300/70 dark:border-cyan-900/40",
    dot: "bg-cyan-300",
  },
  violet: {
    badge: "bg-violet-50 text-violet-600 border-violet-200/50 dark:bg-violet-950/20 dark:text-violet-300/70 dark:border-violet-900/40",
    dot: "bg-violet-300",
  },
  fuchsia: {
    badge: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200/50 dark:bg-fuchsia-950/20 dark:text-fuchsia-300/70 dark:border-fuchsia-900/40",
    dot: "bg-fuchsia-300",
  },
  slate: {
    badge: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700",
    dot: "bg-slate-400",
  },
}

// ---- Sidebar nav ----
export type SidebarView = "dashboard" | "bugs" | "labels" | "endpoints" | "settings"

export interface SidebarItem {
  id: SidebarView
  label: string
  icon: LucideIcon
  description: string
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Overview & analytics",
  },
  {
    id: "bugs",
    label: "Bug Reports",
    icon: ListChecks,
    description: "All bug reports",
  },
  {
    id: "labels",
    label: "Labels",
    icon: Tag,
    description: "Manage labels",
  },
  {
    id: "endpoints",
    label: "Endpoints",
    icon: Info,
    description: "API reference",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    description: "Preferences",
  },
]

// ---- Chart colors ----
export const CHART_COLORS = {
  open: "var(--chart-1)",
  closed: "var(--chart-2)",
  critical: "var(--chart-3)",
  high: "var(--chart-4)",
  medium: "var(--chart-5)",
  low: "var(--chart-1)",
  dev: "var(--chart-1)",
  staging: "var(--chart-2)",
  production: "var(--chart-3)",
}

// ---- Default template (for the form popover) ----
export const DEFAULT_TEMPLATE = `## Jira Summary
\`[Bug][Login] Cannot login with valid credentials\`

## Overview
IB4G (Dev) > Logged Out > Web > Login Page > Submit > Error

## Environment
App: IB4G (Dev)
Page: Login > Login Page
Platform: Web
OS: Windows
Browser: Chrome

## Preconditions
- User has a valid account
- User is on the login page

## Steps to Reproduce
1. Enter valid email
2. Enter valid password
3. Click Login button

## Actual Result
Error 500 shown, user not logged in.

## Expected Result
User redirected to dashboard.

## Impact
**User Impact:**
- Users cannot access the application

**Business Impact:**
- Revenue loss from abandoned sessions

**QA Impact:**
- QA cannot verify login flow

## Technical Notes
API returns 500, stack trace points to auth middleware.`

// ---- Bug icon (used in header / empty states) ----
export const BUG_ICON = BugIcon
