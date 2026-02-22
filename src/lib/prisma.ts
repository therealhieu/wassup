import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

function createPrismaClient(): PrismaClient {
	const raw = process.env.DATABASE_URL;
	if (!raw) throw new Error("DATABASE_URL environment variable is required");
	const url = raw.replace("file:", "");
	const adapter = new PrismaBetterSqlite3({ url });
	return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
