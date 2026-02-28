export function RankMedal({ rank }: { rank: number }) {
  const colors: Record<number, string> = {
    1: "bg-brand-amber text-white",
    2: "bg-gray-400 text-white",
    3: "bg-amber-700 text-white",
  };

  return (
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-full font-data text-[13px] font-bold ${colors[rank]}`}
    >
      {rank}
    </div>
  );
}
