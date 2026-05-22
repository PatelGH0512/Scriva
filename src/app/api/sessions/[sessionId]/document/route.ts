import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

// PUT /api/sessions/[sessionId]/document - Update document blocks
export async function PUT(req: Request, { params }: RouteParams) {
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

  // Upsert document
  const document = await prisma.document.upsert({
    where: { sessionId },
    update: { blocks: body.blocks ?? [] },
    create: {
      sessionId,
      blocks: body.blocks ?? [],
    },
  });

  // Update hasNotes flag
  const hasNotes = Array.isArray(body.blocks) && body.blocks.length > 0;
  await prisma.session.update({
    where: { id: sessionId },
    data: { hasNotes },
  });

  return NextResponse.json(document);
}
