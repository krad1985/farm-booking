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
  const [submittedData, setSubmittedData] = useState<Record<string, any>>({});

  useEffect(() => {
    fetch(`/api/bookings?link=${link}`)
      .then((r) => r.json())
      .then((data) => {
        setBooking(data.booking);
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
      setSubmittedData({ ...formData });
      setDone(true);
    }
  }

  if (loading) return <div className="p-6 text-center text-gray-500">載入中...</div>;
  if (error && !booking) return <div className="p-6 text-center text-red-600">{error}</div>;

  if (done) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
          <div className="mb-3 text-5xl">✅</div>
          <h2 className="text-2xl font-bold text-green-700">報名成功！</h2>
          <p className="mt-2 text-gray-600">感謝您的報名，資料已成功送出。</p>
          <div className="mt-4 rounded-lg bg-white p-4 text-left text-sm">
            <div className="font-medium text-gray-700">報名摘要</div>
            <div className="mt-2 space-y-1 text-gray-600">
              <div>場地：{booking?.slot?.venue?.name}</div>
              <div>日期：{booking?.slot?.date ? new Date(booking.slot.date).toLocaleString("zh-TW") : ""}</div>
              <div>行程：{booking?.slot?.itineraryTemplate?.title}</div>
              {submittedData.name && <div>姓名：{submittedData.name}</div>}
            </div>
          </div>
          <a href="/student" className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            查看我的報名
          </a>
        </div>
      </div>
    );
  }

  const venue = booking?.slot?.venue;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-2 text-2xl font-bold">活動報名</h1>

      {/* Venue info card */}
      {venue && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">{venue.name}</h2>
          {venue.intro && <p className="mb-3 text-sm text-gray-600">{venue.intro}</p>}
          {venue.featureIntro && (
            <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="mb-1 text-sm font-semibold text-blue-800">場地特色介紹</div>
              <div className="whitespace-pre-wrap text-sm text-blue-900">{venue.featureIntro}</div>
            </div>
          )}
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div><span className="text-gray-500">日期：</span>{new Date(booking.slot.date).toLocaleString("zh-TW")}</div>
            <div><span className="text-gray-500">行程：</span>{booking.slot.itineraryTemplate.title}</div>
            {booking.slot.itineraryTemplate.price > 0 && (
              <div><span className="text-gray-500">費用：</span>NT$ {booking.slot.itineraryTemplate.price}</div>
            )}
            {venue.transportNote && (
              <div><span className="text-gray-500">交通：</span>{venue.transportNote}</div>
            )}
          </div>
          {venue.facilities && (
            <div className="mt-2 text-sm"><span className="text-gray-500">設施：</span>{venue.facilities}</div>
          )}
        </div>
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="">請選擇</option>
                {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : f.type === "textarea" ? (
              <textarea
                required={f.required}
                value={formData[f.key] || ""}
                onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                rows={3}
              />
            ) : (
              <input
                type={f.type === "date" ? "date" : "text"}
                required={f.required}
                value={formData[f.key] || ""}
                onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                onBlur={(e) => {
                  if (f.required && !e.target.value) {
                    e.target.classList.add("border-red-500");
                  } else {
                    e.target.classList.remove("border-red-500");
                  }
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            )}
          </div>
        ))}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {submitting ? "提交中..." : "提交報名"}
        </button>
      </form>
    </div>
  );
}
