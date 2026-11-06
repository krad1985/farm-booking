"use client";

import { useState } from "react";

const STATUSES = ["SUBMITTED", "CONFIRMED", "PAID", "CANCELLED"];

export function RegistrationManager({ registrations, onRefresh }: { registrations: any[]; onRefresh: () => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function handleStatusChange(regId: string, newStatus: string) {
    setSaving(true);
    await fetch("/api/registrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: regId, status: newStatus }),
    });
    setSaving(false);
    onRefresh();
  }

  async function handleSaveEdit(regId: string) {
    setSaving(true);
    const formData = { ...JSON.parse(registrations.find((r) => r.id === regId)?.formData || "{}"), ...editData };
    await fetch("/api/registrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: regId, formData }),
    });
    setSaving(false);
    setEditingId(null);
    onRefresh();
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left">姓名</th>
            <th className="px-4 py-2 text-left">學員代號</th>
            <th className="px-4 py-2 text-left">電話</th>
            <th className="px-4 py-2 text-left">餐點</th>
            <th className="px-4 py-2 text-left">狀態</th>
            <th className="px-4 py-2 text-left">簽到</th>
            <th className="px-4 py-2 text-left">操作</th>
          </tr>
        </thead>
        <tbody>
          {registrations.map((r) => {
            const d = JSON.parse(r.formData || "{}");
            const isEditing = editingId === r.id;
            return (
              <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2">{isEditing ? <input value={editData.name ?? d.name ?? ""} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="w-24 rounded border px-1 py-0.5 text-xs" /> : (r.student?.name || d.name || "-")}</td>
                <td className="px-4 py-2">{r.student?.studentCode || "-"}</td>
                <td className="px-4 py-2">{isEditing ? <input value={editData.phone ?? d.phone ?? ""} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} className="w-28 rounded border px-1 py-0.5 text-xs" /> : (r.student?.phone || d.phone || "-")}</td>
                <td className="px-4 py-2">{isEditing ? <input value={editData.mealPreference ?? d.mealPreference ?? ""} onChange={(e) => setEditData({ ...editData, mealPreference: e.target.value })} className="w-16 rounded border px-1 py-0.5 text-xs" /> : (d.mealPreference || "-")}</td>
                <td className="px-4 py-2">
                  <select
                    value={r.status}
                    onChange={(e) => handleStatusChange(r.id, e.target.value)}
                    disabled={saving}
                    className="rounded border border-gray-300 px-1 py-0.5 text-xs"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-2">{r.checkedIn ? "✅" : "—"}</td>
                <td className="px-4 py-2">
                  {isEditing ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleSaveEdit(r.id)} disabled={saving} className="text-xs text-green-600 hover:underline">儲存</button>
                      <button onClick={() => setEditingId(null)} className="text-xs text-gray-500 hover:underline">取消</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingId(r.id); setEditData({}); }} className="text-xs text-blue-600 hover:underline">編輯</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {registrations.length === 0 && (
        <p className="p-4 text-center text-gray-400">尚無報名資料</p>
      )}
    </div>
  );
}
