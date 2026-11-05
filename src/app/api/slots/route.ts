import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const venueId = searchParams.get("venueId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = {};
  if (venueId) where.venueId = venueId;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }

  const slots = await prisma.slot.findMany({
    where,
    include: {
      venue: true,
      itineraryTemplate: true,
      bookings: { select: { id: true, estimatedHeadcount: true, status: true } },
    },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(slots);
}

export async function POST(req: Request) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "SYSTEM_ADMIN" && role !== "MERCHANT_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const slot = await prisma.slot.create({
    data: {
      venueId: body.venueId,
      itineraryTemplateId: body.itineraryTemplateId,
      date: new Date(body.date),
      capacity: body.capacity ?? 120,
      mergeOpen: body.mergeOpen ?? false,
      notes: body.notes,
    },
  });
  return NextResponse.json(slot, { status: 201 });
}
