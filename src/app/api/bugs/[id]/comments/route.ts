import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const bug = await db.bug.findUnique({ where: { id }, select: { id: true } });
    if (!bug) {
      return NextResponse.json({ error: "Bug not found" }, { status: 404 });
    }
    const comments = await db.bugComment.findMany({
      where: { bugId: id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({
      data: comments.map((c) => ({
        id: c.id,
        bugId: c.bugId,
        author: c.author,
        body: c.body,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[GET /api/bugs/[id]/comments] error:", err);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

const CreateSchema = z.object({
  author: z.string().min(1).max(60).optional(),
  body: z.string().min(1, "Comment body is required").max(4000),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid comment", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const bug = await db.bug.findUnique({ where: { id }, select: { id: true } });
    if (!bug) {
      return NextResponse.json({ error: "Bug not found" }, { status: 404 });
    }
    const comment = await db.bugComment.create({
      data: {
        bugId: id,
        author: parsed.data.author || "Anonymous",
        body: parsed.data.body,
      },
    });
    return NextResponse.json(
      {
        id: comment.id,
        bugId: comment.bugId,
        author: comment.author,
        body: comment.body,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/bugs/[id]/comments] error:", err);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
