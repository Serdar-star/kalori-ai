"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import { createPortal } from "react-dom";
import { useApp } from "@/lib/store";

/* ---------------- Icons ---------------- */

const ICON_PATHS: Record<string, ReactNode> = {
  home: (
    <path d="M3.5 10.4 12 3.5l8.5 6.9V20a1 1 0 0 1-1 1h-4.6v-5.4h-5.8V21H4.5a1 1 0 0 1-1-1z" />
  ),
  chart: <path d="M5 20v-6M12 20V5.5M19 20v-9.5M3.5 20h17" />,
  user: (
    <>
      <circle cx="12" cy="8" r="3.8" />
      <path d="M4.5 20.5c1.4-3.8 4.6-5.3 7.5-5.3s6.1 1.5 7.5 5.3" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3.2l1.8-2.6h6L16.8 8H20a1 1 0 0 1 1 1v9.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13.2" r="3.4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="m6 6 12 12M18 6 6 18" />,
  droplet: <path d="M12 3.2s5.8 6 5.8 10a5.8 5.8 0 0 1-11.6 0c0-4 5.8-10 5.8-10z" />,
  crown: <path d="m4 16.5 1.6-8.4 4.6 3.6L12 5.5l1.8 6.2 4.6-3.6L20 16.5zM5.5 19.5h13" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M3.4 12h17.2M12 3.4c2.8 3.2 2.8 14 0 17.2M12 3.4c-2.8 3.2-2.8 14 0 17.2" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19" />
    </>
  ),
  moon: <path d="M20.5 13.2A8.5 8.5 0 1 1 10.8 3.5a6.8 6.8 0 0 0 9.7 9.7z" />,
  chev: <path d="m9 6 6 6-6 6" />,
  trash: <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5" />,
  download: <path d="M12 3.5v11m0 0-4-4m4 4 4-4M5 20.5h14" />,
  sparkle: (
    <path d="M12 4.5 13.7 9l4.5 1.7-4.5 1.7L12 16.9l-1.7-4.5L5.8 10.7 10.3 9zM19 3.5v3M20.5 5h-3" />
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.8" />
      <path d="m20 20-3.4-3.4" />
    </>
  ),
  image: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <circle cx="8.6" cy="9.6" r="1.5" />
      <path d="m20.5 15-4.8-4.8L7 19" />
    </>
  ),
  pencil: <path d="m4.5 19.5 1-3.8L16.7 4.5a2.05 2.05 0 0 1 2.9 2.9L8.3 18.5z" />,
  lock: (
    <>
      <rect x="5.5" y="11" width="13" height="9" rx="2" />
      <path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9.5a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5z" />
      <path d="M10 19a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  logout: (
    <>
      <path d="M9.5 4.5h-4a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h4" />
      <path d="m15 8 4 4-4 4M19 12H9.5" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4.5 7.5 7.5 5.6 7.5-5.6" />
    </>
  ),
  lock2: (
    <>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
      <path d="M8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7M12 14.5v2" />
    </>
  ),
  eye: (
    <>
      <path d="M2.8 12S6.5 5.8 12 5.8 21.2 12 21.2 12 17.5 18.2 12 18.2 2.8 12 2.8 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeoff: (
    <>
      <path d="M4 4l16 16M9.9 5.2A9.6 9.6 0 0 1 12 5c5.5 0 9.2 7 9.2 7a17.6 17.6 0 0 1-3.2 3.9M6.1 8.1A17.3 17.3 0 0 0 2.8 12s3.7 7 9.2 7a9 9 0 0 0 3.9-.9" />
      <path d="M10 10.2a3 3 0 0 0 4 4.2" />
    </>
  ),
  flame: (
    <path d="M12 21a6.5 6.5 0 0 0 6.5-6.5c0-3.6-2.4-5.6-3.6-8.5-1.8 1.2-2.4 2.6-2.4 4.2-1.2-.9-2-2.4-2-4.2-2.6 1.9-5 4.6-5 8.5A6.5 6.5 0 0 0 12 21z" />
  ),
  utensils: (
    <>
      <path d="M7 3v6a2.5 2.5 0 0 1-2.5 2.5V21M4.5 3v5M9.5 3v5" />
      <path d="M17.5 3c-2 2.4-2.5 5-2.5 7.5 0 1.7 1.1 2.5 2.5 2.5V21M17.5 3V13" />
    </>
  ),
  dumbbell: <path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.8" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7v5l3.2 2" />
    </>
  ),
  scale: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M12 4c2.8 0 5 2.2 5 5h-2.4a2.6 2.6 0 0 0-5.2 0H7c0-2.8 2.2-5 5-5zM12 9l1.4-1.6" />
    </>
  ),
  leaf: (
    <path d="M5 19C5 10 11 5 20 4c-.5 9-5 15-13 15M5 19c0-4 2-8 6-10.5M5 19l-1 1" />
  ),
  star: (
    <path d="m12 3.6 2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z" />
  ),
  bolt: <path d="M13 2.5 4.5 13.5H11L10 21.5l8.5-11H12z" />,
  medal: (
    <>
      <circle cx="12" cy="14.5" r="5" />
      <path d="m9.5 10.5-3-7M14.5 10.5l3-7M9 3.5h6M12 12.5l.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3z" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
    </>
  ),
  barcode: (
    <>
      <path d="M4 7v10M7 7v10M9.5 7v10M13 7v10M15.5 7v10M18.5 7v10M20.5 7v10" />
    </>
  ),
  shield: (
    <path d="M12 3.5 19.5 6.5v5.2c0 4.6-3 7.8-7.5 9.3-4.5-1.5-7.5-4.7-7.5-9.3V6.5z" />
  ),
  share: (
    <>
      <circle cx="18" cy="5.5" r="2.4" />
      <circle cx="6" cy="12" r="2.4" />
      <circle cx="18" cy="18.5" r="2.4" />
      <path d="m8.2 13.1 7.5 4M15.7 6.9l-7.5 4" />
    </>
  ),
  copy: (
    <>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
      <path d="M6 15.5H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8.5a2 2 0 0 1 2 2v1" />
    </>
  ),
  snowflake: (
    <path d="M12 3.5v17M5.5 7.5l13 9M18.5 7.5l-13 9M4.5 12h15" />
  ),
};

