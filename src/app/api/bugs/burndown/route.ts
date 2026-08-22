import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { format, subDays, startOfDay } from "date-fns";

/**
 * Compute a "burn-down" style series: for each day in the window, how many
 * bugs were OPEN at the end of that day.
 *
 * A bug is "open at end of day D" if:
 *   createdAt <= endOfDay(D) AND
 *   (it has no status_changed→closed event with createdAt <= endOfDay(D))
 *
 * We approximate by checking the FIRST close event per bug.
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const days = Math.min(
      Math.max(parseInt(url.searchParams.get("days") || "30", 10), 1),
      90,
    );

    const today = startOfDay(new Date());
    const startDate = subDays(today, days - 1);

    // Fetch all bugs created before the end of the window + all close events
    const [allBugs, closeEvents] = await Promise.all([
      db.bug.findMany({
        where: { createdAt: { lte: today } },
        select: { id: true, createdAt: true },
      }),
      db.bugEvent.findMany({
        where: {
          type: "status_changed",
          newValue: "closed",
          createdAt: { lte: today },
        },
        select: { bugId: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    // Map bugId → first close date (or null if never closed)
    const firstCloseByBug = new Map<string, Date>();
    for (const e of closeEvents) {
      if (!firstCloseByBug.has(e.bugId)) {
        firstCloseByBug.set(e.bugId, e.createdAt);
      }
    }
    const createdAtByBug = new Map(allBugs.map((b) => [b.id, b.createdAt]));

    // Build daily buckets
    const buckets: { date: string; open: number; closed: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = subDays(today, days - 1 - i);
      const endOfDay = new Date(d);
      endOfDay.setHours(23, 59, 59, 999);
      const key = format(d, "yyyy-MM-dd");

      let open = 0;
      let closed = 0;
      for (const [bugId, createdAt] of createdAtByBug) {
        if (createdAt <= endOfDay) {
          const closeDate = firstCloseByBug.get(bugId);
          if (closeDate && closeDate <= endOfDay) {
            closed++;
          } else {
            open++;
          }
        }
      }
      buckets.push({ date: key, open, closed });
    }

    const currentOpen = buckets[buckets.length - 1]?.open ?? 0;
    const peakOpen = Math.max(...buckets.map((b) => b.open));
    const totalClosed = closeEvents.length;

    return NextResponse.json({
      points: buckets,
      currentOpen,
      peakOpen,
      totalClosed,
    });
  } catch (err) {
    console.error("[GET /api/bugs/burndown] error:", err);
    return NextResponse.json({ error: "Failed to fetch burndown" }, { status: 500 });
  }
}
