"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Ic, Sheet } from "@/components/ui";
import { useApp } from "@/lib/store";

const px = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=160&w=160`;

const AVATARS = [
  px(27590337), px(19130868), px(4770328), px(6428279), px(13950821), px(7090155),
  px(8743917), px(15550301), px(10593645), px(32986463), px(8697543), px(29253297),
];

const GOALS = [
  { id: "lose", icon: "leaf", key: "goal_lose", descKey: "goal_lose_d", cal: 1800 },
  { id: "maintain", icon: "scale", key: "goal_maintain", descKey: "goal_maintain_d", cal: 2200 },
  { id: "gain", icon: "dumbbell", key: "goal_gain", descKey: "goal_gain_d", cal: 2600 },
] as const;

const ACTIVITY = [
  { id: 1, factor: 1.375, key: "act_1" },
  { id: 2, factor: 1.55, key: "act_2" },
  { id: 3, factor: 1.725, key: "act_3" },
] as const;

export function Onboarding() {
  const { t, updateProfile, celebrate, toast } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [goal, setGoal] = useState<string>("maintain");
  const [calories, setCalories] = useState(2200);

  // smart calculator state
  const [sex, setSex] = useState<"m" | "f">("m");
  const [age, setAge] = useState("25");
  const [height, setHeight] = useState("175");
  const [weight, setWeight] = useState("70");
  const [activity, setActivity] = useState(2);
  const [calcApplied, setCalcApplied] = useState(false);
  const [macroGoals, setMacroGoals] = useState<{ p: number; c: number; f: number; w: number } | null>(null);

  const [busy, setBusy] = useState(false);

  const tdee = useMemo(() => {
    const a = parseInt(age, 10);
    const h = parseInt(height, 10);
    const w = parseInt(weight, 10);
    if (!a || !h || !w || a < 10 || a > 100 || h < 100 || h > 250 || w < 30 || w > 250) return null;
    const bmr = 10 * w + 6.25 * h - 5 * a + (sex === "m" ? 5 : -161);
    const factor = ACTIVITY.find((x) => x.id === activity)?.factor ?? 1.55;
    const base = bmr * factor;
    const adj = goal === "lose" ? base - 400 : goal === "gain" ? base + 300 : base;
    return {
      kcal: Math.round(Math.max(1200, adj) / 50) * 50,
      w,
    };
  }, [age, height, weight, sex, activity, goal]);

  const applyCalc = () => {
    if (!tdee) return;
    const w = tdee.w;
    const p = Math.round(Math.min(250, w * (goal === "lose" ? 2.2 : goal === "gain" ? 2.0 : 1.8)));
    const f = Math.round(Math.min(150, (tdee.kcal * 0.25) / 9));
    const c = Math.round(Math.max(60, (tdee.kcal - p * 4 - f * 9) / 4));
    setCalories(tdee.kcal);
    setMacroGoals({ p, c, f, w: Math.round(Math.min(5000, w * 35) / 250) * 250 });
    setCalcApplied(true);
    setStep(3);
  };

  const finish = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await updateProfile({
        name: name.trim() || "Guest",
        avatar,
        goal,
        dailyCalories: calories,
        ...(calcApplied && macroGoals
          ? { proteinGoal: macroGoals.p, carbsGoal: macroGoals.c, fatGoal: macroGoals.f, waterGoalMl: macroGoals.w }
          : {}),
        onboarded: true,
      });
      celebrate(true);
    } catch {
      toast(t("error_generic"), "error");
    } finally {
      setBusy(false);
    }
  };

  const numInput = "input w-full px-3 py-2.5 text-center text-[15px] font-extrabold";

  return (
    <Sheet open onClose={() => undefined} maxW="max-w-md">
      <div className="p-6 pb-8">
        {/* progress */}
        <div className="mb-6 flex justify-center gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="h-[5px] rounded-full transition-all duration-300"
              style={{ width: i === step ? 26 : 8, background: i <= step ? "var(--accent)" : "var(--card2)" }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
              <h2 className="text-center font-display text-[21px] font-extrabold tracking-tight">{t("onb_title")}</h2>
              <p className="mt-1 text-center text-[13px] font-semibold text-[var(--muted)]">{t("onb_sub")}</p>

              <p className="mb-2.5 mt-6 text-[12px] font-bold text-[var(--muted)]">{t("onb_pick_avatar")}</p>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAvatar(a)}
                    className={`aspect-square overflow-hidden rounded-2xl border transition active:scale-90 ${
                      avatar === a ? "border-[var(--accent)] shadow-[0_0_0_3px_var(--accent-soft)]" : "border-[var(--line)] opacity-80"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>

              <p className="mb-2.5 mt-5 text-[12px] font-bold text-[var(--muted)]">{t("name_label")}</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("onb_name_ph")}
                maxLength={24}
                className="input w-full px-4 py-3.5 text-[15px] font-bold"
              />

              <button onClick={() => setStep(1)} className="btn-accent mt-6 w-full py-3.5 text-[15px]">
                {t("onb_continue")}
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
              <h2 className="text-center font-display text-[21px] font-extrabold tracking-tight">{t("onb_goal_q")}</h2>
              <div className="mt-6 space-y-2.5">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      setGoal(g.id);
                      setCalories(g.cal);
                    }}
                    className={`flex w-full items-center gap-3.5 rounded-2xl border p-4 text-start transition active:scale-[0.98] ${
                      goal === g.id ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--line)] bg-[var(--card)]"
                    }`}
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--card2)] text-[var(--accent-strong)]">
                      <Ic name={g.icon} size={20} strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14.5px] font-extrabold">{t(g.key)}</span>
                      <span className="block text-[12px] font-semibold text-[var(--muted)]">{t(g.descKey)}</span>
                    </span>
                    {goal === g.id && <Ic name="check" size={18} className="text-[var(--accent)]" strokeWidth={2.8} />}
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(2)} className="btn-accent mt-6 w-full py-3.5 text-[15px]">
                {t("onb_continue")}
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
              <h2 className="text-center font-display text-[21px] font-extrabold tracking-tight">{t("calc_title")}</h2>
              <p className="mt-1 text-center text-[12px] font-semibold text-[var(--muted)]">{t("calc_sub")}</p>

              {/* sex */}
              <div className="seg mt-5 w-full">
                <button className={`flex-1 ${sex === "m" ? "active" : ""}`} onClick={() => setSex("m")}>
                  {t("calc_male")}
                </button>
                <button className={`flex-1 ${sex === "f" ? "active" : ""}`} onClick={() => setSex("f")}>
                  {t("calc_female")}
                </button>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2.5">
                <div>
                  <p className="mb-1 text-center text-[10.5px] font-bold text-[var(--faint)]">{t("calc_age")}</p>
                  <input value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 2))} inputMode="numeric" className={numInput} />
                </div>
                <div>
                  <p className="mb-1 text-center text-[10.5px] font-bold text-[var(--faint)]">{t("calc_height")} (cm)</p>
                  <input value={height} onChange={(e) => setHeight(e.target.value.replace(/\D/g, "").slice(0, 3))} inputMode="numeric" className={numInput} />
                </div>
                <div>
                  <p className="mb-1 text-center text-[10.5px] font-bold text-[var(--faint)]">{t("calc_weight")} (kg)</p>
                  <input value={weight} onChange={(e) => setWeight(e.target.value.replace(/\D/g, "").slice(0, 3))} inputMode="numeric" className={numInput} />
                </div>
              </div>

              <p className="mb-1.5 mt-4 text-[10.5px] font-bold text-[var(--faint)]">{t("calc_activity")}</p>
              <div className="grid grid-cols-3 gap-2">
                {ACTIVITY.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setActivity(a.id)}
                    className={`rounded-xl border px-2 py-2.5 text-[10.5px] font-bold leading-tight transition ${
                      activity === a.id ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]" : "border-[var(--line)] text-[var(--muted)]"
                    }`}
                  >
                    {t(a.key)}
                  </button>
                ))}
              </div>

              {/* live preview */}
              <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--card)] py-3">
                <Ic name="bolt" size={15} className="text-[var(--accent)]" strokeWidth={2.2} />
                <span className="num font-display text-[20px] font-extrabold">{tdee ? tdee.kcal.toLocaleString() : "—"}</span>
                <span className="text-[11px] font-bold text-[var(--faint)]">{t("kcal")}</span>
              </div>

              <button onClick={applyCalc} disabled={!tdee} className="btn-accent mt-4 w-full py-3.5 text-[15px]">
                {t("calc_apply")}
              </button>
              <button
                onClick={() => setStep(3)}
                className="mt-2 w-full py-2 text-[12.5px] font-bold text-[var(--faint)] transition hover:text-[var(--muted)]"
              >
                {t("calc_skip")}
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
              <h2 className="text-center font-display text-[21px] font-extrabold tracking-tight">{t("onb_cal_q")}</h2>
              {calcApplied && (
                <p className="mt-1 flex items-center justify-center gap-1.5 text-center text-[11.5px] font-bold text-[var(--accent-strong)]">
                  <Ic name="sparkle" size={13} strokeWidth={2.4} />
                  {t("calc_applied")}
                </p>
              )}
              <div className="mt-8 flex flex-col items-center">
                <p className="num font-display text-[44px] font-extrabold leading-none">{calories.toLocaleString()}</p>
                <p className="mt-1 text-[13px] font-bold text-[var(--muted)]">{t("kcal")}</p>

                <div className="mt-8 flex items-center gap-4">
                  <button
                    onClick={() => setCalories((c) => Math.max(800, c - 100))}
                    className="grid h-12 w-12 place-items-center rounded-full border border-[var(--line-strong)] text-[22px] font-bold text-[var(--muted)] transition active:scale-90"
                  >
                    −
                  </button>
                  <div className="track h-[8px] w-44">
                    <div
                      className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                      style={{ width: `${((calories - 800) / (4000 - 800)) * 100}%` }}
                    />
                  </div>
                  <button
                    onClick={() => setCalories((c) => Math.min(4000, c + 100))}
                    className="grid h-12 w-12 place-items-center rounded-full border border-[var(--line-strong)] text-[22px] font-bold text-[var(--muted)] transition active:scale-90"
                  >
                    +
                  </button>
                </div>
              </div>
              <button onClick={() => void finish()} disabled={busy} className="btn-accent mt-8 w-full py-3.5 text-[15px]">
                {busy ? t("loading") : t("onb_start")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Sheet>
  );
}
