import type { MoveMaster } from "./master";

export type CalculatedStats = {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
};

export type MovePowerResult = {
  move: MoveMaster;
  power: number;
  stab: number;
  itemMultiplier: number;
  offensiveStat: number;
};

export type BulkResult = {
  physical: number;
  special: number;
};
