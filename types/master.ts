export type StatKey = "hp" | "atk" | "def" | "spa" | "spd" | "spe";

export type PokemonMaster = {
  pokeKey: string;
  dexNo: number;
  formNo: number;
  koreanName: string;
  japaneseName?: string;
  englishName?: string;
  showdownId?: string;
  types: string[];
  baseStats: Record<StatKey, number>;
  abilities?: Record<string, string>;
  heightm?: number | null;
  weightkg?: number | null;
  color?: string | null;
  tier?: string | null;
  isNonstandard?: string | null;
  baseSpecies?: string | null;
  forme?: string | null;
};

export type MoveMaster = {
  key: number;
  koreanName: string;
  japaneseName?: string;
  englishName?: string;
  showdownId?: string;
  type: string;
  category: "physical" | "special" | "status";
  power: number | null;
  accuracy?: number | null;
  priority?: number;
  pp?: number | null;
  multihit?: number | [number, number] | null;
  isNonstandard?: string | null;
  isZ?: boolean;
};

export type ItemMaster = {
  key: number;
  koreanName: string;
  japaneseName?: string;
  englishName?: string;
  showdownId?: string;
  effectType?: "life_orb" | "choice_band" | "choice_specs" | "choice_scarf" | "none";
  multiplier?: number;
};

export type NatureMaster = {
  key: number;
  koreanName: string;
  japaneseName?: string;
  englishName?: string;
  showdownId?: string;
  up?: Exclude<StatKey, "hp">;
  down?: Exclude<StatKey, "hp">;
};

export type AbilityMaster = {
  key: number;
  koreanName: string;
  japaneseName?: string;
  englishName?: string;
  showdownId?: string;
  rating?: number | null;
  description?: string;
  shortDescription?: string;
};
