import type { ItemMaster, MoveMaster, NatureMaster, PokemonMaster } from "@/types/master";
import type { MyPokemonSet } from "@/types/team";

type MySetManagerProps = {
  sets: MyPokemonSet[];
  selectedSetId: string;
  pokemon: PokemonMaster;
  natures: NatureMaster[];
  items: ItemMaster[];
  moves: MoveMaster[];
  onSelectSet: (id: string) => void;
  onAddSet: (set: MyPokemonSet) => void;
};

function createSetFromForm(formData: FormData, fallbackPokeKey: string): MyPokemonSet {
  const selectedMoves = formData.getAll("moves").map((value) => Number(value));

  return {
    id: `local-${Date.now()}`,
    pokeKey: fallbackPokeKey,
    nickname: String(formData.get("nickname") || "내 샘플"),
    level: 50,
    natureKey: Number(formData.get("natureKey")),
    itemKey: Number(formData.get("itemKey")),
    evs: {
      hp: Number(formData.get("hp") || 0),
      atk: Number(formData.get("atk") || 0),
      def: Number(formData.get("def") || 0),
      spa: Number(formData.get("spa") || 0),
      spd: Number(formData.get("spd") || 0),
      spe: Number(formData.get("spe") || 0)
    },
    moves: selectedMoves.slice(0, 4)
  };
}

export function MySetManager({
  sets,
  selectedSetId,
  pokemon,
  natures,
  items,
  moves,
  onSelectSet,
  onAddSet
}: MySetManagerProps) {
  function handleSubmit(formData: FormData) {
    onAddSet(createSetFromForm(formData, pokemon.pokeKey));
  }

  return (
    <section className="rounded-md border border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm text-gray-500">내 샘플 등록</p>
          <h2 className="mt-1 text-lg font-semibold text-gray-950">{pokemon.koreanName}</h2>
        </div>
        <label className="w-full md:w-64">
          <span className="text-sm font-medium text-gray-700">비교할 샘플</span>
          <select
            value={selectedSetId}
            onChange={(event) => onSelectSet(event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
          >
            {sets.map((set) => (
              <option key={set.id} value={set.id}>
                {set.nickname ?? set.id}
              </option>
            ))}
          </select>
        </label>
      </div>

      <form action={handleSubmit} className="mt-4 grid gap-4">
        <div className="grid gap-3">
          <label>
            <span className="text-sm font-medium text-gray-700">샘플 이름</span>
            <input
              name="nickname"
              defaultValue="새 샘플 한카리아스"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
            />
          </label>
          <label>
            <span className="text-sm font-medium text-gray-700">성격</span>
            <select
              name="natureKey"
              defaultValue={natures[0]?.key}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
            >
              {natures.map((nature) => (
                <option key={nature.key} value={nature.key}>
                  {nature.koreanName}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-sm font-medium text-gray-700">아이템</span>
            <select
              name="itemKey"
              defaultValue={items[0]?.key}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
            >
              {items.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.koreanName}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700">Stat Points</p>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {(["hp", "atk", "def", "spa", "spd", "spe"] as const).map((stat) => (
              <label key={stat}>
                <span className="text-xs uppercase text-gray-500">{stat}</span>
                <input
                  name={stat}
                  type="number"
                  min={0}
                  max={66}
                  defaultValue={stat === "hp" ? 2 : stat === "atk" || stat === "spe" ? 32 : 0}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
                />
              </label>
            ))}
          </div>
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-gray-700">기술 최대 4개</legend>
          <div className="mt-2 grid gap-2">
            {moves.map((move, index) => (
              <label key={move.key} className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm">
                <input name="moves" type="checkbox" value={move.key} defaultChecked={index < 4 && move.category !== "status"} />
                <span>{move.koreanName}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          className="w-full rounded-md bg-gray-950 px-4 py-2 text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 md:w-fit"
        >
          샘플 추가
        </button>
      </form>
    </section>
  );
}
