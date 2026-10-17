import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const t0 = Date.now();
  let dbStatus = "unknown";
  let dbLatencyMs = -1;
  let dbError: string | null = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
    dbLatencyMs = Date.now() - t0;
  } catch (err: unknown) {
    dbStatus = "error";
    dbError = err instanceof Error ? err.message : String(err);
  }

  const envCheck = {
    DATABASE_URL_SET: Boolean(process.env.DATABASE_URL),
    DATABASE_URL_POOLER_PORT: process.env.DATABASE_URL
      ? process.env.DATABASE_URL.includes(":6543")
        ? "6543 (transaction)"
        : process.env.DATABASE_URL.includes(":5432")
          ? "5432 (session)"
          : "custom"
      : "not set",
    AUTH_SECRET_SET: Boolean(process.env.AUTH_SECRET),
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST ?? "not set",
    NODE_ENV: process.env.NODE_ENV,
  };

  return NextResponse.json({
    status: dbStatus === "connected" ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
      error: dbError,
    },
    environment: envCheck,
  });
}
