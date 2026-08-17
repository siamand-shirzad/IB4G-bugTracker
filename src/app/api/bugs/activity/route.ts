import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "20", 10),
      100,
    );
    // Cursor-based pagination: pass `before=<ISO date>` to fetch events older than that
    const before = url.searchParams.get("before");

    const rows = await db.bugEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: limit + 1, // fetch one extra to know if there's a next page
      ...(before ? { where: { createdAt: { lt: new Date(before) } } } : {}),
      include: {
        bug: {
          select: { summary: true, jiraId: true },
        },
      },
    });

    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor =
      hasMore && slice.length > 0
        ? slice[slice.length - 1].createdAt.toISOString()
        : null;

    const events = slice.map((r) => ({
      id: r.id,
      bugId: r.bugId,
      type: r.type,
      summary: r.summary,
      actor: r.actor,
      createdAt: r.createdAt.toISOString(),
      bugSummary: r.bug.summary,
      jiraId: r.bug.jiraId,
    }));

    return NextResponse.json({ events, hasMore, nextCursor });
  } catch (err) {
    console.error("[GET /api/bugs/activity] error:", err);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}
