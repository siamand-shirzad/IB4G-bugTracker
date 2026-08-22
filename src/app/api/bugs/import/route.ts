import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { parseTemplate } from "@/lib/template-parser";
import { recordEvent } from "@/lib/events";

const ImportItemSchema = z.object({
  summary: z.string().min(1),
  jiraId: z.string().optional(),
  overview: z.string().optional(),
  overviewLoginCondition: z.string().nullable().optional(),
  overviewPlatform: z.string().nullable().optional(),
  overviewModule: z.string().nullable().optional(),
  overviewTrigger: z.string().nullable().optional(),
  overviewIssue: z.string().nullable().optional(),
  envPage: z.string().nullable().optional(),
  envPlatform: z.string().nullable().optional(),
  envOS: z.string().nullable().optional(),
  envBrowser: z.string().nullable().optional(),
  preconditions: z.array(z.string()).optional(),
  stepsToReproduce: z.array(z.string()).optional(),
  actualResult: z.string().nullable().optional(),
  expectedResult: z.string().nullable().optional(),
  userImpact: z.string().nullable().optional(),
  businessImpact: z.string().nullable().optional(),
  qaImpact: z.string().nullable().optional(),
  technicalNotes: z.string().nullable().optional(),
  environmentStage: z.enum(["dev", "staging", "production"]).optional(),
  status: z.enum(["open", "closed"]).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  assignee: z.string().nullable().optional(),
  reporter: z.string().optional(),
  labelNames: z.array(z.string()).optional(),
});

