"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart2, ChevronDown, Clock, Shield, Swords, Zap } from "lucide-react";
import { MySetManager } from "@/components/MySetManager";
import { calculateBulk } from "@/lib/calc/bulk";
import { calculateDamage } from "@/lib/calc/damage";
import { calculateMovePower } from "@/lib/calc/power";
import { applyChoiceScarf } from "@/lib/calc/speed";
import { calculateStats } from "@/lib/calc/stats";
import { findAbilityByKey, listAbilities } from "@/lib/data/abilityRepository";
import { findItemByKey, listItems } from "@/lib/data/itemRepository";
import { getCurrentAccount, signInLocalAccount, signOutLocalAccount, signUpLocalAccount, type LocalAccount } from "@/lib/data/localAuthRepository";
import { findMoveByKey, listMoves } from "@/lib/data/moveRepository";
import { deleteMyPokemonSet, loadMyPokemonSets, replaceMyPokemonSets, saveMyPokemonSet } from "@/lib/data/mySetRepository";
import { listMyPokemonSets } from "@/lib/data/myTeamRepository";
import { findNatureByKey, listNatures } from "@/lib/data/natureRepository";
import { findChampionPokemonByName, findPokemonByKey, listChampionPokemon, searchChampionPokemon } from "@/lib/data/pokemonRepository";
import { findUsageByPokeKey } from "@/lib/data/usageRepository";
import type { BattleStatus, BattleWeather, BulkResult, CalculatedStats, DamageResult, DamageSideModifiers, MovePowerResult, StatStage } from "@/types/calc";
import type { AbilityMaster, ItemMaster, MoveMaster, PokemonMaster } from "@/types/master";
import type { EffortValues, MyPokemonSet } from "@/types/team";
import type { UsageStatPoint } from "@/types/usage";

const STAT_STAGES = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6] as const;

const DEFAULT_SIDE_MODIFIERS: DamageSideModifiers = {
  atkStage: 0,
  defStage: 0,
  spaStage: 0,
  spdStage: 0,
  speStage: 0,
  hpCurrent: undefined,
  hpMax: undefined,
  powerMultiplier: 1,
  status: "none",
  reflect: false,
  lightScreen: false
};

const WEATHER_LABEL: Record<BattleWeather, string> = {
  none: "없음",
  sun: "쾌청",
  rain: "비",
  sand: "모래바람",
  snow: "눈"
};

const STATUS_LABEL: Record<BattleStatus, string> = {
  none: "없음",
  burn: "화상",
  paralysis: "마비",
  poison: "독",
  toxic: "맹독",
  sleep: "잠듦",
  freeze: "얼음"
};

const TYPE_LABEL: Record<string, string> = {
  normal: "노말",
  fire: "불꽃",
  water: "물",
  electric: "전기",
  grass: "풀",
  ice: "얼음",
  fighting: "격투",
  poison: "독",
  ground: "땅",
  flying: "비행",
  psychic: "에스퍼",
  bug: "벌레",
  rock: "바위",
  ghost: "고스트",
  dragon: "드래곤",
  dark: "악",
  steel: "강철",
  fairy: "페어리"
};

const TYPE_COLOR: Record<string, string> = {
  normal: "bg-gray-100 text-gray-600 border-gray-300",
  fire: "bg-orange-100 text-orange-700 border-orange-300",
  water: "bg-blue-100 text-blue-700 border-blue-300",
  electric: "bg-yellow-100 text-yellow-700 border-yellow-300",
  grass: "bg-green-100 text-green-700 border-green-300",
  ice: "bg-sky-100 text-sky-700 border-sky-300",
  fighting: "bg-red-100 text-red-700 border-red-300",
  poison: "bg-purple-100 text-purple-700 border-purple-300",
  ground: "bg-amber-100 text-amber-700 border-amber-300",
  flying: "bg-indigo-100 text-indigo-700 border-indigo-300",
  psychic: "bg-pink-100 text-pink-700 border-pink-300",
  bug: "bg-lime-100 text-lime-700 border-lime-300",
  rock: "bg-stone-100 text-stone-700 border-stone-300",
  ghost: "bg-violet-100 text-violet-700 border-violet-300",
  dragon: "bg-violet-100 text-violet-700 border-violet-300",
  dark: "bg-slate-200 text-slate-600 border-slate-300",
  steel: "bg-zinc-100 text-zinc-700 border-zinc-300",
  fairy: "bg-rose-100 text-rose-700 border-rose-300"
};

const STAT_LABEL: Record<string, string> = {
  atk: "A",
  def: "B",
  spa: "C",
  spd: "D",
  spe: "S"
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

function natureModifierText(nature?: { up?: string; down?: string }): string {
  if (!nature?.up || !nature.down) return "보정 없음";
  return `${STAT_LABEL[nature.up] ?? nature.up}↑ ${STAT_LABEL[nature.down] ?? nature.down}↓`;
}

function abilityDescription(ability?: AbilityMaster): string {
  return ability?.shortDescription || ability?.description || "상세 설명 없음";
}

function bestPower(rows: MovePowerResult[]): MovePowerResult | undefined {
  return [...rows].sort((a, b) => b.power - a.power)[0];
}

function bestDamage(rows: DamageResult[]): DamageResult | undefined {
  const bestRow = [...rows].sort((a, b) => pressureMetric(b).maxPercent - pressureMetric(a).maxPercent)[0];
  if (!bestRow) return undefined;

  const metric = pressureMetric(bestRow);
  const meta = formatMaxHitChanceText(metric);
  if (!bestRow.multihitResults || metric.hitCount <= 1) return bestRow;

  return {
    ...bestRow,
    minDamage: metric.minDamage,
    maxDamage: metric.maxDamage,
    minPercent: metric.minPercent,
    maxPercent: metric.maxPercent,
    koSummary: meta ? `${metric.koSummary} · ${meta}` : metric.koSummary
  };
}

function pressureMetric(row?: DamageResult): {
  hitCount: number;
  hitChance: number;
  minDamage: number;
  maxDamage: number;
  minPercent: number;
  maxPercent: number;
  koSummary: string;
} {
  if (!row) {
    return { hitCount: 0, hitChance: 0, minDamage: 0, maxDamage: 0, minPercent: 0, maxPercent: 0, koSummary: "계산 없음" };
  }

  const maxHitResult = row.multihitResults?.reduce((best, current) => (current.hitCount > best.hitCount ? current : best));
  return maxHitResult ?? row;
}

function pressureMetaText(row?: DamageResult): string | undefined {
  if (!row) return undefined;
  const metric = pressureMetric(row);
  if (!row.multihitResults || metric.hitCount <= 1) return undefined;
  return `최다 ${metric.hitCount}타 기준 · 확률 ${formatChance(metric.hitChance)}`;
}

function pressureLabel(row: Pick<DamageResult, "minPercent" | "maxPercent">): { label: string; className: string } {
  if (row.minPercent >= 100) return { label: "확정 KO", className: "bg-red-100 text-red-700 border border-red-200" };
  if (row.maxPercent >= 100) return { label: "난수 KO", className: "bg-orange-100 text-orange-700 border border-orange-200" };
  if (row.maxPercent >= 50) return { label: "높음", className: "bg-yellow-100 text-yellow-700 border border-yellow-200" };
  return { label: "낮음", className: "bg-slate-100 text-slate-500 border border-slate-200" };
}

function secondaryDamageRows(rows: DamageResult[], best?: DamageResult): DamageResult[] {
  return rows
    .filter((row) => row.move.key !== best?.move.key)
    .sort((a, b) => pressureMetric(b).maxPercent - pressureMetric(a).maxPercent)
    .slice(0, 3);
}

function formatChance(chance: number): string {
  return `${(chance * 100).toFixed(chance === 1 ? 0 : 1)}%`;
}

function formatMaxHitChanceText(metric: { hitCount: number; hitChance: number }): string {
  return `최다 ${metric.hitCount}타 기준 · 확률 ${formatChance(metric.hitChance)}`;
}

function hasMove(entry: { move?: MoveMaster; usageRate: number }): entry is { move: MoveMaster; usageRate: number } {
  return entry.move !== undefined;
}

function applyStageValue(value: number, stage: StatStage): number {
  const multiplier = stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
  return Math.max(1, Math.floor(value * multiplier));
}

function applySpeedStatus(value: number, status: BattleStatus): number {
  return status === "paralysis" ? Math.max(1, Math.floor(value * 0.5)) : value;
}

function applyItemSpeed(value: number, item?: ItemMaster): number {
  return item?.effectType === "choice_scarf" ? applyChoiceScarf(value) : value;
}

function clampHpValue(value: number, max = Number.POSITIVE_INFINITY): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(max, Math.max(1, Math.round(value)));
}

