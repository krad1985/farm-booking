import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BackButton, EmptyState, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function StudentPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = (session.user as any).role;
  if (role !== "STUDENT" && role !== "CLASSROOM_ADMIN" && role !== "SYSTEM_ADMIN") redirect("/dashboard");

  const studentId = (session.user as any).id;
  const registrations = await prisma.registration.findMany({
    where: { submittedById: studentId },
    include: { booking: { include: { slot: { include: { venue: true, itineraryTemplate: true } } } } },
    orderBy: { submittedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl p-6">
      <BackButton href="/dashboard" label="返回儀表板" />
      <h1 className="mb-6 text-3xl font-bold">我的報名</h1>
      {registrations.length === 0 ? (
        <EmptyState icon="📝" title="尚無報名記錄" description="您還沒有報名任何活動。請向教室管理員索取報名連結。" />
      ) : (
        <div className="space-y-4">
          {registrations.map((r) => (
            <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{r.booking.slot.venue.name}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(r.booking.slot.date).toLocaleString("zh-TW")} · {r.booking.slot.itineraryTemplate.title}
                  </p>
                  <div className="mt-2">
                    <StatusBadge status={r.status} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
