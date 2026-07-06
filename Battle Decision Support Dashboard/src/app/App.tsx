import { useState } from "react";
import { Zap, Shield, Swords, AlertTriangle, Clock, BarChart2, ChevronDown } from "lucide-react";

// ─── Type palette – light mode badges ────────────────────────────────────────
const TYPE_COLOR: Record<string, string> = {
  Dragon:   "bg-violet-100 text-violet-700 border-violet-300",
  Ground:   "bg-amber-100  text-amber-700  border-amber-300",
  Grass:    "bg-green-100  text-green-700  border-green-300",
  Dark:     "bg-slate-200  text-slate-600  border-slate-300",
  Ice:      "bg-sky-100    text-sky-700    border-sky-300",
  Fire:     "bg-orange-100 text-orange-700 border-orange-300",
  Water:    "bg-blue-100   text-blue-700   border-blue-300",
  Normal:   "bg-gray-100   text-gray-600   border-gray-300",
  Fighting: "bg-red-100    text-red-700    border-red-300",
  Psychic:  "bg-pink-100   text-pink-700   border-pink-300",
};

// ─── Static mock data ─────────────────────────────────────────────────────────
const MY = {
  name: "Garchomp", nameKo: "한카리아스",
  types: ["Dragon", "Ground"],
  nature: "Jolly", item: "Focus Sash", evs: "H2 / A32 / S32",
  ability: "Rough Skin",
  speed: 169, bestPower: 38880, bestMove: "Outrage",
  physBulk: 28910, specBulk: 23420,
};

const OPP = {
  name: "Meowscarada", nameKo: "마스카나",
  types: ["Grass", "Dark"],
  nature: "Jolly", item: "Choice Band", evs: "A32 / S32",
  ability: "Overgrow",
  speed: 192, bestPower: 34200, bestMove: "Flower Trick",
  physBulk: 19800, specBulk: 20100,
};

const MOVES = [
  { side: "my",  move: "Earthquake",   type: "Ground", usage: 99.5, power: 32400, pressure: "High",      note: "STAB"         },
  { side: "my",  move: "Outrage",      type: "Dragon", usage: 45.6, power: 38880, pressure: "High",      note: "STAB, locked" },
  { side: "my",  move: "Scale Shot",   type: "Dragon", usage: 38.1, power: 29700, pressure: "Med",       note: "Multi-hit"    },
  { side: "my",  move: "Stone Edge",   type: "Normal", usage: 22.4, power: 21600, pressure: "Med",       note: "Coverage"     },
  { side: "opp", move: "Flower Trick", type: "Grass",  usage: 87.3, power: 34200, pressure: "High",      note: "Crit-lock"    },
  { side: "opp", move: "Triple Axel",  type: "Ice",    usage: 52.1, power: 28000, pressure: "Very High", note: "4× threat"    },
  { side: "opp", move: "Knock Off",    type: "Dark",   usage: 70.2, power: 18500, pressure: "Medium",    note: "Item removal" },
  { side: "opp", move: "U-turn",       type: "Normal", usage: 41.5, power: 12000, pressure: "Low",       note: "Pivot"        },
];

const BULK_ROWS = [
  { label: "My Phys Bulk vs Opp Phys Atk",  result: "Risky"    },
  { label: "My Spec Bulk vs Opp Spec Atk",   result: "Safe"     },
  { label: "Opp Phys Bulk vs My Best Atk",   result: "KO Range" },
  { label: "Opp Spec Bulk vs My Spec Atk",   result: "Safe"     },
];

const PRESSURE_CLS: Record<string, string> = {
  "Very High": "bg-red-100    text-red-700    border border-red-200",
  "High":      "bg-orange-100 text-orange-700 border border-orange-200",
  "Med":       "bg-yellow-100 text-yellow-700 border border-yellow-200",
  "Medium":    "bg-yellow-100 text-yellow-700 border border-yellow-200",
  "Low":       "bg-slate-100  text-slate-500  border border-slate-200",
};

const BULK_CLS: Record<string, string> = {
  "Safe":     "bg-emerald-100 text-emerald-700 border border-emerald-200",
  "Risky":    "bg-amber-100   text-amber-700   border border-amber-200",
  "KO Range": "bg-red-100     text-red-700     border border-red-200",
};

const SET_MODES = ["Usage #1", "Fastest", "Strongest", "Bulkiest", "Custom"];

const isFaster  = MY.speed > OPP.speed;
const speedDiff = Math.abs(MY.speed - OPP.speed);
const myHarder  = MY.bestPower > OPP.bestPower;

