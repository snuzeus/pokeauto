"use client";

import { useEffect, useMemo, useState } from "react";
import type { AbilityMaster, ItemMaster, MoveMaster, NatureMaster, PokemonMaster } from "@/types/master";
import type { MyPokemonSet } from "@/types/team";
import type { PokemonUsage } from "@/types/usage";

type MySetManagerProps = {
  pokemon: PokemonMaster;
  pokemonList: PokemonMaster[];
  abilities: AbilityMaster[];
  natures: NatureMaster[];
  items: ItemMaster[];
  moves: MoveMaster[];
  getUsageByPokeKey: (pokeKey: string) => PokemonUsage | undefined;
  onAddSet: (set: MyPokemonSet) => void | Promise<void>;
};

function createSetFromForm(formData: FormData, fallbackPokeKey: string): MyPokemonSet {
  const selectedMoves = formData.getAll("moves").map((value) => Number(value));

  return {
    id: `local-${Date.now()}`,
    pokeKey: String(formData.get("pokeKey") || fallbackPokeKey),
    nickname: String(formData.get("nickname") || "내 샘플"),
    level: 50,
    natureKey: Number(formData.get("natureKey")),
    itemKey: Number(formData.get("itemKey")),
    abilityKey: Number(formData.get("abilityKey")),
    evs: {
      hp: Number(formData.get("hp") || 0),
      atk: Number(formData.get("atk") || 0),
      def: Number(formData.get("def") || 0),
      spa: Number(formData.get("spa") || 0),
      spd: Number(formData.get("spd") || 0),
      spe: Number(formData.get("spe") || 0)
    },
    moves: selectedMoves.slice(0, 4)
  };
}

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase().replace(/[\s._-]/g, "");
}

function pokemonMatchesQuery(pokemon: PokemonMaster, query: string): boolean {
  const normalized = normalizeSearchText(query);
  if (!normalized) return true;

  return [pokemon.koreanName, pokemon.japaneseName, pokemon.englishName, pokemon.showdownId, pokemon.pokeKey]
    .filter(Boolean)
    .some((candidate) => normalizeSearchText(String(candidate)).includes(normalized));
}

function formatErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const maybeError = error as { message?: unknown; details?: unknown; code?: unknown };
    const parts = [maybeError.message, maybeError.details, maybeError.code].filter((part): part is string => typeof part === "string" && part.length > 0);
    if (parts.length > 0) return parts.join(" / ");
  }
  return fallback;
}

