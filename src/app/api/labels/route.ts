import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { serializeLabel } from "@/lib/serialize";
import { LABEL_COLORS } from "@/lib/constants";

export async function GET() {
  try {
    const labels = await db.label.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(labels.map(serializeLabel));
  } catch (err) {
    console.error("[GET /api/labels] error:", err);
    return NextResponse.json({ error: "Failed to fetch labels" }, { status: 500 });
  }
}

const CreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(40),
  color: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const color = parsed.data.color && LABEL_COLORS.includes(parsed.data.color as typeof LABEL_COLORS[number])
      ? parsed.data.color
      : "neutral";
    const created = await db.label.create({
      data: { name: parsed.data.name.trim(), color },
    });
    return NextResponse.json(serializeLabel(created), { status: 201 });
  } catch (err) {
    console.error("[POST /api/labels] error:", err);
    const message = err instanceof Error ? err.message : "Failed to create label";
    // Unique constraint
    if (message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "A label with this name already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Failed to create label" }, { status: 500 });
  }
}
