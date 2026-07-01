export type UsageRankEntry = {
  rank: number;
  key: number;
  name: string;
  rate: number;
};

export type UsageStatPoint = {
  rank: number;
  label: string;
  raw: string;
  pct: number;
  rep_ev: {
    H: number;
    A: number;
    B: number;
    C: number;
    D: number;
    S: number;
  };
};

export type PokemonUsage = {
  season: number;
  rule: number;
  poke_key: string;
  version: "champions";
  source: string;
  data: {
    items: UsageRankEntry[];
    abilities: UsageRankEntry[];
    natures: UsageRankEntry[];
    moves: UsageRankEntry[];
    teammates: UsageRankEntry[];
    battle_teammates: UsageRankEntry[];
    stat_points: {
      skeletons: UsageStatPoint[];
      raw: unknown[];
      marginals: unknown[];
    };
    win_moves: UsageRankEntry[];
    lose_moves: UsageRankEntry[];
    win_pokemons: UsageRankEntry[];
    lose_pokemons: UsageRankEntry[];
    mega: UsageRankEntry[];
    updated_at: string;
  };
  created: number;
  synced_at: number;
};
