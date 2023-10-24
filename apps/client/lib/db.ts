import { env } from "@/env";
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

export const db = globalThis.prisma || new PrismaClient();

if (env.NODE_ENV !== "production") globalThis.prisma = db;
