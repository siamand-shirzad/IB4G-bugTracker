import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { BugEvent } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const bug = await db.bug.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!bug) {
      return NextResponse.json({ error: "Bug not found" }, { status: 404 });
    }
    const rows = await db.bugEvent.findMany({
      where: { bugId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const events: BugEvent[] = rows.map((r) => ({
      id: r.id,
      bugId: r.bugId,
      type: r.type as BugEvent["type"],
      field: r.field,
      oldValue: r.oldValue,
      newValue: r.newValue,
      actor: r.actor,
      summary: r.summary,
      createdAt: r.createdAt.toISOString(),
    }));
    return NextResponse.json(events);
  } catch (err) {
    console.error("[GET /api/bugs/[id]/events] error:", err);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}
