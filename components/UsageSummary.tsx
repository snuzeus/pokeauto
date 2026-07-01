import type { ItemMaster, NatureMaster, PokemonMaster } from "@/types/master";
import type { UsageStatPoint } from "@/types/usage";

type UsageSummaryProps = {
  pokemon: PokemonMaster;
  nature?: NatureMaster;
  item?: ItemMaster;
  statPoint?: UsageStatPoint;
};

export function UsageSummary({ pokemon, nature, item, statPoint }: UsageSummaryProps) {
  return (
    <section className="rounded-md border border-rose-100 bg-white p-4">
      <p className="text-xs font-semibold uppercase text-rose-600">Opponent Meta</p>
      <h2 className="mt-1 text-xl font-semibold text-gray-950">{pokemon.koreanName}</h2>
      <div className="mt-3 space-y-1 text-sm text-gray-600">
        <p>성격: {nature?.koreanName ?? "미확인"}</p>
        <p>아이템: {item?.koreanName ?? "미확인"}</p>
        <p>노력치: {statPoint?.label ?? "미확인"}</p>
      </div>
    </section>
  );
}
