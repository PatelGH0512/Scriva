import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

// GET /api/sessions/[sessionId]/messages - Get all messages for a session
export async function GET(req: Request, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

  // Verify session ownership
  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

// POST /api/sessions/[sessionId]/messages - Save messages (bulk upsert)
export async function POST(req: Request, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
  const body = await req.json();

  // Verify session ownership
  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const messages = body.messages as Array<{
    id: string;
    role: string;
    content: string;
    createdAt?: string;
  }>;

  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
  }

  // Delete existing messages and insert new ones (simpler than upsert for chat)
  await prisma.$transaction([
    prisma.chatMessage.deleteMany({ where: { sessionId } }),
    prisma.chatMessage.createMany({
      data: messages.map((m) => ({
        id: m.id,
        sessionId,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
      })),
    }),
  ]);

  return NextResponse.json({ success: true, count: messages.length });
}
