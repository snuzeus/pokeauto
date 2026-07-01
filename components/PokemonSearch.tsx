type PokemonSearchProps = {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  error?: string;
};

export function PokemonSearch({ query, onQueryChange, onSearch, error }: PokemonSearchProps) {
  return (
    <section className="rounded-md border border-gray-200 bg-[#f8faf9] p-4">
      <div className="flex flex-col gap-3">
        <label className="flex-1">
          <span className="text-sm font-medium text-gray-700">상대 포켓몬</span>
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSearch();
            }}
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
            placeholder="한카리아스"
          />
        </label>
        <button
          type="button"
          onClick={onSearch}
          className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
        >
          검색
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </section>
  );
}
