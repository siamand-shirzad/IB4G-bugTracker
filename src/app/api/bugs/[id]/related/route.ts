import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeBug } from "@/lib/serialize";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "5", 10),
      20,
    );

    const bug = await db.bug.findUnique({
      where: { id },
      select: {
        id: true,
        overviewModule: true,
        envPlatform: true,
        environmentStage: true,
        overviewIssue: true,
        labels: { select: { labelId: true } },
      },
    });
    if (!bug) {
      return NextResponse.json({ error: "Bug not found" }, { status: 404 });
    }

    const labelIds = bug.labels.map((l) => l.labelId);

    // Find bugs that share any of: module, platform, stage, issue, or any label
    // Score each candidate by how many dimensions match, then take top N.
    const candidates = await db.bug.findMany({
      where: {
        id: { not: id },
        OR: [
          ...(bug.overviewModule ? [{ overviewModule: bug.overviewModule }] : []),
          ...(bug.envPlatform ? [{ envPlatform: bug.envPlatform }] : []),
          { environmentStage: bug.environmentStage },
          ...(bug.overviewIssue ? [{ overviewIssue: bug.overviewIssue }] : []),
          ...(labelIds.length > 0
            ? [{ labels: { some: { labelId: { in: labelIds } } } }]
            : []),
        ],
      },
      include: { labels: { include: { label: true } } },
      take: 50,
    });

    const scored = candidates
      .map((c) => {
        let score = 0;
        if (bug.overviewModule && c.overviewModule === bug.overviewModule) score += 3;
        if (bug.envPlatform && c.envPlatform === bug.envPlatform) score += 2;
        if (c.environmentStage === bug.environmentStage) score += 1;
        if (bug.overviewIssue && c.overviewIssue === bug.overviewIssue) score += 4;
        const sharedLabels = c.labels.filter((l) =>
          labelIds.includes(l.labelId),
        ).length;
        score += sharedLabels * 2;
        return { bug: c, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return NextResponse.json({
      data: scored.map((s) => serializeBug(s.bug)),
      scores: scored.map((s) => s.score),
    });
  } catch (err) {
    console.error("[GET /api/bugs/[id]/related] error:", err);
    return NextResponse.json({ error: "Failed to fetch related bugs" }, { status: 500 });
  }
}
