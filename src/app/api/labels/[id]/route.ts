import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { serializeLabel } from "@/lib/serialize";
import { LABEL_COLORS } from "@/lib/constants";

const UpdateSchema = z.object({
  name: z.string().min(1).max(40).optional(),
  color: z.string().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const existing = await db.label.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Label not found" }, { status: 404 });
    }
    const data: { name?: string; color?: string } = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name.trim();
    if (parsed.data.color !== undefined) {
      data.color = LABEL_COLORS.includes(parsed.data.color as typeof LABEL_COLORS[number])
        ? parsed.data.color
        : "neutral";
    }
    const updated = await db.label.update({ where: { id }, data });
    return NextResponse.json(serializeLabel(updated));
  } catch (err) {
    console.error("[PUT /api/labels/[id]] error:", err);
    const message = err instanceof Error ? err.message : "Failed to update label";
    if (message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "A label with this name already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Failed to update label" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const existing = await db.label.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Label not found" }, { status: 404 });
    }
    await db.label.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error("[DELETE /api/labels/[id]] error:", err);
    return NextResponse.json({ error: "Failed to delete label" }, { status: 500 });
  }
}