const ImportSchema = z.object({
  bugs: z.array(ImportItemSchema).max(500, "Max 500 bugs per import"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ImportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid import payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const items = parsed.data.bugs;
    const created: { id: string; summary: string }[] = [];
    const skipped: { summary: string; reason: string }[] = [];

    // Resolve label names → ids (create missing labels)
    const allLabelNames = new Set<string>();
    items.forEach((i) => (i.labelNames ?? []).forEach((n) => allLabelNames.add(n)));
    const labelMap = new Map<string, string>();
    if (allLabelNames.size > 0) {
      const existing = await db.label.findMany({
        where: { name: { in: Array.from(allLabelNames) } },
      });
      for (const l of existing) labelMap.set(l.name, l.id);
      for (const name of allLabelNames) {
        if (!labelMap.has(name)) {
          const c = await db.label.create({ data: { name, color: "neutral" } });
          labelMap.set(name, c.id);
        }
      }
    }

    for (const item of items) {
      try {
        // Compute the data payload explicitly to avoid spreading `undefined`
        const data: {
          summary: string;
          jiraId: string | null;
          overviewLoginCondition: string | null;
          overviewPlatform: string | null;
          overviewModule: string | null;
          overviewTrigger: string | null;
          overviewIssue: string | null;
          envPage: string | null;
          envPlatform: string | null;
          envOS: string | null;
          envBrowser: string | null;
          preconditions: string;
          stepsToReproduce: string;
          actualResult: string | null;
          expectedResult: string | null;
          userImpact: string | null;
          businessImpact: string | null;
          qaImpact: string | null;
          technicalNotes: string | null;
          environmentStage: string;
          status: string;
          priority: string;
          assignee: string | null;
          reporter: string;
          labels?: { create: { labelId: string }[] };
        } = {
          summary: item.summary,
          jiraId: item.jiraId ?? null,
          overviewLoginCondition: null,
          overviewPlatform: null,
          overviewModule: null,
          overviewTrigger: null,
          overviewIssue: null,
          envPage: null,
          envPlatform: null,
          envOS: null,
          envBrowser: null,
          preconditions: JSON.stringify([]),
          stepsToReproduce: JSON.stringify([]),
          actualResult: null,
          expectedResult: null,
          userImpact: null,
          businessImpact: null,
          qaImpact: null,
          technicalNotes: null,
          environmentStage: item.environmentStage ?? "dev",
          status: item.status ?? "open",
          priority: item.priority ?? "medium",
          assignee: item.assignee ?? null,
          reporter: item.reporter ?? "Importer",
        };

        if (item.overview && item.overview.trim()) {
          const p = parseTemplate(item.overview);
          if (!item.summary && p.summary) data.summary = p.summary;
          if (!item.jiraId && p.jiraId) data.jiraId = p.jiraId;
          if (p.overviewLoginCondition) data.overviewLoginCondition = p.overviewLoginCondition;
          if (p.overviewPlatform) data.overviewPlatform = p.overviewPlatform;
          if (p.overviewModule) data.overviewModule = p.overviewModule;
          if (p.overviewTrigger) data.overviewTrigger = p.overviewTrigger;
          if (p.overviewIssue) data.overviewIssue = p.overviewIssue;
          if (p.envPage) data.envPage = p.envPage;
          if (p.envPlatform) data.envPlatform = p.envPlatform;
          if (p.envOS) data.envOS = p.envOS;
          if (p.envBrowser) data.envBrowser = p.envBrowser;
          data.preconditions = JSON.stringify(item.preconditions ?? p.preconditions);
          data.stepsToReproduce = JSON.stringify(item.stepsToReproduce ?? p.stepsToReproduce);
          if (item.actualResult ?? p.actualResult) data.actualResult = (item.actualResult ?? p.actualResult)!;
          if (item.expectedResult ?? p.expectedResult) data.expectedResult = (item.expectedResult ?? p.expectedResult)!;
          if (item.userImpact ?? p.userImpact) data.userImpact = (item.userImpact ?? p.userImpact)!;
          if (item.businessImpact ?? p.businessImpact) data.businessImpact = (item.businessImpact ?? p.businessImpact)!;
          if (item.qaImpact ?? p.qaImpact) data.qaImpact = (item.qaImpact ?? p.qaImpact)!;
          if (item.technicalNotes ?? p.technicalNotes) data.technicalNotes = (item.technicalNotes ?? p.technicalNotes)!;
        } else {
          if (item.overviewLoginCondition !== undefined) data.overviewLoginCondition = item.overviewLoginCondition;
          if (item.overviewPlatform !== undefined) data.overviewPlatform = item.overviewPlatform;
          if (item.overviewModule !== undefined) data.overviewModule = item.overviewModule;
          if (item.overviewTrigger !== undefined) data.overviewTrigger = item.overviewTrigger;
          if (item.overviewIssue !== undefined) data.overviewIssue = item.overviewIssue;
          if (item.envPage !== undefined) data.envPage = item.envPage;
          if (item.envPlatform !== undefined) data.envPlatform = item.envPlatform;
          if (item.envOS !== undefined) data.envOS = item.envOS;
          if (item.envBrowser !== undefined) data.envBrowser = item.envBrowser;
          if (item.preconditions) data.preconditions = JSON.stringify(item.preconditions);
          if (item.stepsToReproduce) data.stepsToReproduce = JSON.stringify(item.stepsToReproduce);
          if (item.actualResult !== undefined) data.actualResult = item.actualResult;
          if (item.expectedResult !== undefined) data.expectedResult = item.expectedResult;
          if (item.userImpact !== undefined) data.userImpact = item.userImpact;
          if (item.businessImpact !== undefined) data.businessImpact = item.businessImpact;
          if (item.qaImpact !== undefined) data.qaImpact = item.qaImpact;
          if (item.technicalNotes !== undefined) data.technicalNotes = item.technicalNotes;
        }

        const labelIds = (item.labelNames ?? [])
          .map((n) => labelMap.get(n))
          .filter((id): id is string => Boolean(id));
        if (labelIds.length > 0) {
          data.labels = { create: labelIds.map((labelId) => ({ labelId })) };
        }

        const created2 = await db.bug.create({ data });

        await recordEvent({
          bugId: created2.id,
          type: "created",
          summary: `Bug report imported${created2.jiraId ? ` (${created2.jiraId})` : ""}`,
          actor: "Importer",
        }).catch(() => {});

        created.push({ id: created2.id, summary: created2.summary });
      } catch (e) {
        const reason = e instanceof Error ? e.message : "Unknown error";
        skipped.push({ summary: item.summary, reason });
      }
    }

    return NextResponse.json({
      success: true,
      created: created.length,
      skipped: skipped.length,
      createdIds: created.map((c) => c.id),
      skippedDetails: skipped,
    });
  } catch (err) {
    console.error("[POST /api/bugs/import] error:", err);
    return NextResponse.json({ error: "Failed to import bugs" }, { status: 500 });
  }
}
