import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ITINERARY_LABELS } from "@/lib/constants";

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
    return <div className="p-6">無管理場地</div>;
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-2 text-3xl font-bold">{venue.name} · 商家管理</h1>
      <p className="mb-6 text-gray-600">{venue.intro}</p>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">場次與報名彙總</h2>
        <div className="space-y-3">
          {venue.slots.map((s) => {
            const used = s.bookings.filter((b) => b.status !== "CANCELLED").reduce((a, b) => a + b.estimatedHeadcount, 0);
            const regTotal = s.bookings.reduce((a, b) => a + b.registrations.length, 0);
            return (
              <div key={s.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {new Date(s.date).toLocaleString("zh-TW")} · {ITINERARY_LABELS[s.itineraryTemplate.type]}
                    </div>
                    <div className="text-sm text-gray-600">
                      容量 {s.capacity} · 預訂 {used} · 實際報名 {regTotal} · 併團 {s.mergeOpen ? "開放" : "關閉"}
                    </div>
                  </div>
                  <a
                    href={`/api/export?bookingId=${s.bookings[0]?.id}&type=aggregate`}
                    className="rounded bg-blue-100 px-3 py-1 text-sm text-blue-700 hover:bg-blue-200"
                  >
                    匯出彙總
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">行程範本</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {venue.itineraryTemplates.map((t) => (
            <div key={t.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="font-medium">{t.title}</div>
              <div className="text-sm text-gray-600">NT$ {t.price}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}