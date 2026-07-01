import { Gauge } from "lucide-react";

type SpeedMatchupPanelProps = {
  myName: string;
  opponentName: string;
  mySpeed: number;
  opponentSpeed: number;
  opponentScarfSpeed: number;
};

function verdict(mySpeed: number, opponentSpeed: number): string {
  if (mySpeed > opponentSpeed) return "내가 선공";
  if (mySpeed < opponentSpeed) return "상대가 선공";
  return "동속";
}

function delta(mySpeed: number, opponentSpeed: number): string {
  const value = Math.abs(mySpeed - opponentSpeed);
  return value === 0 ? "차이 없음" : `${value} 차이`;
}

export function SpeedMatchupPanel({
  myName,
  opponentName,
  mySpeed,
  opponentSpeed,
  opponentScarfSpeed
}: SpeedMatchupPanelProps) {
  const normalVerdict = verdict(mySpeed, opponentSpeed);
  const scarfVerdict = verdict(mySpeed, opponentScarfSpeed);

  return (
    <section className="rounded-md border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-gray-400">Speed Matchup</p>
          <h2 className="mt-1 text-lg font-semibold text-gray-950">상대 vs 나 스피드</h2>
        </div>
        <div className="rounded-md bg-indigo-50 p-2">
          <Gauge className="h-5 w-5 text-indigo-700" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-md border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-teal-800">{myName}</p>
          <p className="mt-2 text-4xl font-semibold text-gray-950">{mySpeed}</p>
          <p className="mt-2 text-sm font-medium text-gray-700">내 스피드</p>
        </div>
        <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-500">{opponentName}</p>
          <p className="mt-2 text-4xl font-semibold text-gray-950">{opponentSpeed}</p>
          <p className="mt-2 text-sm font-medium text-gray-700">
            일반: {normalVerdict} · {delta(mySpeed, opponentSpeed)}
          </p>
        </div>
        <div className="rounded-md border border-rose-100 bg-rose-50 p-4">
          <p className="text-sm font-medium text-rose-800">{opponentName} 구애스카프</p>
          <p className="mt-2 text-4xl font-semibold text-gray-950">{opponentScarfSpeed}</p>
          <p className="mt-2 text-sm font-medium text-gray-700">
            스카프: {scarfVerdict} · {delta(mySpeed, opponentScarfSpeed)}
          </p>
        </div>
      </div>
    </section>
  );
}
