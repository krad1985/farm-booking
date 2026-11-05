import Link from "next/link";

// Back button component
export function BackButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition"
    >
      <span>←</span> {label}
    </Link>
  );
}

// Status badge with color
export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    PENDING: "bg-amber-100 text-amber-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    REGISTRATION_OPEN: "bg-green-100 text-green-800",
    FINALIZED: "bg-gray-200 text-gray-800",
    CANCELLED: "bg-red-100 text-red-800",
    SUBMITTED: "bg-blue-100 text-blue-800",
    PAID: "bg-green-100 text-green-800",
  };
  const labels: Record<string, string> = {
    DRAFT: "草稿",
    PENDING: "待審核",
    CONFIRMED: "已確認",
    REGISTRATION_OPEN: "報名中",
    FINALIZED: "已結案",
    CANCELLED: "已取消",
    SUBMITTED: "已提交",
    PAID: "已繳費",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}>
      {labels[status] || status}
    </span>
  );
}

// Empty state component
export function EmptyState({ icon, title, description, actionHref, actionLabel }: {
  icon: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-12 text-center">
      <div className="mb-3 text-4xl">{icon}</div>
      <h3 className="mb-1 text-lg font-semibold text-gray-700">{title}</h3>
      <p className="mb-4 text-sm text-gray-500">{description}</p>
      {actionHref && actionLabel && (
        <a href={actionHref} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          {actionLabel}
        </a>
      )}
    </div>
  );
}

// Primary button
export function PrimaryButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition ${props.className || ""}`}
    >
      {children}
    </button>
  );
}

// Secondary button (link style)
export function SecondaryButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition ${props.className || ""}`}
    >
      {children}
    </button>
  );
}
