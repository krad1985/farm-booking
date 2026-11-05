import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  const venueId = (session.user as any).venueId;
  const classroomId = (session.user as any).classroomId;

  // Merchant stats
  if (role === "MERCHANT_ADMIN" && venueId) {
    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      include: {
        slots: {
          include: {
            itineraryTemplate: true,
            bookings: { include: { registrations: true } },
          },
        },
      },
    });
    if (!venue) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const totalSlots = venue.slots.length;
    const totalCapacity = venue.slots.reduce((a, s) => a + s.capacity, 0);
    const totalBooked = venue.slots.reduce((a, s) => a + s.bookings.filter((b) => b.status !== "CANCELLED").reduce((x, b) => x + b.estimatedHeadcount, 0), 0);
    const totalRegistered = venue.slots.reduce((a, s) => a + s.bookings.reduce((x, b) => x + b.registrations.length, 0), 0);
    const totalCheckedIn = venue.slots.reduce((a, s) => a + s.bookings.reduce((x, b) => x + b.registrations.filter((r) => r.checkedIn).length, 0), 0);

    // By itinerary type
    const byType: Record<string, { slots: number; booked: number; registered: number }> = {};
    for (const s of venue.slots) {
      const type = s.itineraryTemplate.type;
      if (!byType[type]) byType[type] = { slots: 0, booked: 0, registered: 0 };
      byType[type].slots++;
      byType[type].booked += s.bookings.filter((b) => b.status !== "CANCELLED").reduce((x, b) => x + b.estimatedHeadcount, 0);
      byType[type].registered += s.bookings.reduce((x, b) => x + b.registrations.length, 0);
    }

    // Monthly breakdown
    const monthly: Record<string, { slots: number; booked: number }> = {};
    for (const s of venue.slots) {
      const key = new Date(s.date).toLocaleDateString("zh-TW", { year: "numeric", month: "2-digit" });
      if (!monthly[key]) monthly[key] = { slots: 0, booked: 0 };
      monthly[key].slots++;
      monthly[key].booked += s.bookings.filter((b) => b.status !== "CANCELLED").reduce((x, b) => x + b.estimatedHeadcount, 0);
    }

    return NextResponse.json({
      type: "merchant",
      venueName: venue.name,
      totalSlots,
      totalCapacity,
      totalBooked,
      totalRegistered,
      totalCheckedIn,
      utilization: totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0,
      byType,
      monthly,
    });
  }

  // Classroom stats
  if (role === "CLASSROOM_ADMIN" && classroomId) {
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      include: {
        students: true,
        bookings: {
          include: { slot: { include: { venue: true, itineraryTemplate: true } }, registrations: true },
        },
      },
    });
    if (!classroom) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const totalStudents = classroom.students.length;
    const totalBookings = classroom.bookings.length;
    const totalRegistered = classroom.bookings.reduce((a, b) => a + b.registrations.length, 0);
    const totalCheckedIn = classroom.bookings.reduce((a, b) => a + b.registrations.filter((r) => r.checkedIn).length, 0);
    const totalPaid = classroom.bookings.reduce((a, b) => a + b.registrations.filter((r) => r.status === "PAID").length, 0);

    return NextResponse.json({
      type: "classroom",
      classroomName: classroom.name,
      totalStudents,
      totalBookings,
      totalRegistered,
      totalCheckedIn,
      totalPaid,
      registrationRate: totalStudents > 0 ? Math.round((totalRegistered / totalStudents) * 100) : 0,
      paymentRate: totalRegistered > 0 ? Math.round((totalPaid / totalRegistered) * 100) : 0,
      checkinRate: totalRegistered > 0 ? Math.round((totalCheckedIn / totalRegistered) * 100) : 0,
    });
  }

  // System admin stats
  if (role === "SYSTEM_ADMIN") {
    const venues = await prisma.venue.findMany({
      include: { slots: { include: { bookings: { include: { registrations: true } } } } },
    });
    const classrooms = await prisma.classroom.count();
    const students = await prisma.student.count();
    const bookings = await prisma.booking.count();
    const registrations = await prisma.registration.count();

    const totalCapacity = venues.reduce((a, v) => a + v.slots.reduce((x, s) => x + s.capacity, 0), 0);
    const totalBooked = venues.reduce((a, v) => a + v.slots.reduce((x, s) => x + s.bookings.filter((b) => b.status !== "CANCELLED").reduce((y, b) => y + b.estimatedHeadcount, 0), 0), 0);

    return NextResponse.json({
      type: "system",
      venues: venues.length,
      classrooms,
      students,
      bookings,
      registrations,
      totalCapacity,
      totalBooked,
      utilization: totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0,
    });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
