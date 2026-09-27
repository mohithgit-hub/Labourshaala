import "dotenv/config";
import { PrismaClient } from "./src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString:
    process.env.DIRECT_URL || process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

try {
  await prisma.$connect();

  console.log("✅ Connected to Supabase PostgreSQL\n");

  console.log("Supabase counts:");
  console.log("Users:", await prisma.user.count());
  console.log("Worker profiles:", await prisma.workerProfile.count());
  console.log("Customer profiles:", await prisma.customerProfile.count());
  console.log("Worker skills:", await prisma.workerSkill.count());
  console.log("Bookings:", await prisma.booking.count());
} catch (error) {
  console.error("❌ Error:");
  console.error(error);
} finally {
  await prisma.$disconnect();
}