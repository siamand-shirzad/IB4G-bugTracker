import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeBug } from "@/lib/serialize";
import type { BugStats } from "@/lib/types";

export async function GET() {
  try {
    const [total, open, closed, critical, byPlatformRows, recentRows] = await Promise.all([
      db.bug.count(),
      db.bug.count({ where: { status: "open" } }),
      db.bug.count({ where: { status: "closed" } }),
      db.bug.count({ where: { priority: "critical" } }),
      db.bug.groupBy({
        by: ["envPlatform"],
        _count: { _all: true },
      }),
      db.bug.findMany({
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: { labels: { include: { label: true } } },
      }),
    ]);

    const byStatusRows = await db.bug.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    const byPriorityRows = await db.bug.groupBy({
      by: ["priority"],
      _count: { _all: true },
    });
    const byStageRows = await db.bug.groupBy({
      by: ["environmentStage"],
      _count: { _all: true },
    });

    // Priority × Stage matrix for the heatmap
    const priorityStageRows = await db.bug.groupBy({
      by: ["priority", "environmentStage"],
      _count: { _all: true },
    });
    const priorityStageMatrix = priorityStageRows.map((r) => ({
      priority: r.priority,
      stage: r.environmentStage,
      count: r._count._all,
    }));

    // Assignee workload: group by assignee, count open vs closed
    const allBugs = await db.bug.findMany({
      select: { assignee: true, status: true },
    });
    const assigneeMap = new Map<string, { open: number; closed: number; total: number }>();
    for (const b of allBugs) {
      const key = b.assignee ?? "(unassigned)";
      const entry = assigneeMap.get(key) ?? { open: 0, closed: 0, total: 0 };
      entry.total++;
      if (b.status === "open") entry.open++;
      else entry.closed++;
      assigneeMap.set(key, entry);
    }
    const byAssignee = Array.from(assigneeMap.entries())
      .map(([name, v]) => ({ name: name === "(unassigned)" ? null : name, ...v }))
      .sort((a, b) => b.total - a.total);

    // Resolution time: for each closed bug, find the status_changed→closed event
    // and compute the delta from createdAt to that event.
    const closedBugs = await db.bug.findMany({
      where: { status: "closed" },
      select: { id: true, createdAt: true },
    });
    let resolutionTimes: number[] = [];
    if (closedBugs.length > 0) {
      const closeEvents = await db.bugEvent.findMany({
        where: {
          bugId: { in: closedBugs.map((b) => b.id) },
          type: "status_changed",
          newValue: "closed",
        },
        select: { bugId: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      });
      const closeEventByBug = new Map<string, Date>();
      for (const e of closeEvents) {
        // Take the FIRST close event per bug (earliest)
        if (!closeEventByBug.has(e.bugId)) {
          closeEventByBug.set(e.bugId, e.createdAt);
        }
      }
      const createdAtByBug = new Map(closedBugs.map((b) => [b.id, b.createdAt]));
      for (const [bugId, closedAt] of closeEventByBug) {
        const createdAt = createdAtByBug.get(bugId);
        if (createdAt) {
          const hours = (closedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
          if (hours >= 0) resolutionTimes.push(hours);
        }
      }
    }
    const resolutionTimeHours = {
      avg: resolutionTimes.length > 0 ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length : null,
      min: resolutionTimes.length > 0 ? Math.min(...resolutionTimes) : null,
      max: resolutionTimes.length > 0 ? Math.max(...resolutionTimes) : null,
      count: resolutionTimes.length,
    };

    const statusColors: Record<string, string> = {
      open: "var(--chart-4)",
      closed: "var(--chart-2)",
    };
    const priorityColors: Record<string, string> = {
      critical: "var(--chart-3)",
      high: "var(--chart-4)",
      medium: "var(--chart-5)",
      low: "var(--chart-1)",
    };
    const stageColors: Record<string, string> = {
      dev: "var(--chart-1)",
      staging: "var(--chart-2)",
      production: "var(--chart-3)",
    };

    const stats: BugStats = {
      total,
      open,
      closed,
      critical,
      byStatus: byStatusRows.map((r) => ({
        name: r.status,
        value: r._count._all,
        fill: statusColors[r.status] ?? "var(--chart-1)",
      })),
      byPriority: byPriorityRows.map((r) => ({
        name: r.priority,
        value: r._count._all,
        fill: priorityColors[r.priority] ?? "var(--chart-1)",
      })),
      byStage: byStageRows.map((r) => ({
        name: r.environmentStage,
        value: r._count._all,
        fill: stageColors[r.environmentStage] ?? "var(--chart-1)",
      })),
      byPlatform: byPlatformRows
        .filter((r) => r.envPlatform)
        .map((r) => ({ name: r.envPlatform ?? "Unknown", value: r._count._all })),
      byAssignee,
      priorityStageMatrix,
      resolutionTimeHours,
      recent: recentRows.map(serializeBug),
    };

    return NextResponse.json(stats);
  } catch (err) {
    console.error("[GET /api/bugs/stats] error:", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
