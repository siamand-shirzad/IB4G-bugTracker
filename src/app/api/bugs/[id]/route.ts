import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { serializeBug } from "@/lib/serialize";
import { parseTemplate } from "@/lib/template-parser";
import { recordEvent, recordDiffEvents } from "@/lib/events";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const bug = await db.bug.findUnique({
      where: { id },
      include: { labels: { include: { label: true } } },
    });
    if (!bug) {
      return NextResponse.json({ error: "Bug not found" }, { status: 404 });
    }
    return NextResponse.json(serializeBug(bug));
  } catch (err) {
    console.error("[GET /api/bugs/[id]] error:", err);
    return NextResponse.json({ error: "Failed to fetch bug" }, { status: 500 });
  }
}

const UpdateSchema = z.object({
  summary: z.string().min(1).optional(),
  jiraId: z.string().nullable().optional(),
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
  labelIds: z.array(z.string()).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const b = parsed.data;

    const existing = await db.bug.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Bug not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (b.summary !== undefined) data.summary = b.summary;
    if (b.jiraId !== undefined) data.jiraId = b.jiraId;
    if (b.overviewLoginCondition !== undefined) data.overviewLoginCondition = b.overviewLoginCondition;
    if (b.overviewPlatform !== undefined) data.overviewPlatform = b.overviewPlatform;
    if (b.overviewModule !== undefined) data.overviewModule = b.overviewModule;
    if (b.overviewTrigger !== undefined) data.overviewTrigger = b.overviewTrigger;
    if (b.overviewIssue !== undefined) data.overviewIssue = b.overviewIssue;
    if (b.envPage !== undefined) data.envPage = b.envPage;
    if (b.envPlatform !== undefined) data.envPlatform = b.envPlatform;
    if (b.envOS !== undefined) data.envOS = b.envOS;
    if (b.envBrowser !== undefined) data.envBrowser = b.envBrowser;
    if (b.preconditions !== undefined) data.preconditions = JSON.stringify(b.preconditions);
    if (b.stepsToReproduce !== undefined) data.stepsToReproduce = JSON.stringify(b.stepsToReproduce);
    if (b.actualResult !== undefined) data.actualResult = b.actualResult;
    if (b.expectedResult !== undefined) data.expectedResult = b.expectedResult;
    if (b.userImpact !== undefined) data.userImpact = b.userImpact;
    if (b.businessImpact !== undefined) data.businessImpact = b.businessImpact;
    if (b.qaImpact !== undefined) data.qaImpact = b.qaImpact;
    if (b.technicalNotes !== undefined) data.technicalNotes = b.technicalNotes;
    if (b.environmentStage !== undefined) data.environmentStage = b.environmentStage;
    if (b.status !== undefined) data.status = b.status;
    if (b.priority !== undefined) data.priority = b.priority;
    if (b.assignee !== undefined) data.assignee = b.assignee;
    if (b.reporter !== undefined) data.reporter = b.reporter;

    // If a raw `overview` template is provided, re-parse and override the parsed fields
    if (b.overview && b.overview.trim()) {
      const parsedOverview = parseTemplate(b.overview);
      if (parsedOverview.summary && !b.summary) data.summary = parsedOverview.summary;
      if (parsedOverview.jiraId && !b.jiraId) data.jiraId = parsedOverview.jiraId;
      if (parsedOverview.overviewLoginCondition) data.overviewLoginCondition = parsedOverview.overviewLoginCondition;
      if (parsedOverview.overviewPlatform) data.overviewPlatform = parsedOverview.overviewPlatform;
      if (parsedOverview.overviewModule) data.overviewModule = parsedOverview.overviewModule;
      if (parsedOverview.overviewTrigger) data.overviewTrigger = parsedOverview.overviewTrigger;
      if (parsedOverview.overviewIssue) data.overviewIssue = parsedOverview.overviewIssue;
      if (parsedOverview.envPage) data.envPage = parsedOverview.envPage;
      if (parsedOverview.envPlatform) data.envPlatform = parsedOverview.envPlatform;
      if (parsedOverview.envOS) data.envOS = parsedOverview.envOS;
      if (parsedOverview.envBrowser) data.envBrowser = parsedOverview.envBrowser;
      data.preconditions = JSON.stringify(parsedOverview.preconditions);
      data.stepsToReproduce = JSON.stringify(parsedOverview.stepsToReproduce);
      if (parsedOverview.actualResult) data.actualResult = parsedOverview.actualResult;
      if (parsedOverview.expectedResult) data.expectedResult = parsedOverview.expectedResult;
      if (parsedOverview.userImpact) data.userImpact = parsedOverview.userImpact;
      if (parsedOverview.businessImpact) data.businessImpact = parsedOverview.businessImpact;
      if (parsedOverview.qaImpact) data.qaImpact = parsedOverview.qaImpact;
      if (parsedOverview.technicalNotes) data.technicalNotes = parsedOverview.technicalNotes;
    }

    // Handle labels replacement if provided
    let labelsOp:
      | { deleteMany: Record<string, never>; create: { labelId: string }[] }
      | undefined;
    if (b.labelIds !== undefined) {
      // Validate labels exist
      let labelIds = b.labelIds;
      if (labelIds.length > 0) {
        const existingLabels = await db.label.findMany({
          where: { id: { in: labelIds } },
          select: { id: true },
        });
        labelIds = existingLabels.map((l) => l.id);
      }
      labelsOp = {
        deleteMany: {} as Record<string, never>,
        create: labelIds.map((labelId) => ({ labelId })),
      };
    }

    const updated = await db.bug.update({
      where: { id },
      data: { ...data, labels: labelsOp },
      include: { labels: { include: { label: true } } },
    });

    // Record diff events for tracked fields
    await recordDiffEvents(
      existing as unknown as Record<string, unknown>,
      updated as unknown as Record<string, unknown>,
      id,
      b.reporter ?? "Anonymous",
    ).catch((e) => console.error("[diff-events] failed:", e));

    // If labels changed, record a labels_changed event
    if (b.labelIds !== undefined) {
      const oldLabelIds = await db.bugLabel
        .findMany({ where: { bugId: id }, select: { labelId: true } })
        .catch(() => [])
      // Note: by this point the labels are already replaced, so we record what we know:
      // (This is best-effort; the diff is approximated)
      const newCount = b.labelIds.length
      await recordEvent({
        bugId: id,
        type: "labels_changed",
        field: "labels",
        oldValue: null,
        newValue: String(newCount),
        actor: b.reporter ?? "Anonymous",
        summary: `Labels updated (now ${newCount} label${newCount === 1 ? "" : "s"})`,
      }).catch((e) => console.error("[labels-event] failed:", e))
      void oldLabelIds
    }

    return NextResponse.json(serializeBug(updated));
  } catch (err) {
    console.error("[PUT /api/bugs/[id]] error:", err);
    return NextResponse.json({ error: "Failed to update bug" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const existing = await db.bug.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Bug not found" }, { status: 404 });
    }
    await db.bug.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error("[DELETE /api/bugs/[id]] error:", err);
    return NextResponse.json({ error: "Failed to delete bug" }, { status: 500 });
  }
}
