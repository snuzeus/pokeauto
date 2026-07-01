import type { CalculatedStats } from "@/types/calc";
import type { NatureMaster, StatKey } from "@/types/master";
import type { EffortValues } from "@/types/team";

type CalculateStatsInput = {
  baseStats: Record<StatKey, number>;
  level: number;
  evs: EffortValues;
  nature?: NatureMaster;
};

function natureMultiplier(stat: Exclude<StatKey, "hp">, nature?: NatureMaster): number {
  if (nature?.up === stat) return 1.1;
  if (nature?.down === stat) return 0.9;
  return 1;
}

function calculateHp(base: number, ev: number, level: number): number {
  void level;
  return base === 1 ? base : base + ev + 75;
}

function calculateNonHp(base: number, ev: number, level: number, multiplier: number): number {
  void level;
  const raw = base + ev + 20;
  return Math.floor(raw * multiplier);
}

export function calculateStats(input: CalculateStatsInput): CalculatedStats {
  const { baseStats, level, evs, nature } = input;

  return {
    hp: calculateHp(baseStats.hp, evs.hp, level),
    atk: calculateNonHp(baseStats.atk, evs.atk, level, natureMultiplier("atk", nature)),
    def: calculateNonHp(baseStats.def, evs.def, level, natureMultiplier("def", nature)),
    spa: calculateNonHp(baseStats.spa, evs.spa, level, natureMultiplier("spa", nature)),
    spd: calculateNonHp(baseStats.spd, evs.spd, level, natureMultiplier("spd", nature)),
    spe: calculateNonHp(baseStats.spe, evs.spe, level, natureMultiplier("spe", nature))
  };
}
