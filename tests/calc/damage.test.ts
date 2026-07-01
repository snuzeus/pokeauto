import { describe, expect, it } from "vitest";
import { calculateDamage, summarizeKoChance } from "@/lib/calc/damage";

const garchompStats = { hp: 185, atk: 182, def: 115, spa: 90, spd: 105, spe: 169 };

describe("calculateDamage", () => {
  it("calculates 16 damage rolls and KO chance for a damaging move", () => {
    const result = calculateDamage({
      level: 50,
      attackerTypes: ["dragon", "ground"],
      defenderTypes: ["dragon", "ground"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 200, koreanName: "역린", type: "dragon", category: "physical", power: 120 },
      item: { key: 275, koreanName: "기합의띠", effectType: "none", multiplier: 1 }
    });

    expect(result?.rolls).toHaveLength(16);
    expect(result?.minDamage).toBe(216);
    expect(result?.maxDamage).toBe(255);
    expect(result?.koSummary).toBe("확정 1타");
  });

  it("excludes status moves", () => {
    const result = calculateDamage({
      level: 50,
      attackerTypes: ["dragon", "ground"],
      defenderTypes: ["dragon", "ground"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 446, koreanName: "스텔스록", type: "rock", category: "status", power: null }
    });

    expect(result).toBeUndefined();
  });
});

describe("summarizeKoChance", () => {
  it("reports guaranteed and random KO windows", () => {
    expect(summarizeKoChance([50, 60], 100)).toBe("확정 2타");
    expect(summarizeKoChance([30, 60], 100)).toBe("난수 2타 25.00%");
  });
});
