import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ITINERARY_LABELS } from "@/lib/constants";
import { BackButton, StatusBadge, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

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
      <BackButton href="/dashboard" label="返回儀表板" />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">教室管理</h1>
        <a href="/classroom/new-booking" className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 transition">
          + 新增預約請求
        </a>
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          icon="📋"
          title="尚無預約"
          description="您還沒有建立任何預約請求。點擊下方按鈕開始建立第一筆預約。"
          actionHref="/classroom/new-booking"
          actionLabel="+ 新增預約請求"
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const regCount = b.registrations.length;
            return (
              <div key={b.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{b.slot.venue.name}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(b.slot.date).toLocaleString("zh-TW")} · {ITINERARY_LABELS[b.slot.itineraryTemplate.type]}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <StatusBadge status={b.status} />
                      <span className="text-sm text-gray-500">
                        預估 {b.estimatedHeadcount} 人 · 已報名 {regCount} 人
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a href={`/classroom/booking/${b.id}`} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                      查看報名
                    </a>
                    {b.registrationLink && (
                      <a href={`/register/${b.registrationLink}`} className="rounded-lg bg-green-100 px-3 py-1.5 text-sm text-green-700 hover:bg-green-200 transition">
                        報名連結
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
