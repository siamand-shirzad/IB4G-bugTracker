import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  try {
    const { id, commentId } = await params;
    const existing = await db.bugComment.findUnique({
      where: { id: commentId },
      select: { id: true, bugId: true },
    });
    if (!existing || existing.bugId !== id) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }
    await db.bugComment.delete({ where: { id: commentId } });
    return NextResponse.json({ success: true, id: commentId });
  } catch (err) {
    console.error("[DELETE /api/bugs/[id]/comments/[commentId]] error:", err);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}

const UpdateSchema = z.object({
  body: z.string().min(1).max(4000),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  try {
    const { id, commentId } = await params;
    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid comment body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const existing = await db.bugComment.findUnique({
      where: { id: commentId },
      select: { id: true, bugId: true },
    });
    if (!existing || existing.bugId !== id) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }
    const updated = await db.bugComment.update({
      where: { id: commentId },
      data: { body: parsed.data.body },
    });
    return NextResponse.json({
      id: updated.id,
      bugId: updated.bugId,
      author: updated.author,
      body: updated.body,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err) {
    console.error("[PUT /api/bugs/[id]/comments/[commentId]] error:", err);
    return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
  }
}
