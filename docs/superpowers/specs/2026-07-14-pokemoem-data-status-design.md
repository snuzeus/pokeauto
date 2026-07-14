# Pokemoem Data Status Display

## Goal

Show the exact Pokemoem singles data snapshot bundled into the application so
users can verify that a deployed version contains current data.

## Design

The sync script already fetches the Pokemoem singles ranking response. It will
store that response's `source_updated_at` value in `champions-legal.json`
alongside the selected season and rule. The usage repository will expose this
metadata as a typed value. The fixed application header will display the
Champions season, singles rule, and the source update time formatted in KST.

The UI reads only generated local data. It does not make a browser-side API
request, so the displayed status always describes the same snapshot used by
the calculator.

## Error handling

Older generated data may lack `source_updated_at`. In that case the header
shows the season and rule without a timestamp rather than rendering an invalid
date.

## Tests

- Verify that the repository returns season, rule, and source update metadata.
- Verify the KST display formatter for a valid timestamp and an absent value.
