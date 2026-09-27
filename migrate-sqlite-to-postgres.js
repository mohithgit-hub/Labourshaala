import "dotenv/config";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "./src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlitePath = path.join(
  __dirname,
  "backend",
  "labourshaala.db"
);

const sqlite = new DatabaseSync(sqlitePath);

const adapter = new PrismaPg({
  connectionString:
    process.env.DIRECT_URL || process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("======================================");
  console.log("LabourShaala Booking Migration");
  console.log("SQLite → Supabase PostgreSQL");
  console.log("======================================\n");

  await prisma.$connect();

  console.log("✅ Connected to Supabase\n");

  const sqliteBookings = sqlite
    .prepare("SELECT * FROM bookings")
    .all();

  console.log(
    `SQLite bookings found: ${sqliteBookings.length}`
  );

  const postgresBookings = await prisma.booking.findMany({
    select: {
      id: true,
    },
  });

  const existingIds = new Set(
    postgresBookings.map((booking) => booking.id)
  );

  console.log(
    `Supabase bookings already present: ${postgresBookings.length}\n`
  );

  const missingBookings = sqliteBookings.filter(
    (booking) => !existingIds.has(booking.id)
  );

  console.log(
    `Bookings still needing migration: ${missingBookings.length}\n`
  );

  for (const booking of missingBookings) {
    console.log(`Migrating booking: ${booking.id}`);

    await prisma.booking.create({
      data: {
        id: booking.id,
        customerId: booking.customerId,
        workerId: booking.workerId,
        skillName: booking.skillName ?? null,
        status: booking.status,
        paymentMode: booking.paymentMode ?? null,
        paymentStatus: booking.paymentStatus ?? "Unpaid",
        rating: booking.rating ?? null,
        review: booking.review ?? null,
        createdAt: new Date(booking.createdAt),
        updatedAt: new Date(booking.updatedAt),
      },
    });

    console.log("✅ Migrated");
  }

  console.log("\n======================================");
  console.log("Final verification");
  console.log("======================================");

  console.log(
    "Users:",
    await prisma.user.count()
  );

  console.log(
    "Worker profiles:",
    await prisma.workerProfile.count()
  );

  console.log(
    "Customer profiles:",
    await prisma.customerProfile.count()
  );

  console.log(
    "Worker skills:",
    await prisma.workerSkill.count()
  );

  console.log(
    "Bookings:",
    await prisma.booking.count()
  );

  console.log("\n✅ Booking migration completed.");
}

main()
  .catch((error) => {
    console.error("\n❌ MIGRATION FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    sqlite.close();
    await prisma.$disconnect();
  });