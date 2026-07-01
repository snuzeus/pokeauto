import type { DamageResult } from "@/types/calc";

type DamageTableProps = {
  title: string;
  rows: DamageResult[];
  tone: "mine" | "opponent";
};

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function DamageTable({ title, rows, tone }: DamageTableProps) {
  const accentClass = tone === "mine" ? "bg-emerald-500" : "bg-rose-500";
  const badgeClass = tone === "mine" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700";
  const barClass = tone === "mine" ? "bg-emerald-500" : "bg-rose-500";

  return (
    <section className="rounded-md border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-gray-400">Damage Cards</p>
          <h2 className="mt-1 text-lg font-semibold text-gray-950">{title}</h2>
        </div>
        <span className={`h-3 w-3 rounded-full ${accentClass}`} aria-hidden="true" />
      </div>

      <div className="mt-4 grid gap-3">
        {rows.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-200 p-5 text-sm text-gray-500">계산 가능한 공격 기술이 없습니다.</div>
        ) : (
          rows.map((row) => (
            <article key={row.move.key} className="rounded-md border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-base font-semibold text-gray-950">{row.move.koreanName}</p>
                  <p className="text-xs text-gray-500">{row.move.englishName ?? row.move.japaneseName}</p>
                </div>
                <span className={`inline-flex w-fit rounded-md px-2.5 py-1 text-sm font-semibold ${badgeClass}`}>{row.koSummary}</span>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-950">
                    {formatPercent(row.minPercent)}-{formatPercent(row.maxPercent)}
                  </span>
                  <span className="text-gray-500">
                    {row.minDamage}-{row.maxDamage} · x{row.typeEffectiveness}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                  <div className={`h-full rounded-full ${barClass}`} style={{ width: `${Math.min(100, row.maxPercent)}%` }} />
                </div>
              </div>

              <p className="mt-3 line-clamp-2 text-xs leading-5 text-gray-500">난수: {row.rolls.join(", ")}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
