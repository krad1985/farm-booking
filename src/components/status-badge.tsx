const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  REGISTRATION_OPEN: "bg-green-100 text-green-800",
  FINALIZED: "bg-gray-200 text-gray-600",
  CANCELLED: "bg-red-100 text-red-800",
  SUBMITTED: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "草稿",
  PENDING: "待審核",
  CONFIRMED: "已確認",
  REGISTRATION_OPEN: "報名中",
  FINALIZED: "已結案",
  CANCELLED: "已取消",
  SUBMITTED: "已提交",
  PAID: "已繳費",
};

export function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || "bg-gray-100 text-gray-700";
  const label = STATUS_LABELS[status] || status;
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