export function MySetManager({
  pokemon,
  pokemonList,
  abilities,
  natures,
  items,
  moves,
  getUsageByPokeKey,
  onAddSet
}: MySetManagerProps) {
  const [draftPokeKey, setDraftPokeKey] = useState(() => (pokemonList.some((entry) => entry.pokeKey === pokemon.pokeKey) ? pokemon.pokeKey : pokemonList[0]?.pokeKey ?? pokemon.pokeKey));
  const [pokemonQuery, setPokemonQuery] = useState("");
  const [successMessage, setSuccessMessage] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const draftPokemon = pokemonList.find((entry) => entry.pokeKey === draftPokeKey) ?? pokemonList[0] ?? pokemon;
  const usage = getUsageByPokeKey(draftPokemon.pokeKey);
  const selectedUsageRank = pokemonList.findIndex((entry) => entry.pokeKey === draftPokemon.pokeKey) + 1;
  const filteredPokemonList = useMemo(() => pokemonList.filter((entry) => pokemonMatchesQuery(entry, pokemonQuery)).slice(0, 30), [pokemonList, pokemonQuery]);
  const natureRates = useMemo(() => new Map((usage?.data.natures ?? []).map((entry) => [entry.key, entry.rate])), [usage]);
  const abilityRates = useMemo(() => new Map((usage?.data.abilities ?? []).map((entry) => [entry.key, entry.rate])), [usage]);
  const itemRates = useMemo(() => new Map((usage?.data.items ?? []).map((entry) => [entry.key, entry.rate])), [usage]);
  const moveRates = useMemo(() => new Map((usage?.data.moves ?? []).map((entry) => [entry.key, entry.rate])), [usage]);
  const ratedNatures = useMemo(
    () => natures.filter((nature) => (natureRates.get(nature.key) ?? 0) > 0).sort((a, b) => (natureRates.get(b.key) ?? 0) - (natureRates.get(a.key) ?? 0)),
    [natures, natureRates]
  );
  const ratedAbilities = useMemo(
    () => abilities.filter((ability) => (abilityRates.get(ability.key) ?? 0) > 0).sort((a, b) => (abilityRates.get(b.key) ?? 0) - (abilityRates.get(a.key) ?? 0)),
    [abilities, abilityRates]
  );
  const ratedItems = useMemo(
    () => items.filter((item) => (itemRates.get(item.key) ?? 0) > 0).sort((a, b) => (itemRates.get(b.key) ?? 0) - (itemRates.get(a.key) ?? 0)),
    [items, itemRates]
  );
  const ratedMoves = useMemo(
    () => moves.filter((move) => (moveRates.get(move.key) ?? 0) > 0).sort((a, b) => (moveRates.get(b.key) ?? 0) - (moveRates.get(a.key) ?? 0)),
    [moves, moveRates]
  );
  const defaultAbility = Object.values(draftPokemon.abilities ?? {})
    .map((name) => abilities.find((ability) => ability.englishName === name))
    .find((ability) => ability !== undefined && (abilityRates.get(ability.key) ?? 0) > 0);

  useEffect(() => {
    if (!successMessage) return;

    const timeoutId = window.setTimeout(() => setSuccessMessage(undefined), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  async function handleSubmit(formData: FormData) {
    const nextSet = createSetFromForm(formData, draftPokemon.pokeKey);
    setIsSubmitting(true);
    setErrorMessage(undefined);

    try {
      await onAddSet(nextSet);
      setSuccessMessage(`${nextSet.nickname ?? draftPokemon.koreanName} 등록됐습니다.`);
    } catch (error) {
      setErrorMessage(formatErrorMessage(error, "샘플 저장에 실패했습니다."));
    } finally {
      setIsSubmitting(false);
    }
  }

  function rateText(rate: number): string {
    return `${rate.toFixed(1)}%`;
  }

  function selectDraftPokemon(pokeKey: string) {
    setDraftPokeKey(pokeKey);
    setPokemonQuery("");
  }

  return (
    <section className="rounded-md border border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm text-gray-500">내 샘플 등록</p>
          <p className="mt-1 text-xs text-gray-400">선택한 포켓몬 기준으로 성격/특성/아이템/기술을 채용률 순서로 보여줍니다.</p>
        </div>
        {successMessage ? (
          <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            {successMessage}
          </p>
        ) : null}
        {errorMessage ? (
          <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            {errorMessage}
          </p>
        ) : null}
      </div>

      <form action={handleSubmit} className="mt-4 grid gap-4">
        <div className="grid gap-3">
          <div key={`pokemon-${draftPokemon.pokeKey}`}>
            <span className="text-sm font-medium text-gray-700">포켓몬</span>
            <input type="hidden" name="pokeKey" value={draftPokeKey} />
            <input
              value={pokemonQuery}
              onChange={(event) => setPokemonQuery(event.target.value)}
              placeholder={`${draftPokemon.koreanName} / ${draftPokemon.englishName ?? draftPokemon.showdownId ?? ""}`}
              aria-label="샘플 포켓몬 검색"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
            />
            <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-2">
              <div className="mb-2 flex items-center justify-between gap-2 text-xs text-gray-500">
                <span>
                  현재 선택: <strong className="text-gray-900">{selectedUsageRank > 0 ? `#${selectedUsageRank}` : "#-"} {draftPokemon.koreanName}</strong>
                </span>
                <span>{pokemonList.length}마리</span>
              </div>
              <div className="grid max-h-56 gap-1 overflow-y-auto pr-1">
                {filteredPokemonList.length === 0 ? (
                  <p className="rounded-md bg-white px-3 py-2 text-sm text-gray-500">검색 결과 없음</p>
                ) : null}
                {filteredPokemonList.map((entry) => {
                  const usageRank = pokemonList.findIndex((pokemonEntry) => pokemonEntry.pokeKey === entry.pokeKey) + 1;
                  const isSelected = entry.pokeKey === draftPokeKey;
                  return (
                    <button
                      key={entry.pokeKey}
                      type="button"
                      onClick={() => selectDraftPokemon(entry.pokeKey)}
                      className={`flex items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 ${
                        isSelected ? "bg-gray-950 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{entry.koreanName}</span>
                        <span className={`block truncate text-xs ${isSelected ? "text-white/60" : "text-gray-400"}`}>
                          {entry.englishName ?? entry.showdownId} / {entry.pokeKey}
                        </span>
                      </span>
                      <span className={`shrink-0 font-mono text-xs ${isSelected ? "text-white/70" : "text-gray-400"}`}>#{usageRank}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <label key={`ability-${draftPokemon.pokeKey}`}>
            <span className="text-sm font-medium text-gray-700">샘플 이름</span>
            <input
              name="nickname"
              defaultValue="새 샘플 한카리아스"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
            />
          </label>
          <label>
            <span className="text-sm font-medium text-gray-700">성격</span>
            <select
              name="natureKey"
              defaultValue={ratedNatures[0]?.key}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
            >
              {ratedNatures.length === 0 ? (
                <option value="">채용률 데이터 없음</option>
              ) : null}
              {ratedNatures.map((nature) => (
                <option key={nature.key} value={nature.key}>
                  {nature.koreanName} · {rateText(natureRates.get(nature.key) ?? 0)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-sm font-medium text-gray-700">아이템</span>
            <select
              name="itemKey"
              defaultValue={ratedItems[0]?.key}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
            >
              {ratedItems.length === 0 ? (
                <option value="">채용률 데이터 없음</option>
              ) : null}
              {ratedItems.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.koreanName} · {rateText(itemRates.get(item.key) ?? 0)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-sm font-medium text-gray-700">특성</span>
            <select
              name="abilityKey"
              defaultValue={defaultAbility?.key ?? ratedAbilities[0]?.key}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
            >
              {ratedAbilities.length === 0 ? (
                <option value="">채용률 데이터 없음</option>
              ) : null}
              {ratedAbilities.map((ability) => (
                <option key={ability.key} value={ability.key}>
                  {ability.koreanName} · {rateText(abilityRates.get(ability.key) ?? 0)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700">Stat Points</p>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {(["hp", "atk", "def", "spa", "spd", "spe"] as const).map((stat) => (
              <label key={stat}>
                <span className="text-xs uppercase text-gray-500">{stat}</span>
                <input
                  name={stat}
                  type="number"
                  min={0}
                  max={66}
                  defaultValue={stat === "hp" ? 2 : stat === "atk" || stat === "spe" ? 32 : 0}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
                />
              </label>
            ))}
          </div>
        </div>

        <fieldset key={`moves-${draftPokemon.pokeKey}`}>
          <legend className="text-sm font-medium text-gray-700">기술 최대 4개</legend>
          <div className="mt-2 grid gap-2">
            {ratedMoves.length === 0 ? (
              <p className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-500">채용률 데이터 없음</p>
            ) : null}
            {ratedMoves.map((move, index) => (
              <label key={move.key} className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm">
                <input name="moves" type="checkbox" value={move.key} defaultChecked={index < 4 && move.category !== "status"} />
                <span>{move.koreanName}</span>
                <span className="ml-auto font-mono text-xs text-gray-400">{rateText(moveRates.get(move.key) ?? 0)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="sticky bottom-0 -mx-4 -mb-4 flex flex-col gap-2 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur md:flex-row md:items-center">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-gray-950 px-4 py-2 text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400 md:w-fit"
          >
            {isSubmitting ? "저장 중..." : "샘플 추가"}
          </button>
          {successMessage ? (
            <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              {successMessage}
            </p>
          ) : null}
          {errorMessage ? (
            <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              {errorMessage}
            </p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
