"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, BarChart2, ChevronDown, Clock, Shield, Swords, Zap } from "lucide-react";
import { MySetManager } from "@/components/MySetManager";
import { calculateBulk } from "@/lib/calc/bulk";
import { calculateDamage } from "@/lib/calc/damage";
import { calculateMovePower } from "@/lib/calc/power";
import { applyChoiceScarf } from "@/lib/calc/speed";
import { calculateStats } from "@/lib/calc/stats";
import { findItemByKey, listItems } from "@/lib/data/itemRepository";
import { findMoveByKey, listMoves } from "@/lib/data/moveRepository";
import { listMyPokemonSets } from "@/lib/data/myTeamRepository";
import { findNatureByKey, listNatures } from "@/lib/data/natureRepository";
import { findPokemonByKey, findPokemonByName } from "@/lib/data/pokemonRepository";
import { findUsageByPokeKey } from "@/lib/data/usageRepository";
import type { BulkResult, CalculatedStats, DamageResult, MovePowerResult } from "@/types/calc";
import type { ItemMaster, MoveMaster, PokemonMaster } from "@/types/master";
import type { EffortValues, MyPokemonSet } from "@/types/team";
import type { UsageStatPoint } from "@/types/usage";

const MY_SETS_STORAGE_KEY = "pokeauto.myPokemonSets";

const TYPE_LABEL: Record<string, string> = {
  dragon: "드래곤",
  ground: "땅",
  rock: "바위",
  grass: "풀",
  dark: "악",
  ice: "얼음",
  fire: "불꽃",
  water: "물",
  normal: "노말",
  fighting: "격투",
  psychic: "에스퍼"
};

const TYPE_COLOR: Record<string, string> = {
  dragon: "bg-violet-100 text-violet-700 border-violet-300",
  ground: "bg-amber-100 text-amber-700 border-amber-300",
  rock: "bg-stone-100 text-stone-700 border-stone-300",
  grass: "bg-green-100 text-green-700 border-green-300",
  dark: "bg-slate-200 text-slate-600 border-slate-300",
  ice: "bg-sky-100 text-sky-700 border-sky-300",
  fire: "bg-orange-100 text-orange-700 border-orange-300",
  water: "bg-blue-100 text-blue-700 border-blue-300",
  normal: "bg-gray-100 text-gray-600 border-gray-300",
  fighting: "bg-red-100 text-red-700 border-red-300",
  psychic: "bg-pink-100 text-pink-700 border-pink-300"
};

function evsFromUsage(statPoint: UsageStatPoint): EffortValues {
  return {
    hp: statPoint.rep_ev.H,
    atk: statPoint.rep_ev.A,
    def: statPoint.rep_ev.B,
    spa: statPoint.rep_ev.C,
    spd: statPoint.rep_ev.D,
    spe: statPoint.rep_ev.S
  };
}

function formatStatPoints(evs: EffortValues): string {
  return `H${evs.hp} / A${evs.atk} / B${evs.def} / C${evs.spa} / D${evs.spd} / S${evs.spe}`;
}

function typeBadge(type: string) {
  return (
    <span key={type} className={`rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${TYPE_COLOR[type] ?? TYPE_COLOR.normal}`}>
      {TYPE_LABEL[type] ?? type}
    </span>
  );
}

function bestPower(rows: MovePowerResult[]): MovePowerResult | undefined {
  return [...rows].sort((a, b) => b.power - a.power)[0];
}

function bestDamage(rows: DamageResult[]): DamageResult | undefined {
  return [...rows].sort((a, b) => b.maxPercent - a.maxPercent)[0];
}

function pressureLabel(row: DamageResult): { label: string; className: string } {
  if (row.minPercent >= 100) return { label: "확정 KO", className: "bg-red-100 text-red-700 border border-red-200" };
  if (row.maxPercent >= 100) return { label: "난수 KO", className: "bg-orange-100 text-orange-700 border border-orange-200" };
  if (row.maxPercent >= 50) return { label: "높음", className: "bg-yellow-100 text-yellow-700 border border-yellow-200" };
  return { label: "낮음", className: "bg-slate-100 text-slate-500 border border-slate-200" };
}