export function Ic({
  name,
  size = 20,
  className = "",
  strokeWidth = 1.9,
  style,
}: {
  name: keyof typeof ICON_PATHS | string;
  size?: number;
  className?: string;
  strokeWidth?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden
    >
      {ICON_PATHS[name] ?? null}
    </svg>
  );
}

/* ---------------- Sheet (bottom on mobile, centered on desktop) ---------------- */

export function Sheet({
  open,
  onClose,
  children,
  maxW = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxW?: string;
}) {
  // Portal to <body> so sheets always sit above the bottom nav & page layers
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[70] bg-black/65 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div className="pointer-events-none fixed inset-0 z-[80] flex items-end justify-center md:items-center">
            <motion.div
              className={`safe-bottom pointer-events-auto w-full ${maxW} max-h-[92dvh] overflow-y-auto no-scrollbar rounded-t-[28px] border border-[var(--line-strong)] bg-[var(--surface)] shadow-2xl md:mx-4 md:rounded-[28px]`}
              initial={{ y: 120, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 120, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
            >
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* ---------------- Toggle ---------------- */

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative h-[26px] w-[46px] shrink-0 rounded-full transition-colors duration-200"
      style={{
        background: checked ? "var(--accent)" : "var(--card2)",
        border: `1px solid ${checked ? "var(--accent)" : "var(--line-strong)"}`,
      }}
    >
      <motion.span
        className="absolute top-[2px] block h-[20px] w-[20px] rounded-full shadow"
        animate={{ left: checked ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        style={{ background: checked ? "var(--accent-ink)" : "var(--muted)" }}
      />
    </button>
  );
}

/* ---------------- Progress ring ---------------- */

export function Ring({
  pct,
  size = 190,
  stroke = 13,
  children,
  colors,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
  colors?: [string, string];
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, pct));
  const [c1, c2] = colors ?? ["var(--accent)", "var(--teal)"];
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="kalora-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--line)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#kalora-ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - clamped) }}
          transition={{ type: "spring", stiffness: 55, damping: 20 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/* ---------------- Macro bar ---------------- */

export function MacroBar({
  label,
  value,
  goal,
  color,
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
}) {
  const pct = goal > 0 ? Math.min(1, value / goal) : 0;
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="truncate text-[12px] font-bold text-[var(--muted)]">{label}</span>
        <span className="num text-[12px] font-bold">
          {Math.round(value)}
          <span className="text-[var(--faint)]">/{goal}g</span>
        </span>
      </div>
      <div className="track h-[7px]">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ type: "spring", stiffness: 60, damping: 20 }}
        />
      </div>
    </div>
  );
}

/* ---------------- Toasts ---------------- */

export function ToastHost() {
  const { toasts } = useApp();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[95] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ y: -24, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -16, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="flex items-center gap-2 rounded-full border px-4 py-2.5 text-[13px] font-bold shadow-xl backdrop-blur-md"
            style={{
              background: "color-mix(in srgb, var(--card2) 88%, transparent)",
              borderColor:
                t.type === "error" ? "var(--coral)" : t.type === "info" ? "var(--line-strong)" : "var(--accent)",
              color: "var(--ink)",
            }}
          >
            {t.type === "error" ? (
              <Ic name="x" size={14} className="text-[var(--coral)]" />
            ) : t.type === "info" ? (
              <Ic name="sparkle" size={14} className="text-[var(--muted)]" />
            ) : (
              <Ic name="check" size={14} className="text-[var(--accent)]" strokeWidth={2.6} />
            )}
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- Small pieces ---------------- */

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[15px] font-extrabold tracking-tight">{children}</h2>
      {right}
    </div>
  );
}

export function HealthPill({ score }: { score: number }) {
  const color = score >= 80 ? "var(--accent)" : score >= 60 ? "var(--amber)" : "var(--coral)";
  const soft = score >= 80 ? "var(--accent-soft)" : score >= 60 ? "var(--amber-soft)" : "var(--coral-soft)";
  return (
    <span
      className="num inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold"
      style={{ background: soft, color }}
    >
      <Ic name="sparkle" size={12} strokeWidth={2.4} />
      {score}
    </span>
  );
}
