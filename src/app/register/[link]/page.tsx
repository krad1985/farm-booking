"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Field = { key: string; label: string; type: string; required?: boolean; options?: string[] };

export default function RegisterPage() {
  const params = useParams();
  const link = params.link as string;
  const [booking, setBooking] = useState<any>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/bookings?link=${link}`)
      .then((r) => r.json())
      .then((data) => {
        setBooking(data.booking);
        // load form template fields
        const ft = data.formTemplate;
        if (ft?.fields) {
          setFields(typeof ft.fields === "string" ? JSON.parse(ft.fields) : ft.fields);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("找不到預約");
        setLoading(false);
      });
  }, [link]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: booking.id, formData }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "提交失敗");
    } else {
      setDone(true);
    }
  }

  if (loading) return <div className="p-6">載入中...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (done) return <div className="mx-auto max-w-md p-6 text-center"><h2 className="text-2xl font-bold text-green-600">報名成功！</h2><p className="mt-2 text-gray-600">感謝您的報名。</p></div>;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-2 text-2xl font-bold">活動報名</h1>
      {booking && (
        <p className="mb-6 text-gray-600">
          {booking.slot?.venue?.name} · {new Date(booking.slot?.date).toLocaleString("zh-TW")}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="mb-1 block text-sm font-medium">
              {f.label} {f.required && <span className="text-red-500">*</span>}
            </label>
            {f.type === "select" ? (
              <select
                required={f.required}
                value={formData[f.key] || ""}
                onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="">請選擇</option>
                {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : f.type === "textarea" ? (
              <textarea
                required={f.required}
                value={formData[f.key] || ""}
                onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                rows={3}
              />
            ) : (
              <input
                type={f.type === "date" ? "date" : "text"}
                required={f.required}
                value={formData[f.key] || ""}
                onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            )}
          </div>
        ))}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "提交中..." : "提交報名"}
        </button>
      </form>
    </div>
  );
}
