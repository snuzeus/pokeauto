import abilityData from "@/data/master/abilities.json";
import type { AbilityMaster } from "@/types/master";

const abilities = abilityData as AbilityMaster[];

export function listAbilities(): AbilityMaster[] {
  return abilities;
}

export function findAbilityByKey(key: number): AbilityMaster | undefined {
  return abilities.find((ability) => ability.key === key);
}

export function findAbilityByEnglishName(name: string): AbilityMaster | undefined {
  const normalized = name.trim().toLowerCase();
  return abilities.find((ability) => ability.englishName?.toLowerCase() === normalized || ability.showdownId?.toLowerCase() === normalized.replace(/[^a-z0-9]/g, ""));
}