// ─── Sub-components ───────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: string }) {
  return (
    <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${TYPE_COLOR[type] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {type}
    </span>
  );
}

function StatBox({
  label, value, color, large = false,
}: { label: string; value: string | number; color: "blue" | "red"; large?: boolean }) {
  const border = color === "blue" ? "border-sky-200"  : "border-rose-200";
  const bg     = color === "blue" ? "bg-sky-50/60"    : "bg-rose-50/60";
  const val    = color === "blue" ? "text-sky-700"    : "text-rose-700";
  return (
    <div className={`border ${border} ${bg} rounded-md p-2.5`}>
      <div className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-1">{label}</div>
      <div
        className={`font-bold font-mono leading-none ${large ? "text-[1.6rem]" : "text-lg"} ${val}`}
        style={{ fontFamily: "'Rajdhani', sans-serif" }}
      >
        {value}
      </div>
    </div>
  );
}

function PokemonCard({ data, side }: { data: typeof MY; side: "my" | "opp" }) {
  const isMy   = side === "my";
  const color  = isMy ? "blue" as const : "red" as const;

  const borderCard = isMy ? "border-sky-200"  : "border-rose-200";
  const headerBg   = isMy ? "bg-sky-600"      : "bg-rose-600";
  const labelTxt   = isMy ? "text-sky-600"    : "text-rose-600";
  const moveBorder = isMy ? "border-sky-200 bg-sky-50" : "border-rose-200 bg-rose-50";
  const moveName   = isMy ? "text-sky-800"    : "text-rose-800";
  const moveVal    = isMy ? "text-sky-600"    : "text-rose-600";

  return (
    <div className={`bg-white border ${borderCard} rounded-xl overflow-hidden flex flex-col h-full shadow-sm`}>
      {/* Colored top stripe */}
      <div className={`${headerBg} px-4 py-2.5 flex items-center justify-between`}>
        <div>
          <div className="text-[8px] font-mono uppercase tracking-widest text-white/60 mb-0.5">
            {isMy ? "My Pokémon" : "Opponent"}
          </div>
          <div
            className="text-[1.5rem] font-bold leading-none text-white"
            style={{ fontFamily: "'Rajdhani', sans-serif" }}
          >
            {data.name}
          </div>
          <div className="text-[9px] font-mono text-white/50 mt-0.5">{data.nameKo}</div>
        </div>
        <div className="flex flex-col gap-1 items-end">
          {data.types.map(t => (
            <span
              key={t}
              className="px-2 py-0.5 rounded bg-white/20 text-white text-[9px] font-bold uppercase tracking-wider border border-white/20"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Set summary */}
        <div className="grid grid-cols-3 gap-1.5 border border-slate-100 rounded-md p-2 bg-slate-50">
          {[["Nature", data.nature], ["Item", data.item], ["EVs", data.evs]].map(([k, v]) => (
            <div key={k}>
              <div className="text-[8px] font-mono text-slate-400 uppercase mb-0.5">{k}</div>
              <div className="text-[10px] font-mono text-slate-600 leading-tight">{v}</div>
            </div>
          ))}
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-2 gap-2">
          <StatBox label="Speed"      value={data.speed}                      color={color} large />
          <StatBox label="Best Power" value={data.bestPower.toLocaleString()} color={color} large />
          <StatBox label="Phys Bulk"  value={data.physBulk.toLocaleString()}  color={color} />
          <StatBox label="Spec Bulk"  value={data.specBulk.toLocaleString()}  color={color} />
        </div>

        {/* Top move */}
        <div className={`mt-auto rounded-md border p-2.5 ${moveBorder}`}>
          <div className={`text-[8px] font-mono uppercase tracking-widest mb-1 ${moveVal} opacity-70`}>Top Move</div>
          <div className={`text-sm font-bold ${moveName}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            {data.bestMove}
          </div>
          <div className={`text-xs font-mono font-semibold ${moveVal}`}>
            {data.bestPower.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

function VSPanel() {
  return (
    <div className="flex flex-col gap-2.5">
      {/* Speed Check */}
      <div className={`rounded-xl border p-4 flex flex-col gap-2 shadow-sm ${
        isFaster
          ? "border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50"
          : "border-rose-200 bg-gradient-to-br from-rose-50 to-red-50"
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3 h-3" /> Speed Check
          </span>
          <span className={`text-[9px] font-mono font-bold px-2.5 py-1 rounded-full ${
            isFaster ? "bg-sky-600 text-white" : "bg-rose-600 text-white"
          }`}>
            {isFaster ? "▲ YOU MOVE FIRST" : "▼ OPP MOVES FIRST"}
          </span>
        </div>

        <div
          className="flex items-baseline justify-center gap-3 py-1"
          style={{ fontFamily: "'Rajdhani', sans-serif" }}
        >
          <span className={`font-bold leading-none ${isFaster ? "text-5xl text-sky-700" : "text-3xl text-slate-300"}`}>
            {MY.speed}
          </span>
          <span className="text-slate-300 text-2xl font-light">{isFaster ? ">" : "<"}</span>
          <span className={`font-bold leading-none ${isFaster ? "text-3xl text-slate-300" : "text-5xl text-rose-700"}`}>
            {OPP.speed}
          </span>
        </div>

        <div className="text-center">
          <span className={`text-[11px] font-mono font-bold tracking-wide ${isFaster ? "text-sky-700" : "text-rose-700"}`}>
            {isFaster ? `+${speedDiff}` : `−${speedDiff}`} Speed
          </span>
        </div>
        <div className={`text-[10px] text-center font-mono rounded py-1 px-2 border ${
          isFaster
            ? "text-sky-600/70 bg-sky-100/50 border-sky-200"
            : "text-amber-700 bg-amber-50 border-amber-200"
        }`}>
          {isFaster ? "Unless opponent is Scarf / Tailwind" : "⚡ Check priority / Focus Sash / speed boost"}
        </div>
      </div>

      {/* Power Check */}
      <div className={`rounded-xl border p-4 flex flex-col gap-2 shadow-sm ${
        myHarder
          ? "border-sky-200 bg-sky-50/40"
          : "border-rose-200 bg-rose-50/40"
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <Swords className="w-3 h-3" /> Power Check
          </span>
          <span className={`text-[9px] font-mono font-bold px-2.5 py-1 rounded-full ${
            myHarder ? "bg-sky-600 text-white" : "bg-rose-600 text-white"
          }`}>
            {myHarder ? "YOU HIT HARDER" : "OPP HITS HARDER"}
          </span>
        </div>
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <div
              className={`font-bold leading-none ${myHarder ? "text-4xl text-sky-700" : "text-2xl text-slate-300"}`}
              style={{ fontFamily: "'Rajdhani', sans-serif" }}
            >
              {MY.bestPower.toLocaleString()}
            </div>
            <div className="text-[8px] font-mono text-slate-400 uppercase mt-1">My Best</div>
          </div>
          <div className="text-slate-200 text-xl font-thin">vs</div>
          <div className="text-center">
            <div
              className={`font-bold leading-none ${myHarder ? "text-2xl text-slate-300" : "text-4xl text-rose-700"}`}
              style={{ fontFamily: "'Rajdhani', sans-serif" }}
            >
              {OPP.bestPower.toLocaleString()}
            </div>
            <div className="text-[8px] font-mono text-slate-400 uppercase mt-1">Opp Best</div>
          </div>
        </div>
        <div className="h-px bg-slate-100 mx-2" />
        <div className="text-center text-[10px] font-mono text-slate-400">
          {myHarder ? MY.bestMove : OPP.bestMove} is the dominant threat
        </div>
      </div>

      {/* Bulk Check */}
      <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 flex flex-col gap-2 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <Shield className="w-3 h-3" /> Bulk Check
          </span>
          <span className="text-[9px] font-mono font-bold px-2.5 py-1 rounded-full bg-amber-500 text-white">
            DANGER ZONE
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: "My Phys vs Opp Atk", val: "Risky",    cls: "text-amber-700"   },
            { label: "Opp Phys vs My Atk",  val: "KO Range", cls: "text-red-700"     },
            { label: "My Spec Bulk",         val: "Safe",     cls: "text-emerald-700" },
            { label: "Opp Spec Bulk",        val: "Safe",     cls: "text-emerald-700" },
          ].map((r) => (
            <div key={r.label} className="bg-white/70 border border-white rounded-md p-2 text-center">
              <div className="text-[8px] font-mono text-slate-400 mb-1 leading-tight">{r.label}</div>
              <div
                className={`text-sm font-bold ${r.cls}`}
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
              >
                {r.val}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VerdictCard({
  icon, label, title, subtitle, note, status,
}: {
  icon: React.ReactNode; label: string; title: string;
  subtitle: string; note: string; status: "good" | "bad" | "warn";
}) {
  const map = {
    good: { border: "border-sky-200",    bg: "bg-gradient-to-br from-sky-50 to-blue-50",     icon: "text-sky-600",    title: "text-sky-900",    sub: "text-sky-600",    badge: "bg-sky-600"    },
    bad:  { border: "border-rose-200",   bg: "bg-gradient-to-br from-rose-50 to-red-50",      icon: "text-rose-600",   title: "text-rose-900",   sub: "text-rose-600",   badge: "bg-rose-600"   },
    warn: { border: "border-amber-200",  bg: "bg-gradient-to-br from-amber-50 to-orange-50",  icon: "text-amber-600",  title: "text-amber-900",  sub: "text-amber-700",  badge: "bg-amber-500"  },
  }[status];

  return (
    <div className={`border ${map.border} ${map.bg} rounded-xl p-4 shadow-sm`}>
      <div className={`flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest mb-2.5 ${map.icon}`}>
        {icon}
        <span>{label}</span>
      </div>
      <div
        className={`text-[1.2rem] font-bold leading-tight mb-0.5 ${map.title}`}
        style={{ fontFamily: "'Rajdhani', sans-serif" }}
      >
        {title}
      </div>
      <div className={`text-sm font-mono font-semibold mb-2 ${map.sub}`}>{subtitle}</div>
      <div className="text-[10px] text-slate-400 font-mono leading-relaxed">{note}</div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function App() {
  const [setMode, setSetMode] = useState("Usage #1");

  return (
    <div
      className="min-h-screen bg-[#f0f4f9] text-slate-800 overflow-x-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="h-11 border-b border-slate-200 flex items-center px-5 gap-6 bg-white sticky top-0 z-50 shadow-sm">
        <span
          className="text-sm font-bold tracking-[0.2em] text-sky-600 uppercase shrink-0"
          style={{ fontFamily: "'Rajdhani', sans-serif" }}
        >
          Turn Snapshot
        </span>

        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-2 text-amber-600 font-mono text-[11px]">
            <Clock className="w-3 h-3" />
            <span className="font-semibold tracking-widest">30s Decision Window</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 shrink-0">
          {["Singles", "Season 3", "Updated 2026-07-01"].map((s, i) => (
            <span key={i} className="flex items-center gap-3">
              {i > 0 && <span className="w-px h-3 bg-slate-200" />}
              {s}
            </span>
          ))}
          <span className="w-px h-3 bg-slate-200" />
          <span className="text-slate-500">Set: {setMode}</span>
        </div>
      </header>

      {/* ── Selector row ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-b border-slate-200 bg-white/80 backdrop-blur">
        {/* My Pokemon */}
        <div className="flex-1 flex items-center gap-2">
          <span className="text-[9px] font-mono text-sky-500 uppercase tracking-widest shrink-0">My</span>
          <button className="flex-1 flex items-center gap-2 bg-sky-50 border border-sky-200 rounded-md px-3 py-1.5 hover:border-sky-400 hover:bg-sky-100/60 transition-colors text-left">
            <span className="text-sm font-semibold text-sky-800" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              {MY.name}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">{MY.nameKo}</span>
            <ChevronDown className="w-3.5 h-3.5 text-sky-400 ml-auto shrink-0" />
          </button>
          <div className="flex gap-1">
            {["Dragonite", "Heatran", "Landorus-T"].map(p => (
              <span key={p} className="text-[9px] font-mono text-slate-400 hover:text-slate-600 cursor-pointer px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 transition-colors">{p}</span>
            ))}
          </div>
        </div>

        {/* Set mode */}
        <div className="flex items-center gap-0.5 bg-slate-100 border border-slate-200 rounded-lg p-0.5 shrink-0">
          {SET_MODES.map(mode => (
            <button
              key={mode}
              onClick={() => setSetMode(mode)}
              className={`px-2.5 py-1 text-[9px] font-mono rounded-md transition-colors ${
                setMode === mode
                  ? "bg-white text-slate-800 font-semibold shadow-sm border border-slate-200"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Opponent */}
        <div className="flex-1 flex items-center gap-2 flex-row-reverse">
          <span className="text-[9px] font-mono text-rose-500 uppercase tracking-widest shrink-0">Opp</span>
          <button className="flex-1 flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-md px-3 py-1.5 hover:border-rose-400 hover:bg-rose-100/60 transition-colors text-left">
            <span className="text-sm font-semibold text-rose-800" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              {OPP.name}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">{OPP.nameKo}</span>
            <ChevronDown className="w-3.5 h-3.5 text-rose-400 ml-auto shrink-0" />
          </button>
          <div className="flex gap-1 flex-row-reverse">
            {["Urshifu", "Rillaboom", "Incineroar"].map(p => (
              <span key={p} className="text-[9px] font-mono text-slate-400 hover:text-slate-600 cursor-pointer px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 transition-colors">{p}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main 3-col comparison ──────────────────────────────────────── */}
      <div className="px-5 pt-3 pb-2 grid grid-cols-[1fr_400px_1fr] gap-3">
        <PokemonCard data={MY}  side="my"  />
        <VSPanel />
        <PokemonCard data={OPP} side="opp" />
      </div>

      {/* ── Verdict cards ──────────────────────────────────────────────── */}
      <div className="px-5 pb-3 grid grid-cols-3 gap-3">
        <VerdictCard
          icon={<Zap className="w-3.5 h-3.5" />}
          label="Speed Verdict"
          title={isFaster ? "You are faster" : "Opponent is faster"}
          subtitle={isFaster ? `+${speedDiff} Speed` : `−${speedDiff} Speed`}
          note={isFaster ? "Unless opponent runs Choice Scarf or Tailwind" : "Priority move or Focus Sash may save you"}
          status={isFaster ? "good" : "bad"}
        />
        <VerdictCard
          icon={<AlertTriangle className="w-3.5 h-3.5" />}
          label="Biggest Threat"
          title="Opp: Triple Axel"
          subtitle="Likely 2HKO"
          note="4× super-effective — watch for Ice coverage immediately"
          status="bad"
        />
        <VerdictCard
          icon={<Swords className="w-3.5 h-3.5" />}
          label="Best Pressure Move"
          title="Your best: Earthquake"
          subtitle="Highest neutral power"
          note="STAB Ground — 32,400 score vs physical bulk 19,800"
          status="good"
        />
      </div>

      {/* ── Move table + Bulk matrix ───────────────────────────────────── */}
      <div className="px-5 pb-6 grid grid-cols-[3fr_1fr] gap-3">
        {/* Move table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
            <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400">Move Pressure Analysis</span>
          </div>
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {["Side", "Move", "Type", "Usage", "Power Score", "Pressure", "Note"].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[8px] uppercase tracking-widest text-slate-400 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOVES.map((m, i) => (
                <tr
                  key={i}
                  className={`border-b border-slate-50 hover:bg-slate-50/80 transition-colors ${
                    m.side === "my"
                      ? "border-l-2 border-l-sky-400"
                      : "border-l-2 border-l-rose-400"
                  }`}
                >
                  <td className="px-3 py-2">
                    <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      m.side === "my"
                        ? "bg-sky-100 text-sky-700"
                        : "bg-rose-100 text-rose-700"
                    }`}>
                      {m.side === "my" ? "MY" : "OPP"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-700 font-semibold">{m.move}</td>
                  <td className="px-3 py-2">
                    <span className={`text-[8px] px-1.5 py-0.5 rounded border ${TYPE_COLOR[m.type] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                      {m.type}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2 justify-end">
                      <div className="w-14 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-slate-300" style={{ width: `${m.usage}%` }} />
                      </div>
                      <span className="text-slate-400 text-[9px] w-9 text-right">{m.usage}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span
                      className={`font-bold text-sm ${m.side === "my" ? "text-sky-700" : "text-rose-700"}`}
                      style={{ fontFamily: "'Rajdhani', sans-serif" }}
                    >
                      {m.power.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-medium ${PRESSURE_CLS[m.pressure]}`}>
                      {m.pressure}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-400 text-[9px]">{m.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bulk matrix */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400">Bulk Matrix</span>
          </div>
          <div className="p-3 flex flex-col gap-2">
            {BULK_ROWS.map((r, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5">
                <div className="text-[9px] font-mono text-slate-400 leading-relaxed pr-3">{r.label}</div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-md shrink-0 ${BULK_CLS[r.result]}`}
                  style={{ fontFamily: "'Rajdhani', sans-serif" }}
                >
                  {r.result}
                </span>
              </div>
            ))}
          </div>

          {/* Condition hint */}
          <div className="mx-3 mb-3 border border-amber-200 rounded-lg p-3 bg-amber-50">
            <div className="text-[8px] font-mono text-amber-600 uppercase tracking-widest mb-1.5">Conditions That Change This</div>
            <div className="flex flex-col gap-1">
              {["Opponent is Scarf → Opp moves first", "Your Sash intact → Survive 1 hit", "Intimidate active → Phys bulk shifts Safe"].map(c => (
                <div key={c} className="text-[9px] font-mono text-slate-500 flex items-start gap-1.5">
                  <span className="text-amber-400 mt-0.5">→</span>
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
