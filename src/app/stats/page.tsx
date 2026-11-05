"use client";

import { useEffect, useState } from "react";
import { BackButton } from "@/components/ui";

export default function StatsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-center">載入中...</div>;
  if (!data || data.error) return <div className="p-6 text-center text-red-600">{data?.error || "無法載入"}</div>;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <BackButton href="/dashboard" label="返回儀表板" />
      <h1 className="mb-6 text-3xl font-bold">統計儀表板</h1>

      {data.type === "merchant" && <MerchantStats data={data} />}
      {data.type === "classroom" && <ClassroomStats data={data} />}
      {data.type === "system" && <SystemStats data={data} />}
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${color || ""}`}>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-3xl font-bold">{value}</div>
      {sub && <div className="mt-1 text-xs text-gray-400">{sub}</div>}
    </div>
  );
}

function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{value} / {max} ({pct}%)</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-gray-200">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MerchantStats({ data }: { data: any }) {
  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="總場次" value={data.totalSlots} />
        <StatCard label="總容量" value={data.totalCapacity} sub="人" />
        <StatCard label="預訂人數" value={data.totalBooked} sub="人" />
        <StatCard label="實際報名" value={data.totalRegistered} sub="人" />
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="簽到人數" value={data.totalCheckedIn} sub="人" color="border-green-200" />
        <StatCard label="場次利用率" value={`${data.utilization}%`} color="border-blue-200" />
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-3 font-semibold">依行程類型</h3>
        {Object.entries(data.byType).map(([type, info]: [string, any]) => (
          <ProgressBar key={type} label={type} value={info.registered} max={info.booked || 1} color="bg-blue-500" />
        ))}
      </div>
    </>
  );
}

function ClassroomStats({ data }: { data: any }) {
  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="學員總數" value={data.totalStudents} />
        <StatCard label="預約筆數" value={data.totalBookings} />
        <StatCard label="已報名" value={data.totalRegistered} sub="人" />
        <StatCard label="已繳費" value={data.totalPaid} sub="人" />
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="報名率" value={`${data.registrationRate}%`} color="border-blue-200" />
        <StatCard label="繳費率" value={`${data.paymentRate}%`} color="border-green-200" />
        <StatCard label="簽到率" value={`${data.checkinRate}%`} color="border-purple-200" />
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-3 font-semibold">簽到進度</h3>
        <ProgressBar label="簽到進度" value={data.totalCheckedIn} max={data.totalRegistered || 1} color="bg-green-500" />
      </div>
    </>
  );
}

function SystemStats({ data }: { data: any }) {
  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="場地數" value={data.venues} />
        <StatCard label="教室數" value={data.classrooms} />
        <StatCard label="學員數" value={data.students} />
        <StatCard label="預約數" value={data.bookings} />
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="報名數" value={data.registrations} />
        <StatCard label="總容量" value={data.totalCapacity} sub="人" />
        <StatCard label="場次利用率" value={`${data.utilization}%`} color="border-blue-200" />
      </div>
    </>
  );
}
