import { describe, expect, it } from "vitest";
import { calculateMovePower, isDamagingMove } from "@/lib/calc/power";

describe("power calculation", () => {
  it("excludes status moves", () => {
    expect(
      isDamagingMove({
        key: 446,
        koreanName: "스텔스록",
        type: "rock",
        category: "status",
        power: null
      })
    ).toBe(false);
  });

  it("applies STAB and life orb to physical moves", () => {
    const result = calculateMovePower({
      pokemonTypes: ["dragon", "ground"],
      stats: { hp: 185, atk: 182, def: 115, spa: 90, spd: 105, spe: 169 },
      move: { key: 89, koreanName: "지진", type: "ground", category: "physical", power: 100 },
      item: { key: 270, koreanName: "생명의구슬", effectType: "life_orb", multiplier: 1.3 }
    });

    expect(result?.stab).toBe(1.5);
    expect(result?.itemMultiplier).toBe(1.3);
    expect(result?.power).toBe(35490);
  });
});
