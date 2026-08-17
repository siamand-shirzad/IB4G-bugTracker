import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeBug } from "@/lib/serialize";

type RawBugRow = {
  id: string;
  jiraId: string | null;
  summary: string;
  overviewLoginCondition: string | null;
  overviewPlatform: string | null;
  overviewModule: string | null;
  overviewTrigger: string | null;
  overviewIssue: string | null;
  envPage: string | null;
  envPlatform: string | null;
  envOS: string | null;
  envBrowser: string | null;
  preconditions: string | null;
  stepsToReproduce: string | null;
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
  createdAt: string;
  updatedAt: string;
};

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "10", 10),
      50,
    );

    if (!q) {
      return NextResponse.json({ data: [], q: "" });
    }

    // Case-insensitive search on SQLite via LOWER() in raw SQL.
    // We search across the most relevant text fields, then hydrate labels separately.
    const pattern = `%${q.toLowerCase()}%`;
    const rows = (await db.$queryRaw`
      SELECT * FROM Bug
      WHERE
        LOWER(summary) LIKE ${pattern}
        OR LOWER(COALESCE(jiraId, '')) LIKE ${pattern}
        OR LOWER(COALESCE(actualResult, '')) LIKE ${pattern}
        OR LOWER(COALESCE(expectedResult, '')) LIKE ${pattern}
        OR LOWER(COALESCE(technicalNotes, '')) LIKE ${pattern}
        OR LOWER(COALESCE(envPlatform, '')) LIKE ${pattern}
        OR LOWER(COALESCE(envPage, '')) LIKE ${pattern}
        OR LOWER(COALESCE(overviewModule, '')) LIKE ${pattern}
        OR LOWER(COALESCE(overviewIssue, '')) LIKE ${pattern}
        OR LOWER(COALESCE(overviewTrigger, '')) LIKE ${pattern}
      ORDER BY datetime(updatedAt) DESC
      LIMIT ${limit}
    `) as RawBugRow[];

    if (rows.length === 0) {
      return NextResponse.json({ data: [], q, total: 0 });
    }

    // Hydrate labels for each bug
    const ids = rows.map((r) => r.id);
    const labelRows = await db.bugLabel.findMany({
      where: { bugId: { in: ids } },
      include: { label: true },
    });
    const labelsByBug = new Map<string, typeof labelRows>();
    for (const l of labelRows) {
      const arr = labelsByBug.get(l.bugId) ?? [];
      arr.push(l);
      labelsByBug.set(l.bugId, arr);
    }

    // Normalize raw row dates (SQLite returns ISO strings via $queryRaw)
    const data = rows.map((r) => {
      const labels = (labelsByBug.get(r.id) ?? []).map((l) => l.label);
      return serializeBug({
        ...r,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
        labels: labels.map((label) => ({ label })),
      });
    });

    return NextResponse.json({ data, q, total: data.length });
  } catch (err) {
    console.error("[GET /api/bugs/search] error:", err);
    return NextResponse.json({ error: "Failed to search bugs" }, { status: 500 });
  }
}
