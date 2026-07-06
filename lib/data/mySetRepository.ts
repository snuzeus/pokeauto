import { listMyPokemonSets } from "@/lib/data/myTeamRepository";
import { isSupabaseConfigured, supabase } from "@/lib/data/supabaseClient";
import type { MyPokemonSet } from "@/types/team";

const MY_SETS_STORAGE_KEY = "pokeauto.myPokemonSets";

type MyPokemonSetRow = {
  id: string;
  user_id: string;
  poke_key: string;
  nickname: string | null;
  level: number;
  nature_key: number;
  item_key: number | null;
  ability_key: number | null;
  evs: MyPokemonSet["evs"];
  moves: number[];
};

function localStorageKey(accountId?: string): string {
  return accountId ? `${MY_SETS_STORAGE_KEY}.${accountId}` : MY_SETS_STORAGE_KEY;
}

function rowToSet(row: MyPokemonSetRow): MyPokemonSet {
  return {
    id: row.id,
    pokeKey: row.poke_key,
    nickname: row.nickname ?? undefined,
    level: row.level,
    natureKey: row.nature_key,
    itemKey: row.item_key ?? undefined,
    abilityKey: row.ability_key ?? undefined,
    evs: row.evs,
    moves: row.moves
  };
}

function setToRow(set: MyPokemonSet, userId: string): Omit<MyPokemonSetRow, "user_id"> & { user_id: string } {
  return {
    id: set.id,
    user_id: userId,
    poke_key: set.pokeKey,
    nickname: set.nickname ?? null,
    level: set.level,
    nature_key: set.natureKey,
    item_key: set.itemKey ?? null,
    ability_key: set.abilityKey ?? null,
    evs: set.evs,
    moves: set.moves
  };
}

async function getSupabaseUserId(): Promise<string> {
  if (!supabase) throw new Error("Supabase가 설정되지 않았습니다.");

  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user?.id) throw new Error("로그인 세션이 없습니다. 다시 로그인해주세요.");

  return data.user.id;
}

export function loadLocalMyPokemonSets(accountId?: string): MyPokemonSet[] {
  if (typeof window === "undefined") return listMyPokemonSets();

  const stored = window.localStorage.getItem(localStorageKey(accountId));
  if (!stored) return listMyPokemonSets();

  try {
    const parsed = JSON.parse(stored) as MyPokemonSet[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : listMyPokemonSets();
  } catch {
    window.localStorage.removeItem(localStorageKey(accountId));
    return listMyPokemonSets();
  }
}

export function saveLocalMyPokemonSets(sets: MyPokemonSet[], accountId?: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(localStorageKey(accountId), JSON.stringify(sets));
}

export async function loadMyPokemonSets(accountId?: string): Promise<MyPokemonSet[]> {
  if (!isSupabaseConfigured || !supabase || !accountId) return loadLocalMyPokemonSets(accountId);

  await getSupabaseUserId();
  const { data, error } = await supabase.from("pokemon_sets").select("*").order("created_at", { ascending: true });
  if (error) throw error;

  const sets = (data as MyPokemonSetRow[]).map(rowToSet);
  return sets.length > 0 ? sets : listMyPokemonSets();
}

export async function saveMyPokemonSet(set: MyPokemonSet, accountId?: string): Promise<MyPokemonSet> {
  if (!isSupabaseConfigured || !supabase || !accountId) {
    const sets = [...loadLocalMyPokemonSets(accountId), set];
    saveLocalMyPokemonSets(sets, accountId);
    return set;
  }

  const userId = await getSupabaseUserId();
  const { error } = await supabase.from("pokemon_sets").upsert(setToRow(set, userId));
  if (error) throw error;
  return set;
}

export async function deleteMyPokemonSet(setId: string, accountId?: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !accountId) {
    const sets = loadLocalMyPokemonSets(accountId).filter((set) => set.id !== setId);
    saveLocalMyPokemonSets(sets, accountId);
    return;
  }

  await getSupabaseUserId();
  const { error } = await supabase.from("pokemon_sets").delete().eq("id", setId);
  if (error) throw error;
}

export async function replaceMyPokemonSets(sets: MyPokemonSet[], accountId?: string) {
  if (!isSupabaseConfigured || !supabase || !accountId) {
    saveLocalMyPokemonSets(sets, accountId);
  }
}
