"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function CheckInPage() {
  const params = useParams();
  const bookingId = params.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function fetchStatus() {
    const res = await fetch(`/api/checkin?bookingId=${bookingId}`);
    const d = await res.json();
    setData(d);
    setLoading(false);
  }

  useEffect(() => { fetchStatus(); }, [bookingId]);

  async function handleCheckIn(registrationId: string) {
    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId }),
    });
    if (res.ok) fetchStatus();
  }

  if (loading) return <div className="p-6 text-center">載入中...</div>;
  if (!data) return <div className="p-6 text-center text-red-600">找不到資料</div>;

  const filtered = data.registrations.filter((r: any) => {
    if (!search) return true;
    const name = r.student?.name || JSON.parse(r.formData || "{}").name || "";
    return name.includes(search) || r.student?.studentCode?.includes(search);
  });

  const checkedCount = data.checkedIn;
  const totalCount = data.total;
  const pct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-2 text-2xl font-bold">簽到管理</h1>
      <div className="mb-4 rounded-lg bg-gray-100 p-3">
        <div className="flex items-center justify-between text-sm">
          <span>已簽到 {checkedCount} / {totalCount} 人</span>
          <span className="font-medium">{pct}%</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
          <div className="h-2 rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <input
        type="text"
        placeholder="搜尋姓名或學員代號..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />

      <div className="space-y-2">
        {filtered.map((r: any) => {
          const d = JSON.parse(r.formData || "{}");
          const name = r.student?.name || d.name || "未知名";
          return (
            <div
              key={r.id}
              className={`flex items-center justify-between rounded-lg border p-3 ${r.checkedIn ? "border-green-300 bg-green-50" : "border-gray-200 bg-white"}`}
            >
              <div>
                <div className="font-medium">{name}</div>
                <div className="text-xs text-gray-500">{r.student?.studentCode || ""} · {d.mealPreference || ""}</div>
              </div>
              <button
                onClick={() => !r.checkedIn && handleCheckIn(r.id)}
                disabled={r.checkedIn}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  r.checkedIn
                    ? "bg-green-200 text-green-800 cursor-default"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {r.checkedIn ? "✅ 已簽到" : "簽到"}
              </button>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="mt-4 text-center text-gray-400">沒有符合的學員</p>
      )}
    </div>
  );
}
