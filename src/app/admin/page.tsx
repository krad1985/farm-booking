import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = (session.user as any).role;
  if (role !== "SYSTEM_ADMIN" && role !== "RESERVATION_MANAGER") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-3xl font-bold">系統管理後台</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <a href="/venues" className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md">
          <h2 className="font-semibold">場地管理</h2>
          <p className="text-sm text-gray-500">查看與管理場地、時段</p>
        </a>
        <a href="/classroom" className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md">
          <h2 className="font-semibold">教室管理</h2>
          <p className="text-sm text-gray-500">查看教室預約與報名</p>
        </a>
        <a href="/merchant" className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md">
          <h2 className="font-semibold">商家管理</h2>
          <p className="text-sm text-gray-500">查看商家場地與彙總</p>
        </a>
      </div>
      <p className="mt-6 text-sm text-gray-400">
        完整的使用者管理、範本管理、稽核日誌等功能可依需求擴充。
      </p>
    </div>
  );
}
