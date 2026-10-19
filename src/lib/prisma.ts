import { PrismaClient } from "@prisma/client";

function cleanDatabaseUrl(raw?: string): string | undefined {
  if (!raw) return undefined;
  let url = raw.trim();
  // Strip outer quotes if pasted with quotes in Vercel UI
  if (
    (url.startsWith('"') && url.endsWith('"')) ||
    (url.startsWith("'") && url.endsWith("'"))
  ) {
    url = url.slice(1, -1).trim();
  }
  // Strip "DATABASE_URL=" prefix if pasted with key name
  if (url.startsWith("DATABASE_URL=")) {
    url = url.replace(/^DATABASE_URL=/, "").trim();
    if (
      (url.startsWith('"') && url.endsWith('"')) ||
      (url.startsWith("'") && url.endsWith("'"))
    ) {
      url = url.slice(1, -1).trim();
    }
  }
  return url;
}

const cleanedUrl = cleanDatabaseUrl(process.env.DATABASE_URL);
if (cleanedUrl && cleanedUrl !== process.env.DATABASE_URL) {
  process.env.DATABASE_URL = cleanedUrl;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const isProduction = process.env.NODE_ENV === "production";

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(cleanedUrl ? { datasources: { db: { url: cleanedUrl } } } : {}),
    // Silence query logs in production for perf; enable warnings in dev
    log: isProduction ? ["error"] : ["warn"],
  });

if (!isProduction) globalForPrisma.prisma = prisma;
