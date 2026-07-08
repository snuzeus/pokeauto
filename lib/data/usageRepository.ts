import championsLegalData from "@/data/master/champions-legal.json";
import itemData from "@/data/master/items.json";
import pokemonData from "@/data/master/pokemon.json";
import usageIndexData from "@/data/sample/index.json";
import type { ItemMaster, PokemonMaster } from "@/types/master";
import type { PokemonUsage, UsageRankEntry } from "@/types/usage";

const usageByKey = usageIndexData as unknown as Record<string, PokemonUsage>;
const championsLegal = championsLegalData as { pokemonKeys?: string[] };
const pokemon = pokemonData as PokemonMaster[];
const items = itemData as ItemMaster[];
const baseUsageKeyByMegaKey = new Map(
  pokemon
    .filter((entry) => entry.forme?.toLowerCase().startsWith("mega"))
    .map((entry) => [entry.pokeKey, `${String(entry.dexNo).padStart(4, "0")}-00`])
);
const itemKeySet = new Set(items.map((item) => item.key));
const normalizedUsageCache = new Map<string, PokemonUsage | undefined>();

function megaSuffix(entry: PokemonMaster): string {
  const suffix = entry.forme?.replace(/^Mega/u, "").replace(/^-/, "") ?? "";
  return suffix.toUpperCase();
}

function megaStoneCandidatesForPokemon(pokeKey: string): ItemMaster[] {
  const target = pokemon.find((entry) => entry.pokeKey === pokeKey);
  if (!target) return [];

  const megaForms = pokemon.filter((entry) => entry.dexNo === target.dexNo && entry.forme?.toLowerCase().startsWith("mega"));
  const candidates = megaForms
    .map((megaForm) => {
      const baseName = megaForm.koreanName.replace(/-메가(?:-[XY])?$/u, "");
      const suffix = megaSuffix(megaForm);
      const expectedName = `${baseName}나이트${suffix}`;
      const item = items.find((entry) => entry.koreanName === expectedName);
      return item ? { item, suffix } : undefined;
    })
    .filter((entry): entry is { item: ItemMaster; suffix: string } => entry !== undefined);

  return candidates.sort((a, b) => {
    const suffixOrder = (value: string) => (value === "X" ? 0 : value === "Y" ? 1 : 2);
    return suffixOrder(a.suffix) - suffixOrder(b.suffix) || a.item.key - b.item.key;
  }).map((entry) => entry.item);
}

function isUnresolvedNumericItem(entry: UsageRankEntry): boolean {
  return !itemKeySet.has(entry.key) && /^\d+$/.test(String(entry.name ?? ""));
}

function normalizeUsageItemsForPokemon(pokeKey: string, entries: UsageRankEntry[]): UsageRankEntry[] {
  const unresolved = entries.filter(isUnresolvedNumericItem).sort((a, b) => a.key - b.key);
  if (unresolved.length === 0) return entries;

  const candidates = megaStoneCandidatesForPokemon(pokeKey);
  if (candidates.length === 0) return entries;

  const mappedByUsageKey = new Map<number, ItemMaster>();
  unresolved.forEach((entry, index) => {
    const candidate = candidates[index];
    if (candidate) mappedByUsageKey.set(entry.key, candidate);
  });

  return entries.map((entry) => {
    const item = mappedByUsageKey.get(entry.key);
    return item ? { ...entry, key: item.key, name: item.koreanName } : entry;
  });
}

function normalizeUsageForPokemon(usage: PokemonUsage | undefined, pokeKey: string): PokemonUsage | undefined {
  if (!usage) return undefined;

  return {
    ...usage,
    data: {
      ...usage.data,
      items: normalizeUsageItemsForPokemon(pokeKey, usage.data.items)
    }
  };
}

export function findUsageByPokeKey(pokeKey: string): PokemonUsage | undefined {
  if (normalizedUsageCache.has(pokeKey)) return normalizedUsageCache.get(pokeKey);

  const directUsage = usageByKey[pokeKey];
  const baseKey = baseUsageKeyByMegaKey.get(pokeKey);
  const baseUsage = baseKey ? usageByKey[baseKey] : undefined;
  let normalizedUsage: PokemonUsage | undefined;

  if (directUsage?.source === "pokemoem") {
    normalizedUsage = normalizeUsageForPokemon(directUsage, pokeKey);
  } else if (baseUsage?.source === "pokemoem") {
    normalizedUsage = normalizeUsageForPokemon(baseUsage, baseKey ?? pokeKey);
  } else {
    normalizedUsage = normalizeUsageForPokemon(usageByKey[pokeKey], pokeKey);
  }

  normalizedUsageCache.set(pokeKey, normalizedUsage);
  return normalizedUsage;
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
