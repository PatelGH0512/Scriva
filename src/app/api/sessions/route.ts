import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/sessions - List all sessions for the current user
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await prisma.session.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      document: true,
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json(sessions);
}

// POST /api/sessions - Create a new session
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const title = body.title || "New Chat";

  // Ensure user exists in our DB (sync from Clerk)
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email: "", // Will be updated by webhook
    },
  });

  const session = await prisma.session.create({
    data: {
      userId,
      title,
      document: {
        create: { blocks: [] },
      },
    },
    include: { document: true },
  });

  return NextResponse.json(session, { status: 201 });
}
