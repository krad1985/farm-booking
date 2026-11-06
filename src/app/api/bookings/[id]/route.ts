import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  const venueId = (session.user as any).venueId;
  const classroomId = (session.user as any).classroomId;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { slot: true },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { status, registrationOpen, finalHeadcount, notes } = body;

  // Merchant can approve/reject
  if (role === "MERCHANT_ADMIN" || role === "SYSTEM_ADMIN") {
    if (venueId !== booking.slot.venueId && role !== "SYSTEM_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(registrationOpen !== undefined && { registrationOpen }),
        ...(finalHeadcount !== undefined && { finalHeadcount }),
        ...(notes !== undefined && { notes }),
      },
    });
    return NextResponse.json(updated);
  }

  // Classroom admin can update final headcount and notes
  if (role === "CLASSROOM_ADMIN" && classroomId === booking.classroomId) {
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        ...(finalHeadcount !== undefined && { finalHeadcount }),
        ...(notes !== undefined && { notes }),
        ...(status === "FINALIZED" && { status: "FINALIZED" }),
      },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
