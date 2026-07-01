"use client";

import { useEffect, useState } from "react";
import { Database, Swords } from "lucide-react";
import { ComparisonPanel } from "@/components/ComparisonPanel";
import { DamageTable } from "@/components/DamageTable";
import { MySetManager } from "@/components/MySetManager";
import { MyTeamPanel } from "@/components/MyTeamPanel";
import { PokemonSearch } from "@/components/PokemonSearch";
import { PowerTable } from "@/components/PowerTable";
import { SpeedMatchupPanel } from "@/components/SpeedMatchupPanel";
import { UsageSummary } from "@/components/UsageSummary";
import { calculateBulk } from "@/lib/calc/bulk";
import { calculateDamage } from "@/lib/calc/damage";
import { calculateMovePower } from "@/lib/calc/power";
import { applyChoiceScarf } from "@/lib/calc/speed";
import { calculateStats } from "@/lib/calc/stats";
import { findItemByKey, listItems } from "@/lib/data/itemRepository";
import { findMoveByKey, listMoves } from "@/lib/data/moveRepository";
import { listMyPokemonSets } from "@/lib/data/myTeamRepository";
import { findNatureByKey, listNatures } from "@/lib/data/natureRepository";
import { findPokemonByKey, findPokemonByName } from "@/lib/data/pokemonRepository";
import { findUsageByPokeKey } from "@/lib/data/usageRepository";
import type { EffortValues, MyPokemonSet } from "@/types/team";
import type { UsageStatPoint } from "@/types/usage";

const MY_SETS_STORAGE_KEY = "pokeauto.myPokemonSets";

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
  const [mySets, setMySets] = useState<MyPokemonSet[]>(() => listMyPokemonSets());
  const [selectedSetId, setSelectedSetId] = useState(() => listMyPokemonSets()[0]?.id ?? "");

  useEffect(() => {
    const stored = window.localStorage.getItem(MY_SETS_STORAGE_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as MyPokemonSet[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setMySets(parsed);
        setSelectedSetId(parsed[0].id);
      }
    } catch {
      window.localStorage.removeItem(MY_SETS_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(MY_SETS_STORAGE_KEY, JSON.stringify(mySets));
  }, [mySets]);

  const mySet = mySets.find((set) => set.id === selectedSetId) ?? mySets[0];
  const myPokemon = findPokemonByKey(mySet.pokeKey);
  const opponentPokemon = findPokemonByKey(opponentKey);
  const natures = listNatures();
  const items = listItems();
  const moves = listMoves();

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

  const myMoves = mySet.moves.map(findMoveByKey).filter((move) => move !== undefined);
  const opponentMoves = (usage?.data.moves ?? [])
    .slice(0, 10)
    .map((entry) => findMoveByKey(entry.key))
    .filter((move) => move !== undefined);

  const myPowers = myMoves
    .map((move) => calculateMovePower({ pokemonTypes: myPokemon.types, stats: myStats, move, item: myItem }))
    .filter((result) => result !== undefined);

  const opponentPowers = opponentMoves
    .map((move) => calculateMovePower({ pokemonTypes: opponentPokemon.types, stats: opponentStats, move, item: opponentItem }))
    .filter((result) => result !== undefined);

  const myDamageRows = myMoves
    .map((move) =>
      calculateDamage({
        level: mySet.level,
        attackerTypes: myPokemon.types,
        defenderTypes: opponentPokemon.types,
        attackerStats: myStats,
        defenderStats: opponentStats,
        move,
        item: myItem
      })
    )
    .filter((result) => result !== undefined);

  const opponentDamageRows = opponentMoves
    .map((move) =>
      calculateDamage({
        level: 50,
        attackerTypes: opponentPokemon.types,
        defenderTypes: myPokemon.types,
        attackerStats: opponentStats,
        defenderStats: myStats,
        move,
        item: opponentItem
      })
    )
    .filter((result) => result !== undefined);

  function handleSearch() {
    const found = findPokemonByName(query);
    if (!found) {
      setSearchError("현재 샘플 데이터에 없는 포켓몬입니다.");
      return;
    }

    setOpponentKey(found.pokeKey);
    setSearchError(undefined);
  }

  function handleAddSet(set: MyPokemonSet) {
    setMySets((current) => {
      const next = [...current, set];
      return next;
    });
    setSelectedSetId(set.id);
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-gray-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 md:px-6">
        <header className="rounded-md border border-gray-200 bg-white p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                <Swords className="h-4 w-4" aria-hidden="true" />
                Pokemon Champions
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-normal text-gray-950">매치업 카드</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                포케모음처럼 세트와 결과를 카드로 훑어보는 개인용 로컬 매치업 보드입니다.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
              <Database className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              시즌 3 · 룰 10 · 로컬 샘플
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <PokemonSearch query={query} onQueryChange={setQuery} onSearch={handleSearch} error={searchError} />
          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr]">
            <MyTeamPanel set={mySet} pokemon={myPokemon} />
            <div className="flex items-center justify-center">
              <span className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-500">VS</span>
            </div>
            <UsageSummary pokemon={opponentPokemon} nature={opponentNature} item={opponentItem} statPoint={opponentStatPoint} />
          </div>
        </section>

        <SpeedMatchupPanel
          myName={mySet.nickname ?? myPokemon.koreanName}
          opponentName={opponentPokemon.koreanName}
          mySpeed={myStats.spe}
          opponentSpeed={opponentStats.spe}
          opponentScarfSpeed={applyChoiceScarf(opponentStats.spe)}
        />

        <section className="grid gap-5 xl:grid-cols-2">
          <DamageTable title="내 기술 → 상대" rows={myDamageRows} tone="mine" />
          <DamageTable title="상대 기술 → 나" rows={opponentDamageRows} tone="opponent" />
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <ComparisonPanel
            mySpeed={myStats.spe}
            opponentSpeed={opponentStats.spe}
            opponentScarfSpeed={applyChoiceScarf(opponentStats.spe)}
            myBulk={myBulk}
            opponentBulk={opponentBulk}
          />
          <div className="grid gap-5 2xl:grid-cols-2">
            <PowerTable title="내 공격 기술 결정력" rows={myPowers} targetBulk={opponentBulk.physical} />
            <PowerTable title="상대 공격 기술 결정력" rows={opponentPowers} targetBulk={myBulk.physical} />
          </div>
        </section>

        <MySetManager
          sets={mySets}
          selectedSetId={mySet.id}
          pokemon={myPokemon}
          natures={natures}
          items={items}
          moves={moves}
          onSelectSet={setSelectedSetId}
          onAddSet={handleAddSet}
        />
      </div>
    </main>
  );
}
