import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeBug } from "@/lib/serialize";

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const format = (url.searchParams.get("format") || "csv").toLowerCase();
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "1000", 10),
      5000,
    );

    const rows = await db.bug.findMany({
      orderBy: { updatedAt: "desc" },
      take: limit,
      include: { labels: { include: { label: true } } },
    });
    const bugs = rows.map(serializeBug);

    if (format === "json") {
      return new NextResponse(JSON.stringify(bugs, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="ib4g-bugs-${Date.now()}.json"`,
        },
      });
    }

    // CSV format
    const headers = [
      "id",
      "jiraId",
      "summary",
      "status",
      "priority",
      "environmentStage",
      "envPlatform",
      "envOS",
      "envBrowser",
      "assignee",
      "reporter",
      "labels",
      "createdAt",
      "updatedAt",
    ];
    const csvLines = [headers.join(",")];
    for (const b of bugs) {
      const labels = b.labels.map((l) => l.name).join(" | ");
      const row = [
        b.id,
        b.jiraId ?? "",
        b.summary,
        b.status,
        b.priority,
        b.environmentStage,
        b.envPlatform ?? "",
        b.envOS ?? "",
        b.envBrowser ?? "",
        b.assignee ?? "",
        b.reporter,
        labels,
        b.createdAt,
        b.updatedAt,
      ].map((v) => escapeCsv(String(v)));
      csvLines.push(row.join(","));
    }

    return new NextResponse(csvLines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ib4g-bugs-${Date.now()}.csv"`,
      },
    });
  } catch (err) {
    console.error("[GET /api/bugs/export] error:", err);
    return NextResponse.json({ error: "Failed to export bugs" }, { status: 500 });
  }
}
