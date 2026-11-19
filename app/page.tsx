"use client";

import React, { useState, useEffect } from "react";

type StatKey = "INT" | "CRAFT" | "DEX" | "STR" | "STA";

interface Quest {
  id: string;
  title: string;
  category: string;
  xp: number;
  stat: StatKey;
  statGain: number;
  completed: boolean;
}

interface PlayerState {
  level: number;
  xp: number;
  streak: number;
  lastActiveDate: string;
  penaltyActive: boolean;
  stats: Record<StatKey, number>;
  quests: Quest[];
}

const DEFAULT_QUESTS: Quest[] = [
  {
    id: "q1",
    title: "2-Hr Part A PYQ / Mock Sprint (9 AM – 11 AM)",
    category: "UCEED / NID",
    xp: 60,
    stat: "INT",
    statGain: 2,
    completed: false,
  },
  {
    id: "q2",
    title: "1-Hr Part B / NID Sketching & Storyboard Drill",
    category: "DESIGN",
    xp: 60,
    stat: "CRAFT",
    statGain: 2,
    completed: false,
  },
  {
    id: "q3",
    title: "50 Freehand Perspective Lines + 10 Human Figures",
    category: "SKILL",
    xp: 35,
    stat: "DEX",
    statGain: 1,
    completed: false,
  },
  {
    id: "q4",
    title: "Workout: 50 Pushups, 50 Squats, 50 Sit-ups & 2km Run",
    category: "PHYSICAL",
    xp: 45,
    stat: "STR",
    statGain: 2,
    completed: false,
  },
  {
    id: "q5",
    title: "Error Log Audit + Zero Distraction Deep Work",
    category: "DISCIPLINE",
    xp: 30,
    stat: "STA",
    statGain: 1,
    completed: false,
  },
];

const getTodayKey = () => new Date().toISOString().split("T")[0];

const getRank = (level: number) => {
  if (level >= 30) return { rank: "S-RANK", title: "National Top 100 Contender", color: "text-amber-400 border-amber-400 shadow-amber-500/30" };
  if (level >= 22) return { rank: "A-RANK", title: "Elite Design Architect", color: "text-purple-400 border-purple-400 shadow-purple-500/30" };
  if (level >= 15) return { rank: "B-RANK", title: "High-Speed Visualizer", color: "text-cyan-300 border-cyan-300 shadow-cyan-400/30" };
  if (level >= 8) return { rank: "C-RANK", title: "Disciplined Challenger", color: "text-emerald-400 border-emerald-400 shadow-emerald-500/30" };
  if (level >= 4) return { rank: "D-RANK", title: "Awakened Builder", color: "text-sky-400 border-sky-400 shadow-sky-500/30" };
  return { rank: "E-RANK", title: "Initiate Hunter", color: "text-slate-300 border-slate-400 shadow-slate-500/20" };
};

