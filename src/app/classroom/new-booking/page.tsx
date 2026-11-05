"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewBookingPage() {
  const router = useRouter();
  const [venues, setVenues] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [venueId, setVenueId] = useState("");
  const [slotId, setSlotId] = useState("");
  const [headcount, setHeadcount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/venues").then((r) => r.json()).then(setVenues);
  }, []);

  useEffect(() => {
    if (venueId) {
      fetch(`/api/slots?venueId=${venueId}`).then((r) => r.json()).then(setSlots);
    } else {
      setSlots([]);
    }
  }, [venueId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId, estimatedHeadcount: parseInt(headcount) || 0 }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "建立失敗");
    } else {
      router.push("/classroom");
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">新增預約請求</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">選擇場地</label>
          <select value={venueId} onChange={(e) => setVenueId(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-3 py-2">
            <option value="">請選擇</option>
            {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">選擇時段</label>
          <select value={slotId} onChange={(e) => setSlotId(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-3 py-2">
            <option value="">請選擇</option>
            {slots.map((s) => (
              <option key={s.id} value={s.id}>
                {new Date(s.date).toLocaleString("zh-TW")} · {s.itineraryTemplate?.title} (剩餘 {s.capacity - s.bookedCount})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">初估人數</label>
          <input type="number" value={headcount} onChange={(e) => setHeadcount(e.target.value)} required min={1} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={submitting} className="w-full rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {submitting ? "提交中..." : "提交預約請求"}
        </button>
      </form>
    </div>
  );
}
