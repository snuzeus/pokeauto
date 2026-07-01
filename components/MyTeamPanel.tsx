import type { PokemonMaster } from "@/types/master";
import type { MyPokemonSet } from "@/types/team";

type MyTeamPanelProps = {
  set: MyPokemonSet;
  pokemon: PokemonMaster;
};

export function MyTeamPanel({ set, pokemon }: MyTeamPanelProps) {
  return (
    <section className="rounded-md border border-emerald-100 bg-white p-4">
      <p className="text-xs font-semibold uppercase text-emerald-600">My Sample</p>
      <h2 className="mt-1 text-xl font-semibold text-gray-950">{set.nickname ?? pokemon.koreanName}</h2>
      <p className="mt-1 text-sm text-gray-600">
        {pokemon.koreanName} · {pokemon.pokeKey}
      </p>
      <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-gray-700">
        노력치 H{set.evs.hp}/A{set.evs.atk}/B{set.evs.def}/C{set.evs.spa}/D{set.evs.spd}/S{set.evs.spe}
      </p>
    </section>
  );
}
