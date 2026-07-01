import type { CalculatedStats, DamageResult } from "@/types/calc";
import type { ItemMaster, MoveMaster } from "@/types/master";
import { getTypeEffectiveness } from "./typeEffectiveness";

const DAMAGE_ROLLS = [85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100] as const;

type CalculateDamageInput = {
  level: number;
  attackerTypes: string[];
  defenderTypes: string[];
  attackerStats: CalculatedStats;
  defenderStats: CalculatedStats;
  move: MoveMaster;
  item?: ItemMaster;
};

function isDamagingMove(move: MoveMaster): move is MoveMaster & { power: number } {
  return move.category !== "status" && typeof move.power === "number" && move.power > 0;
}

function getItemMultiplier(move: MoveMaster, item?: ItemMaster): number {
  if (!item) return 1;
  if (item.effectType === "life_orb") return 1.3;
  if (item.effectType === "choice_band" && move.category === "physical") return 1.5;
  if (item.effectType === "choice_specs" && move.category === "special") return 1.5;
  return 1;
}

function getKoChance(rolls: number[], targetHp: number, hits: number): number {
  let total = 0;
  let ko = 0;

  function visit(depth: number, sum: number) {
    if (depth === hits) {
      total += 1;
      if (sum >= targetHp) ko += 1;
      return;
    }

    for (const roll of rolls) {
      visit(depth + 1, sum + roll);
    }
  }

  visit(0, 0);
  return total === 0 ? 0 : ko / total;
}

export function summarizeKoChance(rolls: number[], targetHp: number): string {
  if (rolls.length === 0) return "계산 불가";

  for (let hits = 1; hits <= 4; hits += 1) {
    const minTotal = Math.min(...rolls) * hits;
    const maxTotal = Math.max(...rolls) * hits;

    if (minTotal >= targetHp) return `확정 ${hits}타`;
    if (maxTotal >= targetHp) {
      const chance = getKoChance(rolls, targetHp, hits) * 100;
      return `난수 ${hits}타 ${chance.toFixed(2)}%`;
    }
  }

  return "5타 이상";
}

export function calculateDamage(input: CalculateDamageInput): DamageResult | undefined {
  const { level, attackerTypes, defenderTypes, attackerStats, defenderStats, move, item } = input;
  if (!isDamagingMove(move)) return undefined;

  const offensiveStat = move.category === "physical" ? attackerStats.atk : attackerStats.spa;
  const defensiveStat = move.category === "physical" ? defenderStats.def : defenderStats.spd;
  const stab = attackerTypes.includes(move.type) ? 1.5 : 1;
  const typeEffectiveness = getTypeEffectiveness(move.type, defenderTypes);
  const itemMultiplier = getItemMultiplier(move, item);

  if (typeEffectiveness === 0) {
    const result = {
      move,
      rolls: DAMAGE_ROLLS.map(() => 0),
      minDamage: 0,
      maxDamage: 0,
      minPercent: 0,
      maxPercent: 0,
      typeEffectiveness,
      stab,
      itemMultiplier,
      offensiveStat,
      defensiveStat,
      koSummary: "효과 없음"
    };
    return result;
  }

  const baseDamage = Math.floor(Math.floor(Math.floor((Math.floor((2 * level) / 5) + 2) * move.power * offensiveStat) / defensiveStat) / 50) + 2;
  const rolls = DAMAGE_ROLLS.map((random) => Math.floor(baseDamage * (random / 100) * stab * typeEffectiveness * itemMultiplier));
  const minDamage = Math.min(...rolls);
  const maxDamage = Math.max(...rolls);

  return {
    move,
    rolls,
    minDamage,
    maxDamage,
    minPercent: (minDamage / defenderStats.hp) * 100,
    maxPercent: (maxDamage / defenderStats.hp) * 100,
    typeEffectiveness,
    stab,
    itemMultiplier,
    offensiveStat,
    defensiveStat,
    koSummary: summarizeKoChance(rolls, defenderStats.hp)
  };
}
