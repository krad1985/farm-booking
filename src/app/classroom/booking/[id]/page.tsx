import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BOOKING_STATUS_LABELS } from "@/lib/constants";


export default async function ClassroomBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      classroom: true,
      slot: { include: { venue: true, itineraryTemplate: true } },
      registrations: { include: { student: true }, orderBy: { submittedAt: "desc" } },
    },
  });
  if (!booking) redirect("/classroom");

  const role = (session.user as any).role;
  const classroomId = (session.user as any).classroomId;
  if (role !== "SYSTEM_ADMIN" && classroomId !== booking.classroomId) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-2 text-3xl font-bold">報名詳情</h1>
      <p className="mb-6 text-gray-600">
        {booking.slot.venue.name} · {new Date(booking.slot.date).toLocaleString("zh-TW")} · {BOOKING_STATUS_LABELS[booking.status]}
      </p>

      <div className="mb-4 flex gap-3">
        <a
          href={`/api/export?bookingId=${id}&type=students`}
          className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          匯出名單 (CSV)
        </a>
        <span className="self-center text-sm text-gray-500">共 {booking.registrations.length} 筆報名</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">姓名</th>
              <th className="px-4 py-2 text-left">學員代號</th>
              <th className="px-4 py-2 text-left">電話</th>
              <th className="px-4 py-2 text-left">狀態</th>
              <th className="px-4 py-2 text-left">提交時間</th>
            </tr>
          </thead>
          <tbody>
            {booking.registrations.map((r) => {
              const d = JSON.parse(r.formData || "{}");
              return (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">{r.student?.name || d.name || "-"}</td>
                  <td className="px-4 py-2">{r.student?.studentCode || "-"}</td>
                  <td className="px-4 py-2">{r.student?.phone || d.phone || "-"}</td>
                  <td className="px-4 py-2">{r.status}</td>
                  <td className="px-4 py-2">{new Date(r.submittedAt).toLocaleString("zh-TW")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {booking.registrations.length === 0 && (
          <p className="p-4 text-center text-gray-400">尚無報名資料</p>
        )}
      </div>
    </div>
  );
}