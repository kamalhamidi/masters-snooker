import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Mark notifications read: { ids: string[] } or { all: true } */
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  await prisma.notification.updateMany({
    where: {
      userId: session.user.id,
      ...(body.all ? {} : { id: { in: Array.isArray(body.ids) ? body.ids : [] } }),
    },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
