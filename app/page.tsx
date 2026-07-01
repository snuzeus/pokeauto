"use client";

import { useMemo, useState } from "react";
import { ComparisonPanel } from "@/components/ComparisonPanel";
import { MyTeamPanel } from "@/components/MyTeamPanel";
import { PokemonSearch } from "@/components/PokemonSearch";
import { PowerTable } from "@/components/PowerTable";
import { UsageSummary } from "@/components/UsageSummary";
import { calculateBulk } from "@/lib/calc/bulk";
import { calculateMovePower } from "@/lib/calc/power";
import { applyChoiceScarf } from "@/lib/calc/speed";
import { calculateStats } from "@/lib/calc/stats";
import { findItemByKey } from "@/lib/data/itemRepository";
import { findMoveByKey } from "@/lib/data/moveRepository";
import { listMyPokemonSets } from "@/lib/data/myTeamRepository";
import { findNatureByKey } from "@/lib/data/natureRepository";
import { findPokemonByKey, findPokemonByName } from "@/lib/data/pokemonRepository";
import { findUsageByPokeKey } from "@/lib/data/usageRepository";
import type { EffortValues } from "@/types/team";
import type { UsageStatPoint } from "@/types/usage";

function evsFromUsage(statPoint: UsageStatPoint): EffortValues {
  return {
    hp: statPoint.rep_ev.H,
    atk: statPoint.rep_ev.A,
    def: statPoint.rep_ev.B,
    spa: statPoint.rep_ev.C,
    spd: statPoint.rep_ev.D,
    spe: statPoint.rep_ev.S
  };
}

export default function Home() {
  const [query, setQuery] = useState("한카리아스");
  const [opponentKey, setOpponentKey] = useState("0445-00");
  const [searchError, setSearchError] = useState<string>();

  const mySet = listMyPokemonSets()[0];
  const myPokemon = findPokemonByKey(mySet.pokeKey);
  const opponentPokemon = findPokemonByKey(opponentKey);

  if (!myPokemon || !opponentPokemon) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6">
        <section className="rounded-md border border-red-200 bg-white p-4 text-red-700">
          로컬 마스터 데이터가 부족합니다.
        </section>
      </main>
    );
  }

  const myNature = findNatureByKey(mySet.natureKey);
  const myItem = findItemByKey(mySet.itemKey);
  const usage = findUsageByPokeKey(opponentPokemon.pokeKey);
  const opponentNature = findNatureByKey(usage?.data.natures[0]?.key ?? 13);
  const opponentItem = findItemByKey(usage?.data.items[0]?.key);
  const opponentStatPoint = usage?.data.stat_points.skeletons[0];

  const myStats = calculateStats({ baseStats: myPokemon.baseStats, level: mySet.level, evs: mySet.evs, nature: myNature });
  const opponentStats = calculateStats({
    baseStats: opponentPokemon.baseStats,
    level: 50,
    evs: opponentStatPoint ? evsFromUsage(opponentStatPoint) : { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    nature: opponentNature
  });
  const myBulk = calculateBulk(myStats);
  const opponentBulk = calculateBulk(opponentStats);

  const myPowers = useMemo(
    () =>
      mySet.moves
        .map(findMoveByKey)
        .filter((move) => move !== undefined)
        .map((move) => calculateMovePower({ pokemonTypes: myPokemon.types, stats: myStats, move, item: myItem }))
        .filter((result) => result !== undefined),
    [myItem, myPokemon.types, mySet.moves, myStats]
  );

  const opponentPowers = useMemo(
    () =>
      (usage?.data.moves ?? [])
        .slice(0, 10)
        .map((entry) => findMoveByKey(entry.key))
        .filter((move) => move !== undefined)
        .map((move) => calculateMovePower({ pokemonTypes: opponentPokemon.types, stats: opponentStats, move, item: opponentItem }))
        .filter((result) => result !== undefined),
    [opponentItem, opponentPokemon.types, opponentStats, usage?.data.moves]
  );

  function handleSearch() {
    const found = findPokemonByName(query);
    if (!found) {
      setSearchError("현재 샘플 데이터에 없는 포켓몬입니다.");
      return;
    }

    setOpponentKey(found.pokeKey);
    setSearchError(undefined);
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-950">Pokemon Champions 메타 계산기</h1>
        <p className="mt-1 text-sm text-gray-600">로컬 샘플 데이터 기준 · 시즌 3 · 룰 10</p>
      </header>
      <PokemonSearch query={query} onQueryChange={setQuery} onSearch={handleSearch} error={searchError} />
      <div className="grid gap-4 md:grid-cols-2">
        <MyTeamPanel set={mySet} pokemon={myPokemon} />
        <UsageSummary pokemon={opponentPokemon} nature={opponentNature} item={opponentItem} statPoint={opponentStatPoint} />
      </div>
      <ComparisonPanel
        mySpeed={myStats.spe}
        opponentSpeed={opponentStats.spe}
        opponentScarfSpeed={applyChoiceScarf(opponentStats.spe)}
        myBulk={myBulk}
        opponentBulk={opponentBulk}
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <PowerTable title="내 공격 기술 결정력" rows={myPowers} targetBulk={opponentBulk.physical} />
        <PowerTable title="상대 공격 기술 결정력" rows={opponentPowers} targetBulk={myBulk.physical} />
      </div>
    </main>
  );
}
