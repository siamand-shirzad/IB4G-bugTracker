import type { ParsedOverview } from "@/lib/types"

/**
 * IB4G Jira Bug Report Template Parser
 *
 * Parses a pasted Jira-style bug template into structured fields, and
 * reconstructs the template text from stored DB fields.
 *
 * Supported sections (## headers):
 *  - Jira Summary
 *  - Overview          (breadcrumb: App > LoginCondition > Platform > Module > Trigger > Issue)
 *  - Environment       (Key: Value lines: App, Page, Platform, OS, Browser)
 *  - Preconditions     (- list items)
 *  - Steps to Reproduce (1. numbered items)
 *  - Actual Result
 *  - Expected Result
 *  - Impact            (subsections: User Impact / Business Impact / QA Impact)
 *  - Technical Notes
 */

const SECTION_HEADERS = [
  "Jira Summary",
  "Overview",
  "Environment",
  "Preconditions",
  "Steps to Reproduce",
  "Actual Result",
  "Expected Result",
  "Impact",
  "Technical Notes",
] as const

type SectionName = (typeof SECTION_HEADERS)[number]

const EMPTY_PARSED: ParsedOverview = {
  jiraId: null,
  summary: "",
  overviewLoginCondition: null,
  overviewPlatform: null,
  overviewModule: null,
  overviewTrigger: null,
  overviewIssue: null,
  envPage: null,
  envPlatform: null,
  envOS: null,
  envBrowser: null,
  preconditions: [],
  stepsToReproduce: [],
  actualResult: null,
  expectedResult: null,
  userImpact: null,
  businessImpact: null,
  qaImpact: null,
  technicalNotes: null,
}

/**
 * Split raw template into a map of section name -> raw content.
 */
function splitSections(raw: string): Map<SectionName, string> {
  const sections = new Map<SectionName, string>()
  // Normalize newlines
  const text = raw.replace(/\r\n/g, "\n")
  // Match ## Header followed by content until next ## or EOF
  const headerRegex = /^##\s+(.+?)\s*$/gm
  const matches: { name: string; start: number }[] = []
  let m: RegExpExecArray | null
  while ((m = headerRegex.exec(text)) !== null) {
    const name = m[1].trim()
    if (SECTION_HEADERS.includes(name as SectionName)) {
      matches.push({ name, start: m.index + m[0].length })
    }
  }
  for (let i = 0; i < matches.length; i++) {
    const { name, start } = matches[i]
    const end = i + 1 < matches.length ? matches[i + 1].start - matches[i + 1].name.length - 3 : text.length
    const content = text.slice(start, end).trim()
    sections.set(name as SectionName, content)
  }
  return sections
}

/**
 * Parse the Jira Summary line.
 * Example: `[Bug][Login] Cannot login with valid credentials`
 * Also captures a Jira ID like IB4G-1234 if present anywhere in the summary section.
 */
function parseJiraSummary(content: string): { summary: string; jiraId: string | null } {
  const trimmed = content.trim()
  // Remove leading backticks if wrapped
  let text = trimmed.replace(/^`+/, "").replace(/`+$/, "").trim()
  // Extract Jira ID pattern (e.g. IB4G-1234, PROJ-22)
  const jiraIdMatch = text.match(/\b([A-Z][A-Z0-9_]+-\d+)\b/)
  const jiraId = jiraIdMatch ? jiraIdMatch[1] : null
  // Remove the Jira ID from the summary text for cleanliness
  if (jiraId) {
    text = text.replace(jiraId, "").replace(/\s+/g, " ").trim()
  }
  // Strip leading tag brackets like [Bug][Login]
  // Keep removing leading [xxx] tokens
  while (/^\[[^\]]*\]\s*/.test(text)) {
    text = text.replace(/^\[[^\]]*\]\s*/, "")
  }
  // Remove leading/trailing quotes
  text = text.replace(/^["'`]+|["'`]+$/g, "").trim()
  return { summary: text, jiraId }
}

/**
 * Parse Overview breadcrumb.
 * Example: `IB4G (Dev) > Logged Out > Web > Login Page > Submit > Error`
 * 6 parts -> [app, loginCondition, platform, module, trigger, issue]
 * 5 parts -> [loginCondition, platform, module, trigger, issue]
 */
function parseOverview(content: string): Partial<ParsedOverview> {
  const parts = content
    .split(">")
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length === 0) return {}
  if (parts.length >= 6) {
    const [, loginCondition, platform, module, trigger, issue] = parts
    return {
      overviewLoginCondition: loginCondition || null,
      overviewPlatform: platform || null,
      overviewModule: module || null,
      overviewTrigger: trigger || null,
      overviewIssue: issue || null,
    }
  }
  // 5 or fewer: map in order
  const [loginCondition, platform, module, trigger, issue] = parts
  return {
    overviewLoginCondition: loginCondition || null,
    overviewPlatform: platform || null,
    overviewModule: module || null,
    overviewTrigger: trigger || null,
    overviewIssue: issue || null,
  }
}

