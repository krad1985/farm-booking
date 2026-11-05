import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get("bookingId");
  const type = searchParams.get("type") || "students"; // students | aggregate
  if (!bookingId) return NextResponse.json({ error: "bookingId required" }, { status: 400 });

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { classroom: true, slot: { include: { venue: true, itineraryTemplate: true } } },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = (session.user as any).role;
  const classroomId = (session.user as any).classroomId;
  const venueId = (session.user as any).venueId;
  const isClassroomOwner = role === "CLASSROOM_ADMIN" && classroomId === booking.classroomId;
  const isVenueOwner = role === "MERCHANT_ADMIN" && venueId === booking.slot.venueId;
  const isSystem = role === "SYSTEM_ADMIN";
  if (!isClassroomOwner && !isVenueOwner && !isSystem) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (type === "aggregate" || isVenueOwner) {
    // Aggregate export for merchant
    const regs = await prisma.registration.findMany({ where: { bookingId } });
    const mealCounts: Record<string, number> = {};
    let specialDiet = 0;
    regs.forEach((r) => {
      const d = JSON.parse(r.formData || "{}");
      const meal = d.mealPreference || "一般";
      mealCounts[meal] = (mealCounts[meal] || 0) + 1;
      if (d.specialDiet) specialDiet++;
    });
    const lines = [
      `場地,${booking.slot.venue.name}`,
      `日期,${new Date(booking.slot.date).toLocaleDateString("zh-TW")}`,
      `行程,${booking.slot.itineraryTemplate.title}`,
      `預估人數,${booking.estimatedHeadcount}`,
      `實際報名,${regs.length}`,
      "",
      "餐點統計",
      ...Object.entries(mealCounts).map(([k, v]) => `${k},${v}`),
      `特殊飲食,${specialDiet}`,
    ];
    const csv = lines.join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="aggregate-${bookingId}.csv"`,
      },
    });
  }

  // Student-level export (classroom only)
  if (!isClassroomOwner && !isSystem) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const regs = await prisma.registration.findMany({
    where: { bookingId },
    include: { student: true },
  });
  const header = ["姓名", "學員代號", "電話", "狀態", "提交時間"];
  const rows = regs.map((r) => {
    const d = JSON.parse(r.formData || "{}");
    return [
      r.student?.name || d.name || "",
      r.student?.studentCode || "",
      r.student?.phone || d.phone || "",
      r.status,
      new Date(r.submittedAt).toLocaleString("zh-TW"),
    ];
  });
  const csv = [header, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  return new NextResponse("\uFEFF" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="students-${bookingId}.csv"`,
    },
  });
}
