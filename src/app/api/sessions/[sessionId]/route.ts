import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

// GET /api/sessions/[sessionId] - Get a single session with document and messages
export async function GET(req: Request, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId },
    include: {
      document: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json(session);
}

// PATCH /api/sessions/[sessionId] - Update session (title, hasNotes)
export async function PATCH(req: Request, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
  const body = await req.json();

  // Verify ownership
  const existing = await prisma.session.findFirst({
    where: { id: sessionId, userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const session = await prisma.session.update({
    where: { id: sessionId },
    data: {
      title: body.title ?? existing.title,
      hasNotes: body.hasNotes ?? existing.hasNotes,
    },
  });

  return NextResponse.json(session);
}

// DELETE /api/sessions/[sessionId] - Delete a session
export async function DELETE(req: Request, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

  // Verify ownership
  const existing = await prisma.session.findFirst({
    where: { id: sessionId, userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  await prisma.session.delete({ where: { id: sessionId } });

  return NextResponse.json({ success: true });
}
