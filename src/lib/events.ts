import { db } from "@/lib/db"

type EventInput = {
  bugId: string
  type: string
  field?: string | null
  oldValue?: string | null
  newValue?: string | null
  actor?: string
  summary: string
}

/**
 * Record a single bug activity event. Non-blocking on failure —
 * we never want event logging to break a primary operation.
 */
export async function recordEvent(input: EventInput) {
  try {
    await db.bugEvent.create({
      data: {
        bugId: input.bugId,
        type: input.type,
        field: input.field ?? null,
        oldValue: input.oldValue ?? null,
        newValue: input.newValue ?? null,
        actor: input.actor ?? "Anonymous",
        summary: input.summary,
      },
    })
  } catch (err) {
    console.error("[recordEvent] failed:", err)
  }
}

type DiffEntry = {
  field: string
  label: string
  oldValue: string | null
  newValue: string | null
  eventType: string
  humanize?: (oldV: string, newV: string) => string
}

const FIELD_DIFFS: DiffEntry[] = [
  {
    field: "status",
    label: "Status",
    oldValue: "",
    newValue: "",
    eventType: "status_changed",
    humanize: (o, n) => `Status changed from ${o} to ${n}`,
  },
  {
    field: "priority",
    label: "Priority",
    oldValue: "",
    newValue: "",
    eventType: "priority_changed",
    humanize: (o, n) => `Priority changed from ${o} to ${n}`,
  },
  {
    field: "environmentStage",
    label: "Environment Stage",
    oldValue: "",
    newValue: "",
    eventType: "stage_changed",
    humanize: (o, n) => `Environment stage changed from ${o} to ${n}`,
  },
  {
    field: "assignee",
    label: "Assignee",
    oldValue: "",
    newValue: "",
    eventType: "assignee_changed",
    humanize: (o, n) =>
      `Assignee changed from ${o || "Unassigned"} to ${n || "Unassigned"}`,
  },
  {
    field: "summary",
    label: "Summary",
    oldValue: "",
    newValue: "",
    eventType: "summary_changed",
    humanize: (_o, n) => `Summary updated to "${n.slice(0, 80)}${n.length > 80 ? "…" : ""}"`,
  },
  {
    field: "jiraId",
    label: "Jira ID",
    oldValue: "",
    newValue: "",
    eventType: "details_updated",
    humanize: (o, n) => `Jira ID changed from ${o || "—"} to ${n || "—"}`,
  },
]

/**
 * Compare before/after bug rows and record one event per changed tracked field.
 */
export async function recordDiffEvents(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  bugId: string,
  actor: string = "Anonymous",
) {
  const events: EventInput[] = []
  for (const def of FIELD_DIFFS) {
    const oldV = before[def.field] as string | null | undefined
    const newV = after[def.field] as string | null | undefined
    const oldS = oldV ?? null
    const newS = newV ?? null
    if (String(oldS ?? "") !== String(newS ?? "")) {
      events.push({
        bugId,
        type: def.eventType,
        field: def.field,
        oldValue: oldS,
        newValue: newS,
        actor,
        summary: def.humanize
          ? def.humanize(String(oldS ?? "—"), String(newS ?? "—"))
          : `${def.label} updated`,
      })
    }
  }
  // Special: if other detail fields changed (overview/env/impact/notes), emit a single "details_updated"
  const detailFields = [
    "overviewLoginCondition",
    "overviewPlatform",
    "overviewModule",
    "overviewTrigger",
    "overviewIssue",
    "envPage",
    "envOS",
    "envBrowser",
    "preconditions",
    "stepsToReproduce",
    "actualResult",
    "expectedResult",
    "userImpact",
    "businessImpact",
    "qaImpact",
    "technicalNotes",
  ]
  const detailChanged = detailFields.some(
    (f) => String(before[f] ?? "") !== String(after[f] ?? ""),
  )
  if (detailChanged && events.length === 0) {
    events.push({
      bugId,
      type: "details_updated",
      field: null,
      oldValue: null,
      newValue: null,
      actor,
      summary: "Bug details updated",
    })
  }

  await Promise.all(events.map((e) => recordEvent(e)))
}
