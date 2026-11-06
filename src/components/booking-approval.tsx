"use client";

import { useState } from "react";

export function BookingApprovalButtons({ bookingId, onDone }: { bookingId: string; onDone: () => void }) {
  const [loading, setLoading] = useState(false);

  async function handleAction(action: "confirm" | "reject") {
    if (action === "reject" && !confirm("確定拒絕此預約？")) return;
    setLoading(true);
    await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        action === "confirm"
          ? { status: "CONFIRMED", registrationOpen: true }
          : { status: "CANCELLED" }
      ),
    });
    setLoading(false);
    onDone();
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleAction("confirm")}
        disabled={loading}
        className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        ✅ 確認
      </button>
      <button
        onClick={() => handleAction("reject")}
        disabled={loading}
        className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
      >
        ❌ 拒絕
      </button>
    </div>
  );
}