/**
 * Parse Environment section.
 * Lines like: `App: IB4G (Dev)`, `Page: Login > Login Page`, `Platform: Web`, `OS: Windows`, `Browser: Chrome`
 */
function parseEnvironment(content: string): Partial<ParsedOverview> {
  const result: Partial<ParsedOverview> = {}
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean)
  for (const line of lines) {
    const colonIdx = line.indexOf(":")
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim().toLowerCase()
    const value = line.slice(colonIdx + 1).trim()
    if (!value) continue
    switch (key) {
      case "page":
        result.envPage = value
        break
      case "platform":
        result.envPlatform = value
        break
      case "os":
        result.envOS = value
        break
      case "browser":
        result.envBrowser = value
        break
      // App is captured but not stored as a separate field (it overlaps with stage)
    }
  }
  return result
}

/**
 * Parse a bullet list section: lines starting with `-` or `*`.
 */
function parseList(content: string): string[] {
  return content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^[-*]\s*/, "").replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean)
}

/**
 * Parse a numbered list section (Steps to Reproduce).
 * Accepts both `1.` and `-` formats.
 */
function parseNumberedList(content: string): string[] {
  return content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^\d+[\.\)]\s*/, "").replace(/^[-*]\s*/, "").trim())
    .filter(Boolean)
}

/**
 * Parse the Impact section into 3 sub-impacts.
 * Supports subsections marked with `### User Impact`, `**User Impact:**`, or `User Impact:` lines.
 * If no subsections are found, the whole block is treated as userImpact.
 */
function parseImpact(content: string): {
  userImpact: string | null
  businessImpact: string | null
  qaImpact: string | null
} {
  const user: string[] = []
  const business: string[] = []
  const qa: string[] = []
  let current: "user" | "business" | "qa" | null = null

  const lines = content.split("\n")
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    // Detect subsection headers: `### User Impact`, `**User Impact:**`, `User Impact:`
    const headerMatch = line.match(
      /^(?:#{1,6}\s*)?(?:\*\*)?\s*(User|Business|QA)\s*Impact\s*:?\s*(?:\*\*)?\s*$/i,
    )
    if (headerMatch) {
      const kind = headerMatch[1].toLowerCase()
      current = kind === "user" ? "user" : kind === "business" ? "business" : "qa"
      continue
    }
    // Also detect inline `**User Impact:** text on same line`
    const inlineMatch = line.match(
      /^(?:\*\*)?\s*(User|Business|QA)\s*Impact\s*:?\s*(?:\*\*)?\s*(.*)$/i,
    )
    if (inlineMatch) {
      const kind = inlineMatch[1].toLowerCase()
      current = kind === "user" ? "user" : kind === "business" ? "business" : "qa"
      const rest = inlineMatch[2].trim()
      if (rest) {
        const cleaned = rest.replace(/^[-*]\s*/, "")
        if (cleaned) {
          if (current === "user") user.push(cleaned)
          else if (current === "business") business.push(cleaned)
          else qa.push(cleaned)
        }
      }
      continue
    }
    // Regular bullet/text line
    const cleaned = line.replace(/^[-*]\s*/, "").replace(/^\d+\.\s*/, "").trim()
    if (!cleaned) continue
    if (current === "user") user.push(cleaned)
    else if (current === "business") business.push(cleaned)
    else if (current === "qa") qa.push(cleaned)
    else user.push(cleaned)
  }

  // If nothing was categorized, treat whole content as userImpact
  if (!current && user.length === 0 && business.length === 0 && qa.length === 0) {
    const text = content.trim()
    return {
      userImpact: text || null,
      businessImpact: null,
      qaImpact: null,
    }
  }

  return {
    userImpact: user.length ? user.join("\n") : null,
    businessImpact: business.length ? business.join("\n") : null,
    qaImpact: qa.length ? qa.join("\n") : null,
  }
}

/**
 * Main entry: parse a full template string into structured fields.
 */
