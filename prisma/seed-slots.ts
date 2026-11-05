import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const venues = await prisma.venue.findMany({ include: { itineraryTemplates: true } });
  for (const v of venues) {
    for (const t of v.itineraryTemplates) {
      const d1 = new Date("2026-10-15T13:00:00");
      await prisma.slot.create({ data: { venueId: v.id, itineraryTemplateId: t.id, date: d1, capacity: t.type === "HALF_PM_DINNER" ? 80 : 120, mergeOpen: true } });
      const d2 = new Date("2026-11-01T09:00:00");
      await prisma.slot.create({ data: { venueId: v.id, itineraryTemplateId: t.id, date: d2, capacity: t.type === "HALF_AM_LUNCH" ? 100 : 120, mergeOpen: false } });
    }
  }
  console.log("Slots created");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
