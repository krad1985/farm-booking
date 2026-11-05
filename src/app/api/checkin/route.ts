import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: check in a registration (by registration id or student code)
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "CLASSROOM_ADMIN" && role !== "SYSTEM_ADMIN" && role !== "MERCHANT_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { registrationId, studentCode, bookingId } = body;

  let reg;
  if (registrationId) {
    reg = await prisma.registration.findUnique({ where: { id: registrationId } });
  } else if (studentCode && bookingId) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { classroom: true } });
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    const student = await prisma.student.findFirst({ where: { classroomId: booking.classroomId, studentCode } });
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
    reg = await prisma.registration.findFirst({ where: { bookingId, studentId: student.id } });
  }

  if (!reg) return NextResponse.json({ error: "Registration not found" }, { status: 404 });

  const updated = await prisma.registration.update({
    where: { id: reg.id },
    data: { checkedIn: true, checkedInAt: new Date() },
    include: { student: true },
  });

  return NextResponse.json({ success: true, registration: updated });
}

// GET: check-in status for a booking
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get("bookingId");
  if (!bookingId) return NextResponse.json({ error: "bookingId required" }, { status: 400 });

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { registrations: { include: { student: true } } },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const total = booking.registrations.length;
  const checkedIn = booking.registrations.filter((r) => r.checkedIn).length;

  return NextResponse.json({ bookingId, total, checkedIn, registrations: booking.registrations });
}
