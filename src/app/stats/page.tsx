"use client";

import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { Ic, SectionTitle, Sheet } from "@/components/ui";
import { useApp, useDerived } from "@/lib/store";
import { ACHIEVEMENTS, shiftDate, todayStr, totalsFor } from "@/lib/utils";

export default function StatsPage() {
  return (
    <AppShell>
      <Stats />
    </AppShell>
  );
}

function Stats() {
  const { t, lang, entries, profile, days, toast, removeEntry } = useApp();
  const d = useDerived();
  const [range, setRange] = useState<"week" | "month">("week");
  const [reportOpen, setReportOpen] = useState(false);
  const [openDay, setOpenDay] = useState<string | null>(null);

  // always last 7 days for the weekly report
  const week = useMemo(() => {
    const out: { date: string; calories: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = shiftDate(todayStr(), -i);
      out.push({ date, calories: d.byDate.get(date) ?? 0 });
    }
    return out;
  }, [d.byDate]);

  const report = useMemo(() => {
    const goal = profile?.dailyCalories ?? 2200;
    const logged = week.filter((w) => w.calories > 0);
    const underDays = logged.filter((w) => w.calories <= goal).length;
    const avg = logged.length ? Math.round(logged.reduce((s, w) => s + w.calories, 0) / logged.length) : 0;
    const best =
      logged.filter((w) => w.calories <= goal).sort((a, b) => b.calories - a.calories)[0] ??
      logged.sort((a, b) => b.calories - a.calories)[0] ??
      null;
    const ratio = logged.length ? underDays / logged.length : 0;
    const stars = ratio >= 0.75 ? 3 : ratio >= 0.4 ? 2 : ratio > 0 ? 1 : 0;
    return { avg, logs: logged.length, underDays, best, stars };
  }, [week, profile?.dailyCalories]);

  const copyReport = async () => {
    const text = `Kalora 📊 ${report.avg} ${t("kcal")}/day · ${report.logs} 🍽️ · 🔥 ${d.streak.current} ${t("streak")}`;
    try {
      await navigator.clipboard.writeText(text);
      toast(t("copied"));
    } catch {
      toast(t("error_generic"), "error");
    }
  };

  const numDays = range === "week" ? 7 : 30;
  const today = todayStr();

  const series = useMemo(() => {
    const out: { date: string; calories: number; isToday: boolean }[] = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const date = shiftDate(today, -i);
      out.push({ date, calories: d.byDate.get(date) ?? 0, isToday: date === today });
    }
    return out;
  }, [numDays, today, d.byDate]);

  const goal = profile?.dailyCalories ?? 2200;
  const maxVal = Math.max(goal * 1.12, ...series.map((s) => s.calories), 100);
  const goalPct = Math.min(96, (goal / maxVal) * 100);

  const periodEntries = useMemo(() => {
    const set = new Set(series.map((s) => s.date));
    return entries.filter((e) => set.has(e.date));
  }, [series, entries]);

  const periodTotals = totalsFor(periodEntries);
  const loggedDays = series.filter((s) => s.calories > 0).length;
  const avg = loggedDays > 0 ? Math.round(series.reduce((s, x) => s + x.calories, 0) / loggedDays) : 0;

  const macroSum = periodTotals.protein * 4 + periodTotals.carbs * 4 + periodTotals.fat * 9;

  const weightPoints = useMemo(() => {
    return Object.values(days)
      .filter((x) => x.weightKg != null)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14);
  }, [days]);

  const hasData = entries.length > 0;

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-2">
        <h1 className="font-display text-[21px] font-extrabold tracking-tight">{t("stats_title")}</h1>
        <div className="flex items-center gap-2">
          <div className="seg">
            <button className={range === "week" ? "active" : ""} onClick={() => setRange("week")}>
              {t("stats_week")}
            </button>
            <button className={range === "month" ? "active" : ""} onClick={() => setRange("month")}>
              {t("stats_month")}
            </button>
          </div>
          <button
            onClick={() => setReportOpen(true)}
            aria-label={t("weekly_report")}
            className="grid h-[38px] w-[38px] place-items-center rounded-full border border-[var(--line-strong)] bg-[var(--card)] text-[var(--amber)] transition active:scale-90"
          >
            <Ic name="crown" size={17} strokeWidth={2.1} />
          </button>
        </div>
      </header>

      {!hasData && (
        <div className="card flex flex-col items-center gap-2 p-8 text-center">
          <span className="text-[34px]">🌱</span>
          <p className="text-[13.5px] font-bold text-[var(--muted)]">{t("stats_no_data")}</p>
        </div>
      )}

      {/* calorie chart */}
      <section className="card p-5">
        <div className="flex items-baseline justify-between">
          <p className="text-[13px] font-extrabold">{t("kcal")}</p>
          <p className="num text-[12px] font-bold text-[var(--muted)]">
            {t("stats_goal")}: {goal.toLocaleString()}
          </p>
        </div>
        <div className="relative mt-4 h-40">
          {/* goal line */}
          <div
            className="absolute inset-x-0 z-10 border-t border-dashed border-[var(--amber)]"
            style={{ bottom: `${goalPct}%` }}
          >
            <span className="absolute -top-2 end-0 rounded-full bg-[var(--amber-soft)] px-1.5 text-[9px] font-extrabold text-[var(--amber)]">
              {t("stats_goal")}
            </span>
          </div>
          <div className="flex h-full items-end gap-[3px]">
            {series.map((s) => {
              const h = maxVal > 0 ? Math.max(s.calories > 0 ? 4 : 0, (s.calories / maxVal) * 100) : 0;
              const over = s.calories > goal;
              return (
                <div key={s.date} className="group relative flex h-full flex-1 items-end" title={`${s.date} · ${s.calories} ${t("kcal")}`}>
                  <div
                    className="w-full rounded-t-[5px] transition-all duration-500"
                    style={{
                      height: `${h}%`,
                      background: over
                        ? "var(--coral)"
                        : s.isToday
                          ? "linear-gradient(180deg, var(--accent-strong), var(--accent))"
                          : "color-mix(in srgb, var(--accent) 55%, var(--card2))",
                      boxShadow: s.isToday ? "0 0 18px var(--accent-soft)" : undefined,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] font-bold text-[var(--faint)]">
          <span>{series[0]?.date.slice(5)}</span>
          <span>{t("today_word")}</span>
        </div>
      </section>

      {/* stat tiles */}
      <section className="grid grid-cols-2 gap-3">
        <StatTile icon="chart" color="var(--accent)" label={t("stats_avg")} value={avg.toLocaleString()} sub={t("kcal")} />
        <StatTile icon="utensils" color="var(--teal)" label={t("stats_logs")} value={String(periodEntries.length)} sub={range === "week" ? t("stats_week") : t("stats_month")} />
        <StatTile icon="flame" color="var(--amber)" label={t("stats_streak")} value={String(d.streak.current)} sub={t("streak")} />
        <StatTile icon="crown" color="var(--amber)" label={t("stats_best")} value={String(d.streak.best)} sub={t("streak")} />
      </section>

      {/* macro split + weight */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="card flex items-center gap-5 p-5">
          <MacroDonut
            protein={periodTotals.protein * 4}
            carbs={periodTotals.carbs * 4}
            fat={periodTotals.fat * 9}
          />
          <div className="space-y-2 text-[12px] font-bold">
            <p className="text-[13px] font-extrabold">{t("stats_macro_split")}</p>
            <p className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--coral)]" />
              {t("macro_protein")}
              <span className="num ms-auto text-[var(--muted)]">{macroSum > 0 ? Math.round(((periodTotals.protein * 4) / macroSum) * 100) : 0}%</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--amber)]" />
              {t("macro_carbs")}
              <span className="num ms-auto text-[var(--muted)]">{macroSum > 0 ? Math.round(((periodTotals.carbs * 4) / macroSum) * 100) : 0}%</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--teal)]" />
              {t("macro_fat")}
              <span className="num ms-auto text-[var(--muted)]">{macroSum > 0 ? Math.round(((periodTotals.fat * 9) / macroSum) * 100) : 0}%</span>
            </p>
          </div>
        </div>

        <div className="card p-5">
          <p className="flex items-center gap-2 text-[13px] font-extrabold">
            <Ic name="scale" size={15} className="text-[var(--teal)]" strokeWidth={2} />
            {t("check_in_weight")}
          </p>
          {weightPoints.length >= 2 ? (
            <>
              <WeightSpark points={weightPoints.map((p) => p.weightKg as number)} />
              <p className="num mt-1 text-end text-[15px] font-extrabold">
                {weightPoints[weightPoints.length - 1]?.weightKg?.toFixed(1)} {profile?.units === "imperial" ? "lb" : "kg"}
              </p>
            </>
          ) : (
            <div className="grid h-24 place-items-center text-[12.5px] font-bold text-[var(--faint)]">
              {t("stats_no_data")}
            </div>
          )}
        </div>
      </section>

      {/* history — last 7 days */}
      <section>
        <SectionTitle>{t("last_7_days")}</SectionTitle>
        <div className="card divide-y divide-[var(--line)] px-4">
          {[...week].reverse().map((day) => {
            const dayEntries = entries.filter((e) => e.date === day.date);
            const has = day.calories > 0;
            const open = openDay === day.date;
            const isToday = day.date === todayStr();
            return (
              <div key={day.date}>
                <button
                  onClick={() => has && setOpenDay(open ? null : day.date)}
                  disabled={!has}
                  className={`flex w-full items-center gap-3 py-3 text-start ${has ? "" : "opacity-45"}`}
                >
                  <div className="w-14 shrink-0">
                    <p className="text-[11.5px] font-extrabold">
                      {new Date(`${day.date}T12:00:00`).toLocaleDateString(lang, { weekday: "short" })}
                    </p>
                    <p className="num text-[11px] font-bold text-[var(--faint)]">
                      {new Date(`${day.date}T12:00:00`).toLocaleDateString(lang, { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="track h-[7px]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (day.calories / (profile?.dailyCalories || 1)) * 100)}%`,
                          background: day.calories > (profile?.dailyCalories ?? 0) ? "var(--coral)" : "var(--accent)",
                        }}
                      />
                    </div>
                    <p className="mt-1 text-[10.5px] font-bold text-[var(--faint)]">
                      {isToday ? t("today_word") : dayEntries.length > 0 ? `${dayEntries.length} 🍽️` : t("meal_empty")}
                    </p>
                  </div>
                  <span className="num shrink-0 text-[13px] font-extrabold">
                    {day.calories > 0 ? day.calories.toLocaleString() : "—"}
                  </span>
                  {has && (
                    <Ic
                      name="chev"
                      size={14}
                      strokeWidth={2.4}
                      className={`shrink-0 text-[var(--faint)] transition-transform duration-200 ${open ? "rotate-90 rtl:-rotate-90" : "rtl:rotate-180"}`}
                    />
                  )}
                </button>
                {open && dayEntries.length > 0 && (
                  <div className="mb-2.5 space-y-1 rounded-xl bg-[var(--card2)] p-2">
                    {dayEntries.map((e) => (
                      <div key={e.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
                        <span className="text-[15px]">{e.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12.5px] font-bold">{e.name}</p>
                          <p className="text-[10px] font-semibold text-[var(--faint)]">
                            {t(`meal_${e.meal === "snack" ? "snack" : e.meal}`)} · P{Math.round(e.protein)} C{Math.round(e.carbs)} F{Math.round(e.fat)}
                          </p>
                        </div>
                        <span className="num text-[12.5px] font-extrabold">{e.calories}</span>
                        <button
                          onClick={() => void removeEntry(e.id)}
                          aria-label={t("remove")}
                          className="grid h-6 w-6 place-items-center rounded-full text-[var(--faint)] transition hover:bg-[var(--coral-soft)] hover:text-[var(--coral)]"
                        >
                          <Ic name="trash" size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* achievements */}
      <section>
        <SectionTitle
          right={
            <span className="num rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] font-extrabold text-[var(--accent-strong)]">
              {d.unlockedIds.size}/{ACHIEVEMENTS.length}
            </span>
          }
        >
          {t("stats_achievements")}
        </SectionTitle>
        <div className="grid grid-cols-5 gap-2.5">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = d.unlockedIds.has(a.id);
            const icon = ACH_ICONS[a.id] ?? "medal";
            return (
              <div key={a.id} className="flex flex-col items-center gap-1.5 text-center">
                <div
                  className={`grid aspect-square w-full place-items-center rounded-2xl border transition ${
                    unlocked
                      ? "border-transparent"
                      : "border-[var(--line)] bg-[var(--card)] opacity-45"
                  }`}
                  style={
                    unlocked
                      ? { background: "linear-gradient(145deg, color-mix(in srgb, var(--amber) 30%, var(--card)), var(--card))", boxShadow: "0 4px 20px var(--amber-soft)" }
                      : undefined
                  }
                >
                  <Ic
                    name={unlocked ? icon : "lock"}
                    size={20}
                    strokeWidth={2}
                    className={unlocked ? "text-[var(--amber)]" : "text-[var(--faint)]"}
                  />
                </div>
                <p className="line-clamp-2 text-[9.5px] font-bold leading-tight text-[var(--muted)]">{t(a.nameKey)}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* weekly report */}
      <Sheet open={reportOpen} onClose={() => setReportOpen(false)} maxW="max-w-sm">
        <div className="p-5">
          <div
            className="relative overflow-hidden rounded-[22px] border p-5 text-center"
            style={{
              background: "linear-gradient(150deg, color-mix(in srgb, var(--accent) 14%, var(--card)), var(--card) 55%, color-mix(in srgb, var(--teal) 12%, var(--card)))",
              borderColor: "color-mix(in srgb, var(--accent) 30%, var(--line))",
            }}
          >
            <div className="flex items-center justify-between">
              <p className="font-display text-[16px] font-extrabold">📊 {t("weekly_report")}</p>
              <button
                onClick={() => setReportOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full border border-[var(--line)] text-[var(--muted)]"
                aria-label={t("close")}
              >
                <Ic name="x" size={14} />
              </button>
            </div>

            {/* stars */}
            <div className="mt-4 flex justify-center gap-2 text-[30px]">
              {[0, 1, 2].map((i) => (
                <span key={i} className={i < report.stars ? "" : "opacity-20 grayscale"}>
                  ⭐
                </span>
              ))}
            </div>
            <p className="mt-1 text-[11px] font-bold text-[var(--muted)]">
              {report.underDays}/7 {t("stats_goal").toLowerCase()} ✓
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-3">
                <p className="num font-display text-[20px] font-extrabold leading-none">{report.avg.toLocaleString()}</p>
                <p className="mt-1 text-[10px] font-bold text-[var(--faint)]">{t("stats_avg")} ({t("kcal")})</p>
              </div>
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-3">
                <p className="num font-display text-[20px] font-extrabold leading-none">{d.streak.current} 🔥</p>
                <p className="mt-1 text-[10px] font-bold text-[var(--faint)]">{t("stats_streak")}</p>
              </div>
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-3">
                <p className="num font-display text-[20px] font-extrabold leading-none">{report.logs}</p>
                <p className="mt-1 text-[10px] font-bold text-[var(--faint)]">{t("stats_logs")}</p>
              </div>
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-3">
                <p className="num font-display text-[20px] font-extrabold leading-none">
                  {report.best ? report.best.calories.toLocaleString() : "—"}
                </p>
                <p className="mt-1 text-[10px] font-bold text-[var(--faint)]">
                  {t("best_day")}
                  {report.best ? ` · ${new Date(`${report.best.date}T12:00:00`).toLocaleDateString(lang, { day: "numeric", month: "short" })}` : ""}
                </p>
              </div>
            </div>
          </div>

          <button onClick={() => void copyReport()} className="btn-accent mt-4 flex w-full items-center justify-center gap-2 py-3 text-[13.5px]">
            <Ic name="download" size={16} strokeWidth={2.2} />
            {t("copy_summary")}
          </button>
        </div>
      </Sheet>
    </div>
  );
}

const ACH_ICONS: Record<string, string> = {
  first: "utensils",
  streak3: "flame",
  streak7: "flame",
  streak30: "crown",
  clean: "leaf",
  water: "droplet",
  protein: "dumbbell",
  photo10: "camera",
  goal3: "target",
  hundred: "medal",
};

function StatTile({ icon, color, label, value, sub }: { icon: string; color: string; label: string; value: string; sub: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-[12px] font-bold text-[var(--muted)]">
        <Ic name={icon} size={15} strokeWidth={2.1} style={{ color }} />
        {label}
      </div>
      <p className="num mt-2 font-display text-[23px] font-extrabold leading-none">
        {value}
        <span className="ms-1.5 text-[11px] font-bold text-[var(--faint)]">{sub}</span>
      </p>
    </div>
  );
}

function MacroDonut({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const total = protein + carbs + fat;
  const segs = [
    { v: protein, c: "var(--coral)" },
    { v: carbs, c: "var(--amber)" },
    { v: fat, c: "var(--teal)" },
  ];
  const r = 34;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90 shrink-0">
      <circle cx="48" cy="48" r={r} fill="none" stroke="var(--surface)" strokeWidth="12" />
      {total > 0 &&
        segs.map((s, i) => {
          const frac = s.v / total;
          const dash = `${frac * c - 2} ${c - frac * c + 2}`;
          const off = -acc * c;
          acc += frac;
          return (
            <circle
              key={i}
              cx="48"
              cy="48"
              r={r}
              fill="none"
              stroke={s.c}
              strokeWidth="12"
              strokeDasharray={dash}
              strokeDashoffset={off}
              strokeLinecap="butt"
            />
          );
        })}
    </svg>
  );
}

function WeightSpark({ points }: { points: number[] }) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = Math.max(max - min, 0.5);
  const w = 200;
  const h = 64;
  const coords = points.map((p, i) => ({
    x: points.length > 1 ? (i / (points.length - 1)) * w : w / 2,
    y: 8 + (1 - (p - min) / span) * (h - 16),
  }));
  const path = coords.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-16 w-full" preserveAspectRatio="none">
      <path d={`${path} L${w},${h} L0,${h} Z`} fill="var(--teal-soft)" stroke="none" />
      <path d={path} fill="none" stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round" />
      {coords.length > 0 && (
        <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="3.5" fill="var(--teal)" />
      )}
    </svg>
  );
}
