import championsLegalData from "@/data/master/champions-legal.json";
import pokemonData from "@/data/master/pokemon.json";
import usageIndexData from "@/data/sample/index.json";
import type { PokemonMaster } from "@/types/master";
import type { PokemonUsage } from "@/types/usage";

const usageByKey = usageIndexData as unknown as Record<string, PokemonUsage>;
const championsLegal = championsLegalData as { pokemonKeys?: string[] };
const pokemon = pokemonData as PokemonMaster[];
const baseUsageKeyByMegaKey = new Map(
  pokemon
    .filter((entry) => entry.forme?.toLowerCase().startsWith("mega"))
    .map((entry) => [entry.pokeKey, `${String(entry.dexNo).padStart(4, "0")}-00`])
);

export function findUsageByPokeKey(pokeKey: string): PokemonUsage | undefined {
  const directUsage = usageByKey[pokeKey];
  const baseKey = baseUsageKeyByMegaKey.get(pokeKey);
  const baseUsage = baseKey ? usageByKey[baseKey] : undefined;

  if (directUsage?.source === "pokemoem") return directUsage;
  if (baseUsage?.source === "pokemoem") return baseUsage;

  return usageByKey[pokeKey];
}

export function listChampionUsageEntries(): PokemonUsage[] {
  return Object.values(usageByKey).filter((usage) => usage.source === "pokemoem");
}

export function listChampionUsageKeys(): string[] {
  const legalKeys = championsLegal.pokemonKeys ?? [];
  if (legalKeys.length === 0) return listChampionUsageEntries().map((usage) => usage.poke_key);

  const legalKeySet = new Set(legalKeys);
  const usageOrderedKeys = listChampionUsageEntries()
    .map((usage) => usage.poke_key)
    .filter((pokeKey) => legalKeySet.has(pokeKey));
  const usageOrderedKeySet = new Set(usageOrderedKeys);
  const legalOnlyKeys = legalKeys.filter((pokeKey) => !usageOrderedKeySet.has(pokeKey));

  return [...usageOrderedKeys, ...legalOnlyKeys];
}
