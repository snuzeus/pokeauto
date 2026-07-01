import type { CalculatedStats, MovePowerResult } from "@/types/calc";
import type { ItemMaster, MoveMaster } from "@/types/master";

type CalculateMovePowerInput = {
  pokemonTypes: string[];
  stats: CalculatedStats;
  move: MoveMaster;
  item?: ItemMaster;
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

export function calculateMovePower(input: CalculateMovePowerInput): MovePowerResult | undefined {
  const { pokemonTypes, stats, move, item } = input;
  if (!isDamagingMove(move)) return undefined;

  const offensiveStat = move.category === "physical" ? stats.atk : stats.spa;
  const stab = pokemonTypes.includes(move.type) ? 1.5 : 1;
  const itemMultiplier = getItemMultiplier(move, item);
  const power = Math.floor(offensiveStat * move.power! * stab * itemMultiplier);

  return {
    move,
    power,
    stab,
    itemMultiplier,
    offensiveStat
  };
}
