import { prisma } from "@/lib/prisma";
import { ITINERARY_LABELS } from "@/lib/constants";
import { EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function VenuesPage() {
  const venues = await prisma.venue.findMany({
    include: {
      itineraryTemplates: { where: { isActive: true } },
      slots: {
        include: { itineraryTemplate: true, bookings: true },
        orderBy: { date: "asc" },
      },
    },
  });

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-3xl font-bold">場地與可預約時段</h1>
      {venues.map((v) => (
        <section key={v.id} className="mb-10">
          <h2 className="mb-2 text-2xl font-semibold">{v.name}</h2>
          <p className="mb-4 text-gray-600">{v.intro}</p>
          {v.slots.length === 0 ? (
            <EmptyState icon="📅" title="目前無可預約時段" description="此場地尚未開放預約時段，請稍後再查看。" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {v.slots.map((s) => {
                const used = s.bookings
                  .filter((b) => b.status !== "CANCELLED")
                  .reduce((a, b) => a + b.estimatedHeadcount, 0);
                const remaining = s.capacity - used;
                const pct = Math.round((used / s.capacity) * 100);
                const colorClass =
                  remaining <= 0
                    ? "bg-red-200 border-red-400"
                    : remaining < s.capacity * 0.2
                    ? "bg-amber-200 border-amber-400"
                    : "bg-green-200 border-green-400";
                const statusText =
                  remaining <= 0 ? "已滿" : remaining < s.capacity * 0.2 ? "即將滿" : "可預約";
                return (
                  <div key={s.id} className={`rounded-lg border-2 p-4 ${colorClass}`}>
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">
                        {new Date(s.date).toLocaleDateString("zh-TW")}{" "}
                        {new Date(s.date).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        remaining <= 0 ? "bg-red-600 text-white" :
                        remaining < s.capacity * 0.2 ? "bg-amber-600 text-white" :
                        "bg-green-600 text-white"
                      }`}>
                        {statusText}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-gray-700">{ITINERARY_LABELS[s.itineraryTemplate.type]}</div>
                    <div className="mt-2 text-sm font-medium">
                      容量 {s.capacity} · 已訂 {used} · 剩餘 {remaining}
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-gray-300">
                      <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    {s.mergeOpen && (
                      <div className="mt-2 text-xs font-medium text-blue-700">🤝 併團開放</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ))}
      {venues.length === 0 && (
        <EmptyState icon="🏔️" title="目前無場地" description="系統尚未設定任何場地。" />
      )}
    </div>
  );
}
