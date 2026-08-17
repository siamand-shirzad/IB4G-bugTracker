import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { serializeBug } from "@/lib/serialize";
import { parseTemplate } from "@/lib/template-parser";
import type { BugInput, BugListResponse, BugPriority, BugStatus, EnvironmentStage } from "@/lib/types";

// ---- Query params for GET ----
const ListQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["all", "open", "closed"]).optional(),
  priority: z.enum(["all", "low", "medium", "high", "critical"]).optional(),
  platform: z.string().optional(),
  stage: z.enum(["all", "dev", "staging", "production"]).optional(),
  assignee: z.string().optional(),
  labelId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const parsed = ListQuerySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const q = parsed.data;

    const where: {
      AND: Record<string, unknown>[];
    } = { AND: [] };

    if (q.search) {
      // SQLite doesn't support `mode: "insensitive"` in Prisma. Use raw SQL
      // with LOWER() to find matching IDs, then constrain the Prisma query to
      // those IDs.
      const pattern = `%${q.search.toLowerCase()}%`;
      const matchingRows = (await db.$queryRaw`
        SELECT id FROM Bug
        WHERE
          LOWER(summary) LIKE ${pattern}
          OR LOWER(COALESCE(jiraId, '')) LIKE ${pattern}
          OR LOWER(COALESCE(actualResult, '')) LIKE ${pattern}
          OR LOWER(COALESCE(expectedResult, '')) LIKE ${pattern}
          OR LOWER(COALESCE(technicalNotes, '')) LIKE ${pattern}
          OR LOWER(COALESCE(envPlatform, '')) LIKE ${pattern}
          OR LOWER(COALESCE(envPage, '')) LIKE ${pattern}
          OR LOWER(COALESCE(overviewModule, '')) LIKE ${pattern}
      `) as { id: string }[];
      const matchingIds = matchingRows.map((r) => r.id);
      where.AND.push({ id: { in: matchingIds.length > 0 ? matchingIds : ["__none__"] } });
    }
    if (q.status && q.status !== "all") {
      where.AND.push({ status: q.status });
    }
    if (q.priority && q.priority !== "all") {
      where.AND.push({ priority: q.priority });
    }
    if (q.stage && q.stage !== "all") {
      where.AND.push({ environmentStage: q.stage });
    }
    if (q.platform && q.platform !== "all") {
      // Case-insensitive platform filter via raw SQL ID lookup
      const platPattern = `%${q.platform.toLowerCase()}%`;
      const platRows = (await db.$queryRaw`
        SELECT id FROM Bug WHERE LOWER(COALESCE(envPlatform, '')) LIKE ${platPattern}
      `) as { id: string }[];
      const platIds = platRows.map((r) => r.id);
      where.AND.push({ id: { in: platIds.length > 0 ? platIds : ["__none__"] } });
    }
    if (q.assignee) {
      if (q.assignee === "__unassigned__") {
        where.AND.push({ assignee: null });
      } else {
        const assigneePattern = `%${q.assignee.toLowerCase()}%`;
        const assigneeRows = (await db.$queryRaw`
          SELECT id FROM Bug WHERE LOWER(COALESCE(assignee, '')) LIKE ${assigneePattern}
        `) as { id: string }[];
        const assigneeIds = assigneeRows.map((r) => r.id);
        where.AND.push({ id: { in: assigneeIds.length > 0 ? assigneeIds : ["__none__"] } });
      }
    }
    if (q.labelId) {
      where.AND.push({ labels: { some: { labelId: q.labelId } } });
    }

    const [total, rows] = await Promise.all([
      db.bug.count({ where }),
      db.bug.findMany({
        where,
        include: { labels: { include: { label: true } } },
        orderBy: { updatedAt: "desc" },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
    ]);

    const data = rows.map(serializeBug);
    const totalPages = Math.max(1, Math.ceil(total / q.pageSize));

    const response: BugListResponse = {
      data,
      total,
      page: q.page,
      pageSize: q.pageSize,
      totalPages,
    };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[GET /api/bugs] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch bugs" },
      { status: 500 },
    );
  }
}

