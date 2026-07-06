import type { MoveMaster } from "./master";

export type CalculatedStats = {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
};

export type StatStage = -6 | -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type BattleStatus = "none" | "burn" | "paralysis" | "poison" | "toxic" | "sleep" | "freeze";

export type DamageSideModifiers = {
  atkStage: StatStage;
  defStage: StatStage;
  spaStage: StatStage;
  spdStage: StatStage;
  speStage: StatStage;
  hpPercent?: number;
  hpCurrent?: number;
  hpMax?: number;
  powerMultiplier?: number;
  status?: BattleStatus;
  reflect: boolean;
  lightScreen: boolean;
};

export type BattleWeather = "none" | "sun" | "rain" | "sand" | "snow";

export type BattleModifiers = {
  weather: BattleWeather;
  attacker: DamageSideModifiers;
  defender: DamageSideModifiers;
};

export type MovePowerResult = {
  move: MoveMaster;
  power: number;
  stab: number;
  itemMultiplier: number;
  offensiveStat: number;
  usageRate?: number;
  abilityNotes?: string[];
};

export type BulkResult = {
  physical: number;
  special: number;
};

export type DamageResult = {
  move: MoveMaster;
  usageRate?: number;
  rolls: number[];
  hitCount: number;
  hitChance: number;
  multihitResults?: MultiHitDamageResult[];
  minDamage: number;
  maxDamage: number;
  minPercent: number;
  maxPercent: number;
  typeEffectiveness: number;
  stab: number;
  itemMultiplier: number;
  offensiveStat: number;
  defensiveStat: number;
  abilityNotes?: string[];
  koSummary: string;
};

export type MultiHitDamageResult = {
  hitCount: number;
  hitChance: number;
  rolls: number[];
  minDamage: number;
  maxDamage: number;
  minPercent: number;
  maxPercent: number;
  koSummary: string;
};
