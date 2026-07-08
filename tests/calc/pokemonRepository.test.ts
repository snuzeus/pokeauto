import { describe, expect, it } from "vitest";
import { findChampionPokemonByName, searchChampionPokemon } from "@/lib/data/pokemonRepository";

describe("pokemonRepository mega search aliases", () => {
  it("finds mega forms when the Korean mega suffix is typed after the Pokemon name", () => {
    expect(findChampionPokemonByName("리자몽-메가-X")?.showdownId).toBe("charizardmegax");
    expect(findChampionPokemonByName("리자몽 메가 X")?.showdownId).toBe("charizardmegax");
    expect(findChampionPokemonByName("리자몽메가X")?.showdownId).toBe("charizardmegax");
  });

  it("prioritizes matching mega forms in autocomplete", () => {
    expect(searchChampionPokemon("망나뇽메가", 3)[0]?.showdownId).toBe("dragonitemega");
  });
});
