import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString:
    process.env.DIRECT_URL || process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

export default prisma;