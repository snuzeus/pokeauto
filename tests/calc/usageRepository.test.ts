import { describe, expect, it } from "vitest";
import { formatChampionUsageSourceUpdatedAt, findUsageByPokeKey, getChampionUsageMetadata } from "@/lib/data/usageRepository";

describe("usageRepository item normalization", () => {
  it("maps numeric ZA mega stone usage entries to displayable item names", () => {
    const usage = findUsageByPokeKey("0149-00");

    expect(usage?.data.items[0]).toMatchObject({
      key: 2005,
      name: "망나뇽나이트"
    });
  });

  it("maps split X/Y ZA mega stones by their numeric order", () => {
    const usage = findUsageByPokeKey("0026-00");

    expect(usage?.data.items.slice(0, 2)).toEqual([
      expect.objectContaining({ key: 2013, name: "라이츄나이트Y" }),
      expect.objectContaining({ key: 2012, name: "라이츄나이트X" })
    ]);
  });
});

describe("Champions usage metadata", () => {
  it("exposes valid bundled singles metadata without pinning a season", () => {
    const metadata = getChampionUsageMetadata();

    expect(metadata.rule).toBe(10);
    expect(metadata.season).toEqual(expect.any(Number));
    expect(metadata.season).toBeGreaterThan(0);
    expect(metadata.sourceUpdatedAt).toEqual(expect.any(String));
    expect(Number.isNaN(Date.parse(metadata.sourceUpdatedAt!))).toBe(false);
  });

  it("formats source updates in Korea time", () => {
    expect(formatChampionUsageSourceUpdatedAt("2026-07-14T02:15:53Z")).toBe("2026. 7. 14. 11:15");
    expect(formatChampionUsageSourceUpdatedAt()).toBeUndefined();
  });
});
