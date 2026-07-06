import pokemonData from "@/data/master/pokemon.json";
import { listChampionUsageKeys } from "@/lib/data/usageRepository";
import type { PokemonMaster } from "@/types/master";

const pokemon = pokemonData as PokemonMaster[];
const pokemonByKey = new Map(pokemon.map((entry) => [entry.pokeKey, entry]));

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase().replace(/[\s._-]/g, "");
}

function searchCandidates(entry: PokemonMaster): string[] {
  const candidates = [entry.koreanName, entry.japaneseName, entry.englishName, entry.showdownId, entry.pokeKey].filter(Boolean) as string[];

  if (entry.forme?.toLowerCase().startsWith("mega")) {
    const koreanBase = entry.koreanName.replace(/-메가(?:-[XY])?$/u, "");
    const englishBase = entry.englishName?.replace(/-Mega(?:-[XY])?$/u, "");
    const suffix = entry.forme.replace(/^Mega/u, "").replace(/^-/, "");

    candidates.push(`메가${koreanBase}`, `메가 ${koreanBase}`);
    if (suffix) {
      candidates.push(`메가${koreanBase}${suffix}`, `메가 ${koreanBase} ${suffix}`);
    }

    if (englishBase) {
      candidates.push(`Mega ${englishBase}`, `Mega${englishBase}`);
      if (suffix) {
        candidates.push(`Mega ${englishBase} ${suffix}`, `Mega${englishBase}${suffix}`);
      }
    }
  }

  return candidates;
}

export function listPokemon(): PokemonMaster[] {
  return pokemon;
}

export function listChampionPokemon(): PokemonMaster[] {
  return listChampionUsageKeys()
    .map((pokeKey) => pokemonByKey.get(pokeKey))
    .filter((entry) => entry !== undefined);
}

export function findPokemonByName(name: string): PokemonMaster | undefined {
  const normalized = normalizeSearchText(name);

  return pokemon.find((entry) => searchCandidates(entry).some((candidate) => normalizeSearchText(candidate) === normalized));
}

export function findChampionPokemonByName(name: string): PokemonMaster | undefined {
  const normalized = normalizeSearchText(name);

  return listChampionPokemon().find((entry) => searchCandidates(entry).some((candidate) => normalizeSearchText(candidate) === normalized));
}

export function searchPokemon(query: string, limit = 8): PokemonMaster[] {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];

  return pokemon
    .map((entry) => {
      const candidates = searchCandidates(entry).map(normalizeSearchText);
      const exact = candidates.some((candidate) => candidate === normalized);
      const startsWith = candidates.some((candidate) => candidate.startsWith(normalized));
      const includes = candidates.some((candidate) => candidate.includes(normalized));

      if (exact) return { entry, score: 0 };
      if (startsWith) return { entry, score: 1 };
      if (includes) return { entry, score: 2 };
      return undefined;
    })
    .filter((result) => result !== undefined)
    .sort((a, b) => a.score - b.score || a.entry.dexNo - b.entry.dexNo || a.entry.formNo - b.entry.formNo)
    .slice(0, limit)
    .map((result) => result.entry);
}

export function searchChampionPokemon(query: string, limit = 8): PokemonMaster[] {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];

  return listChampionPokemon()
    .map((entry, usageIndex) => {
      const candidates = searchCandidates(entry).map(normalizeSearchText);
      const exact = candidates.some((candidate) => candidate === normalized);
      const startsWith = candidates.some((candidate) => candidate.startsWith(normalized));
      const includes = candidates.some((candidate) => candidate.includes(normalized));

      if (exact) return { entry, score: 0, usageIndex };
      if (startsWith) return { entry, score: 1, usageIndex };
      if (includes) return { entry, score: 2, usageIndex };
      return undefined;
    })
    .filter((result) => result !== undefined)
    .sort((a, b) => a.score - b.score || a.usageIndex - b.usageIndex)
    .slice(0, limit)
    .map((result) => result.entry);
}

export function findPokemonByKey(pokeKey: string): PokemonMaster | undefined {
  return pokemon.find((entry) => entry.pokeKey === pokeKey);
}
