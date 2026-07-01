import { describe, expect, it } from "vitest";
import { calculateStats } from "@/lib/calc/stats";

describe("calculateStats", () => {
  it("calculates level 50 stats with nature modifiers", () => {
    const stats = calculateStats({
      baseStats: { hp: 108, atk: 130, def: 95, spa: 80, spd: 85, spe: 102 },
      level: 50,
      evs: { hp: 2, atk: 32, def: 0, spa: 0, spd: 0, spe: 32 },
      nature: { key: 13, koreanName: "명랑", up: "spe", down: "spa" }
    });

    expect(stats).toEqual({
      hp: 185,
      atk: 182,
      def: 115,
      spa: 90,
      spd: 105,
      spe: 169
    });
  });
});
