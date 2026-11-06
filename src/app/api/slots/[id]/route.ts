import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  const venueId = (session.user as any).venueId;
  const slot = await prisma.slot.findUnique({ where: { id } });
  if (!slot) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (role !== "SYSTEM_ADMIN" && (role !== "MERCHANT_ADMIN" || venueId !== slot.venueId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const updated = await prisma.slot.update({
    where: { id },
    data: {
      ...(body.capacity !== undefined && { capacity: body.capacity }),
      ...(body.mergeOpen !== undefined && { mergeOpen: body.mergeOpen }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  const venueId = (session.user as any).venueId;
  const slot = await prisma.slot.findUnique({ where: { id } });
  if (!slot) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (role !== "SYSTEM_ADMIN" && (role !== "MERCHANT_ADMIN" || venueId !== slot.venueId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // Check if there are bookings
  const bookingCount = await prisma.booking.count({ where: { slotId: id } });
  if (bookingCount > 0) {
    return NextResponse.json({ error: "此時段已有預約，無法刪除" }, { status: 400 });
  }
  await prisma.slot.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
