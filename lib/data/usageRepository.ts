import garchompUsage from "@/data/sample/0445-00.json";
import type { PokemonUsage } from "@/types/usage";

const usageByKey: Record<string, PokemonUsage> = {
  "0445-00": garchompUsage as PokemonUsage
};

export function findUsageByPokeKey(pokeKey: string): PokemonUsage | undefined {
  return usageByKey[pokeKey];
}
