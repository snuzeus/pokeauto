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
    <section className="rounded-md border border-gray-900 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <div>
          <p className="text-sm font-medium text-gray-500">상대 vs 나 스피드</p>
          <h2 className="mt-1 text-xl font-semibold text-gray-950">선공 관계</h2>
        </div>
        <Gauge className="h-6 w-6 text-gray-900" aria-hidden="true" />
      </div>
      <div className="grid gap-0 md:grid-cols-3">
        <div className="border-b border-gray-200 p-5 md:border-b-0 md:border-r">
          <p className="text-sm text-gray-500">{myName}</p>
          <p className="mt-2 text-4xl font-semibold text-gray-950">{mySpeed}</p>
          <p className="mt-2 text-sm font-medium text-gray-700">내 스피드</p>
        </div>
        <div className="border-b border-gray-200 p-5 md:border-b-0 md:border-r">
          <p className="text-sm text-gray-500">{opponentName}</p>
          <p className="mt-2 text-4xl font-semibold text-gray-950">{opponentSpeed}</p>
          <p className="mt-2 text-sm font-medium text-gray-700">
            일반: {normalVerdict} · {delta(mySpeed, opponentSpeed)}
          </p>
        </div>
        <div className="p-5">
          <p className="text-sm text-gray-500">{opponentName} 구애스카프</p>
          <p className="mt-2 text-4xl font-semibold text-gray-950">{opponentScarfSpeed}</p>
          <p className="mt-2 text-sm font-medium text-gray-700">
            스카프: {scarfVerdict} · {delta(mySpeed, opponentScarfSpeed)}
          </p>
        </div>
      </div>
    </section>
  );
}
