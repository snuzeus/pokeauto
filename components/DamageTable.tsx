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
  const headerClass = tone === "mine" ? "border-gray-900 bg-gray-950 text-white" : "border-red-900 bg-red-950 text-white";
  const badgeClass = tone === "mine" ? "bg-gray-100 text-gray-900" : "bg-red-50 text-red-900";

  return (
    <section className="overflow-hidden rounded-md border border-gray-200 bg-white">
      <div className={`border-b px-5 py-4 ${headerClass}`}>
        <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Damage Rolls</p>
        <h2 className="mt-1 text-lg font-semibold">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-5 py-3">기술</th>
              <th className="px-4 py-3">몇타</th>
              <th className="px-4 py-3">HP 비율</th>
              <th className="px-4 py-3">데미지</th>
              <th className="px-4 py-3">상성</th>
              <th className="px-4 py-3">난수</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-5 py-8 text-gray-500" colSpan={6}>
                  계산 가능한 공격 기술이 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.move.key} className="border-t border-gray-100 align-top">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-950">{row.move.koreanName}</p>
                    <p className="text-xs text-gray-500">{row.move.englishName ?? row.move.japaneseName}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded px-2 py-1 text-sm font-semibold ${badgeClass}`}>{row.koSummary}</span>
                  </td>
                  <td className="px-4 py-4 text-base font-semibold text-gray-950">
                    {formatPercent(row.minPercent)}-{formatPercent(row.maxPercent)}
                  </td>
                  <td className="px-4 py-4 text-gray-700">
                    {row.minDamage}-{row.maxDamage}
                  </td>
                  <td className="px-4 py-4 text-gray-600">x{row.typeEffectiveness}</td>
                  <td className="max-w-[240px] px-4 py-4 text-xs leading-5 text-gray-500">{row.rolls.join(", ")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
