import type { BattleModifiers, CalculatedStats, DamageResult, StatStage } from "@/types/calc";
import type { AbilityMaster, ItemMaster, MoveMaster } from "@/types/master";
import { getAbilityMoveEffect, getDefensiveAbilityEffect } from "./abilityEffects";
import { getTypeEffectiveness } from "./typeEffectiveness";

const DAMAGE_ROLLS = [85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100] as const;
const TWO_TO_FIVE_HIT_CHANCE: Record<number, number> = {
  2: 35 / 100,
  3: 35 / 100,
  4: 15 / 100,
  5: 15 / 100
};

type CalculateDamageInput = {
  level: number;
  attackerTypes: string[];
  defenderTypes: string[];
  attackerStats: CalculatedStats;
  defenderStats: CalculatedStats;
  move: MoveMaster;
  item?: ItemMaster;
  ability?: AbilityMaster;
  defenderAbility?: AbilityMaster;
  usageRate?: number;
  modifiers?: BattleModifiers;
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

function applyStage(stat: number, stage: StatStage): number {
  const multiplier = stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
  return Math.max(1, Math.floor(stat * multiplier));
}

function getWeatherMultiplier(moveType: string, weather: BattleModifiers["weather"] = "none"): number {
  if (weather === "sun" && moveType === "fire") return 1.5;
  if (weather === "sun" && moveType === "water") return 0.5;
  if (weather === "rain" && moveType === "water") return 1.5;
  if (weather === "rain" && moveType === "fire") return 0.5;
  return 1;
}

function getWeatherDefenseMultiplier(move: MoveMaster, defenderTypes: string[], weather: BattleModifiers["weather"] = "none"): number {
  if (weather === "sand" && move.category === "special" && defenderTypes.includes("rock")) return 1.5;
  if (weather === "snow" && move.category === "physical" && defenderTypes.includes("ice")) return 1.5;
  return 1;
}

function getScreenMultiplier(move: MoveMaster, modifiers?: BattleModifiers): number {
  if (!modifiers) return 1;
  if (move.category === "physical" && modifiers.defender.reflect) return 0.5;
  if (move.category === "special" && modifiers.defender.lightScreen) return 0.5;
  return 1;
}

function hasBurnBypass(ability?: AbilityMaster): boolean {
  return ability?.showdownId === "guts";
}

function getStatusAttackMultiplier(move: MoveMaster, modifiers?: BattleModifiers, ability?: AbilityMaster): number {
  if (move.category !== "physical") return 1;
  if (modifiers?.attacker.status !== "burn") return 1;
  return hasBurnBypass(ability) ? 1 : 0.5;
}

function getMaxHp(statHp: number, modifiers?: BattleModifiers["defender"] | BattleModifiers["attacker"]): number {
  return Math.max(1, Math.floor(modifiers?.hpMax ?? statHp));
}

function getCurrentHp(statHp: number, modifiers?: BattleModifiers["defender"] | BattleModifiers["attacker"]): number {
  const maxHp = getMaxHp(statHp, modifiers);
  if (typeof modifiers?.hpCurrent === "number") {
    return Math.min(maxHp, Math.max(1, Math.floor(modifiers.hpCurrent)));
  }

  const hpPercent = modifiers?.hpPercent ?? 100;
  const clamped = Math.min(100, Math.max(1, hpPercent));
  return Math.max(1, Math.floor((maxHp * clamped) / 100));
}

function getPowerMultiplier(modifiers?: BattleModifiers): number {
  const multiplier = modifiers?.attacker.powerMultiplier ?? 1;
  return Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1;
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

function combineRolls(rolls: number[], hits: number): number[] {
  if (hits > 5) {
    return [Math.min(...rolls) * hits, Math.max(...rolls) * hits];
  }

  let totals = [0];

  for (let hit = 0; hit < hits; hit += 1) {
    totals = totals.flatMap((total) => rolls.map((roll) => total + roll));
  }

  return totals;
}

function getMinMax(values: number[]): { min: number; max: number } {
  return values.reduce(
    (range, value) => ({
      min: Math.min(range.min, value),
      max: Math.max(range.max, value)
    }),
    { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY }
  );
}

export function summarizeKoChance(rolls: number[], targetHp: number, maxHits = 4): string {
  if (rolls.length === 0) return "계산 불가";

  for (let hits = 1; hits <= maxHits; hits += 1) {
    const { min, max } = getMinMax(rolls);
    const minTotal = min * hits;
    const maxTotal = max * hits;

    if (minTotal >= targetHp) return `확정 ${hits}타`;
    if (maxTotal >= targetHp) {
      const chance = getKoChance(rolls, targetHp, hits) * 100;
      return `난수 ${hits}타 ${chance.toFixed(2)}%`;
    }
  }

  return "5타 이상";
}

function getHitChances(move: MoveMaster): Array<{ hitCount: number; hitChance: number }> {
  if (Array.isArray(move.multihit)) {
    const [minHits, maxHits] = move.multihit;
    if (minHits === 2 && maxHits === 5) {
      return [2, 3, 4, 5].map((hitCount) => ({ hitCount, hitChance: TWO_TO_FIVE_HIT_CHANCE[hitCount] }));
    }
    return Array.from({ length: maxHits - minHits + 1 }, (_, index) => {
      const hitCount = minHits + index;
      return { hitCount, hitChance: 1 / (maxHits - minHits + 1) };
    });
  }

  if (typeof move.multihit === "number" && move.multihit > 1) {
    const accuracy = typeof move.accuracy === "number" ? move.accuracy / 100 : 1;

    if (move.englishName === "Triple Axel") {
      return [
        { hitCount: 1, hitChance: accuracy * (1 - accuracy) },
        { hitCount: 2, hitChance: accuracy * accuracy * (1 - accuracy) },
        { hitCount: 3, hitChance: accuracy ** 3 }
      ];
    }

    return [{ hitCount: move.multihit, hitChance: 1 }];
  }

  return [{ hitCount: 1, hitChance: 1 }];
}

export function calculateDamage(input: CalculateDamageInput): DamageResult | undefined {
  const { level, attackerTypes, defenderTypes, attackerStats, defenderStats, move, item, ability, defenderAbility, usageRate, modifiers } = input;
  if (!isDamagingMove(move)) return undefined;

  const abilityEffect = getAbilityMoveEffect(move, attackerTypes, ability, {
    weather: modifiers?.weather,
    status: modifiers?.attacker.status ?? "none",
    hpCurrent: getCurrentHp(attackerStats.hp, modifiers?.attacker),
    hpMax: getMaxHp(attackerStats.hp, modifiers?.attacker)
  });
  const rawOffensiveStat = move.category === "physical" ? attackerStats.atk : attackerStats.spa;
  const rawDefensiveStat = move.category === "physical" ? defenderStats.def : defenderStats.spd;
  const offensiveStat = applyStage(rawOffensiveStat, move.category === "physical" ? modifiers?.attacker.atkStage ?? 0 : modifiers?.attacker.spaStage ?? 0);
  const stagedDefensiveStat = applyStage(rawDefensiveStat, move.category === "physical" ? modifiers?.defender.defStage ?? 0 : modifiers?.defender.spdStage ?? 0);
  const defensiveStat = Math.floor(stagedDefensiveStat * getWeatherDefenseMultiplier(move, defenderTypes, modifiers?.weather));
  const stab = abilityEffect.attackerTypes.includes(abilityEffect.moveType) ? abilityEffect.stabMultiplier : 1;
  const typeEffectiveness = getTypeEffectiveness(abilityEffect.moveType, defenderTypes);
  const itemMultiplier = getItemMultiplier(move, item);
  const weatherMultiplier = getWeatherMultiplier(abilityEffect.moveType, modifiers?.weather);
  const screenMultiplier = getScreenMultiplier(move, modifiers);
  const statusAttackMultiplier = getStatusAttackMultiplier(move, modifiers, ability);
  const defenderMaxHp = getMaxHp(defenderStats.hp, modifiers?.defender);
  const defenderCurrentHp = getCurrentHp(defenderStats.hp, modifiers?.defender);
  const defenderAbilityEffect = getDefensiveAbilityEffect(move, defenderTypes, defenderAbility, {
    moveType: abilityEffect.moveType,
    typeEffectiveness,
    weather: modifiers?.weather,
    status: modifiers?.defender.status ?? "none",
    hpCurrent: defenderCurrentHp,
    hpMax: defenderMaxHp
  });

  if (typeEffectiveness === 0) {
    const result = {
      move,
      usageRate,
      rolls: DAMAGE_ROLLS.map(() => 0),
      hitCount: 1,
      hitChance: 1,
      minDamage: 0,
      maxDamage: 0,
      minPercent: 0,
      maxPercent: 0,
      typeEffectiveness,
      stab,
      itemMultiplier,
      offensiveStat,
      defensiveStat,
      abilityNotes: [...abilityEffect.notes, ...defenderAbilityEffect.notes],
      koSummary: "효과 없음"
    };
    return result;
  }

  const effectivePower = Math.floor(move.power * abilityEffect.powerMultiplier * getPowerMultiplier(modifiers));
  const baseDamage = Math.floor(Math.floor(Math.floor((Math.floor((2 * level) / 5) + 2) * effectivePower * offensiveStat) / defensiveStat) / 50) + 2;
  const rolls = DAMAGE_ROLLS.map((random) =>
    Math.floor(baseDamage * (random / 100) * stab * typeEffectiveness * itemMultiplier * weatherMultiplier * screenMultiplier * statusAttackMultiplier * defenderAbilityEffect.damageMultiplier)
  );
  const hitChances = getHitChances(move);
  const multihitResults = hitChances.map(({ hitCount, hitChance }) => {
    const combinedRolls = combineRolls(rolls, hitCount);
    const { min: minDamage, max: maxDamage } = getMinMax(combinedRolls);

    return {
      hitCount,
      hitChance,
      rolls: combinedRolls,
      minDamage,
      maxDamage,
      minPercent: (minDamage / defenderMaxHp) * 100,
      maxPercent: (maxDamage / defenderMaxHp) * 100,
      koSummary: summarizeKoChance(combinedRolls, defenderCurrentHp, 1)
    };
  });
  const representative = multihitResults[0];
  const minDamage = representative.minDamage;
  const maxDamage = representative.maxDamage;

  return {
    move,
    usageRate,
    rolls: representative.rolls,
    hitCount: representative.hitCount,
    hitChance: representative.hitChance,
    multihitResults: multihitResults.length > 1 || representative.hitCount > 1 ? multihitResults : undefined,
    minDamage,
    maxDamage,
    minPercent: (minDamage / defenderMaxHp) * 100,
    maxPercent: (maxDamage / defenderMaxHp) * 100,
    typeEffectiveness,
    stab,
    itemMultiplier,
    offensiveStat,
    defensiveStat,
    abilityNotes: [...abilityEffect.notes, ...defenderAbilityEffect.notes],
    koSummary: summarizeKoChance(rolls, defenderCurrentHp)
  };
}
