import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { serializeBug } from "@/lib/serialize";
import { recordEvent } from "@/lib/events";

const BulkSchema = z.object({
  bugIds: z.array(z.string()).min(1, "At least one bug ID is required"),
  action: z.discriminatedUnion("type", [
    z.object({ type: z.literal("status"), value: z.enum(["open", "closed"]) }),
    z.object({ type: z.literal("priority"), value: z.enum(["low", "medium", "high", "critical"]) }),
    z.object({ type: z.literal("stage"), value: z.enum(["dev", "staging", "production"]) }),
    z.object({ type: z.literal("addLabel"), value: z.string() }),
    z.object({ type: z.literal("removeLabel"), value: z.string() }),
    z.object({ type: z.literal("assignee"), value: z.string().nullable() }),
    z.object({ type: z.literal("delete") }),
  ]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = BulkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid bulk action", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { bugIds, action } = parsed.data;

    // Verify all bugs exist
    const bugs = await db.bug.findMany({
      where: { id: { in: bugIds } },
      select: { id: true, status: true, priority: true, environmentStage: true, assignee: true },
    });
    const validIds = bugs.map((b) => b.id);
    if (validIds.length === 0) {
      return NextResponse.json({ error: "No valid bugs found" }, { status: 404 });
    }

    if (action.type === "delete") {
      await db.bug.deleteMany({ where: { id: { in: validIds } } });
      return NextResponse.json({
        success: true,
        affected: validIds.length,
        action: "delete",
      });
    }

    if (action.type === "addLabel") {
      const label = await db.label.findUnique({
        where: { id: action.value },
        select: { id: true, name: true },
      });
      if (!label) {
        return NextResponse.json({ error: "Label not found" }, { status: 404 });
      }
      const existingLinks = await db.bugLabel.findMany({
        where: { bugId: { in: validIds }, labelId: label.id },
        select: { bugId: true },
      });
      const existingSet = new Set(existingLinks.map((l) => l.bugId));
      const toCreate = validIds
        .filter((id) => !existingSet.has(id))
        .map((bugId) => ({ bugId, labelId: label.id }));
      if (toCreate.length > 0) {
        // skipDuplicates isn't supported on SQLite createMany; we already filtered
        await db.bugLabel.createMany({ data: toCreate });
      }
      await Promise.all(
        validIds.map((bugId) =>
          recordEvent({
            bugId,
            type: "labels_changed",
            field: "labels",
            oldValue: null,
            newValue: label.name,
            summary: `Label "${label.name}" added (bulk)`,
          }),
        ),
      );
      const updated = await db.bug.findMany({
        where: { id: { in: validIds } },
        include: { labels: { include: { label: true } } },
      });
      return NextResponse.json({
        success: true,
        affected: validIds.length,
        action: "addLabel",
        data: updated.map(serializeBug),
      });
    }

    if (action.type === "removeLabel") {
      const label = await db.label.findUnique({
        where: { id: action.value },
        select: { id: true, name: true },
      });
      if (!label) {
        return NextResponse.json({ error: "Label not found" }, { status: 404 });
      }
      await db.bugLabel.deleteMany({
        where: { bugId: { in: validIds }, labelId: label.id },
      });
      await Promise.all(
        validIds.map((bugId) =>
          recordEvent({
            bugId,
            type: "labels_changed",
            field: "labels",
            oldValue: label.name,
            newValue: null,
            summary: `Label "${label.name}" removed (bulk)`,
          }),
        ),
      );
      const updated = await db.bug.findMany({
        where: { id: { in: validIds } },
        include: { labels: { include: { label: true } } },
      });
      return NextResponse.json({
        success: true,
        affected: validIds.length,
        action: "removeLabel",
        data: updated.map(serializeBug),
      });
    }

    if (action.type === "assignee") {
      const newAssignee = action.value;
      const beforeMap = new Map<string, string>();
      for (const b of bugs) {
        beforeMap.set(b.id, b.assignee ?? "");
      }
      await db.bug.updateMany({
        where: { id: { in: validIds } },
        data: { assignee: newAssignee },
      });
      await Promise.all(
        validIds.map((bugId) =>
          recordEvent({
            bugId,
            type: "assignee_changed",
            field: "assignee",
            oldValue: beforeMap.get(bugId) || null,
            newValue: newAssignee,
            summary: newAssignee
              ? `Assignee set to ${newAssignee} (bulk)`
              : `Assignee cleared (bulk)`,
          }),
        ),
      );
      const updated = await db.bug.findMany({
        where: { id: { in: validIds } },
        include: { labels: { include: { label: true } } },
      });
      return NextResponse.json({
        success: true,
        affected: validIds.length,
        action: "assignee",
        data: updated.map(serializeBug),
      });
    }

    // status / priority / stage
    const fieldConfig = {
      status: {
        dbField: "status" as const,
        eventType: "status_changed",
        label: "Status",
      },
      priority: {
        dbField: "priority" as const,
        eventType: "priority_changed",
        label: "Priority",
      },
      stage: {
        dbField: "environmentStage" as const,
        eventType: "stage_changed",
        label: "Environment Stage",
      },
    } as const;
    const cfg = fieldConfig[action.type];

    // Build a map of bugId → oldValue for event recording
    const beforeMap = new Map<string, string>();
    for (const b of bugs) {
      beforeMap.set(b.id, String(b[cfg.dbField] ?? ""));
    }

    await db.bug.updateMany({
      where: { id: { in: validIds } },
      data: { [cfg.dbField]: action.value },
    });

    await Promise.all(
      validIds.map((bugId) =>
        recordEvent({
          bugId,
          type: cfg.eventType,
          field: cfg.dbField,
          oldValue: beforeMap.get(bugId) ?? null,
          newValue: action.value,
          summary: `${cfg.label} changed to ${action.value} (bulk)`,
        }),
      ),
    );

    const updated = await db.bug.findMany({
      where: { id: { in: validIds } },
      include: { labels: { include: { label: true } } },
    });
    return NextResponse.json({
      success: true,
      affected: validIds.length,
      action: action.type,
      data: updated.map(serializeBug),
    });
  } catch (err) {
    console.error("[POST /api/bugs/bulk] error:", err);
    return NextResponse.json({ error: "Failed to apply bulk action" }, { status: 500 });
  }
}