function StatBox({ label, value, side, large = false }: { label: string; value: string | number; side: "my" | "opp"; large?: boolean }) {
  const border = side === "my" ? "border-sky-200" : "border-rose-200";
  const bg = side === "my" ? "bg-sky-50/60" : "bg-rose-50/60";
  const valueColor = side === "my" ? "text-sky-700" : "text-rose-700";

  return (
    <div className={`rounded-md border ${border} ${bg} p-2.5`}>
      <div className="mb-1 font-mono text-[9px] uppercase tracking-widest text-slate-400">{label}</div>
      <div className={`font-bold leading-none ${large ? "text-[1.6rem]" : "text-lg"} ${valueColor}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
        {value}
      </div>
    </div>
  );
}

function PokemonCard({
  pokemon,
  title,
  subtitle,
  side,
  stats,
  bulk,
  nature,
  item,
  evText,
  bestMove
}: {
  pokemon: PokemonMaster;
  title: string;
  subtitle: string;
  side: "my" | "opp";
  stats: CalculatedStats;
  bulk: BulkResult;
  nature?: string;
  item?: string;
  evText: string;
  bestMove?: MovePowerResult;
}) {
  const isMy = side === "my";
  const borderCard = isMy ? "border-sky-200" : "border-rose-200";
  const headerBg = isMy ? "bg-sky-600" : "bg-rose-600";
  const moveBorder = isMy ? "border-sky-200 bg-sky-50" : "border-rose-200 bg-rose-50";
  const moveText = isMy ? "text-sky-800" : "text-rose-800";

  return (
    <div className={`flex h-full flex-col overflow-hidden rounded-xl border ${borderCard} bg-white shadow-sm`}>
      <div className={`${headerBg} flex items-center justify-between px-4 py-2.5`}>
        <div>
          <div className="mb-0.5 font-mono text-[8px] uppercase tracking-widest text-white/60">{title}</div>
          <div className="text-[1.5rem] font-bold leading-none text-white" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            {pokemon.englishName ?? pokemon.koreanName}
          </div>
          <div className="mt-0.5 font-mono text-[9px] text-white/60">{subtitle}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {pokemon.types.map((type) => (
            <span key={type} className="rounded border border-white/20 bg-white/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
              {TYPE_LABEL[type] ?? type}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="grid grid-cols-3 gap-1.5 rounded-md border border-slate-100 bg-slate-50 p-2">
          {[
            ["성격", nature ?? "미확인"],
            ["아이템", item ?? "미확인"],
            ["SP", evText]
          ].map(([label, value]) => (
            <div key={label}>
              <div className="mb-0.5 font-mono text-[8px] uppercase text-slate-400">{label}</div>
              <div className="font-mono text-[10px] leading-tight text-slate-600">{value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <StatBox label="Speed" value={stats.spe} side={side} large />
          <StatBox label="Best Power" value={(bestMove?.power ?? 0).toLocaleString()} side={side} large />
          <StatBox label="Phys Bulk" value={bulk.physical.toLocaleString()} side={side} />
          <StatBox label="Spec Bulk" value={bulk.special.toLocaleString()} side={side} />
        </div>

        <div className={`mt-auto rounded-md border p-2.5 ${moveBorder}`}>
          <div className={`mb-1 font-mono text-[8px] uppercase tracking-widest opacity-70 ${moveText}`}>대표 기술</div>
          <div className={`text-sm font-bold ${moveText}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            {bestMove?.move.koreanName ?? "계산 없음"}
          </div>
          <div className={`font-mono text-xs font-semibold ${moveText}`}>{(bestMove?.power ?? 0).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

function VSPanel({
  myStats,
  opponentStats,
  opponentScarfSpeed,
  myBestPower,
  opponentBestPower,
  myBestDamage,
  opponentBestDamage
}: {
  myStats: CalculatedStats;
  opponentStats: CalculatedStats;
  opponentScarfSpeed: number;
  myBestPower?: MovePowerResult;
  opponentBestPower?: MovePowerResult;
  myBestDamage?: DamageResult;
  opponentBestDamage?: DamageResult;
}) {
  const isFaster = myStats.spe > opponentStats.spe;
  const speedDiff = Math.abs(myStats.spe - opponentStats.spe);
  const myHarder = (myBestPower?.power ?? 0) >= (opponentBestPower?.power ?? 0);

  return (
    <div className="flex flex-col gap-2.5">
      <div className={`rounded-xl border p-4 shadow-sm ${isFaster ? "border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50" : "border-rose-200 bg-gradient-to-br from-rose-50 to-red-50"}`}>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-slate-400">
            <Zap className="h-3 w-3" /> 스피드 체크
          </span>
          <span className={`rounded-full px-2.5 py-1 font-mono text-[9px] font-bold text-white ${isFaster ? "bg-sky-600" : "bg-rose-600"}`}>
            {isFaster ? "내가 선공" : "상대 선공"}
          </span>
        </div>

        <div className="flex items-baseline justify-center gap-3 py-2" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
          <span className={`font-bold leading-none ${isFaster ? "text-5xl text-sky-700" : "text-3xl text-slate-300"}`}>{myStats.spe}</span>
          <span className="text-2xl font-light text-slate-300">{isFaster ? ">" : "<"}</span>
          <span className={`font-bold leading-none ${isFaster ? "text-3xl text-slate-300" : "text-5xl text-rose-700"}`}>{opponentStats.spe}</span>
        </div>
        <div className="text-center font-mono text-[11px] font-bold tracking-wide text-slate-500">차이 {speedDiff} · 상대 스카프 {opponentScarfSpeed}</div>
      </div>

      <div className={`rounded-xl border p-4 shadow-sm ${myHarder ? "border-sky-200 bg-sky-50/50" : "border-rose-200 bg-rose-50/50"}`}>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-slate-400">
            <Swords className="h-3 w-3" /> 결정력 체크
          </span>
          <span className={`rounded-full px-2.5 py-1 font-mono text-[9px] font-bold text-white ${myHarder ? "bg-sky-600" : "bg-rose-600"}`}>
            {myHarder ? "내 화력 우위" : "상대 화력 우위"}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-center gap-4">
          <div className="text-center">
            <div className={`font-bold leading-none ${myHarder ? "text-4xl text-sky-700" : "text-2xl text-slate-300"}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              {(myBestPower?.power ?? 0).toLocaleString()}
            </div>
            <div className="mt-1 font-mono text-[8px] uppercase text-slate-400">내 최고</div>
          </div>
          <div className="text-xl font-thin text-slate-200">vs</div>
          <div className="text-center">
            <div className={`font-bold leading-none ${myHarder ? "text-2xl text-slate-300" : "text-4xl text-rose-700"}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              {(opponentBestPower?.power ?? 0).toLocaleString()}
            </div>
            <div className="mt-1 font-mono text-[8px] uppercase text-slate-400">상대 최고</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-slate-400">
            <Shield className="h-3 w-3" /> KO 체크
          </span>
          <span className="rounded-full bg-amber-500 px-2.5 py-1 font-mono text-[9px] font-bold text-white">위험 구간</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {[
            ["내 최대 타점", myBestDamage?.koSummary ?? "계산 없음", "text-sky-700"],
            ["상대 최대 타점", opponentBestDamage?.koSummary ?? "계산 없음", "text-rose-700"],
            ["내 HP 비율", myBestDamage ? `${myBestDamage.maxPercent.toFixed(1)}%` : "-", "text-sky-700"],
            ["상대 HP 비율", opponentBestDamage ? `${opponentBestDamage.maxPercent.toFixed(1)}%` : "-", "text-rose-700"]
          ].map(([label, value, cls]) => (
            <div key={label} className="rounded-md border border-white bg-white/70 p-2 text-center">
              <div className="mb-1 font-mono text-[8px] leading-tight text-slate-400">{label}</div>
              <div className={`text-sm font-bold ${cls}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VerdictCard({
  icon,
  label,
  title,
  subtitle,
  note,
  status
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  subtitle: string;
  note: string;
  status: "good" | "bad" | "warn";
}) {
  const map = {
    good: { border: "border-sky-200", bg: "bg-gradient-to-br from-sky-50 to-blue-50", icon: "text-sky-600", title: "text-sky-900", sub: "text-sky-600" },
    bad: { border: "border-rose-200", bg: "bg-gradient-to-br from-rose-50 to-red-50", icon: "text-rose-600", title: "text-rose-900", sub: "text-rose-600" },
    warn: { border: "border-amber-200", bg: "bg-gradient-to-br from-amber-50 to-orange-50", icon: "text-amber-600", title: "text-amber-900", sub: "text-amber-700" }
  }[status];

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${map.border} ${map.bg}`}>
      <div className={`mb-2.5 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest ${map.icon}`}>
        {icon}
        <span>{label}</span>
      </div>
      <div className={`mb-0.5 text-[1.2rem] font-bold leading-tight ${map.title}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>{title}</div>
      <div className={`mb-2 font-mono text-sm font-semibold ${map.sub}`}>{subtitle}</div>
      <div className="font-mono text-[10px] leading-relaxed text-slate-400">{note}</div>
    </div>
  );
}

function MovePressureTable({ myRows, opponentRows }: { myRows: DamageResult[]; opponentRows: DamageResult[] }) {
  const rows = [
    ...myRows.map((row) => ({ row, side: "내 기술" as const })),
    ...opponentRows.map((row) => ({ row, side: "상대 기술" as const }))
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <BarChart2 className="h-3.5 w-3.5 text-slate-400" />
        <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400">기술 압박 분석</span>
      </div>
      <table className="w-full font-mono text-[11px]">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            {["방향", "기술", "타입", "HP 비율", "데미지", "압박", "판정"].map((header) => (
              <th key={header} className="px-3 py-2 text-left text-[8px] font-semibold uppercase tracking-widest text-slate-400">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ row, side }) => {
            const pressure = pressureLabel(row);
            const isMy = side === "내 기술";
            return (
              <tr key={`${side}-${row.move.key}`} className={`border-b border-slate-50 transition-colors hover:bg-slate-50/80 ${isMy ? "border-l-2 border-l-sky-400" : "border-l-2 border-l-rose-400"}`}>
                <td className="px-3 py-2">
                  <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${isMy ? "bg-sky-100 text-sky-700" : "bg-rose-100 text-rose-700"}`}>
                    {side}
                  </span>
                </td>
                <td className="px-3 py-2 font-semibold text-slate-700">{row.move.koreanName}</td>
                <td className="px-3 py-2">{typeBadge(row.move.type)}</td>
                <td className="px-3 py-2 text-right text-slate-500">{row.minPercent.toFixed(1)}-{row.maxPercent.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right font-semibold text-slate-700">{row.minDamage}-{row.maxDamage}</td>
                <td className="px-3 py-2 text-right">
                  <span className={`rounded-full px-2 py-0.5 text-[8px] font-medium ${pressure.className}`}>{pressure.label}</span>
                </td>
                <td className="px-3 py-2 text-[9px] text-slate-400">{row.koSummary}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BulkMatrix({ myBulk, opponentBulk }: { myBulk: BulkResult; opponentBulk: BulkResult }) {
  const rows = [
    ["내 물리 내구", myBulk.physical.toLocaleString(), "Safe"],
    ["내 특수 내구", myBulk.special.toLocaleString(), "Safe"],
    ["상대 물리 내구", opponentBulk.physical.toLocaleString(), "KO Range"],
    ["상대 특수 내구", opponentBulk.special.toLocaleString(), "Risky"]
  ];
  const cls: Record<string, string> = {
    Safe: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    Risky: "bg-amber-100 text-amber-700 border border-amber-200",
    "KO Range": "bg-red-100 text-red-700 border border-red-200"
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <Shield className="h-3.5 w-3.5 text-slate-400" />
        <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400">내구 매트릭스</span>
      </div>
      <div className="flex flex-col gap-2 p-3">
        {rows.map(([label, value, result]) => (
          <div key={label} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
            <div>
              <div className="font-mono text-[9px] leading-relaxed text-slate-400">{label}</div>
              <div className="font-mono text-xs font-semibold text-slate-600">{value}</div>
            </div>
            <span className={`shrink-0 rounded-md px-2.5 py-1 text-[10px] font-bold ${cls[result]}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              {result}
            </span>
          </div>
        ))}
      </div>
      <div className="mx-3 mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
        <div className="mb-1.5 font-mono text-[8px] uppercase tracking-widest text-amber-600">결과를 바꾸는 조건</div>
        {["상대가 스카프면 선공 관계 변경", "기합의띠가 남아 있으면 1회 생존", "랭크/벽/날씨는 아직 MVP 계산 제외"].map((condition) => (
          <div key={condition} className="flex items-start gap-1.5 font-mono text-[9px] text-slate-500">
            <span className="mt-0.5 text-amber-400">→</span>
            <span>{condition}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState("한카리아스");
  const [opponentKey, setOpponentKey] = useState("0445-00");
  const [searchError, setSearchError] = useState<string>();
  const [mySets, setMySets] = useState<MyPokemonSet[]>(() => listMyPokemonSets());
  const [selectedSetId, setSelectedSetId] = useState(() => listMyPokemonSets()[0]?.id ?? "");

  useEffect(() => {
    const stored = window.localStorage.getItem(MY_SETS_STORAGE_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as MyPokemonSet[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setMySets(parsed);
        setSelectedSetId(parsed[0].id);
      }
    } catch {
      window.localStorage.removeItem(MY_SETS_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(MY_SETS_STORAGE_KEY, JSON.stringify(mySets));
  }, [mySets]);

  const mySet = mySets.find((set) => set.id === selectedSetId) ?? mySets[0];
  const myPokemon = findPokemonByKey(mySet.pokeKey);
  const opponentPokemon = findPokemonByKey(opponentKey);
  const natures = listNatures();
  const items = listItems();
  const moves = listMoves();

  if (!myPokemon || !opponentPokemon) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6">
        <section className="rounded-md border border-red-200 bg-white p-4 text-red-700">로컬 마스터 데이터가 부족합니다.</section>
      </main>
    );
  }

  const myNature = findNatureByKey(mySet.natureKey);
  const myItem = findItemByKey(mySet.itemKey);
  const usage = findUsageByPokeKey(opponentPokemon.pokeKey);
  const opponentNature = findNatureByKey(usage?.data.natures[0]?.key ?? 13);
  const opponentItem = findItemByKey(usage?.data.items[0]?.key);
  const opponentStatPoint = usage?.data.stat_points.skeletons[0];
  const opponentEvs = opponentStatPoint ? evsFromUsage(opponentStatPoint) : { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };

  const myStats = calculateStats({ baseStats: myPokemon.baseStats, level: mySet.level, evs: mySet.evs, nature: myNature });
  const opponentStats = calculateStats({ baseStats: opponentPokemon.baseStats, level: 50, evs: opponentEvs, nature: opponentNature });
  const myBulk = calculateBulk(myStats);
  const opponentBulk = calculateBulk(opponentStats);

  const myMoves = mySet.moves.map(findMoveByKey).filter((move) => move !== undefined);
  const opponentMoves = (usage?.data.moves ?? []).slice(0, 10).map((entry) => findMoveByKey(entry.key)).filter((move) => move !== undefined);

  const myPowers = myMoves.map((move) => calculateMovePower({ pokemonTypes: myPokemon.types, stats: myStats, move, item: myItem })).filter((result) => result !== undefined);
  const opponentPowers = opponentMoves.map((move) => calculateMovePower({ pokemonTypes: opponentPokemon.types, stats: opponentStats, move, item: opponentItem })).filter((result) => result !== undefined);

  const myDamageRows = myMoves
    .map((move) =>
      calculateDamage({
        level: mySet.level,
        attackerTypes: myPokemon.types,
        defenderTypes: opponentPokemon.types,
        attackerStats: myStats,
        defenderStats: opponentStats,
        move,
        item: myItem
      })
    )
    .filter((result) => result !== undefined);

  const opponentDamageRows = opponentMoves
    .map((move) =>
      calculateDamage({
        level: 50,
        attackerTypes: opponentPokemon.types,
        defenderTypes: myPokemon.types,
        attackerStats: opponentStats,
        defenderStats: myStats,
        move,
        item: opponentItem
      })
    )
    .filter((result) => result !== undefined);

  const myBestPower = bestPower(myPowers);
  const opponentBestPower = bestPower(opponentPowers);
  const myBestDamage = bestDamage(myDamageRows);
  const opponentBestDamage = bestDamage(opponentDamageRows);
  const isFaster = myStats.spe > opponentStats.spe;
  const speedDiff = Math.abs(myStats.spe - opponentStats.spe);

  function handleSearch() {
    const found = findPokemonByName(query);
    if (!found) {
      setSearchError("현재 샘플 데이터에 없는 포켓몬입니다.");
      return;
    }

    setOpponentKey(found.pokeKey);
    setSearchError(undefined);
  }

  function handleAddSet(set: MyPokemonSet) {
    setMySets((current) => [...current, set]);
    setSelectedSetId(set.id);
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f0f4f9] text-slate-800" style={{ fontFamily: "'Inter', sans-serif" }}>
      <header className="sticky top-0 z-50 flex h-11 items-center gap-6 border-b border-slate-200 bg-white px-5 shadow-sm">
        <span className="shrink-0 text-sm font-bold uppercase tracking-[0.2em] text-sky-600" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
          Turn Snapshot
        </span>
        <div className="flex flex-1 justify-center">
          <div className="flex items-center gap-2 font-mono text-[11px] text-amber-600">
            <Clock className="h-3 w-3" />
            <span className="font-semibold tracking-widest">30초 판단 보드</span>
          </div>
        </div>
        <div className="hidden shrink-0 items-center gap-3 font-mono text-[10px] text-slate-400 lg:flex">
          <span>싱글</span>
          <span className="h-3 w-px bg-slate-200" />
          <span>시즌 3</span>
          <span className="h-3 w-px bg-slate-200" />
          <span>로컬 샘플</span>
        </div>
      </header>

      <section className="flex items-center gap-3 border-b border-slate-200 bg-white/80 px-5 py-2.5 backdrop-blur">
        <div className="flex flex-1 items-center gap-2">
          <span className="shrink-0 font-mono text-[9px] uppercase tracking-widest text-sky-500">My</span>
          <button
            type="button"
            className="flex flex-1 items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-1.5 text-left transition-colors hover:border-sky-400 hover:bg-sky-100/60 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
          >
            <span className="text-sm font-semibold text-sky-800" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              {myPokemon.englishName ?? myPokemon.koreanName}
            </span>
            <span className="font-mono text-[10px] text-slate-400">{mySet.nickname ?? myPokemon.koreanName}</span>
            <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 text-sky-400" />
          </button>
          <div className="hidden gap-1 lg:flex">
            {mySets.slice(0, 3).map((set) => (
              <button
                key={set.id}
                type="button"
                onClick={() => setSelectedSetId(set.id)}
                className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] text-slate-400 transition-colors hover:text-slate-600"
              >
                {set.nickname ?? set.id}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-0.5">
          {["Usage #1", "Fastest", "Strongest", "Bulkiest", "Custom"].map((mode, index) => (
            <button
              key={mode}
              type="button"
              className={`rounded-md px-2.5 py-1 font-mono text-[9px] transition-colors ${
                index === 0 ? "border border-slate-200 bg-white font-semibold text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="flex flex-1 flex-row-reverse items-center gap-2">
          <span className="shrink-0 font-mono text-[9px] uppercase tracking-widest text-rose-500">Opp</span>
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 transition-colors hover:border-rose-400 hover:bg-rose-100/60">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSearch();
              }}
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-rose-800 outline-none"
              style={{ fontFamily: "'Rajdhani', sans-serif" }}
              aria-label="상대 포켓몬"
            />
            <button type="button" onClick={handleSearch} className="rounded bg-rose-600 px-2 py-1 font-mono text-[9px] font-bold text-white focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2">
              검색
            </button>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-rose-400" />
          </div>
          <div className="hidden flex-row-reverse gap-1 lg:flex">
            {["한카리아스", "망나뇽", "랜드로스"].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setQuery(name);
                  const found = findPokemonByName(name);
                  if (found) setOpponentKey(found.pokeKey);
                }}
                className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] text-slate-400 transition-colors hover:text-slate-600"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </section>
      {searchError ? <p className="px-5 pt-2 font-mono text-xs text-rose-600">{searchError}</p> : null}

      <section className="grid gap-3 px-5 pb-2 pt-3 xl:grid-cols-[1fr_400px_1fr]">
        <PokemonCard
          pokemon={myPokemon}
          title="내 포켓몬"
          subtitle={mySet.nickname ?? myPokemon.koreanName}
          side="my"
          stats={myStats}
          bulk={myBulk}
          nature={myNature?.koreanName}
          item={myItem?.koreanName}
          evText={formatStatPoints(mySet.evs)}
          bestMove={myBestPower}
        />
        <VSPanel
          myStats={myStats}
          opponentStats={opponentStats}
          opponentScarfSpeed={applyChoiceScarf(opponentStats.spe)}
          myBestPower={myBestPower}
          opponentBestPower={opponentBestPower}
          myBestDamage={myBestDamage}
          opponentBestDamage={opponentBestDamage}
        />
        <PokemonCard
          pokemon={opponentPokemon}
          title="상대"
          subtitle={opponentPokemon.koreanName}
          side="opp"
          stats={opponentStats}
          bulk={opponentBulk}
          nature={opponentNature?.koreanName}
          item={opponentItem?.koreanName}
          evText={opponentStatPoint?.label ?? "미확인"}
          bestMove={opponentBestPower}
        />
      </section>

      <section className="grid gap-3 px-5 pb-3 xl:grid-cols-3">
        <VerdictCard
          icon={<Zap className="h-3.5 w-3.5" />}
          label="스피드 판정"
          title={isFaster ? "내가 더 빠름" : "상대가 더 빠름"}
          subtitle={`${speedDiff} 차이`}
          note={isFaster ? "상대 스카프/순풍 여부만 확인하면 됩니다." : "선공기, 기합의띠, 스피드 상승 여부를 확인하세요."}
          status={isFaster ? "good" : "bad"}
        />
        <VerdictCard
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
          label="가장 위험한 상대 기술"
          title={opponentBestDamage?.move.koreanName ?? "계산 없음"}
          subtitle={opponentBestDamage?.koSummary ?? "-"}
          note={opponentBestDamage ? `${opponentBestDamage.minPercent.toFixed(1)}-${opponentBestDamage.maxPercent.toFixed(1)}% 범위` : "공격 기술 데이터가 없습니다."}
          status="bad"
        />
        <VerdictCard
          icon={<Swords className="h-3.5 w-3.5" />}
          label="내 최고 압박 기술"
          title={myBestDamage?.move.koreanName ?? "계산 없음"}
          subtitle={myBestDamage?.koSummary ?? "-"}
          note={myBestDamage ? `${myBestDamage.minPercent.toFixed(1)}-${myBestDamage.maxPercent.toFixed(1)}% 범위` : "공격 기술 데이터가 없습니다."}
          status="good"
        />
      </section>

      <section className="grid gap-3 px-5 pb-6 xl:grid-cols-[3fr_1fr]">
        <MovePressureTable myRows={myDamageRows} opponentRows={opponentDamageRows} />
        <BulkMatrix myBulk={myBulk} opponentBulk={opponentBulk} />
      </section>

      <details className="mx-5 mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <summary className="cursor-pointer px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-slate-400">
          Custom sample editor
        </summary>
        <div className="border-t border-slate-100 p-4">
          <MySetManager
            sets={mySets}
            selectedSetId={mySet.id}
            pokemon={myPokemon}
            natures={natures}
            items={items}
            moves={moves}
            onSelectSet={setSelectedSetId}
            onAddSet={handleAddSet}
          />
        </div>
      </details>
    </main>
  );
}
