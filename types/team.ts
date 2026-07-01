export type EffortValues = {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
};

export type MyPokemonSet = {
  id: string;
  pokeKey: string;
  nickname?: string;
  level: number;
  natureKey: number;
  itemKey?: number;
  abilityKey?: number;
  evs: EffortValues;
  moves: number[];
};
