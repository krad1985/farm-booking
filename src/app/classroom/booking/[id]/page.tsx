import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BOOKING_STATUS_LABELS } from "@/lib/constants";
import QRCode from "qrcode";
import { RegistrationManager } from "@/components/registration-manager";
import { BackButton, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

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

  const checkinUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/checkin/${booking.id}`;
  const qrDataUrl = await QRCode.toDataURL(checkinUrl, { width: 200, margin: 2 });

  return (
    <div className="mx-auto max-w-6xl p-6">
      <BackButton href="/classroom" label="返回教室管理" />

      <div className="mb-6">
        <h1 className="text-3xl font-bold">報名詳情</h1>
        <p className="mt-1 text-gray-600">
          {booking.slot.venue.name} · {new Date(booking.slot.date).toLocaleString("zh-TW")}
        </p>
        <div className="mt-2">
          <StatusBadge status={booking.status} />
        </div>
      </div>

      {/* Summary card */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-sm text-gray-500">行程</div>
          <div className="font-semibold">{booking.slot.itineraryTemplate.title}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-sm text-gray-500">預估人數</div>
          <div className="font-semibold">{booking.estimatedHeadcount} 人</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-sm text-gray-500">已報名</div>
          <div className="font-semibold">{booking.registrations.length} 人</div>
        </div>
      </div>

      <div className="mb-4 flex gap-3">
        <a
          href={`/api/export?bookingId=${id}&type=students`}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
        >
          📥 匯出名單 (CSV)
        </a>
        {booking.registrationLink && (
          <a
            href={`/register/${booking.registrationLink}`}
            target="_blank"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            🔗 開啟報名連結
          </a>
        )}
        <a
          href={`/checkin/${id}`}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition"
        >
          ✅ 簽到管理
        </a>
        <span className="self-center text-sm text-gray-500">共 {booking.registrations.length} 筆報名</span>
      </div>

      {/* QR Code for check-in */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">簽到 QR Code</h3>
        <div className="flex items-center gap-4">
          <img src={qrDataUrl} alt="簽到 QR Code" className="h-32 w-32" />
          <div className="text-sm text-gray-600">
            <p>掃描此 QR Code 進入簽到頁面</p>
            <p className="mt-1 text-xs text-gray-400">或直接訪問：/checkin/{id}</p>
          </div>
        </div>
      </div>

      <RegistrationManager registrations={booking.registrations} onRefresh={() => window.location.reload()} />
    </div>
  );
}
