import { prisma } from "@/lib/prisma";
import { ITINERARY_LABELS } from "@/lib/constants";

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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {v.slots.map((s) => {
              const used = s.bookings
                .filter((b) => b.status !== "CANCELLED")
                .reduce((a, b) => a + b.estimatedHeadcount, 0);
              const remaining = s.capacity - used;
              const pct = Math.round((used / s.capacity) * 100);
              const color =
                remaining <= 0 ? "bg-red-100 border-red-300" :
                remaining < s.capacity * 0.2 ? "bg-yellow-100 border-yellow-300" :
                "bg-green-100 border-green-300";
              return (
                <div key={s.id} className={`rounded-lg border p-4 ${color}`}>
                  <div className="font-semibold">
                    {new Date(s.date).toLocaleDateString("zh-TW")}{" "}
                    {new Date(s.date).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="text-sm text-gray-700">{ITINERARY_LABELS[s.itineraryTemplate.type]}</div>
                  <div className="mt-2 text-sm">
                    容量 {s.capacity} · 已訂 {used} · 剩餘 {remaining}
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                  </div>
                  {s.mergeOpen && <div className="mt-2 text-xs text-blue-700">併團開放</div>}
                </div>
              );
            })}
          </div>
          {v.slots.length === 0 && <p className="text-gray-400">目前無可預約時段</p>}
        </section>
      ))}
    </div>
  );
}