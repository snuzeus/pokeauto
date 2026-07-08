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

  it("applies offensive stage and weather to move power", () => {
    const neutral = calculateMovePower({
      pokemonTypes: ["fire"],
      stats: { hp: 185, atk: 182, def: 115, spa: 90, spd: 105, spe: 169 },
      move: { key: 53, koreanName: "화염방사", type: "fire", category: "special", power: 90 }
    });
    const boosted = calculateMovePower({
      pokemonTypes: ["fire"],
      stats: { hp: 185, atk: 182, def: 115, spa: 90, spd: 105, spe: 169 },
      move: { key: 53, koreanName: "화염방사", type: "fire", category: "special", power: 90 },
      stage: 2,
      weather: "sun"
    });

    expect(boosted!.power).toBeGreaterThan(neutral!.power);
  });

  it("uses maximum total base power for multi-hit representative power", () => {
    const singleHit = calculateMovePower({
      pokemonTypes: ["ice"],
      stats: { hp: 185, atk: 100, def: 115, spa: 90, spd: 105, spe: 169 },
      move: { key: 420, koreanName: "얼음뭉치", englishName: "Ice Shard", type: "ice", category: "physical", power: 40 }
    });
    const tripleAxel = calculateMovePower({
      pokemonTypes: ["ice"],
      stats: { hp: 185, atk: 100, def: 115, spa: 90, spd: 105, spe: 169 },
      move: { key: 813, koreanName: "트리플악셀", englishName: "Triple Axel", showdownId: "tripleaxel", type: "ice", category: "physical", power: 20, accuracy: 90, multihit: 3 }
    });
    const icicleSpear = calculateMovePower({
      pokemonTypes: ["ice"],
      stats: { hp: 185, atk: 100, def: 115, spa: 90, spd: 105, spe: 169 },
      move: { key: 333, koreanName: "고드름침", englishName: "Icicle Spear", type: "ice", category: "physical", power: 25, multihit: [2, 5] }
    });

    expect(singleHit?.power).toBe(6000);
    expect(tripleAxel?.power).toBe(18000);
    expect(icicleSpear?.power).toBe(18750);
  });

  it("applies type boost items and Punching Glove to representative power", () => {
    const neutral = calculateMovePower({
      pokemonTypes: ["ice"],
      stats: { hp: 185, atk: 100, def: 115, spa: 90, spd: 105, spe: 169 },
      move: { key: 8, koreanName: "냉동펀치", englishName: "Ice Punch", showdownId: "icepunch", type: "ice", category: "physical", power: 75 }
    });
    const neverMeltIce = calculateMovePower({
      pokemonTypes: ["ice"],
      stats: { hp: 185, atk: 100, def: 115, spa: 90, spd: 105, spe: 169 },
      move: { key: 8, koreanName: "냉동펀치", englishName: "Ice Punch", showdownId: "icepunch", type: "ice", category: "physical", power: 75 },
      item: { key: 246, koreanName: "녹지않는얼음", englishName: "Never-Melt Ice", showdownId: "nevermeltice", effectType: "none", multiplier: 1 }
    });
    const punchingGlove = calculateMovePower({
      pokemonTypes: ["ice"],
      stats: { hp: 185, atk: 100, def: 115, spa: 90, spd: 105, spe: 169 },
      move: { key: 8, koreanName: "냉동펀치", englishName: "Ice Punch", showdownId: "icepunch", type: "ice", category: "physical", power: 75 },
      item: { key: 1884, koreanName: "펀치글러브", englishName: "Punching Glove", showdownId: "punchingglove", effectType: "none", multiplier: 1 }
    });

    expect(neutral?.power).toBe(11250);
    expect(neverMeltIce?.power).toBe(13500);
    expect(punchingGlove?.power).toBe(12375);
  });
});
