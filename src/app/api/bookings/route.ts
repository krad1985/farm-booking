import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  const classroomId = (session.user as any).classroomId;
  const venueId = (session.user as any).venueId;

  const { searchParams } = new URL(req.url);
  const link = searchParams.get("link");
  const filterClassroom = searchParams.get("classroomId");
  const filterVenue = searchParams.get("venueId");

  if (link) {
    const booking = await prisma.booking.findUnique({
      where: { registrationLink: link },
      include: {
        classroom: true,
        slot: { include: { venue: true, itineraryTemplate: true } },
        formTemplate: true,
      },
    });
    if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
    let formTemplate = booking.formTemplate;
    if (!formTemplate) {
      formTemplate = await prisma.formTemplate.findFirst({ where: { isDefault: true } });
    }
    return NextResponse.json({ booking, formTemplate });
  }

  const where: any = {};
  if (role === "CLASSROOM_ADMIN") {
    where.classroomId = classroomId;
  } else if (role === "MERCHANT_ADMIN") {
    where.slot = { venueId: venueId };
  }
  if (filterClassroom) where.classroomId = filterClassroom;
  if (filterVenue) where.slot = { venueId: filterVenue };

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      classroom: true,
      slot: { include: { venue: true, itineraryTemplate: true } },
      registrations: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(bookings);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "CLASSROOM_ADMIN" && role !== "SYSTEM_ADMIN" && role !== "RESERVATION_MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();

  // Check slot capacity for merge
  const slot = await prisma.slot.findUnique({ where: { id: body.slotId } });
  if (!slot) return NextResponse.json({ error: "Slot not found" }, { status: 404 });

  const existingBooked = await prisma.booking.aggregate({
    where: { slotId: body.slotId, status: { not: "CANCELLED" } },
    _sum: { estimatedHeadcount: true },
  });
  const used = existingBooked._sum.estimatedHeadcount || 0;
  const remaining = slot.capacity - used;
  if (body.estimatedHeadcount > remaining) {
    return NextResponse.json(
      { error: `容量不足：剩餘 ${remaining} 人` },
      { status: 400 }
    );
  }

  const booking = await prisma.booking.create({
    data: {
      classroomId: body.classroomId || (session.user as any).classroomId,
      slotId: body.slotId,
      choiceSetId: body.choiceSetId || null,
      estimatedHeadcount: body.estimatedHeadcount || 0,
      status: "PENDING",
      registrationLink: nanoid(12),
      registrationDeadline: body.registrationDeadline ? new Date(body.registrationDeadline) : null,
      notes: body.notes,
      createdBy: (session.user as any).id,
    },
  });
  return NextResponse.json(booking, { status: 201 });
}
