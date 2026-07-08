import type { BattleStatus, BattleWeather, CalculatedStats, MovePowerResult, StatStage } from "@/types/calc";
import type { AbilityMaster, ItemMaster, MoveMaster } from "@/types/master";
import { getAbilityMoveEffect } from "./abilityEffects";

const PUNCH_MOVES = new Set(["bulletpunch", "cometpunch", "dizzypunch", "doubleironbash", "drainpunch", "dynamicpunch", "firepunch", "focuspunch", "hammerarm", "headlongrush", "icehammer", "icepunch", "jetpunch", "machpunch", "megapunch", "meteormash", "plasmafists", "poweruppunch", "ragefist", "shadowpunch", "skyuppercut", "surgingstrikes", "thunderpunch", "wickedblow"]);
const TYPE_BOOST_ITEMS: Record<string, string> = {
  blackbelt: "fighting",
  blackglasses: "dark",
  charcoal: "fire",
  dragonfang: "dragon",
  hardstone: "rock",
  magnet: "electric",
  metalcoat: "steel",
  miracleseed: "grass",
  mysticwater: "water",
  nevermeltice: "ice",
  poisonbarb: "poison",
  sharpbeak: "flying",
  silkscarf: "normal",
  silverpowder: "bug",
  softsand: "ground",
  spelltag: "ghost",
  twistedspoon: "psychic",
  icicleplate: "ice",
  pixieplate: "fairy",
  skyplate: "flying",
  splashplate: "water",
  spookyplate: "ghost",
  stoneplate: "rock",
  toxicplate: "poison",
  zapplate: "electric",
  dracoplate: "dragon",
  dreadplate: "dark",
  earthplate: "ground",
  fistplate: "fighting",
  flameplate: "fire",
  insectplate: "bug",
  ironplate: "steel",
  meadowplate: "grass",
  mindplate: "psychic",
  iciumz: "ice"
};

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

function getItemMultiplier(move: MoveMaster, moveType: string, item?: ItemMaster): number {
  if (!item) return 1;
  if (item.effectType === "life_orb") return 1.3;
  if (item.effectType === "choice_band" && move.category === "physical") return 1.5;
  if (item.effectType === "choice_specs" && move.category === "special") return 1.5;
  if (item.showdownId === "punchingglove" && PUNCH_MOVES.has(move.showdownId ?? "")) return 1.1;
  if (item.showdownId && TYPE_BOOST_ITEMS[item.showdownId] === moveType) return 1.2;
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

function getRepresentativeBasePower(move: MoveMaster): number {
  if (move.englishName === "Triple Axel" || move.showdownId === "tripleaxel" || move.englishName === "Triple Kick" || move.showdownId === "triplekick") {
    return move.power! * 6;
  }

  if (Array.isArray(move.multihit)) return move.power! * move.multihit[1];
  if (typeof move.multihit === "number" && move.multihit > 1) return move.power! * move.multihit;
  return move.power!;
}

export function calculateMovePower(input: CalculateMovePowerInput): MovePowerResult | undefined {
  const { pokemonTypes, stats, move, item, ability, usageRate, stage = 0, weather = "none", powerMultiplier = 1, status = "none", hpCurrent, hpMax } = input;
  if (!isDamagingMove(move)) return undefined;

  const abilityEffect = getAbilityMoveEffect(move, pokemonTypes, ability, { weather, status, hpCurrent, hpMax });
  const offensiveStat = applyStage(move.category === "physical" ? stats.atk : stats.spa, stage);
  const stab = abilityEffect.attackerTypes.includes(abilityEffect.moveType) ? abilityEffect.stabMultiplier : 1;
  const itemMultiplier = getItemMultiplier(move, abilityEffect.moveType, item);
  const weatherMultiplier = getWeatherMultiplier(abilityEffect.moveType, weather);
  const customPowerMultiplier = Number.isFinite(powerMultiplier) && powerMultiplier > 0 ? powerMultiplier : 1;
  const power = Math.floor(offensiveStat * getRepresentativeBasePower(move) * stab * itemMultiplier * abilityEffect.powerMultiplier * weatherMultiplier * customPowerMultiplier);

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
