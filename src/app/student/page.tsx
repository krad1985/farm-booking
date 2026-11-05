import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

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
      <h1 className="mb-6 text-3xl font-bold">我的報名</h1>
      {registrations.length === 0 && <p className="text-gray-400">尚無報名記錄</p>}
      <div className="space-y-4">
        {registrations.map((r) => (
          <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="font-semibold">{r.booking.slot.venue.name}</h3>
            <p className="text-sm text-gray-600">
              {new Date(r.booking.slot.date).toLocaleString("zh-TW")} · {r.booking.slot.itineraryTemplate.title}
            </p>
            <p className="mt-1 text-sm">狀態：{r.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}