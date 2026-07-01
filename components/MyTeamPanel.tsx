import type { PokemonMaster } from "@/types/master";
import type { MyPokemonSet } from "@/types/team";

type MyTeamPanelProps = {
  set: MyPokemonSet;
  pokemon: PokemonMaster;
};

export function MyTeamPanel({ set, pokemon }: MyTeamPanelProps) {
  return (
    <section className="rounded-md border border-teal-200 bg-teal-50 p-4">
      <p className="text-sm font-medium text-teal-800">내 포켓몬 샘플</p>
      <h2 className="mt-1 text-xl font-semibold text-gray-950">{set.nickname ?? pokemon.koreanName}</h2>
      <p className="mt-1 text-sm text-gray-600">
        {pokemon.koreanName} · {pokemon.pokeKey}
      </p>
      <p className="mt-3 text-sm text-gray-600">
        노력치 H{set.evs.hp}/A{set.evs.atk}/B{set.evs.def}/C{set.evs.spa}/D{set.evs.spd}/S{set.evs.spe}
      </p>
    </section>
  );
}
