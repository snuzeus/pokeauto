import pokemonData from "@/data/master/pokemon.json";
import type { PokemonMaster } from "@/types/master";

const pokemon = pokemonData as PokemonMaster[];

export function listPokemon(): PokemonMaster[] {
  return pokemon;
}

export function findPokemonByName(name: string): PokemonMaster | undefined {
  const normalized = name.trim().toLowerCase();

  return pokemon.find((entry) =>
    [entry.koreanName, entry.japaneseName, entry.englishName, entry.pokeKey]
      .filter(Boolean)
      .some((candidate) => candidate!.toLowerCase() === normalized)
  );
}

export function findPokemonByKey(pokeKey: string): PokemonMaster | undefined {
  return pokemon.find((entry) => entry.pokeKey === pokeKey);
}