export default function SystemTracker() {
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [newQuestTitle, setNewQuestTitle] = useState("");
  const [newQuestStat, setNewQuestStat] = useState<StatKey>("INT");
  const [systemAlert, setSystemAlert] = useState<string | null>(null);

  // Load & handle daily midnight reset + penalty check
  useEffect(() => {
    const today = getTodayKey();
    const saved = localStorage.getItem("solo_system_v1");

    if (saved) {
      const parsed: PlayerState = JSON.parse(saved);
      if (parsed.lastActiveDate !== today) {
        const allDoneYesterday = parsed.quests.every((q) => q.completed);
        const resetQuests = parsed.quests.map((q) => ({ ...q, completed: false }));
        const updated: PlayerState = {
          ...parsed,
          lastActiveDate: today,
          streak: allDoneYesterday ? parsed.streak + 1 : 0,
          penaltyActive: !allDoneYesterday,
          quests: resetQuests,
        };
        setPlayer(updated);
        localStorage.setItem("solo_system_v1", JSON.stringify(updated));
        if (!allDoneYesterday) {
          triggerAlert("WARNING: YESTERDAY'S DAILY QUESTS INCOMPLETE. PENALTY QUEST ASSIGNED.");
        }
      } else {
        setPlayer(parsed);
      }
    } else {
      const initial: PlayerState = {
        level: 1,
        xp: 0,
        streak: 0,
        lastActiveDate: today,
        penaltyActive: false,
        stats: { INT: 10, CRAFT: 10, DEX: 10, STR: 10, STA: 10 },
        quests: DEFAULT_QUESTS,
      };
      setPlayer(initial);
      localStorage.setItem("solo_system_v1", JSON.stringify(initial));
    }
  }, []);

  // Midnight countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const h = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0");
      const m = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, "0");
      const s = String(Math.floor((diff / 1000) % 60)).padStart(2, "0");
      setTimeLeft(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const triggerAlert = (msg: string) => {
    setSystemAlert(msg);
    setTimeout(() => setSystemAlert(null), 4000);
  };

  const toggleQuest = (id: string) => {
    if (!player) return;
    const target = player.quests.find((q) => q.id === id);
    if (!target) return;

    const completing = !target.completed;
    const xpDelta = completing ? target.xp : -target.xp;
    const statDelta = completing ? target.statGain : -target.statGain;

    let newXp = player.xp + xpDelta;
    let newLevel = player.level;
    const xpNeeded = newLevel * 100;

    if (newXp >= xpNeeded) {
      newXp -= xpNeeded;
      newLevel += 1;
      triggerAlert(`LEVEL UP! YOU HAVE REACHED LEVEL ${newLevel}.`);
    } else if (newXp < 0 && newLevel > 1) {
      newLevel -= 1;
      newXp = newLevel * 100 + newXp;
    } else if (newXp < 0) {
      newXp = 0;
    }

    const updatedQuests = player.quests.map((q) =>
      q.id === id ? { ...q, completed: completing } : q
    );

    const updated: PlayerState = {
      ...player,
      level: newLevel,
      xp: newXp,
      stats: {
        ...player.stats,
        [target.stat]: Math.max(1, player.stats[target.stat] + statDelta),
      },
      quests: updatedQuests,
    };

    setPlayer(updated);
    localStorage.setItem("solo_system_v1", JSON.stringify(updated));
  };

  const addCustomQuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!player || !newQuestTitle.trim()) return;
    const custom: Quest = {
      id: Date.now().toString(),
      title: newQuestTitle.trim(),
      category: "CUSTOM",
      xp: 30,
      stat: newQuestStat,
      statGain: 1,
      completed: false,
    };
    const updated = { ...player, quests: [...player.quests, custom] };
    setPlayer(updated);
    localStorage.setItem("solo_system_v1", JSON.stringify(updated));
    setNewQuestTitle("");
    triggerAlert("NEW DAILY QUEST REGISTERED.");
  };

  const clearPenalty = () => {
    if (!player) return;
    const updated = { ...player, penaltyActive: false, xp: player.xp + 25 };
    setPlayer(updated);
    localStorage.setItem("solo_system_v1", JSON.stringify(updated));
    triggerAlert("PENALTY SURVIVED. +25 BONUS XP AWARDED.");
  };

  if (!player) return null;

  const xpCap = player.level * 100;
  const xpPercent = Math.min(100, Math.round((player.xp / xpCap) * 100));
  const rankInfo = getRank(player.level);
  const completedCount = player.quests.filter((q) => q.completed).length;

  // Exam countdowns
  const nidDays = Math.max(
    0,
    Math.ceil((new Date("2026-12-20").getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );
  const uceedDays = Math.max(
    0,
    Math.ceil((new Date("2027-01-18").getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return (
    <main className="min-h-screen bg-[#040812] text-cyan-50 font-mono p-4 md:p-8 selection:bg-cyan-500/30">
      {/* Holographic System Toast */}
      {systemAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md border border-cyan-400 bg-[#07152b]/95 px-4 py-3 text-center text-xs tracking-widest text-cyan-300 shadow-[0_0_25px_rgba(0,212,255,0.45)]">
          [SYSTEM NOTIFICATION] {systemAlert}
        </div>
      )}

      <div className="mx-auto max-w-2xl space-y-6">
        {/* Boss Battle Exam Countdowns */}
        <div className="grid grid-cols-2 gap-3">
          <div className="border border-cyan-500/40 bg-[#081226]/90 p-3 shadow-[0_0_15px_rgba(0,212,255,0.12)]">
            <p className="text-[10px] tracking-widest text-cyan-400">BOSS GATE I: NID PRELIMS</p>
            <p className="mt-1 text-xl font-bold text-white">{nidDays} DAYS LEFT</p>
            <p className="text-[11px] text-slate-400">Target: Top 1,300 Shortlist</p>
          </div>
          <div className="border border-cyan-500/40 bg-[#081226]/90 p-3 shadow-[0_0_15px_rgba(0,212,255,0.12)]">
            <p className="text-[10px] tracking-widest text-cyan-400">BOSS GATE II: UCEED 2027</p>
            <p className="mt-1 text-xl font-bold text-white">{uceedDays} DAYS LEFT</p>
            <p className="text-[11px] text-slate-400">Target: IIT AIR &lt; 100</p>
          </div>
        </div>

        {/* Penalty Quest Warning Banner */}
        {player.penaltyActive && (
          <div className="border-2 border-red-500 bg-red-950/40 p-4 shadow-[0_0_25px_rgba(239,68,68,0.4)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-widest text-red-400">
                [!] PENALTY QUEST ACTIVE
              </span>
              <span className="text-xs text-red-300">STREAK RESET</span>
            </div>
            <p className="mt-2 text-sm text-red-100">
              Complete <strong>20 Extra Perspective Cubes + 50 Pushups</strong> immediately to clear penalty status.
            </p>
            <button
              onClick={clearPenalty}
              className="mt-3 w-full border border-red-400 bg-red-500/20 py-2 text-xs font-bold tracking-widest text-red-200 hover:bg-red-500/40"
            >
              CONFIRM PENALTY COMPLETION
            </button>
          </div>
        )}

        {/* STATUS WINDOW */}
        <section className="border border-cyan-400/60 bg-[#071124]/95 p-5 shadow-[0_0_30px_rgba(0,212,255,0.18)]">
          <div className="flex items-start justify-between border-b border-cyan-500/30 pb-4">
            <div>
              <p className="text-[11px] tracking-[0.25em] text-cyan-400">STATUS WINDOW</p>
              <h1 className="mt-1 text-2xl font-bold tracking-wider text-white">
                LEVEL {player.level}
              </h1>
              <p className="text-xs text-slate-400">CLASS: {rankInfo.title}</p>
            </div>
            <div className="text-right">
              <span
                className={`inline-block border px-3 py-1 text-xs font-bold tracking-widest shadow-md ${rankInfo.color}`}
              >
                {rankInfo.rank}
              </span>
              <p className="mt-2 text-xs text-cyan-300">STREAK: {player.streak} DAYS</p>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-cyan-300">
              <span>EXPERIENCE (XP)</span>
              <span>
                {player.xp} / {xpCap} XP ({xpPercent}%)
              </span>
            </div>
            <div className="mt-1.5 h-2.5 w-full overflow-hidden border border-cyan-500/40 bg-slate-900">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-300 shadow-[0_0_12px_#00d4ff]"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>

          {/* 5 Core Stats */}
          <div className="mt-5 grid grid-cols-5 gap-2 border-t border-cyan-500/30 pt-4 text-center">
            {(
              [
                ["INT", "Logic/PYQ", player.stats.INT],
                ["CRAFT", "Sketching", player.stats.CRAFT],
                ["DEX", "Lines/3D", player.stats.DEX],
                ["STR", "Workout", player.stats.STR],
                ["STA", "Focus", player.stats.STA],
              ] as const
            ).map(([code, label, val]) => (
              <div key={code} className="border border-cyan-500/25 bg-[#0a1833] p-2">
                <p className="text-xs font-bold text-cyan-400">{code}</p>
                <p className="mt-0.5 text-lg font-bold text-white">{val}</p>
                <p className="text-[10px] text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* DAILY QUEST WINDOW */}
        <section className="border border-cyan-400/60 bg-[#071124]/95 p-5 shadow-[0_0_30px_rgba(0,212,255,0.18)]">
          <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3">
            <div>
              <p className="text-[11px] tracking-[0.25em] text-cyan-400">DAILY QUEST: PREPARATION</p>
              <p className="text-xs text-slate-400">
                COMPLETED: {completedCount} / {player.quests.length}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] tracking-widest text-slate-400">RESET IN</p>
              <p className="text-sm font-bold text-cyan-300">{timeLeft || "23:59:59"}</p>
            </div>
          </div>

          {/* Quest List */}
          <div className="mt-4 space-y-2.5">
            {player.quests.map((q) => (
              <button
                key={q.id}
                onClick={() => toggleQuest(q.id)}
                className={`flex w-full items-center justify-between border p-3.5 text-left transition ${
                  q.completed
                    ? "border-cyan-500/30 bg-cyan-950/20 text-slate-400 line-through"
                    : "border-cyan-400/50 bg-[#0a1936] text-white hover:border-cyan-300"
                }`}
              >
                <div className="pr-3">
                  <span className="text-[10px] tracking-widest text-cyan-400">
                    [{q.category}] +{q.xp} XP • +{q.statGain} {q.stat}
                  </span>
                  <p className="mt-0.5 text-sm font-medium">{q.title}</p>
                </div>
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center border ${
                    q.completed
                      ? "border-cyan-400 bg-cyan-400 text-slate-950 font-bold"
                      : "border-cyan-400/60"
                  }`}
                >
                  {q.completed ? "✓" : ""}
                </div>
              </button>
            ))}
          </div>

          {/* Add Custom Quest */}
          <form onSubmit={addCustomQuest} className="mt-4 flex gap-2 border-t border-cyan-500/30 pt-4">
            <input
              type="text"
              value={newQuestTitle}
              onChange={(e) => setNewQuestTitle(e.target.value)}
              placeholder="Add custom quest (e.g., 2024 NAT Drill)..."
              className="flex-1 border border-cyan-500/40 bg-[#040812] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
            />
            <select
              value={newQuestStat}
              onChange={(e) => setNewQuestStat(e.target.value as StatKey)}
              className="border border-cyan-500/40 bg-[#040812] px-2 py-2 text-xs text-cyan-300 focus:outline-none"
            >
              <option value="INT">INT</option>
              <option value="CRAFT">CRAFT</option>
              <option value="DEX">DEX</option>
              <option value="STR">STR</option>
              <option value="STA">STA</option>
            </select>
            <button
              type="submit"
              className="border border-cyan-400 bg-cyan-500/20 px-4 py-2 text-xs font-bold tracking-wider text-cyan-200 hover:bg-cyan-500/35"
            >
              + ADD
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
