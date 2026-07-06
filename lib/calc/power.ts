import type { BattleStatus, BattleWeather, CalculatedStats, MovePowerResult, StatStage } from "@/types/calc";
import type { AbilityMaster, ItemMaster, MoveMaster } from "@/types/master";
import { getAbilityMoveEffect } from "./abilityEffects";

type CalculateMovePowerInput = {
  pokemonTypes: string[];
  stats: CalculatedStats;
  move: MoveMaster;
  item?: ItemMaster;
  ability?: AbilityMaster;
  usageRate?: number;
  stage?: StatStage;
  weather?: BattleWeather;
  powerMultiplier?: number;
  status?: BattleStatus;
  hpCurrent?: number;
  hpMax?: number;
};

export function isDamagingMove(move: MoveMaster): boolean {
  return move.category !== "status" && typeof move.power === "number" && move.power > 0;
}

function getItemMultiplier(move: MoveMaster, item?: ItemMaster): number {
  if (!item) return 1;
  if (item.effectType === "life_orb") return 1.3;
  if (item.effectType === "choice_band" && move.category === "physical") return 1.5;
  if (item.effectType === "choice_specs" && move.category === "special") return 1.5;
  return 1;
}

function applyStage(stat: number, stage: StatStage = 0): number {
  const multiplier = stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
  return Math.max(1, Math.floor(stat * multiplier));
}

function getWeatherMultiplier(moveType: string, weather: BattleWeather = "none"): number {
  if (weather === "sun" && moveType === "fire") return 1.5;
  if (weather === "sun" && moveType === "water") return 0.5;
  if (weather === "rain" && moveType === "water") return 1.5;
  if (weather === "rain" && moveType === "fire") return 0.5;
  return 1;
}

export function calculateMovePower(input: CalculateMovePowerInput): MovePowerResult | undefined {
  const { pokemonTypes, stats, move, item, ability, usageRate, stage = 0, weather = "none", powerMultiplier = 1, status = "none", hpCurrent, hpMax } = input;
  if (!isDamagingMove(move)) return undefined;

  const abilityEffect = getAbilityMoveEffect(move, pokemonTypes, ability, { weather, status, hpCurrent, hpMax });
  const offensiveStat = applyStage(move.category === "physical" ? stats.atk : stats.spa, stage);
  const stab = abilityEffect.attackerTypes.includes(abilityEffect.moveType) ? abilityEffect.stabMultiplier : 1;
  const itemMultiplier = getItemMultiplier(move, item);
  const weatherMultiplier = getWeatherMultiplier(abilityEffect.moveType, weather);
  const customPowerMultiplier = Number.isFinite(powerMultiplier) && powerMultiplier > 0 ? powerMultiplier : 1;
  const power = Math.floor(offensiveStat * move.power! * stab * itemMultiplier * abilityEffect.powerMultiplier * weatherMultiplier * customPowerMultiplier);

  return {
    move,
    power,
    stab,
    itemMultiplier,
    offensiveStat,
    usageRate,
    abilityNotes: abilityEffect.notes
  };
}
