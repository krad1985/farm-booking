import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get("bookingId");
  if (!bookingId) return NextResponse.json({ error: "bookingId required" }, { status: 400 });

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { classroom: true, slot: { include: { venue: true } } },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = (session.user as any).role;
  const classroomId = (session.user as any).classroomId;
  const venueId = (session.user as any).venueId;

  // Access control
  const isClassroomOwner = role === "CLASSROOM_ADMIN" && classroomId === booking.classroomId;
  const isVenueOwner = role === "MERCHANT_ADMIN" && venueId === booking.slot.venueId;
  const isSystem = role === "SYSTEM_ADMIN";
  if (!isClassroomOwner && !isVenueOwner && !isSystem) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const registrations = await prisma.registration.findMany({
    where: { bookingId },
    include: { student: true },
    orderBy: { submittedAt: "desc" },
  });

  // Merchant (venue) users see only aggregate-safe data: strip personal formData fields
  const PERSONAL_FIELDS = ["idNumber", "insuranceNo", "emergencyContact", "emergencyPhone", "birthDate"];
  const sanitized = registrations.map((r) => {
    if (isVenueOwner && !isSystem && !isClassroomOwner) {
      const data = JSON.parse(r.formData || "{}");
      PERSONAL_FIELDS.forEach((f) => delete data[f]);
      return { ...r, formData: JSON.stringify(data) };
    }
    return r;
  });

  return NextResponse.json({ booking, registrations: sanitized });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { bookingId, studentId, formData } = body;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || !booking.registrationOpen) {
    return NextResponse.json({ error: "Registration not open" }, { status: 400 });
  }

  const reg = await prisma.registration.create({
    data: {
      bookingId,
      studentId: studentId || null,
      submittedById: (session.user as any).id,
      formData: JSON.stringify(formData || {}),
      status: "SUBMITTED",
    },
  });
  return NextResponse.json(reg, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id, formData, status } = body;
  const reg = await prisma.registration.update({
    where: { id },
    data: {
      ...(formData !== undefined && { formData: JSON.stringify(formData) }),
      ...(status && { status }),
    },
  });
  return NextResponse.json(reg);
}
