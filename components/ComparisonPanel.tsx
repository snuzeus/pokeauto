import type { BulkResult } from "@/types/calc";
import { StatCard } from "./StatCard";

type ComparisonPanelProps = {
  mySpeed: number;
  opponentSpeed: number;
  opponentScarfSpeed: number;
  myBulk: BulkResult;
  opponentBulk: BulkResult;
};

export function ComparisonPanel({ mySpeed, opponentSpeed, opponentScarfSpeed, myBulk, opponentBulk }: ComparisonPanelProps) {
  return (
    <section className="grid gap-3 md:grid-cols-2">
      <StatCard label="내 내구" value={myBulk.physical.toLocaleString()} hint={`특수 ${myBulk.special.toLocaleString()}`} />
      <StatCard label="상대 내구" value={opponentBulk.physical.toLocaleString()} hint={`특수 ${opponentBulk.special.toLocaleString()}`} />
    </section>
  );
}
