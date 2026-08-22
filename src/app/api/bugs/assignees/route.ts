import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Fetch all distinct non-null assignees with their bug counts
    const rows = await db.bug.findMany({
      where: { assignee: { not: null } },
      select: { assignee: true, status: true },
    });
    const map = new Map<string, { total: number; open: number; closed: number }>();
    for (const r of rows) {
      const name = r.assignee!;
      const entry = map.get(name) ?? { total: 0, open: 0, closed: 0 };
      entry.total++;
      if (r.status === "open") entry.open++;
      else entry.closed++;
      map.set(name, entry);
    }
    const assignees = Array.from(map.entries())
      .map(([name, counts]) => ({ name, ...counts }))
      .sort((a, b) => b.total - a.total);
    return NextResponse.json({ assignees });
  } catch (err) {
    console.error("[GET /api/bugs/assignees] error:", err);
    return NextResponse.json({ error: "Failed to fetch assignees" }, { status: 500 });
  }
}
