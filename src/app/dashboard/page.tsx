import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROLE_LABELS } from "@/lib/constants";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = (session.user as any).role as string;
  const name = session.user.name || session.user.email;

  const cards = [
    { href: "/venues", label: "場地介紹與時段", desc: "查看可預約時段" },
  ];
  if (role === "SYSTEM_ADMIN" || role === "RESERVATION_MANAGER") {
    cards.push({ href: "/admin", label: "系統管理後台", desc: "使用者、場地、範本管理" });
  }
  if (role === "MERCHANT_ADMIN" || role === "SYSTEM_ADMIN") {
    cards.push({ href: "/merchant", label: "商家管理", desc: "場地、行程、容量、併團" });
  }
  if (role === "CLASSROOM_ADMIN" || role === "SYSTEM_ADMIN") {
    cards.push({ href: "/classroom", label: "教室管理", desc: "預約、報名表、名單匯出" });
  }
  if (role === "STUDENT") {
    cards.push({ href: "/student", label: "我的報名", desc: "填寫報名表、查看狀態" });
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">歡迎，{name}</h1>
        <p className="text-gray-500">角色：{ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <a
            key={c.href}
            href={c.href}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <h2 className="text-lg font-semibold">{c.label}</h2>
            <p className="mt-1 text-sm text-gray-500">{c.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}