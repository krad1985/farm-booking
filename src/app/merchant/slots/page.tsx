"use client";

import { useEffect, useState } from "react";
import { BackButton } from "@/components/ui";

export default function MerchantSlotsPage() {
  const [venues, setVenues] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [venueId, setVenueId] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

  // Form state
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("09:00");
  const [formTemplateId, setFormTemplateId] = useState("");
  const [formCapacity, setFormCapacity] = useState("120");
  const [formMergeOpen, setFormMergeOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/venues").then((r) => r.json()).then((data) => {
      setVenues(data);
      if (data.length > 0) setVenueId(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (venueId) {
      fetch(`/api/slots?venueId=${venueId}`).then((r) => r.json()).then(setSlots);
      fetch("/api/venues").then((r) => r.json()).then((data) => {
        const v = data.find((x: any) => x.id === venueId);
        if (v) setTemplates(v.itineraryTemplates || []);
      });
    }
  }, [venueId]);

  useEffect(() => { setLoading(false); }, [slots]);

  async function handleCreateSlot(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const dateTime = new Date(`${formDate}T${formTime}:00`);
    const res = await fetch("/api/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        venueId,
        itineraryTemplateId: formTemplateId,
        date: dateTime.toISOString(),
        capacity: parseInt(formCapacity),
        mergeOpen: formMergeOpen,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "建立失敗");
    } else {
      setShowForm(false);
      setFormDate("");
      fetch(`/api/slots?venueId=${venueId}`).then((r) => r.json()).then(setSlots);
    }
  }

  async function handleToggleMerge(slotId: string, current: boolean) {
    const res = await fetch(`/api/slots/${slotId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mergeOpen: !current }),
    });
    if (res.ok) {
      setSlots((prev) => prev.map((s) => s.id === slotId ? { ...s, mergeOpen: !current } : s));
    }
  }

  async function handleDeleteSlot(slotId: string) {
    if (!confirm("確定要刪除此時段？")) return;
    const res = await fetch(`/api/slots/${slotId}`, { method: "DELETE" });
    if (res.ok) {
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <BackButton href="/merchant" label="返回商家管理" />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">時段管理</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showForm ? "取消" : "+ 新增時段"}
        </button>
      </div>

      {/* Venue selector */}
      <div className="mb-4">
        <label className="mr-2 text-sm font-medium">場地：</label>
        <select value={venueId} onChange={(e) => setVenueId(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </div>

      {/* Create slot form */}
      {showForm && (
        <form onSubmit={handleCreateSlot} className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="font-semibold">新增可預約時段</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">日期</label>
              <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">時間</label>
              <input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">行程類型</label>
              <select value={formTemplateId} onChange={(e) => setFormTemplateId(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">請選擇</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.title} (NT$ {t.price})</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">容量（人）</label>
              <input type="number" value={formCapacity} onChange={(e) => setFormCapacity(e.target.value)} required min={1} max={500} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="mergeOpen" checked={formMergeOpen} onChange={(e) => setFormMergeOpen(e.target.checked)} />
            <label htmlFor="mergeOpen" className="text-sm">開放併團</label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? "建立中..." : "建立時段"}
          </button>
        </form>
      )}

      {/* Slots list */}
      {loading ? (
        <p className="text-gray-400">載入中...</p>
      ) : slots.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-12 text-center">
          <div className="mb-3 text-4xl">📅</div>
          <h3 className="mb-1 text-lg font-semibold text-gray-700">尚無時段</h3>
          <p className="text-sm text-gray-500">點擊「+ 新增時段」建立第一個可預約時段</p>
        </div>
      ) : (
        <div className="space-y-3">
          {slots.map((s) => {
            const used = s.bookings?.filter((b: any) => b.status !== "CANCELLED").reduce((a: number, b: any) => a + b.estimatedHeadcount, 0) || 0;
            const remaining = s.capacity - used;
            return (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 hover:shadow-sm transition">
                <div>
                  <div className="font-medium">{new Date(s.date).toLocaleString("zh-TW")} · {s.itineraryTemplate?.title}</div>
                  <div className="text-sm text-gray-600">
                    容量 {s.capacity} · 已訂 {used} · 剩餘 {remaining} · 併團 {s.mergeOpen ? "開放" : "關閉"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleMerge(s.id, s.mergeOpen)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      s.mergeOpen ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {s.mergeOpen ? "關閉併團" : "開放併團"}
                  </button>
                  <button
                    onClick={() => handleDeleteSlot(s.id)}
                    className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 transition"
                  >
                    刪除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
