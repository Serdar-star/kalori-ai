import Link from "next/link";

export default function NotFound() {
  return (
    <div className="ambient grid min-h-dvh place-items-center px-6" data-theme="dark">
      <div className="card max-w-sm p-8 text-center">
        <p className="text-[44px]">🥗</p>
        <h1 className="mt-3 font-display text-[22px] font-extrabold tracking-tight text-[var(--ink)]">404</h1>
        <p className="mt-1.5 text-[13px] font-semibold text-[var(--muted)]">
          This page isn&apos;t on the menu.
        </p>
        <Link href="/" className="btn-accent mt-5 inline-block px-6 py-2.5 text-[13px]">
          ← Kalora
        </Link>
      </div>
    </div>
  );
}
