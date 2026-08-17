import type { Bug } from "@/lib/types"
import { reconstructTemplate } from "@/lib/template-parser"

/**
 * Convert a bug report into a standalone Markdown document suitable for
 * pasting into GitHub issues, Notion, Slack, etc.
 */
export function bugToMarkdown(bug: Bug, comments: { author: string; body: string; createdAt: string }[] = []): string {
  const lines: string[] = []

  // Title
  lines.push(`# ${bug.summary}`)
  lines.push("")

  // Meta block
  lines.push("| Field | Value |")
  lines.push("| --- | --- |")
  if (bug.jiraId) lines.push(`| Jira ID | ${bug.jiraId} |`)
  lines.push(`| Status | ${bug.status} |`)
  lines.push(`| Priority | ${bug.priority} |`)
  lines.push(`| Environment | ${bug.environmentStage} |`)
  if (bug.assignee) lines.push(`| Assignee | ${bug.assignee} |`)
  lines.push(`| Reporter | ${bug.reporter} |`)
  if (bug.labels.length > 0) {
    lines.push(`| Labels | ${bug.labels.map((l) => `\`${l.name}\``).join(" ")} |`)
  }
  lines.push(`| Created | ${new Date(bug.createdAt).toISOString()} |`)
  lines.push(`| Updated | ${new Date(bug.updatedAt).toISOString()} |`)
  lines.push(`| Bug ID | \`${bug.id}\` |`)
  lines.push("")

  // Overview breadcrumb
  const breadcrumb = [
    bug.overviewLoginCondition,
    bug.overviewPlatform,
    bug.overviewModule,
    bug.overviewTrigger,
    bug.overviewIssue,
  ].filter(Boolean).join(" > ")
  if (breadcrumb) {
    lines.push("## Overview")
    lines.push(breadcrumb)
    lines.push("")
  }

  // Environment details
  lines.push("## Environment")
  lines.push("| Property | Value |")
  lines.push("| --- | --- |")
  if (bug.envPage) lines.push(`| Page | ${bug.envPage} |`)
  if (bug.envPlatform) lines.push(`| Platform | ${bug.envPlatform} |`)
  if (bug.envOS) lines.push(`| OS | ${bug.envOS} |`)
  if (bug.envBrowser) lines.push(`| Browser | ${bug.envBrowser} |`)
  lines.push("")

  // Preconditions
  if (bug.preconditions.length > 0) {
    lines.push("## Preconditions")
    bug.preconditions.forEach((p) => lines.push(`- ${p}`))
    lines.push("")
  }

  // Steps to Reproduce
  if (bug.stepsToReproduce.length > 0) {
    lines.push("## Steps to Reproduce")
    bug.stepsToReproduce.forEach((s, i) => lines.push(`${i + 1}. ${s}`))
    lines.push("")
  }

  // Actual / Expected
  if (bug.actualResult) {
    lines.push("## Actual Result")
    lines.push(bug.actualResult)
    lines.push("")
  }
  if (bug.expectedResult) {
    lines.push("## Expected Result")
    lines.push(bug.expectedResult)
    lines.push("")
  }

  // Impact
  if (bug.userImpact || bug.businessImpact || bug.qaImpact) {
    lines.push("## Impact Analysis")
    if (bug.userImpact) {
      lines.push("### User Impact")
      lines.push(bug.userImpact)
      lines.push("")
    }
    if (bug.businessImpact) {
      lines.push("### Business Impact")
      lines.push(bug.businessImpact)
      lines.push("")
    }
    if (bug.qaImpact) {
      lines.push("### QA Impact")
      lines.push(bug.qaImpact)
      lines.push("")
    }
  }

  // Technical Notes
  if (bug.technicalNotes) {
    lines.push("## Technical Notes")
    lines.push("```")
    lines.push(bug.technicalNotes)
    lines.push("```")
    lines.push("")
  }

  // Comments
  if (comments.length > 0) {
    lines.push("## Discussion")
    lines.push("")
    for (const c of comments) {
      const date = new Date(c.createdAt).toISOString().slice(0, 16).replace("T", " ")
      lines.push(`**${c.author}** · _${date}_`)
      lines.push("")
      lines.push(c.body)
      lines.push("")
      lines.push("---")
      lines.push("")
    }
  }

  // Footer with deep link
  lines.push("---")
  lines.push(`> Exported from IB4G BugTracker · [View in app](${typeof window !== "undefined" ? window.location.origin : "https://ib4g.example"}/?bug=${bug.id})`)

  return lines.join("\n")
}

/**
 * Download a bug as a .md file.
 */
export function downloadBugAsMarkdown(bug: Bug, comments: { author: string; body: string; createdAt: string }[] = []) {
  const md = bugToMarkdown(bug, comments)
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  const slug = bug.summary
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50)
  a.download = `${bug.jiraId ?? slug}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Re-export for the "Copy template" button which uses the original template format
export { reconstructTemplate }
