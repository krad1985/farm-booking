import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BOOKING_STATUS_LABELS, ITINERARY_LABELS } from "@/lib/constants";

export default async function ClassroomPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = (session.user as any).role;
  if (role !== "CLASSROOM_ADMIN" && role !== "SYSTEM_ADMIN") redirect("/dashboard");
  const classroomId = (session.user as any).classroomId;

  const bookings = await prisma.booking.findMany({
    where: classroomId ? { classroomId } : {},
    include: {
      classroom: true,
      slot: { include: { venue: true, itineraryTemplate: true } },
      registrations: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-3xl font-bold">教室管理</h1>
      <div className="mb-4">
        <a href="/classroom/new-booking" className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          + 新增預約請求
        </a>
      </div>
      <div className="space-y-4">
        {bookings.map((b) => {
          const regCount = b.registrations.length;
          return (
            <div key={b.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{b.slot.venue.name}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(b.slot.date).toLocaleString("zh-TW")} · {ITINERARY_LABELS[b.slot.itineraryTemplate.type]}
                  </p>
                  <p className="mt-1 text-sm">
                    狀態：{BOOKING_STATUS_LABELS[b.status]} ·
                    預估 {b.estimatedHeadcount} 人 · 已報名 {regCount} 人
                  </p>
                </div>
                <div className="flex gap-2">
                  <a href={`/classroom/booking/${b.id}`} className="rounded bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200">
                    查看報名
                  </a>
                  {b.registrationLink && (
                    <a href={`/register/${b.registrationLink}`} className="rounded bg-green-100 px-3 py-1 text-sm text-green-700 hover:bg-green-200">
                      報名連結
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {bookings.length === 0 && <p className="text-gray-400">尚無預約</p>}
      </div>
    </div>
  );
}