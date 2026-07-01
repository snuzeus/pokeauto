import type { MovePowerResult } from "@/types/calc";

type PowerTableProps = {
  title: string;
  rows: MovePowerResult[];
  targetBulk?: number;
};

export function PowerTable({ title, rows, targetBulk }: PowerTableProps) {
  return (
    <section className="rounded-md border border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-base font-semibold text-gray-950">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-2">기술</th>
              <th className="px-4 py-2">분류</th>
              <th className="px-4 py-2">위력</th>
              <th className="px-4 py-2">결정력</th>
              <th className="px-4 py-2">판정</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={5}>
                  계산 가능한 공격 기술이 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.move.key} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-950">{row.move.koreanName}</td>
                  <td className="px-4 py-3 text-gray-600">{row.move.category}</td>
                  <td className="px-4 py-3 text-gray-600">{row.move.power}</td>
                  <td className="px-4 py-3 text-gray-950">{row.power.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {targetBulk && row.power > targetBulk ? "압박 가능" : "참고 지표"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
