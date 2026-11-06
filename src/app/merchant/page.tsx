import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ITINERARY_LABELS } from "@/lib/constants";
import { MerchantFeatureIntroEditor } from "@/components/merchant-feature-intro-editor";
import { BookingApprovalButtons } from "@/components/booking-approval";
import { BackButton, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function MerchantPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = (session.user as any).role;
  if (role !== "MERCHANT_ADMIN" && role !== "SYSTEM_ADMIN") redirect("/dashboard");
  const venueId = (session.user as any).venueId;

  const venue = venueId
    ? await prisma.venue.findUnique({
        where: { id: venueId },
        include: { itineraryTemplates: true, slots: { include: { itineraryTemplate: true, bookings: { include: { registrations: true } } } } },
      })
    : null;

  if (!venue) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <BackButton href="/dashboard" label="返回儀表板" />
        <EmptyState icon="🏪" title="無管理場地" description="您尚未被指派管理任何場地，請聯繫系統管理員。" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <BackButton href="/dashboard" label="返回儀表板" />
      <h1 className="mb-2 text-3xl font-bold">{venue.name} · 商家管理</h1>

      {/* Pending bookings approval */}
      {(() => {
        const pendingBookings = venue.slots.flatMap((s: any) =>
          s.bookings.filter((b: any) => b.status === "PENDING").map((b: any) => ({ ...b, slot: s }))
        );
        if (pendingBookings.length === 0) return null;
        return (
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-semibold text-amber-700">⏳ 待審核預約 ({pendingBookings.length})</h2>
            <div className="space-y-3">
              {pendingBookings.map((b: any) => (
                <div key={b.id} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{b.slot.itineraryTemplate.title} · {b.classroom?.name}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(b.slot.date).toLocaleString("zh-TW")} · 預估 {b.estimatedHeadcount} 人
                      </div>
                    </div>
                    <BookingApprovalButtons bookingId={b.id} onDone={() => window.location.reload()} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })()}
      <div className="mb-4">
        <a href="/merchant/slots" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          📅 時段管理
        </a>
      </div>
      <p className="mb-2 text-gray-600">{venue.intro}</p>

      {/* Merchant-editable feature intro */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-3 text-lg font-semibold">場地特色介紹（編輯）</h3>
        <p className="mb-3 text-sm text-gray-500">此內容將顯示在報名頁面，讓學員了解場地特色。支援多行文字。</p>
        <MerchantFeatureIntroEditor venueId={venue.id} initialText={venue.featureIntro || ""} />
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">場次與報名彙總</h2>
        {venue.slots.length === 0 ? (
          <EmptyState icon="📅" title="目前無場次" description="尚未建立任何可預約場次。" />
        ) : (
          <div className="space-y-3">
            {venue.slots.map((s) => {
              const used = s.bookings.filter((b) => b.status !== "CANCELLED").reduce((a, b) => a + b.estimatedHeadcount, 0);
              const regTotal = s.bookings.reduce((a, b) => a + b.registrations.length, 0);
              const remaining = s.capacity - used;
              return (
                <div key={s.id} className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-sm transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {new Date(s.date).toLocaleString("zh-TW")} · {ITINERARY_LABELS[s.itineraryTemplate.type]}
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        容量 {s.capacity} · 預訂 {used} · 實際報名 {regTotal} · 剩餘 {remaining} · 併團 {s.mergeOpen ? "✅ 開放" : "❌ 關閉"}
                      </div>
                    </div>
                    <a
                      href={`/api/export?bookingId=${s.bookings[0]?.id}&type=aggregate`}
                      className="rounded-lg bg-blue-100 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-200 transition"
                    >
                      📥 匯出彙總
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">行程範本</h2>
        {venue.itineraryTemplates.length === 0 ? (
          <EmptyState icon="📋" title="目前無行程範本" description="尚未建立任何行程範本。" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {venue.itineraryTemplates.map((t) => (
              <div key={t.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="font-medium">{t.title}</div>
                <div className="text-sm text-gray-600">NT$ {t.price}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