export function parseTemplate(raw: string): ParsedOverview {
  const result: ParsedOverview = { ...EMPTY_PARSED }
  if (!raw || !raw.trim()) return result

  const sections = splitSections(raw)

  const summaryContent = sections.get("Jira Summary")
  if (summaryContent) {
    const { summary, jiraId } = parseJiraSummary(summaryContent)
    result.summary = summary
    result.jiraId = jiraId
  }

  const overviewContent = sections.get("Overview")
  if (overviewContent) {
    Object.assign(result, parseOverview(overviewContent))
  }

  const envContent = sections.get("Environment")
  if (envContent) {
    Object.assign(result, parseEnvironment(envContent))
  }

  const preconditionsContent = sections.get("Preconditions")
  if (preconditionsContent) {
    result.preconditions = parseList(preconditionsContent)
  }

  const stepsContent = sections.get("Steps to Reproduce")
  if (stepsContent) {
    result.stepsToReproduce = parseNumberedList(stepsContent)
  }

  const actualContent = sections.get("Actual Result")
  if (actualContent) {
    result.actualResult = actualContent.trim() || null
  }

  const expectedContent = sections.get("Expected Result")
  if (expectedContent) {
    result.expectedResult = expectedContent.trim() || null
  }

  const impactContent = sections.get("Impact")
  if (impactContent) {
    Object.assign(result, parseImpact(impactContent))
  }

  const techContent = sections.get("Technical Notes")
  if (techContent) {
    result.technicalNotes = techContent.trim() || null
  }

  return result
}

/**
 * Reconstruct the breadcrumb string from stored overview fields.
 */
export function reconstructOverviewBreadcrumb(parts: {
  overviewLoginCondition: string | null
  overviewPlatform: string | null
  overviewModule: string | null
  overviewTrigger: string | null
  overviewIssue: string | null
}): string {
  return [
    parts.overviewLoginCondition,
    parts.overviewPlatform,
    parts.overviewModule,
    parts.overviewTrigger,
    parts.overviewIssue,
  ]
    .filter((p): p is string => Boolean(p && p.trim()))
    .join(" > ")
}

/**
 * Reconstruct the full template text from stored fields (for re-editing / export).
 */
export function reconstructTemplate(bug: {
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
  preconditions: string[]
  stepsToReproduce: string[]
  actualResult: string | null
  expectedResult: string | null
  userImpact: string | null
  businessImpact: string | null
  qaImpact: string | null
  technicalNotes: string | null
}): string {
  const lines: string[] = []

  // Jira Summary
  const summaryPrefix = bug.jiraId ? `${bug.jiraId} ` : ""
  lines.push("## Jira Summary")
  lines.push(`\`${summaryPrefix}${bug.summary}\``)
  lines.push("")

  // Overview
  const breadcrumb = reconstructOverviewBreadcrumb({
    overviewLoginCondition: bug.overviewLoginCondition,
    overviewPlatform: bug.overviewPlatform,
    overviewModule: bug.overviewModule,
    overviewTrigger: bug.overviewTrigger,
    overviewIssue: bug.overviewIssue,
  })
  lines.push("## Overview")
  lines.push(breadcrumb || "—")
  lines.push("")

  // Environment
  lines.push("## Environment")
  if (bug.envPlatform) lines.push(`Platform: ${bug.envPlatform}`)
  if (bug.envPage) lines.push(`Page: ${bug.envPage}`)
  if (bug.envOS) lines.push(`OS: ${bug.envOS}`)
  if (bug.envBrowser) lines.push(`Browser: ${bug.envBrowser}`)
  lines.push("")

  // Preconditions
  lines.push("## Preconditions")
  if (bug.preconditions.length) {
    bug.preconditions.forEach((p) => lines.push(`- ${p}`))
  } else {
    lines.push("- N/A")
  }
  lines.push("")

  // Steps to Reproduce
  lines.push("## Steps to Reproduce")
  if (bug.stepsToReproduce.length) {
    bug.stepsToReproduce.forEach((s, i) => lines.push(`${i + 1}. ${s}`))
  } else {
    lines.push("1. N/A")
  }
  lines.push("")

  // Actual Result
  lines.push("## Actual Result")
  lines.push(bug.actualResult || "—")
  lines.push("")

  // Expected Result
  lines.push("## Expected Result")
  lines.push(bug.expectedResult || "—")
  lines.push("")

  // Impact
  lines.push("## Impact")
  if (bug.userImpact) {
    lines.push("**User Impact:**")
    bug.userImpact.split("\n").forEach((l) => lines.push(`- ${l.replace(/^[-*]\s*/, "")}`))
  }
  if (bug.businessImpact) {
    lines.push("**Business Impact:**")
    bug.businessImpact.split("\n").forEach((l) => lines.push(`- ${l.replace(/^[-*]\s*/, "")}`))
  }
  if (bug.qaImpact) {
    lines.push("**QA Impact:**")
    bug.qaImpact.split("\n").forEach((l) => lines.push(`- ${l.replace(/^[-*]\s*/, "")}`))
  }
  if (!bug.userImpact && !bug.businessImpact && !bug.qaImpact) {
    lines.push("- N/A")
  }
  lines.push("")

  // Technical Notes
  lines.push("## Technical Notes")
  lines.push(bug.technicalNotes || "—")

  return lines.join("\n")
}
