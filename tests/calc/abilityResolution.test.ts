import { describe, expect, it } from "vitest";
import { resolveBattleAbility } from "@/lib/calc/abilityResolution";
import type { AbilityMaster, PokemonMaster } from "@/types/master";
import type { PokemonUsage } from "@/types/usage";

const toughClaws: AbilityMaster = { key: 181, koreanName: "단단한발톱", englishName: "Tough Claws", showdownId: "toughclaws" };
const clearBody: AbilityMaster = { key: 29, koreanName: "클리어바디", englishName: "Clear Body", showdownId: "clearbody" };
const abilities = [toughClaws, clearBody];

const megaMetagross: PokemonMaster = {
  pokeKey: "0376-01",
  dexNo: 376,
  formNo: 1,
  koreanName: "메가 메타그로스",
  englishName: "Metagross-Mega",
  types: ["steel", "psychic"],
  baseStats: { hp: 80, atk: 145, def: 150, spa: 105, spd: 110, spe: 110 },
  abilities: { "0": "Tough Claws" },
  forme: "Mega"
};

function usageWithAbility(key: number, rate = 100): PokemonUsage {
  return {
    season: 3,
    rule: 1,
    poke_key: "0376-01",
    version: "champions",
    source: "pokemoem",
    data: {
      items: [],
      abilities: [{ rank: 1, key, name: "ability", rate }],
      natures: [],
      moves: [],
      teammates: [],
      battle_teammates: [],
      stat_points: { skeletons: [], raw: [], marginals: [] },
      win_moves: [],
      lose_moves: [],
      win_pokemons: [],
      lose_pokemons: [],
      mega: [],
      updated_at: "2026-07-08"
    },
    created: 0,
    synced_at: 0
  };
}

describe("resolveBattleAbility", () => {
  it("keeps an explicitly saved ability", () => {
    expect(resolveBattleAbility({ abilityKey: clearBody.key, pokemon: megaMetagross, usage: usageWithAbility(toughClaws.key), abilities })).toBe(clearBody);
  });

  it("falls back to the top usage ability when a saved sample has no ability key", () => {
    expect(resolveBattleAbility({ pokemon: megaMetagross, usage: usageWithAbility(toughClaws.key), abilities })).toBe(toughClaws);
  });

  it("prefers mega form abilities over borrowed base-form usage abilities", () => {
    expect(resolveBattleAbility({ pokemon: megaMetagross, usage: usageWithAbility(clearBody.key), abilities })).toBe(toughClaws);
  });

  it("falls back to the pokemon master ability when usage has no ability data", () => {
    expect(resolveBattleAbility({ pokemon: megaMetagross, abilities })).toBe(toughClaws);
  });
});
