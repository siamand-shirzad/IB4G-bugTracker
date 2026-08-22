import type { Bug, Label } from "@/lib/types"

// Prisma returns Date objects; we serialize to ISO strings. Use a loose type
// that accepts both Date and string to avoid type friction at call sites.
type DateLike = Date | string

type PrismaLabel = {
  id: string
  name: string
  color: string
  createdAt: DateLike
  updatedAt: DateLike
}

type BugWithLabels = {
  id: string
  jiraId: string | null
  summary: string
  overviewLoginCondition: string | null
  overviewPlatform: string | null
  overviewModule: string | null
  overviewTrigger: string | null
  overviewIssue: string | null
  envPage: string | null
  envPlatform: string | null
  envOS: string | null
  envBrowser: string | null
  preconditions: string | null
  stepsToReproduce: string | null
  actualResult: string | null
  expectedResult: string | null
  userImpact: string | null
  businessImpact: string | null
  qaImpact: string | null
  technicalNotes: string | null
  environmentStage: string
  status: string
  priority: string
  assignee: string | null
  reporter: string
  createdAt: DateLike
  updatedAt: DateLike
  labels?: { label: PrismaLabel }[]
}

function safeParseArray(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.map((x) => String(x)).filter(Boolean)
    }
    return []
  } catch {
    // Not JSON, treat as newline-separated
    return raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
  }
}

function toDate(value: DateLike): Date {
  return value instanceof Date ? value : new Date(value)
}

function serializePrismaLabel(row: PrismaLabel): Label {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: toDate(row.createdAt).toISOString(),
    updatedAt: toDate(row.updatedAt).toISOString(),
  }
}

/**
 * Convert a Prisma Bug row into the API-facing Bug shape.
 */
export function serializeBug(row: BugWithLabels): Bug {
  return {
    id: row.id,
    jiraId: row.jiraId,
    summary: row.summary,
    overviewLoginCondition: row.overviewLoginCondition,
    overviewPlatform: row.overviewPlatform,
    overviewModule: row.overviewModule,
    overviewTrigger: row.overviewTrigger,
    overviewIssue: row.overviewIssue,
    envPage: row.envPage,
    envPlatform: row.envPlatform,
    envOS: row.envOS,
    envBrowser: row.envBrowser,
    preconditions: safeParseArray(row.preconditions),
    stepsToReproduce: safeParseArray(row.stepsToReproduce),
    actualResult: row.actualResult,
    expectedResult: row.expectedResult,
    userImpact: row.userImpact,
    businessImpact: row.businessImpact,
    qaImpact: row.qaImpact,
    technicalNotes: row.technicalNotes,
    environmentStage: row.environmentStage as Bug["environmentStage"],
    status: row.status as Bug["status"],
    priority: row.priority as Bug["priority"],
    assignee: row.assignee,
    reporter: row.reporter,
    createdAt: toDate(row.createdAt).toISOString(),
    updatedAt: toDate(row.updatedAt).toISOString(),
    labels: row.labels ? row.labels.map((l) => serializePrismaLabel(l.label)) : [],
  }
}

export function serializeLabel(row: PrismaLabel): Label {
  return serializePrismaLabel(row)
}
