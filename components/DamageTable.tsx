import type { DamageResult } from "@/types/calc";

type DamageTableProps = {
  title: string;
  rows: DamageResult[];
};

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function DamageTable({ title, rows }: DamageTableProps) {
  return (
    <section className="rounded-md border border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-base font-semibold text-gray-950">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-2">기술</th>
              <th className="px-4 py-2">상성</th>
              <th className="px-4 py-2">데미지</th>
              <th className="px-4 py-2">HP 비율</th>
              <th className="px-4 py-2">몇타</th>
              <th className="px-4 py-2">난수</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={6}>
                  계산 가능한 공격 기술이 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.move.key} className="border-t border-gray-100 align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-950">{row.move.koreanName}</p>
                    <p className="text-xs text-gray-500">{row.move.englishName ?? row.move.japaneseName}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">x{row.typeEffectiveness}</td>
                  <td className="px-4 py-3 text-gray-950">
                    {row.minDamage}-{row.maxDamage}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatPercent(row.minPercent)}-{formatPercent(row.maxPercent)}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-950">{row.koSummary}</td>
                  <td className="max-w-[240px] px-4 py-3 text-xs text-gray-500">{row.rolls.join(", ")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
