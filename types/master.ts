export type StatKey = "hp" | "atk" | "def" | "spa" | "spd" | "spe";

export type PokemonMaster = {
  pokeKey: string;
  dexNo: number;
  formNo: number;
  koreanName: string;
  japaneseName?: string;
  englishName?: string;
  types: string[];
  baseStats: Record<StatKey, number>;
};

export type MoveMaster = {
  key: number;
  koreanName: string;
  japaneseName?: string;
  englishName?: string;
  type: string;
  category: "physical" | "special" | "status";
  power: number | null;
  accuracy?: number | null;
};

export type ItemMaster = {
  key: number;
  koreanName: string;
  japaneseName?: string;
  englishName?: string;
  effectType?: "life_orb" | "choice_band" | "choice_specs" | "choice_scarf" | "none";
  multiplier?: number;
};

export type NatureMaster = {
  key: number;
  koreanName: string;
  japaneseName?: string;
  englishName?: string;
  up?: Exclude<StatKey, "hp">;
  down?: Exclude<StatKey, "hp">;
};
