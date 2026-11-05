import Link from "next/link";

export function BackButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
    >
      <span aria-hidden="true">&larr;</span> {label}
    </Link>
  );
}
