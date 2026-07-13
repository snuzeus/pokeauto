# Latest Pokemoem Singles Data Sync

## Goal

Refresh the application with the same latest singles data shown by
`https://pokemoem.com/pokedex?sort=singles`, without requiring a source-code
change when Pokemoem starts a new season.

## Current problem

The sync script pins `POKEMOEM_SEASON` to 3 and `POKEMOEM_RULE` to 10. The
Pokemoem Pokédex now shows season 4 singles data, so daily runs keep updating
the previous season instead of the page's current data.

## Design

1. Fetch `https://api.pokemoem.com/champions/battlestat/seasons` at the start
   of every sync.
2. Select the highest numbered season whose rule `10` reports `ranking: true`.
   Rule 10 is the singles rule used by the Pokédex's `sort=singles` view.
3. Use the selected season and rule for the existing Champions legal-data,
   ranking, and per-Pokémon detail requests.
4. Keep `POKEMOEM_SEASON` and `POKEMOEM_RULE` as optional explicit overrides
   for recovery and repeatable historical syncs. The normal scheduled workflow
   will not set either variable.
5. Persist the selected season and rule in generated data, and log the source
   update timestamp from the singles ranking response so a workflow run proves
   which live data snapshot was collected.

## Error handling

- If the seasons endpoint is unavailable or has no singles ranking-capable
  season, fail the workflow before writing data.
- If the latest season has rankings but no detail records yet, fail rather than
  silently replacing usable data with fallback entries.

## Tests

- Unit-test selection of the highest eligible singles season.
- Cover skipped seasons, unavailable singles rankings, and explicit overrides.
- Run the sync script against the live Pokemoem API and confirm generated data
  records the current season and uses current ranking source timestamps.