function clampMultiplier(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(10, Math.max(0.01, Number(value.toFixed(2))));
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const maybeError = error as { message?: unknown; details?: unknown; code?: unknown };
    const parts = [maybeError.message, maybeError.details, maybeError.code].filter((part): part is string => typeof part === "string" && part.length > 0);
    if (parts.length > 0) return parts.join(" / ");
  }
  return fallback;
}

function conditionalPowerNote(move: MoveMaster, weather?: BattleWeather): string | undefined {
  const englishName = move.englishName?.toLowerCase();
  const koreanName = move.koreanName;

  if (englishName === "last respects" || koreanName === "성묘") {
    return "조건부 위력: 기절한 아군 1마리마다 +50. 현재 자동 반영 안 됨, 위력 배수로 수동 보정.";
  }

  if (englishName === "knock off" || koreanName === "탁쳐서떨구기") {
    return "조건부 위력: 상대가 아이템을 들고 있으면 1.5배. 현재 자동 반영 안 됨, 필요 시 위력 x1.5.";
  }

  if (englishName === "weather ball" || koreanName === "웨더볼") {
    if (weather && weather !== "none") {
      return `조건부 위력: 날씨(${WEATHER_LABEL[weather]})에서 위력 50→100, 타입도 날씨에 맞게 변화. 현재 자동 반영 안 됨, 필요 시 위력 x2.`;
    }
    return "조건부 위력: 날씨가 있으면 위력 50→100, 타입도 날씨에 맞게 변화. 현재 자동 반영 안 됨.";
  }

  if (englishName === "hex" || koreanName === "병상첨병" || koreanName === "병첨") {
    return "조건부 위력: 대상이 상태이상이면 2배. 현재 자동 반영 안 됨, 필요 시 위력 x2.";
  }

  return undefined;
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
  bestMove,
  speedNote
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
  speedNote?: string;
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
          <div className="text-[1.5rem] font-bold leading-none text-white">
            {pokemon.koreanName}
          </div>
          <div className="mt-0.5 font-mono text-[9px] text-white/60" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            {pokemon.englishName ?? pokemon.showdownId}
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
        {speedNote ? <div className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 font-mono text-[10px] font-semibold text-amber-700">{speedNote}</div> : null}

        <div className={`mt-auto rounded-md border p-2.5 ${moveBorder}`}>
          <div className={`mb-1 font-mono text-[8px] uppercase tracking-widest opacity-70 ${moveText}`}>대표 기술</div>
          <div className={`text-sm font-bold ${moveText}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            {bestMove?.move.koreanName ?? "계산 없음"}
          </div>
          <div className={`font-mono text-xs font-semibold ${moveText}`}>
            채용률 {bestMove?.usageRate?.toFixed(1) ?? "100.0"}% · 결정력 {(bestMove?.power ?? 0).toLocaleString()}
          </div>
          {bestMove && conditionalPowerNote(bestMove.move) ? (
            <div className={`mt-1 font-mono text-[9px] leading-relaxed ${moveText}`}>{conditionalPowerNote(bestMove.move)}</div>
          ) : null}
          {bestMove?.abilityNotes?.length ? (
            <div className={`mt-1 font-mono text-[9px] leading-relaxed ${moveText}`}>{bestMove.abilityNotes.join(" · ")}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SecondaryDamageSummary({ title, rows, side }: { title: string; rows: DamageResult[]; side: "my" | "opp" }) {
  const textColor = side === "my" ? "text-sky-700" : "text-rose-700";
  const emptyText = side === "my" ? "내 다른 기술 없음" : "상대 다른 기술 없음";

  return (
    <div className="min-w-0 rounded-md border border-white bg-white/70 p-2">
      <div className="mb-1.5 font-mono text-[8px] leading-tight text-slate-400">{title}</div>
      <div className="space-y-1">
        {rows.length > 0 ? (
          rows.map((row) => {
            const metric = pressureMetric(row);
            const meta = row.multihitResults && metric.hitCount > 1 ? `${metric.hitCount}타 ${formatChance(metric.hitChance)}` : undefined;
            return (
              <div key={row.move.key} className="flex items-center justify-between gap-2 rounded border border-slate-100 bg-white/70 px-2 py-1">
                <span className="min-w-0 truncate text-[10px] font-bold text-slate-600">{row.move.koreanName}</span>
                <span className={`shrink-0 font-mono text-[10px] font-bold ${textColor}`}>
                  {metric.minPercent.toFixed(1)}-{metric.maxPercent.toFixed(1)}%
                  {meta ? <span className="ml-1 text-[8px] font-semibold text-slate-400">{meta}</span> : null}
                </span>
              </div>
            );
          })
        ) : (
          <div className="rounded border border-slate-100 bg-white/70 px-2 py-2 text-center font-mono text-[10px] text-slate-400">{emptyText}</div>
        )}
      </div>
    </div>
  );
}

function VSPanel({
  myStats,
  opponentStats,
  myBestDamage,
  opponentBestDamage,
  myDamageRows,
  opponentDamageRows
}: {
  myStats: CalculatedStats;
  opponentStats: CalculatedStats;
  myBestDamage?: DamageResult;
  opponentBestDamage?: DamageResult;
  myDamageRows: DamageResult[];
  opponentDamageRows: DamageResult[];
}) {
  const isFaster = myStats.spe > opponentStats.spe;
  const isSpeedTie = myStats.spe === opponentStats.spe;
  const speedDiff = Math.abs(myStats.spe - opponentStats.spe);
  const myPressureMetric = pressureMetric(myBestDamage);
  const opponentPressureMetric = pressureMetric(opponentBestDamage);
  const myPressure = myPressureMetric.maxPercent;
  const opponentPressure = opponentPressureMetric.maxPercent;
  const isPressureTie = myPressure === opponentPressure;
  const myPressuresMore = myPressure > opponentPressure;
  const myOtherRows = secondaryDamageRows(myDamageRows, myBestDamage);
  const opponentOtherRows = secondaryDamageRows(opponentDamageRows, opponentBestDamage);
  const speedCardClass = isSpeedTie
    ? "border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50"
    : isFaster
      ? "border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50"
      : "border-rose-200 bg-gradient-to-br from-rose-50 to-red-50";
  const pressureCardClass = isPressureTie ? "border-amber-200 bg-amber-50/50" : myPressuresMore ? "border-sky-200 bg-sky-50/50" : "border-rose-200 bg-rose-50/50";

  return (
    <div className="flex flex-col gap-2.5">
      <div className={`rounded-xl border p-4 shadow-sm ${speedCardClass}`}>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-slate-400">
            <Zap className="h-3 w-3" /> 스피드 체크
          </span>
          <span className={`rounded-full px-2.5 py-1 font-mono text-[9px] font-bold text-white ${isSpeedTie ? "bg-amber-500" : isFaster ? "bg-sky-600" : "bg-rose-600"}`}>
            {isSpeedTie ? "동률" : isFaster ? "내가 선공" : "상대 선공"}
          </span>
        </div>

        <div className="flex items-baseline justify-center gap-3 py-2" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
          <span className={`font-bold leading-none ${isSpeedTie ? "text-5xl text-amber-700" : isFaster ? "text-5xl text-sky-700" : "text-3xl text-slate-300"}`}>{myStats.spe}</span>
          <span className="text-2xl font-light text-slate-300">{isSpeedTie ? "=" : isFaster ? ">" : "<"}</span>
          <span className={`font-bold leading-none ${isSpeedTie ? "text-5xl text-amber-700" : isFaster ? "text-3xl text-slate-300" : "text-5xl text-rose-700"}`}>{opponentStats.spe}</span>
        </div>
        <div className="text-center font-mono text-[11px] font-bold tracking-wide text-slate-500">차이 {speedDiff}</div>
      </div>

      <div className={`rounded-xl border p-4 shadow-sm ${pressureCardClass}`}>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-slate-400">
            <Swords className="h-3 w-3" /> 압박 기술 비교
          </span>
          <span className={`rounded-full px-2.5 py-1 font-mono text-[9px] font-bold text-white ${isPressureTie ? "bg-amber-500" : myPressuresMore ? "bg-sky-600" : "bg-rose-600"}`}>
            {isPressureTie ? "동률" : myPressuresMore ? "내 압박 우위" : "상대 압박 우위"}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="min-w-0 text-center">
            <div className={`truncate text-sm font-bold ${isPressureTie ? "text-amber-800" : myPressuresMore ? "text-sky-800" : "text-slate-400"}`}>
              {myBestDamage?.move.koreanName ?? "계산 없음"}
            </div>
            <div className={`mt-1 font-bold leading-none ${isPressureTie ? "text-4xl text-amber-700" : myPressuresMore ? "text-4xl text-sky-700" : "text-2xl text-slate-300"}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              {myBestDamage ? `${myPressureMetric.maxPercent.toFixed(1)}%` : "-"}
            </div>
            <div className="mt-1 font-mono text-[9px] text-slate-400">{myBestDamage?.koSummary ?? "계산 없음"}</div>
          </div>
          <div className="text-xl font-thin text-slate-200">vs</div>
          <div className="min-w-0 text-center">
            <div className={`truncate text-sm font-bold ${isPressureTie ? "text-amber-800" : myPressuresMore ? "text-slate-400" : "text-rose-800"}`}>
              {opponentBestDamage?.move.koreanName ?? "계산 없음"}
            </div>
            <div className={`mt-1 font-bold leading-none ${isPressureTie ? "text-4xl text-amber-700" : myPressuresMore ? "text-2xl text-slate-300" : "text-4xl text-rose-700"}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              {opponentBestDamage ? `${opponentBestDamage.maxPercent.toFixed(1)}%` : "-"}
            </div>
            <div className="mt-1 font-mono text-[9px] text-slate-400">{opponentBestDamage?.koSummary ?? "계산 없음"}</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-slate-400">
            <BarChart2 className="h-3 w-3" /> 나머지 기술 데미지
          </span>
          <span className="rounded-full bg-slate-700 px-2.5 py-1 font-mono text-[9px] font-bold text-white">HP 비율</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          <SecondaryDamageSummary title="내 나머지 기술" rows={myOtherRows} side="my" />
          <SecondaryDamageSummary title="상대 나머지 기술" rows={opponentOtherRows} side="opp" />
        </div>
      </div>

      <div className="hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-slate-400">
            <Shield className="h-3 w-3" /> KO 체크
          </span>
          <span className="rounded-full bg-amber-500 px-2.5 py-1 font-mono text-[9px] font-bold text-white">위험 구간</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {[
            ["내 최고 압박", myBestDamage?.koSummary ?? "계산 없음", "text-sky-700"],
            ["상대 최고 압박", opponentBestDamage?.koSummary ?? "계산 없음", "text-rose-700"],
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

function MovePressureTable({ myRows, opponentRows, weather }: { myRows: DamageResult[]; opponentRows: DamageResult[]; weather: BattleWeather }) {
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
            {["방향", "기술", "채용률", "타입", "HP 비율", "데미지", "압박", "판정"].map((header) => (
              <th key={header} className="px-3 py-2 text-left text-[8px] font-semibold uppercase tracking-widest text-slate-400">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ row, side }) => {
            const metric = pressureMetric(row);
            const pressure = pressureLabel(metric);
            const meta = row.multihitResults && metric.hitCount > 1 ? formatMaxHitChanceText(metric) : undefined;
            const isMy = side === "내 기술";
            return (
              <Fragment key={`${side}-${row.move.key}`}>
                <tr key={`${side}-${row.move.key}`} className={`border-b border-slate-50 transition-colors hover:bg-slate-50/80 ${isMy ? "border-l-2 border-l-sky-400" : "border-l-2 border-l-rose-400"}`}>
                  <td className="px-3 py-2">
                    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${isMy ? "bg-sky-100 text-sky-700" : "bg-rose-100 text-rose-700"}`}>
                      {side}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-semibold text-slate-700">
                    <div>{row.move.koreanName}</div>
                    {conditionalPowerNote(row.move, weather) ? (
                      <div className="mt-0.5 max-w-[18rem] whitespace-normal font-mono text-[9px] font-normal leading-relaxed text-amber-600">{conditionalPowerNote(row.move, weather)}</div>
                    ) : null}
                    {row.abilityNotes?.length ? (
                      <div className="mt-0.5 max-w-[18rem] whitespace-normal font-mono text-[9px] font-normal leading-relaxed text-sky-600">{row.abilityNotes.join(" · ")}</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-500">{row.usageRate?.toFixed(1) ?? "100.0"}%</td>
                  <td className="px-3 py-2">{typeBadge(row.move.type)}</td>
                  <td className="px-3 py-2 text-right text-slate-500">{metric.minPercent.toFixed(1)}-{metric.maxPercent.toFixed(1)}%</td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-700">{metric.minDamage}-{metric.maxDamage}</td>
                  <td className="px-3 py-2 text-right">
                    <span className={`rounded-full px-2 py-0.5 text-[8px] font-medium ${pressure.className}`}>{pressure.label}</span>
                  </td>
                  <td className="px-3 py-2 text-[9px] text-slate-400">
                    <div>{metric.koSummary}</div>
                    {meta ? <div className="mt-0.5 font-semibold text-slate-500">{meta}</div> : null}
                  </td>
                </tr>
                {row.multihitResults?.map((result) => (
                  <tr key={`${side}-${row.move.key}-${result.hitCount}`} className={`border-b border-slate-50 bg-slate-50/60 ${isMy ? "border-l-2 border-l-sky-200" : "border-l-2 border-l-rose-200"}`}>
                    <td className="px-3 py-1.5" />
                    <td className="px-3 py-1.5 font-mono text-[10px] text-slate-500">
                      {result.hitCount}타 명중 <span className={isMy ? "text-sky-600" : "text-rose-600"}>{formatChance(result.hitChance)}</span>
                    </td>
                    <td className="px-3 py-1.5" />
                    <td className="px-3 py-1.5" />
                    <td className="px-3 py-1.5 text-right font-mono text-[10px] text-slate-500">
                      {result.minPercent.toFixed(1)}-{result.maxPercent.toFixed(1)}%
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-[10px] font-semibold text-slate-600">
                      {result.minDamage}-{result.maxDamage}
                    </td>
                    <td className="px-3 py-1.5 text-right" />
                    <td className="px-3 py-1.5 font-mono text-[10px] text-slate-500">{result.koSummary}</td>
                  </tr>
                ))}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StageSelect({ label, value, onChange }: { label: string; value: StatStage; onChange: (value: StatStage) => void }) {
  return (
    <label className="flex w-16 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1">
      <span className="font-mono text-[9px] font-semibold text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value) as StatStage)}
        className="bg-transparent font-mono text-[10px] font-bold text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
      >
        {STAT_STAGES.map((stage) => (
          <option key={stage} value={stage}>
            {stage > 0 ? `+${stage}` : stage}
          </option>
        ))}
      </select>
    </label>
  );
}

function BattleNumberInput({
  value,
  onCommit,
  min,
  max,
  step,
  className
}: {
  value: number;
  onCommit: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  function commit(nextDraft = draft) {
    const parsed = Number(nextDraft);
    if (nextDraft.trim() === "" || !Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }
    onCommit(parsed);
  }

  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => commit()}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
      className={className}
    />
  );
}

function BattleConditionPanel({
  weather,
  myModifiers,
  opponentModifiers,
  myHp,
  opponentHp,
  onWeatherChange,
  onMyModifiersChange,
  onOpponentModifiersChange
}: {
  weather: BattleWeather;
  myModifiers: DamageSideModifiers;
  opponentModifiers: DamageSideModifiers;
  myHp: number;
  opponentHp: number;
  onWeatherChange: (weather: BattleWeather) => void;
  onMyModifiersChange: (next: DamageSideModifiers) => void;
  onOpponentModifiersChange: (next: DamageSideModifiers) => void;
}) {
  function getDefaultHp(side: "my" | "opponent"): number {
    return side === "my" ? myHp : opponentHp;
  }

  function updateHp(side: "my" | "opponent", patch: Partial<Pick<DamageSideModifiers, "hpCurrent" | "hpMax">>) {
    const currentModifiers = side === "my" ? myModifiers : opponentModifiers;
    const fallbackMax = currentModifiers.hpMax ?? getDefaultHp(side);
    const nextMax = patch.hpMax !== undefined ? clampHpValue(patch.hpMax) : fallbackMax;
    const nextCurrent = patch.hpCurrent !== undefined ? clampHpValue(patch.hpCurrent, nextMax) : Math.min(currentModifiers.hpCurrent ?? fallbackMax, nextMax);

    updateSide(side, { hpCurrent: nextCurrent, hpMax: nextMax });
  }

  function updateOpponentHpPercent(value: number) {
    const hpPercent = Math.min(100, Math.max(1, Math.round(Number.isFinite(value) ? value : 100)));
    updateSide("opponent", { hpPercent, hpCurrent: undefined, hpMax: undefined });
  }

  function updateSide(side: "my" | "opponent", patch: Partial<DamageSideModifiers>) {
    if (side === "my") onMyModifiersChange({ ...myModifiers, ...patch });
    else onOpponentModifiersChange({ ...opponentModifiers, ...patch });
  }

  return (
    <section className="grid justify-items-center gap-2 border-b border-slate-200 bg-white/70 px-5 py-2.5">
      <span className="font-mono text-[9px] uppercase tracking-widest text-amber-600">전투 조건</span>
      <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-2 py-1">
        <span className="font-mono text-[9px] font-semibold text-slate-400">날씨</span>
        <select
          value={weather}
          onChange={(event) => onWeatherChange(event.target.value as BattleWeather)}
          className="bg-transparent font-mono text-[10px] font-bold text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        >
          {(Object.keys(WEATHER_LABEL) as BattleWeather[]).map((key) => (
            <option key={key} value={key}>
              {WEATHER_LABEL[key]}
            </option>
          ))}
        </select>
      </label>

      <div className="grid w-full max-w-6xl grid-cols-1 gap-2 xl:grid-cols-2">
      {[
        ["my", "내 랭크", myModifiers] as const,
        ["opponent", "상대 랭크", opponentModifiers] as const
      ].map(([side, title, modifiers]) => (
        <div key={side} className="flex min-h-10 w-full flex-wrap items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
          <span className={`w-16 px-1.5 text-center font-mono text-[9px] font-bold ${side === "my" ? "text-sky-600" : "text-rose-600"}`}>{title}</span>
          {side === "my" ? (
            <label className="flex w-36 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1">
              <span className="font-mono text-[9px] font-semibold text-slate-400">HP</span>
              <BattleNumberInput
                min={1}
                max={modifiers.hpMax ?? getDefaultHp(side)}
                value={modifiers.hpCurrent ?? modifiers.hpMax ?? getDefaultHp(side)}
                onCommit={(value) => updateHp(side, { hpCurrent: value })}
                className="w-14 bg-transparent text-right font-mono text-[10px] font-bold text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              />
              <span className="font-mono text-[9px] text-slate-400">/</span>
              <BattleNumberInput
                min={1}
                value={modifiers.hpMax ?? getDefaultHp(side)}
                onCommit={(value) => updateHp(side, { hpMax: value })}
                className="w-14 bg-transparent text-right font-mono text-[10px] font-bold text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              />
            </label>
          ) : (
            <label className="flex w-36 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1">
              <span className="font-mono text-[9px] font-semibold text-slate-400">HP</span>
              <BattleNumberInput
                min={1}
                max={100}
                value={modifiers.hpPercent ?? 100}
                onCommit={updateOpponentHpPercent}
                className="w-12 bg-transparent text-right font-mono text-[10px] font-bold text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              />
              <span className="font-mono text-[9px] text-slate-400">%</span>
            </label>
          )}
          <label className="flex w-24 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1">
            <span className="font-mono text-[9px] font-semibold text-slate-400">위력</span>
            <BattleNumberInput
              min={0.01}
              max={10}
              step={0.05}
              value={modifiers.powerMultiplier ?? 1}
              onCommit={(value) => updateSide(side, { powerMultiplier: clampMultiplier(value) })}
              className="w-14 bg-transparent text-right font-mono text-[10px] font-bold text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            />
            <span className="font-mono text-[9px] text-slate-400">x</span>
          </label>
          <label className="flex w-28 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1">
            <span className="font-mono text-[9px] font-semibold text-slate-400">상태</span>
            <select
              value={modifiers.status ?? "none"}
              onChange={(event) => updateSide(side, { status: event.target.value as BattleStatus })}
              className="bg-transparent font-mono text-[10px] font-bold text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              {(Object.keys(STATUS_LABEL) as BattleStatus[]).map((key) => (
                <option key={key} value={key}>
                  {STATUS_LABEL[key]}
                </option>
              ))}
            </select>
          </label>
          <StageSelect label="A" value={modifiers.atkStage} onChange={(value) => updateSide(side, { atkStage: value })} />
          <StageSelect label="B" value={modifiers.defStage} onChange={(value) => updateSide(side, { defStage: value })} />
          <StageSelect label="C" value={modifiers.spaStage} onChange={(value) => updateSide(side, { spaStage: value })} />
          <StageSelect label="D" value={modifiers.spdStage} onChange={(value) => updateSide(side, { spdStage: value })} />
          <StageSelect label="S" value={modifiers.speStage} onChange={(value) => updateSide(side, { speStage: value })} />
          <label className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-[9px] font-semibold text-slate-500">
            <input type="checkbox" checked={modifiers.reflect} onChange={(event) => updateSide(side, { reflect: event.target.checked })} />
            리플렉터
          </label>
          <label className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-[9px] font-semibold text-slate-500">
            <input type="checkbox" checked={modifiers.lightScreen} onChange={(event) => updateSide(side, { lightScreen: event.target.checked })} />
            빛의장막
          </label>
        </div>
      ))}
      </div>
    </section>
  );
}

export default function Home() {
  const [account, setAccount] = useState<LocalAccount>();
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authError, setAuthError] = useState<string>();
  const [authSuccess, setAuthSuccess] = useState<string>();
  const [authPending, setAuthPending] = useState(false);
  const [setsPending, setSetsPending] = useState(false);
  const [setsError, setSetsError] = useState<string>();
  const [setsSuccess, setSetsSuccess] = useState<string>();
  const [deletingSetId, setDeletingSetId] = useState<string>();
  const [query, setQuery] = useState("한카리아스");
  const [opponentKey, setOpponentKey] = useState("0445-00");
  const [searchError, setSearchError] = useState<string>();
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [selectedOpponentAbilityIndex, setSelectedOpponentAbilityIndex] = useState(0);
  const [selectedOpponentNatureIndex, setSelectedOpponentNatureIndex] = useState(0);
  const [selectedOpponentItemIndex, setSelectedOpponentItemIndex] = useState(0);
  const [selectedOpponentSpIndex, setSelectedOpponentSpIndex] = useState(0);
  const [mySets, setMySets] = useState<MyPokemonSet[]>(() => listMyPokemonSets());
  const [selectedSetId, setSelectedSetId] = useState(() => listMyPokemonSets()[0]?.id ?? "");
  const [isMySetMenuOpen, setIsMySetMenuOpen] = useState(false);
  const [isSampleCreatorOpen, setIsSampleCreatorOpen] = useState(false);
  const [weather, setWeather] = useState<BattleWeather>("none");
  const [myModifiers, setMyModifiers] = useState<DamageSideModifiers>(DEFAULT_SIDE_MODIFIERS);
  const [opponentModifiers, setOpponentModifiers] = useState<DamageSideModifiers>(DEFAULT_SIDE_MODIFIERS);

  useEffect(() => {
    let isMounted = true;

    getCurrentAccount()
      .then((currentAccount) => {
        if (isMounted) setAccount(currentAccount);
      })
      .catch(() => {
        if (isMounted) setAccount(undefined);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    setSetsPending(true);
    setSetsError(undefined);

    loadMyPokemonSets(account?.id)
      .then((sets) => {
        if (!isMounted) return;
        setMySets(sets);
        setSelectedSetId((currentId) => (sets.some((set) => set.id === currentId) ? currentId : sets[0]?.id ?? ""));
      })
      .catch((error) => {
        if (!isMounted) return;
        const fallbackSets = listMyPokemonSets();
        setMySets(fallbackSets);
        setSelectedSetId(fallbackSets[0]?.id ?? "");
        setSetsError(errorMessage(error, "샘플을 불러오지 못했습니다."));
      })
      .finally(() => {
        if (isMounted) setSetsPending(false);
      });

    return () => {
      isMounted = false;
    };
  }, [account?.id]);

  useEffect(() => {
    if (setsPending) return;
    replaceMyPokemonSets(mySets, account?.id).catch((error) => {
      setSetsError(errorMessage(error, "샘플 저장에 실패했습니다."));
    });
  }, [account?.id, mySets, setsPending]);

  useEffect(() => {
    if (!setsSuccess) return;

    const timeoutId = window.setTimeout(() => setSetsSuccess(undefined), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [setsSuccess]);

  const mySet = mySets.find((set) => set.id === selectedSetId) ?? mySets[0];
  const myPokemon = findPokemonByKey(mySet.pokeKey);
  const opponentPokemon = findPokemonByKey(opponentKey);
  const natures = listNatures();
  const items = listItems();
  const moves = listMoves();
  const abilities = listAbilities();
  const pokemonList = listChampionPokemon();
  const opponentSuggestions = useMemo(() => searchChampionPokemon(query, 8), [query]);
  const showOpponentSuggestions = isAutocompleteOpen && opponentSuggestions.length > 0;

  useEffect(() => {
    setActiveSuggestionIndex((index) => Math.min(index, Math.max(opponentSuggestions.length - 1, 0)));
  }, [opponentSuggestions.length]);

  useEffect(() => {
    setSelectedOpponentAbilityIndex(0);
    setSelectedOpponentNatureIndex(0);
    setSelectedOpponentItemIndex(0);
    setSelectedOpponentSpIndex(0);
    setOpponentModifiers({ ...DEFAULT_SIDE_MODIFIERS });
  }, [opponentKey]);

  useEffect(() => {
    setMyModifiers((current) => ({ ...current, hpCurrent: undefined, hpMax: undefined }));
  }, [selectedSetId]);

  useEffect(() => {
    if (!isSampleCreatorOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsSampleCreatorOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSampleCreatorOpen]);

  if (!myPokemon || !opponentPokemon) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6">
        <section className="rounded-md border border-red-200 bg-white p-4 text-red-700">로컬 마스터 데이터가 부족합니다.</section>
      </main>
    );
  }

  const myNature = findNatureByKey(mySet.natureKey);
  const myItem = findItemByKey(mySet.itemKey);
  const myAbility = findAbilityByKey(mySet.abilityKey ?? 0);
  const usage = findUsageByPokeKey(opponentPokemon.pokeKey);
  const opponentAbilityOptions = usage?.data.abilities.slice(0, 3) ?? [];
  const opponentNatureOptions = usage?.data.natures.slice(0, 3) ?? [];
  const opponentItemOptions = usage?.data.items.slice(0, 3) ?? [];
  const opponentSpOptions = usage?.data.stat_points.skeletons.slice(0, 3) ?? [];
  const selectedOpponentAbilityEntry = opponentAbilityOptions[selectedOpponentAbilityIndex] ?? opponentAbilityOptions[0];
  const selectedOpponentNatureEntry = opponentNatureOptions[selectedOpponentNatureIndex] ?? opponentNatureOptions[0];
  const selectedOpponentItemEntry = opponentItemOptions[selectedOpponentItemIndex] ?? opponentItemOptions[0];
  const selectedOpponentSpEntry = opponentSpOptions[selectedOpponentSpIndex] ?? opponentSpOptions[0];
  const opponentAbility = findAbilityByKey(selectedOpponentAbilityEntry?.key);
  const opponentNature = findNatureByKey(selectedOpponentNatureEntry?.key ?? 13);
  const opponentItem = findItemByKey(selectedOpponentItemEntry?.key);
  const opponentStatPoint = selectedOpponentSpEntry;
  const opponentEvs = opponentStatPoint ? evsFromUsage(opponentStatPoint) : { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };

  const myStats = calculateStats({ baseStats: myPokemon.baseStats, level: mySet.level, evs: mySet.evs, nature: myNature });
  const opponentStats = calculateStats({ baseStats: opponentPokemon.baseStats, level: 50, evs: opponentEvs, nature: opponentNature });
  const myStageSpeed = applyStageValue(myStats.spe, myModifiers.speStage);
  const opponentStageSpeed = applyStageValue(opponentStats.spe, opponentModifiers.speStage);
  const myBattleSpeed = applyItemSpeed(applySpeedStatus(myStageSpeed, myModifiers.status ?? "none"), myItem);
  const opponentBattleSpeed = applyItemSpeed(applySpeedStatus(opponentStageSpeed, opponentModifiers.status ?? "none"), opponentItem);
  const myBattleStats = { ...myStats, spe: myBattleSpeed };
  const opponentBattleStats = { ...opponentStats, spe: opponentBattleSpeed };
  const mySpeedNote = myItem?.effectType === "choice_scarf" ? `구애스카프 적용: ${myStageSpeed} → ${myBattleSpeed}` : undefined;
  const opponentSpeedNote = opponentItem?.effectType === "choice_scarf" ? `구애스카프 적용: ${opponentStageSpeed} → ${opponentBattleSpeed}` : undefined;
  const myBulk = calculateBulk(myStats);
  const opponentBulk = calculateBulk(opponentStats);

  const myMoves = mySet.moves.map((key) => ({ move: findMoveByKey(key), usageRate: 100 })).filter(hasMove);
  const opponentMoves = (usage?.data.moves ?? [])
    .slice(0, 10)
    .map((entry) => ({ move: findMoveByKey(entry.key), usageRate: entry.rate }))
    .filter(hasMove);

  const myPowers = myMoves
    .map(({ move, usageRate }) =>
      calculateMovePower({
        pokemonTypes: myPokemon.types,
        stats: myStats,
        move,
        item: myItem,
        ability: myAbility,
        usageRate,
        stage: move.category === "physical" ? myModifiers.atkStage : myModifiers.spaStage,
        weather,
        powerMultiplier: myModifiers.powerMultiplier,
        status: myModifiers.status ?? "none",
        hpCurrent: myModifiers.hpCurrent ?? myStats.hp,
        hpMax: myModifiers.hpMax ?? myStats.hp
      })
    )
    .filter((result) => result !== undefined);
  const opponentPowers = opponentMoves
    .map(({ move, usageRate }) =>
      calculateMovePower({
        pokemonTypes: opponentPokemon.types,
        stats: opponentStats,
        move,
        item: opponentItem,
        ability: opponentAbility,
        usageRate,
        stage: move.category === "physical" ? opponentModifiers.atkStage : opponentModifiers.spaStage,
        weather,
        powerMultiplier: opponentModifiers.powerMultiplier,
        status: opponentModifiers.status ?? "none",
        hpCurrent: opponentStats.hp,
        hpMax: opponentStats.hp
      })
    )
    .filter((result) => result !== undefined);

  const myDamageRows = myMoves
    .map(({ move, usageRate }) =>
      calculateDamage({
        level: mySet.level,
        attackerTypes: myPokemon.types,
        defenderTypes: opponentPokemon.types,
        attackerStats: myStats,
        defenderStats: opponentStats,
        move,
        item: myItem,
        ability: myAbility,
        defenderAbility: opponentAbility,
        usageRate,
        modifiers: {
          weather,
          attacker: myModifiers,
          defender: opponentModifiers
        }
      })
    )
    .filter((result) => result !== undefined);

  const opponentDamageRows = opponentMoves
    .map(({ move, usageRate }) =>
      calculateDamage({
        level: 50,
        attackerTypes: opponentPokemon.types,
        defenderTypes: myPokemon.types,
        attackerStats: opponentStats,
        defenderStats: myStats,
        move,
        item: opponentItem,
        ability: opponentAbility,
        defenderAbility: myAbility,
        usageRate,
        modifiers: {
          weather,
          attacker: opponentModifiers,
          defender: myModifiers
        }
      })
    )
    .filter((result) => result !== undefined);

  const myBestPower = bestPower(myPowers);
  const opponentBestPower = bestPower(opponentPowers);
  const myBestDamage = bestDamage(myDamageRows);
  const opponentBestDamage = bestDamage(opponentDamageRows);
  const isFaster = myBattleStats.spe > opponentBattleStats.spe;
  const speedDiff = Math.abs(myBattleStats.spe - opponentBattleStats.spe);
  function selectOpponent(pokemon: PokemonMaster) {
    setOpponentKey(pokemon.pokeKey);
    setQuery(pokemon.koreanName);
    setSearchError(undefined);
    setIsAutocompleteOpen(false);
    setActiveSuggestionIndex(0);
  }

  function handleSearch(targetQuery = query) {
    const found = findChampionPokemonByName(targetQuery);
    if (!found) {
      setSearchError("도감에서 포켓몬을 찾지 못했습니다.");
      return;
    }

    selectOpponent(found);
  }

  async function handleAddSet(set: MyPokemonSet) {
    setSetsPending(true);
    setSetsError(undefined);

    try {
      await saveMyPokemonSet(set, account?.id);
      setMySets((current) => [...current, set]);
      setSelectedSetId(set.id);
      setIsMySetMenuOpen(false);
      setSetsSuccess(`${set.nickname ?? "샘플"} 등록됐습니다.`);
    } catch (error) {
      setSetsError(errorMessage(error, "샘플 저장에 실패했습니다."));
      throw error;
    } finally {
      setSetsPending(false);
    }
  }

  function selectMySet(id: string) {
    setSelectedSetId(id);
    setIsMySetMenuOpen(false);
  }

  async function handleDeleteSet(setId: string) {
    if (mySets.length <= 1) {
      setSetsError("샘플은 최소 1개 이상 필요합니다.");
      return;
    }

    const targetSet = mySets.find((set) => set.id === setId);
    setDeletingSetId(setId);
    setSetsError(undefined);

    try {
      await deleteMyPokemonSet(setId, account?.id);
      setMySets((current) => {
        const next = current.filter((set) => set.id !== setId);
        if (selectedSetId === setId) {
          setSelectedSetId(next[0]?.id ?? "");
        }
        return next;
      });
      setSetsSuccess(`${targetSet?.nickname ?? "샘플"} 삭제됐습니다.`);
    } catch (error) {
      setSetsError(errorMessage(error, "샘플 삭제에 실패했습니다."));
    } finally {
      setDeletingSetId(undefined);
    }
  }

  async function handleAuthSubmit(formData: FormData) {
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const nickname = String(formData.get("nickname") ?? "");

    setAuthPending(true);

    try {
      const nextAccount = authMode === "signup" ? await signUpLocalAccount(email, password, nickname) : await signInLocalAccount(email, password);
      setAccount(nextAccount);
      setAuthError(undefined);
      setAuthSuccess(authMode === "signup" ? "회원가입 완료" : "로그인 완료");
    } catch (error) {
      setAuthSuccess(undefined);
      setAuthError(errorMessage(error, "인증 처리에 실패했습니다."));
    } finally {
      setAuthPending(false);
    }
  }

  async function handleSignOut() {
    setAuthPending(true);
    await signOutLocalAccount();
    setAccount(undefined);
    setAuthSuccess("로그아웃 완료");
    setAuthError(undefined);
    setAuthPending(false);
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f0f4f9] text-slate-800" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
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
          <span>챔피언스</span>
          <span className="h-3 w-px bg-slate-200" />
          <span>시즌 3</span>
          <span className="h-3 w-px bg-slate-200" />
          <span>{account ? `${account.nickname} 샘플` : "로컬 샘플"}</span>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {account ? (
            <>
              <span className="hidden font-mono text-[10px] font-semibold text-slate-500 sm:inline">{account.email}</span>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                disabled={authPending}
                className="rounded border border-slate-200 bg-white px-2.5 py-1 font-mono text-[9px] font-bold text-slate-500 hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {authPending ? "처리 중" : "로그아웃"}
              </button>
            </>
          ) : (
            <form action={handleAuthSubmit} className="hidden items-center gap-1 md:flex">
              <button type="button" onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")} disabled={authPending} className="rounded border border-slate-200 bg-white px-2 py-1 font-mono text-[9px] font-bold text-slate-500 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                {authMode === "login" ? "회원가입" : "로그인"}
              </button>
              {authMode === "signup" ? (
                <input name="nickname" aria-label="닉네임" placeholder="닉네임" className="w-20 rounded border border-slate-200 bg-white px-2 py-1 font-mono text-[10px] outline-none focus-visible:ring-2 focus-visible:ring-sky-500" />
              ) : null}
              <input name="email" type="email" aria-label="이메일" placeholder="email" className="w-32 rounded border border-slate-200 bg-white px-2 py-1 font-mono text-[10px] outline-none focus-visible:ring-2 focus-visible:ring-sky-500" />
              <input name="password" type="password" aria-label="비밀번호" placeholder="password" className="w-28 rounded border border-slate-200 bg-white px-2 py-1 font-mono text-[10px] outline-none focus-visible:ring-2 focus-visible:ring-sky-500" />
              <button type="submit" disabled={authPending} className="rounded bg-sky-600 px-2.5 py-1 font-mono text-[9px] font-bold text-white focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400">
                {authPending ? "처리 중" : authMode === "login" ? "로그인" : "가입"}
              </button>
            </form>
          )}
        </div>
      </header>
      {authError || authSuccess ? (
        <div className={`border-b px-5 py-1.5 font-mono text-[10px] ${authError ? "border-rose-100 bg-rose-50 text-rose-600" : "border-sky-100 bg-sky-50 text-sky-600"}`}>
          {authError ?? authSuccess}
          {!account ? <span className="ml-2 text-slate-400">개인용 로컬 계정으로 이 브라우저에만 저장됩니다.</span> : null}
        </div>
      ) : null}
      {setsError || setsSuccess || setsPending ? (
        <div
          role={setsError ? "alert" : "status"}
          className={`border-b px-5 py-1.5 font-mono text-[10px] ${
            setsError ? "border-rose-100 bg-rose-50 text-rose-600" : setsSuccess ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-sky-100 bg-sky-50 text-sky-600"
          }`}
        >
          {setsError ?? setsSuccess ?? "샘플을 동기화하는 중입니다."}
        </div>
      ) : null}

      <section className="flex items-center gap-3 border-b border-slate-200 bg-white/80 px-5 py-2.5 backdrop-blur">
        <div className="flex flex-1 items-center gap-2">
          <span className="shrink-0 font-mono text-[9px] uppercase tracking-widest text-sky-500">My</span>
          <div className="relative flex flex-1">
            <button
              type="button"
              onClick={() => setIsMySetMenuOpen((open) => !open)}
              aria-haspopup="listbox"
              aria-expanded={isMySetMenuOpen}
              className="flex w-full items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-1.5 text-left transition-colors hover:border-sky-400 hover:bg-sky-100/60 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
            >
              <span className="text-sm font-semibold text-sky-800" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                {myPokemon.englishName ?? myPokemon.koreanName}
              </span>
              <span className="font-mono text-[10px] text-slate-400">{mySet.nickname ?? myPokemon.koreanName}</span>
              <ChevronDown className={`ml-auto h-3.5 w-3.5 shrink-0 text-sky-400 transition-transform ${isMySetMenuOpen ? "rotate-180" : ""}`} />
            </button>
            {isMySetMenuOpen ? (
              <div
                role="listbox"
                className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-80 overflow-y-auto rounded-lg border border-sky-200 bg-white p-1.5 shadow-xl shadow-sky-950/10"
              >
                {mySets.map((set) => {
                  const setPokemon = findPokemonByKey(set.pokeKey);
                  const isSelected = set.id === mySet.id;
                  return (
                    <div
                      key={set.id}
                      role="option"
                      aria-selected={isSelected}
                      className={`flex w-full items-center justify-between gap-2 rounded-md transition-colors ${
                        isSelected ? "bg-sky-50 text-sky-900" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => selectMySet(set.id)}
                        className="min-w-0 flex-1 px-2.5 py-2 text-left focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                      >
                        <span className="block truncate text-sm font-bold">{setPokemon?.koreanName ?? set.pokeKey}</span>
                        <span className="block truncate font-mono text-[10px] text-slate-400">{set.nickname ?? set.id}</span>
                      </button>
                      <span className="flex shrink-0 items-center gap-1">
                        {isSelected ? <span className="rounded bg-sky-600 px-1.5 py-0.5 font-mono text-[8px] font-bold text-white">선택됨</span> : null}
                        <button
                          type="button"
                          onClick={() => void handleDeleteSet(set.id)}
                          disabled={deletingSetId === set.id || mySets.length <= 1}
                          className="mr-2 rounded border border-rose-100 bg-white px-1.5 py-0.5 font-mono text-[8px] font-bold text-rose-500 transition-colors hover:border-rose-200 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {deletingSetId === set.id ? "삭제 중" : "삭제"}
                        </button>
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => {
              setIsSampleCreatorOpen(true);
              setIsMySetMenuOpen(false);
            }}
            className="shrink-0 rounded-md bg-sky-600 px-3 py-1.5 font-mono text-[9px] font-bold text-white transition-colors hover:bg-sky-700 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
          >
            샘플 만들기
          </button>
          <div className="hidden gap-1 lg:flex">
            {mySets.slice(0, 3).map((set) => (
              <button
                key={set.id}
                type="button"
                onClick={() => selectMySet(set.id)}
                className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] text-slate-400 transition-colors hover:text-slate-600"
              >
                {set.nickname ?? set.id}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-row-reverse items-center gap-2">
          <span className="shrink-0 font-mono text-[9px] uppercase tracking-widest text-rose-500">Opp</span>
          <div className="relative flex min-w-0 flex-1 items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 transition-colors hover:border-rose-400 hover:bg-rose-100/60">
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setIsAutocompleteOpen(true);
                setActiveSuggestionIndex(0);
                setSearchError(undefined);
              }}
              onFocus={() => setIsAutocompleteOpen(true)}
              onBlur={() => {
                window.setTimeout(() => setIsAutocompleteOpen(false), 120);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setIsAutocompleteOpen(true);
                  setActiveSuggestionIndex((index) => Math.min(index + 1, opponentSuggestions.length - 1));
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActiveSuggestionIndex((index) => Math.max(index - 1, 0));
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  if (showOpponentSuggestions) {
                    selectOpponent(opponentSuggestions[activeSuggestionIndex] ?? opponentSuggestions[0]);
                  } else {
                    handleSearch();
                  }
                } else if (event.key === "Escape") {
                  setIsAutocompleteOpen(false);
                }
              }}
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-rose-800 outline-none"
              style={{ fontFamily: "'Rajdhani', sans-serif" }}
              aria-label="상대 포켓몬"
              role="combobox"
              aria-expanded={showOpponentSuggestions}
              aria-controls="opponent-pokemon-suggestions"
              aria-activedescendant={showOpponentSuggestions ? `opponent-pokemon-suggestion-${activeSuggestionIndex}` : undefined}
            />
            <button type="button" onClick={() => handleSearch()} className="rounded bg-rose-600 px-2 py-1 font-mono text-[9px] font-bold text-white focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2">
              검색
            </button>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-rose-400" />
            {showOpponentSuggestions ? (
              <div
                id="opponent-pokemon-suggestions"
                role="listbox"
                className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-80 overflow-y-auto rounded-lg border border-rose-200 bg-white p-1.5 shadow-xl shadow-rose-950/10"
              >
                {opponentSuggestions.map((pokemon, index) => {
                  const isActive = index === activeSuggestionIndex;
                  return (
                    <button
                      key={pokemon.pokeKey}
                      id={`opponent-pokemon-suggestion-${index}`}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setActiveSuggestionIndex(index)}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        selectOpponent(pokemon);
                      }}
                      className={`flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left transition-colors ${
                        isActive ? "bg-rose-50 text-rose-900" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold">{pokemon.koreanName}</span>
                        <span className="block truncate font-mono text-[10px] text-slate-400">
                          {pokemon.englishName ?? pokemon.showdownId} · No.{String(pokemon.dexNo).padStart(4, "0")}
                        </span>
                      </span>
                      <span className="flex shrink-0 gap-1">
                        {pokemon.types.map((type) => (
                          <span key={type} className={`rounded border px-1.5 py-0.5 font-mono text-[8px] font-bold ${TYPE_COLOR[type] ?? TYPE_COLOR.normal}`}>
                            {TYPE_LABEL[type] ?? type}
                          </span>
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </section>
      {searchError ? <p className="px-5 pt-2 font-mono text-xs text-rose-600">{searchError}</p> : null}
      <BattleConditionPanel
        weather={weather}
        myModifiers={myModifiers}
        opponentModifiers={opponentModifiers}
        myHp={myStats.hp}
        opponentHp={opponentStats.hp}
        onWeatherChange={setWeather}
        onMyModifiersChange={setMyModifiers}
        onOpponentModifiersChange={setOpponentModifiers}
      />
      <section className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white/60 px-5 py-2.5">
        <span className="font-mono text-[9px] uppercase tracking-widest text-rose-500">상대 샘플</span>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-0.5">
            <span className="px-2 font-mono text-[9px] font-semibold text-slate-400">특성</span>
            {opponentAbilityOptions.length > 0 ? (
              opponentAbilityOptions.map((entry, index) => {
                const ability = findAbilityByKey(entry.key);
                const isSelected = index === selectedOpponentAbilityIndex;
                return (
                  <button
                    key={`${entry.key}-${entry.rank}`}
                    type="button"
                    title={abilityDescription(ability)}
                    onClick={() => setSelectedOpponentAbilityIndex(index)}
                    className={`rounded-md px-2.5 py-1 font-mono text-[9px] transition-colors focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 ${
                      isSelected ? "border border-rose-200 bg-white font-bold text-rose-700 shadow-sm" : "text-slate-500 hover:bg-white/70 hover:text-slate-700"
                    }`}
                  >
                    #{entry.rank} {ability?.koreanName ?? entry.name} {entry.rate.toFixed(1)}%
                  </button>
                );
              })
            ) : (
              <span className="px-2.5 py-1 font-mono text-[9px] text-slate-400">데이터 없음</span>
            )}
          </div>


          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-0.5">
            <span className="px-2 font-mono text-[9px] font-semibold text-slate-400">아이템</span>
            {opponentItemOptions.length > 0 ? (
              opponentItemOptions.map((entry, index) => {
                const item = findItemByKey(entry.key);
                const isSelected = index === selectedOpponentItemIndex;
                return (
                  <button
                    key={`${entry.key}-${entry.rank}`}
                    type="button"
                    onClick={() => setSelectedOpponentItemIndex(index)}
                    className={`rounded-md px-2.5 py-1 font-mono text-[9px] transition-colors focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 ${
                      isSelected ? "border border-rose-200 bg-white font-bold text-rose-700 shadow-sm" : "text-slate-500 hover:bg-white/70 hover:text-slate-700"
                    }`}
                  >
                    #{entry.rank} {item?.koreanName ?? entry.name} {entry.rate.toFixed(1)}%
                  </button>
                );
              })
            ) : (
              <span className="px-2.5 py-1 font-mono text-[9px] text-slate-400">데이터 없음</span>
            )}
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-0.5">
            <span className="px-2 font-mono text-[9px] font-semibold text-slate-400">성격</span>
            {opponentNatureOptions.length > 0 ? (
              opponentNatureOptions.map((entry, index) => {
                const nature = findNatureByKey(entry.key);
                const isSelected = index === selectedOpponentNatureIndex;
                return (
                  <button
                    key={`${entry.key}-${entry.rank}`}
                    type="button"
                    onClick={() => setSelectedOpponentNatureIndex(index)}
                    className={`rounded-md px-2.5 py-1 font-mono text-[9px] transition-colors focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 ${
                      isSelected ? "border border-rose-200 bg-white font-bold text-rose-700 shadow-sm" : "text-slate-500 hover:bg-white/70 hover:text-slate-700"
                    }`}
                  >
                    #{entry.rank} {nature?.koreanName ?? entry.name} <span className="text-rose-500">{natureModifierText(nature)}</span> {entry.rate.toFixed(1)}%
                  </button>
                );
              })
            ) : (
              <span className="px-2.5 py-1 font-mono text-[9px] text-slate-400">데이터 없음</span>
            )}
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-0.5">
            <span className="px-2 font-mono text-[9px] font-semibold text-slate-400">SP</span>
            {opponentSpOptions.length > 0 ? (
              opponentSpOptions.map((entry, index) => {
                const isSelected = index === selectedOpponentSpIndex;
                return (
                  <button
                    key={`${entry.raw}-${entry.rank}`}
                    type="button"
                    onClick={() => setSelectedOpponentSpIndex(index)}
                    className={`rounded-md px-2.5 py-1 font-mono text-[9px] transition-colors focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 ${
                      isSelected ? "border border-rose-200 bg-white font-bold text-rose-700 shadow-sm" : "text-slate-500 hover:bg-white/70 hover:text-slate-700"
                    }`}
                  >
                    #{entry.rank} {entry.label} {entry.pct.toFixed(1)}%
                  </button>
                );
              })
            ) : (
              <span className="px-2.5 py-1 font-mono text-[9px] text-slate-400">데이터 없음</span>
            )}
          </div>
        </div>
        {opponentAbility ? (
          <p className="basis-full pl-[4.8rem] font-mono text-[10px] leading-relaxed text-slate-500">
            <span className="font-bold text-rose-600">{opponentAbility.koreanName}</span> · {abilityDescription(opponentAbility)}
          </p>
        ) : null}
      </section>

      <section className="grid gap-3 px-5 pb-2 pt-3 xl:grid-cols-[1fr_400px_1fr]">
        <PokemonCard
          pokemon={myPokemon}
          title="내 포켓몬"
          subtitle={mySet.nickname ?? myPokemon.koreanName}
          side="my"
          stats={myBattleStats}
          bulk={myBulk}
          nature={myNature?.koreanName}
          item={myItem?.koreanName}
          evText={formatStatPoints(mySet.evs)}
          bestMove={myBestPower}
          speedNote={mySpeedNote}
        />
        <VSPanel
          myStats={myBattleStats}
          opponentStats={opponentBattleStats}
          myBestDamage={myBestDamage}
          opponentBestDamage={opponentBestDamage}
          myDamageRows={myDamageRows}
          opponentDamageRows={opponentDamageRows}
        />
        <PokemonCard
          pokemon={opponentPokemon}
          title="상대"
          subtitle={opponentPokemon.koreanName}
          side="opp"
          stats={opponentBattleStats}
          bulk={opponentBulk}
          nature={opponentNature?.koreanName}
          item={opponentItem?.koreanName}
          evText={opponentStatPoint?.label ?? "미확인"}
          bestMove={opponentBestPower}
          speedNote={opponentSpeedNote}
        />
      </section>

      <section className="grid gap-3 px-5 pb-3 xl:grid-cols-3">
        <VerdictCard
          icon={<Zap className="h-3.5 w-3.5" />}
          label="스피드 판정"
          title={isFaster ? "내가 더 빠름" : "상대가 더 빠름"}
          subtitle={`${speedDiff} 차이`}
          note={isFaster ? "상대 스카프, 순풍 여부만 확인하면 됩니다." : "선공기, 기합의띠, 스피드 상승 여부를 확인하세요."}
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

      <section className="px-5 pb-6">
        <MovePressureTable myRows={myDamageRows} opponentRows={opponentDamageRows} weather={weather} />
      </section>

      {isSampleCreatorOpen ? (
        <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-sky-500">Sample Creator</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">내 샘플 만들기</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsSampleCreatorOpen(false)}
                aria-label="샘플 만들기 닫기"
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-[10px] font-bold text-slate-500 transition-colors hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
              >
                닫기
              </button>
            </div>
            <div className="max-h-[calc(100vh-9rem)] overflow-y-auto p-4">
              <MySetManager
                pokemon={myPokemon}
                pokemonList={pokemonList}
                abilities={abilities}
                natures={natures}
                items={items}
                moves={moves}
                getUsageByPokeKey={findUsageByPokeKey}
                onAddSet={handleAddSet}
              />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
