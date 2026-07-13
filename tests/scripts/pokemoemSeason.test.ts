import { describe, expect, it } from "vitest";
import { selectLatestSinglesSeason } from "../../scripts/lib/pokemoemSeason.mjs";

describe("selectLatestSinglesSeason", () => {
  it("selects the highest season with singles rankings", () => {
    expect(selectLatestSinglesSeason({
      seasons: [
        { season: 3, rules: { "10": { ranking: true } } },
        { season: 4, rules: { "10": { ranking: true } } }
      ]
    })).toEqual({ season: 4, rule: 10 });
  });

  it("skips newer seasons without singles rankings", () => {
    expect(selectLatestSinglesSeason({
      seasons: [
        { season: 4, rules: { "10": { ranking: true } } },
        { season: 5, rules: { "10": { ranking: false } } }
      ]
    })).toEqual({ season: 4, rule: 10 });
  });

  it("uses explicit season and rule overrides", () => {
    expect(selectLatestSinglesSeason({ seasons: [] }, { season: 3, rule: 10 }))
      .toEqual({ season: 3, rule: 10 });
  });

  it("throws when no singles ranking season is available", () => {
    expect(() => selectLatestSinglesSeason({
      seasons: [{ season: 5, rules: { "10": { ranking: false } } }]
    })).toThrow("No Pokemoem singles ranking season is available.");
  });
});
