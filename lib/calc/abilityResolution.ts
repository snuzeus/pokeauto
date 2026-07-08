import type { AbilityMaster, PokemonMaster } from "@/types/master";
import type { PokemonUsage } from "@/types/usage";

type ResolveBattleAbilityInput = {
  abilityKey?: number;
  pokemon: PokemonMaster;
  usage?: PokemonUsage;
  abilities: AbilityMaster[];
};

function normalizeAbilityName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findAbilityByName(abilities: AbilityMaster[], name: string): AbilityMaster | undefined {
  const normalized = normalizeAbilityName(name);
  return abilities.find((ability) => ability.englishName?.toLowerCase() === name.trim().toLowerCase() || ability.showdownId?.toLowerCase() === normalized);
}

function firstPokemonAbility(pokemon: PokemonMaster, abilities: AbilityMaster[]): AbilityMaster | undefined {
  return Object.values(pokemon.abilities ?? {})
    .map((name) => findAbilityByName(abilities, name))
    .find((ability): ability is AbilityMaster => ability !== undefined);
}

export function resolveBattleAbility(input: ResolveBattleAbilityInput): AbilityMaster | undefined {
  const { abilityKey, pokemon, usage, abilities } = input;

  if (abilityKey) {
    const explicitAbility = abilities.find((ability) => ability.key === abilityKey);
    if (explicitAbility) return explicitAbility;
  }

  const pokemonAbility = firstPokemonAbility(pokemon, abilities);
  if (pokemon.forme?.toLowerCase().startsWith("mega") && pokemonAbility) return pokemonAbility;

  const usageAbility = usage?.data.abilities.find((entry) => entry.rate > 0);
  if (usageAbility) {
    const rankedAbility = abilities.find((ability) => ability.key === usageAbility.key);
    if (rankedAbility) return rankedAbility;
  }

  return pokemonAbility;
}
