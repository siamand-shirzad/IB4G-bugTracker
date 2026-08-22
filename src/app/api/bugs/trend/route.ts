import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { TrendPoint } from "@/lib/types";
import { format, subDays, startOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const days = Math.min(
      Math.max(parseInt(url.searchParams.get("days") || "14", 10), 1),
      90,
    );

    const today = startOfDay(new Date());
    const startDate = subDays(today, days - 1);

    // Fetch all bugs created within the window, plus events of type "status_changed"
    // where the new value is "closed" — that's our "closed" signal.
    const [createdBugs, closedEvents] = await Promise.all([
      db.bug.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
      }),
      db.bugEvent.findMany({
        where: {
          type: "status_changed",
          newValue: "closed",
          createdAt: { gte: startDate },
        },
        select: { createdAt: true },
      }),
    ]);

    // Build date buckets
    const buckets: Record<string, { opened: number; closed: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = subDays(today, days - 1 - i);
      const key = format(d, "yyyy-MM-dd");
      buckets[key] = { opened: 0, closed: 0 };
    }

    for (const b of createdBugs) {
      const key = format(b.createdAt, "yyyy-MM-dd");
      if (buckets[key]) buckets[key].opened++;
    }
    for (const e of closedEvents) {
      const key = format(e.createdAt, "yyyy-MM-dd");
      if (buckets[key]) buckets[key].closed++;
    }

    const points: TrendPoint[] = Object.entries(buckets).map(([date, v]) => ({
      date,
      opened: v.opened,
      closed: v.closed,
    }));

    return NextResponse.json({
      points,
      totalOpened: points.reduce((a, p) => a + p.opened, 0),
      totalClosed: points.reduce((a, p) => a + p.closed, 0),
    });
  } catch (err) {
    console.error("[GET /api/bugs/trend] error:", err);
    return NextResponse.json({ error: "Failed to fetch trend" }, { status: 500 });
  }
}