// ---- POST create ----
const CreateSchema = z.object({
  summary: z.string().min(1, "Summary is required"),
  jiraId: z.string().nullable().optional(),
  overview: z.string().optional(), // raw template text to auto-parse
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const b = parsed.data;

    // If `overview` (raw template) is provided, parse it and merge with explicit fields
    let input: BugInput = {
      summary: b.summary,
      jiraId: b.jiraId ?? null,
      environmentStage: (b.environmentStage as EnvironmentStage) ?? "dev",
      status: (b.status as BugStatus) ?? "open",
      priority: (b.priority as BugPriority) ?? "medium",
      assignee: b.assignee ?? null,
      reporter: b.reporter ?? "Anonymous",
      labelIds: b.labelIds ?? [],
    };

    if (b.overview && b.overview.trim()) {
      const parsedOverview = parseTemplate(b.overview);
      // Explicit fields override parsed ones; parsed fills the rest
      input = {
        ...input,
        summary: b.summary || parsedOverview.summary || "Untitled bug",
        jiraId: b.jiraId ?? parsedOverview.jiraId,
        overviewLoginCondition: b.overviewLoginCondition ?? parsedOverview.overviewLoginCondition,
        overviewPlatform: b.overviewPlatform ?? parsedOverview.overviewPlatform,
        overviewModule: b.overviewModule ?? parsedOverview.overviewModule,
        overviewTrigger: b.overviewTrigger ?? parsedOverview.overviewTrigger,
        overviewIssue: b.overviewIssue ?? parsedOverview.overviewIssue,
        envPage: b.envPage ?? parsedOverview.envPage,
        envPlatform: b.envPlatform ?? parsedOverview.envPlatform,
        envOS: b.envOS ?? parsedOverview.envOS,
        envBrowser: b.envBrowser ?? parsedOverview.envBrowser,
        preconditions: b.preconditions ?? parsedOverview.preconditions,
        stepsToReproduce: b.stepsToReproduce ?? parsedOverview.stepsToReproduce,
        actualResult: b.actualResult ?? parsedOverview.actualResult,
        expectedResult: b.expectedResult ?? parsedOverview.expectedResult,
        userImpact: b.userImpact ?? parsedOverview.userImpact,
        businessImpact: b.businessImpact ?? parsedOverview.businessImpact,
        qaImpact: b.qaImpact ?? parsedOverview.qaImpact,
        technicalNotes: b.technicalNotes ?? parsedOverview.technicalNotes,
      };
    } else {
      input = {
        ...input,
        overviewLoginCondition: b.overviewLoginCondition ?? null,
        overviewPlatform: b.overviewPlatform ?? null,
        overviewModule: b.overviewModule ?? null,
        overviewTrigger: b.overviewTrigger ?? null,
        overviewIssue: b.overviewIssue ?? null,
        envPage: b.envPage ?? null,
        envPlatform: b.envPlatform ?? null,
        envOS: b.envOS ?? null,
        envBrowser: b.envBrowser ?? null,
        preconditions: b.preconditions ?? [],
        stepsToReproduce: b.stepsToReproduce ?? [],
        actualResult: b.actualResult ?? null,
        expectedResult: b.expectedResult ?? null,
        userImpact: b.userImpact ?? null,
        businessImpact: b.businessImpact ?? null,
        qaImpact: b.qaImpact ?? null,
        technicalNotes: b.technicalNotes ?? null,
      };
    }

    // Validate labelIds exist (optional robustness)
    let labelIds = input.labelIds ?? [];
    if (labelIds.length > 0) {
      const existing = await db.label.findMany({
        where: { id: { in: labelIds } },
        select: { id: true },
      });
      labelIds = existing.map((l) => l.id);
    }

    const created = await db.bug.create({
      data: {
        jiraId: input.jiraId,
        summary: input.summary,
        overviewLoginCondition: input.overviewLoginCondition,
        overviewPlatform: input.overviewPlatform,
        overviewModule: input.overviewModule,
        overviewTrigger: input.overviewTrigger,
        overviewIssue: input.overviewIssue,
        envPage: input.envPage,
        envPlatform: input.envPlatform,
        envOS: input.envOS,
        envBrowser: input.envBrowser,
        preconditions: JSON.stringify(input.preconditions ?? []),
        stepsToReproduce: JSON.stringify(input.stepsToReproduce ?? []),
        actualResult: input.actualResult,
        expectedResult: input.expectedResult,
        userImpact: input.userImpact,
        businessImpact: input.businessImpact,
        qaImpact: input.qaImpact,
        technicalNotes: input.technicalNotes,
        environmentStage: input.environmentStage ?? "dev",
        status: input.status ?? "open",
        priority: input.priority ?? "medium",
        assignee: input.assignee,
        reporter: input.reporter ?? "Anonymous",
        labels:
          labelIds.length > 0
            ? { create: labelIds.map((labelId) => ({ labelId })) }
            : undefined,
      },
      include: { labels: { include: { label: true } } },
    });

    // Record creation event
    await db.bugEvent.create({
      data: {
        bugId: created.id,
        type: "created",
        field: null,
        oldValue: null,
        newValue: created.id,
        actor: input.reporter ?? "Anonymous",
        summary: `Bug report created${created.jiraId ? ` (${created.jiraId})` : ""}`,
      },
    }).catch((e) => console.error("[create-event] failed:", e));

    return NextResponse.json(serializeBug(created), { status: 201 });
  } catch (err) {
    console.error("[POST /api/bugs] error:", err);
    return NextResponse.json(
      { error: "Failed to create bug" },
      { status: 500 },
    );
  }
}
