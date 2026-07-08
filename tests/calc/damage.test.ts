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

  it("expands two-to-five hit moves by hit count", () => {
    const result = calculateDamage({
      level: 50,
      attackerTypes: ["dragon", "ground"],
      defenderTypes: ["dragon", "ground"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 799, koreanName: "스케일샷", englishName: "Scale Shot", type: "dragon", category: "physical", power: 25, multihit: [2, 5] }
    });

    expect(result?.multihitResults?.map((entry) => entry.hitCount)).toEqual([2, 3, 4, 5]);
    expect(result?.multihitResults?.map((entry) => entry.hitChance)).toEqual([0.35, 0.35, 0.15, 0.15]);
  });

  it("expands Triple Axel by successful hit count and accuracy chain", () => {
    const result = calculateDamage({
      level: 50,
      attackerTypes: ["ice"],
      defenderTypes: ["dragon", "ground"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 813, koreanName: "트리플악셀", englishName: "Triple Axel", type: "ice", category: "physical", power: 20, accuracy: 90, multihit: 3 }
    });

    expect(result?.multihitResults?.map((entry) => entry.hitCount)).toEqual([1, 2, 3]);
    expect(result?.multihitResults?.map((entry) => Number(entry.hitChance.toFixed(3)))).toEqual([0.09, 0.081, 0.729]);
    expect(result!.multihitResults![2].maxDamage).toBeGreaterThan(result!.multihitResults![0].maxDamage * 3);
  });

  it("applies Protean and Libero style STAB to the used move type", () => {
    const withoutAbility = calculateDamage({
      level: 50,
      attackerTypes: ["dark"],
      defenderTypes: ["normal"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 89, koreanName: "지진", englishName: "Earthquake", type: "ground", category: "physical", power: 100 }
    });
    const withProtean = calculateDamage({
      level: 50,
      attackerTypes: ["dark"],
      defenderTypes: ["normal"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 89, koreanName: "지진", englishName: "Earthquake", type: "ground", category: "physical", power: 100 },
      ability: { key: 168, koreanName: "변환자재", englishName: "Protean", showdownId: "protean" }
    });

    expect(withoutAbility?.stab).toBe(1);
    expect(withProtean?.stab).toBe(1.5);
    expect(withProtean!.minDamage).toBeGreaterThan(withoutAbility!.minDamage);
  });

  it("applies type-changing skin abilities before type effectiveness", () => {
    const result = calculateDamage({
      level: 50,
      attackerTypes: ["fairy"],
      defenderTypes: ["dragon"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 63, koreanName: "파괴광선", englishName: "Hyper Beam", type: "normal", category: "special", power: 150 },
      ability: { key: 182, koreanName: "페어리스킨", englishName: "Pixilate", showdownId: "pixilate" }
    });

    expect(result?.typeEffectiveness).toBe(2);
    expect(result?.stab).toBe(1.5);
  });

  it("applies Freeze-Dry water effectiveness exception", () => {
    const freezeDry = calculateDamage({
      level: 50,
      attackerTypes: ["ice"],
      defenderTypes: ["water"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 573, koreanName: "프리즈드라이", englishName: "Freeze-Dry", showdownId: "freezedry", type: "ice", category: "special", power: 70 }
    });
    const iceBeam = calculateDamage({
      level: 50,
      attackerTypes: ["ice"],
      defenderTypes: ["water"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 58, koreanName: "냉동빔", englishName: "Ice Beam", showdownId: "icebeam", type: "ice", category: "special", power: 90 }
    });

    expect(freezeDry?.typeEffectiveness).toBe(2);
    expect(iceBeam?.typeEffectiveness).toBe(0.5);
    expect(freezeDry!.maxDamage).toBeGreaterThan(iceBeam!.maxDamage);
  });

  it("applies offensive ability power multipliers and Adaptability STAB", () => {
    const normalStab = calculateDamage({
      level: 50,
      attackerTypes: ["normal"],
      defenderTypes: ["normal"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 1, koreanName: "막치기", englishName: "Pound", showdownId: "pound", type: "normal", category: "physical", power: 40 }
    });
    const adaptability = calculateDamage({
      level: 50,
      attackerTypes: ["normal"],
      defenderTypes: ["normal"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 1, koreanName: "막치기", englishName: "Pound", showdownId: "pound", type: "normal", category: "physical", power: 40 },
      ability: { key: 91, koreanName: "적응력", englishName: "Adaptability", showdownId: "adaptability" }
    });
    const technician = calculateDamage({
      level: 50,
      attackerTypes: ["normal"],
      defenderTypes: ["normal"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 1, koreanName: "막치기", englishName: "Pound", showdownId: "pound", type: "normal", category: "physical", power: 40 },
      ability: { key: 101, koreanName: "테크니션", englishName: "Technician", showdownId: "technician" }
    });
    const ironFist = calculateDamage({
      level: 50,
      attackerTypes: ["electric"],
      defenderTypes: ["normal"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 9, koreanName: "번개펀치", englishName: "Thunder Punch", showdownId: "thunderpunch", type: "electric", category: "physical", power: 75 },
      ability: { key: 89, koreanName: "철주먹", englishName: "Iron Fist", showdownId: "ironfist" }
    });
    const neutralPunch = calculateDamage({
      level: 50,
      attackerTypes: ["electric"],
      defenderTypes: ["normal"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 9, koreanName: "번개펀치", englishName: "Thunder Punch", showdownId: "thunderpunch", type: "electric", category: "physical", power: 75 }
    });

    expect(adaptability?.stab).toBe(2);
    expect(adaptability!.maxDamage).toBeGreaterThan(normalStab!.maxDamage);
    expect(technician!.maxDamage).toBeGreaterThan(normalStab!.maxDamage);
    expect(ironFist!.maxDamage).toBeGreaterThan(neutralPunch!.maxDamage);
    expect(ironFist?.abilityNotes?.join(" ")).toContain("철주먹");
  });

  it("applies ice type and punching item boosts", () => {
    const neutral = calculateDamage({
      level: 50,
      attackerTypes: ["ice"],
      defenderTypes: ["normal"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 8, koreanName: "냉동펀치", englishName: "Ice Punch", showdownId: "icepunch", type: "ice", category: "physical", power: 75 }
    });
    const neverMeltIce = calculateDamage({
      level: 50,
      attackerTypes: ["ice"],
      defenderTypes: ["normal"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 8, koreanName: "냉동펀치", englishName: "Ice Punch", showdownId: "icepunch", type: "ice", category: "physical", power: 75 },
      item: { key: 246, koreanName: "녹지않는얼음", englishName: "Never-Melt Ice", showdownId: "nevermeltice", effectType: "none", multiplier: 1 }
    });
    const punchingGlove = calculateDamage({
      level: 50,
      attackerTypes: ["ice"],
      defenderTypes: ["normal"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 8, koreanName: "냉동펀치", englishName: "Ice Punch", showdownId: "icepunch", type: "ice", category: "physical", power: 75 },
      item: { key: 1884, koreanName: "펀치글러브", englishName: "Punching Glove", showdownId: "punchingglove", effectType: "none", multiplier: 1 }
    });

    expect(neverMeltIce!.maxDamage).toBeGreaterThan(neutral!.maxDamage);
    expect(punchingGlove!.maxDamage).toBeGreaterThan(neutral!.maxDamage);
    expect(neverMeltIce?.itemMultiplier).toBe(1.2);
    expect(punchingGlove?.itemMultiplier).toBe(1.1);
  });

  it("matches Adamant A32 Mega Metagross Ice Punch into H2 Hydreigon", () => {
    const result = calculateDamage({
      level: 50,
      attackerTypes: ["steel", "psychic"],
      defenderTypes: ["dark", "dragon"],
      attackerStats: { hp: 155, atk: 216, def: 170, spa: 125, spd: 130, spe: 130 },
      defenderStats: { hp: 169, atk: 125, def: 110, spa: 157, spd: 110, spe: 118 },
      move: { key: 8, koreanName: "냉동펀치", englishName: "Ice Punch", showdownId: "icepunch", type: "ice", category: "physical", power: 75 },
      ability: { key: 181, koreanName: "단단한발톱", englishName: "Tough Claws", showdownId: "toughclaws" }
    });

    expect(result?.typeEffectiveness).toBe(2);
    expect(result?.minDamage).toBe(146);
    expect(result?.maxDamage).toBe(172);
    expect(result?.minPercent).toBeCloseTo(86.39, 2);
    expect(result?.maxPercent).toBeCloseTo(101.78, 2);
  });

  it("matches Jolly A32 Protean Meowscarada Triple Axel into H32 B20 Primarina", () => {
    const result = calculateDamage({
      level: 50,
      attackerTypes: ["grass", "dark"],
      defenderTypes: ["water", "fairy"],
      attackerStats: { hp: 151, atk: 162, def: 90, spa: 101, spd: 90, spe: 179 },
      defenderStats: { hp: 187, atk: 94, def: 114, spa: 146, spd: 136, spe: 80 },
      move: { key: 813, koreanName: "트리플악셀", englishName: "Triple Axel", showdownId: "tripleaxel", type: "ice", category: "physical", power: 20, accuracy: 90, multihit: 3 },
      ability: { key: 168, koreanName: "변환자재", englishName: "Protean", showdownId: "protean" }
    });

    const fullHit = result?.multihitResults?.find((entry) => entry.hitCount === 3);

    expect(result?.stab).toBe(1.5);
    expect(result?.typeEffectiveness).toBe(0.5);
    expect(fullHit?.minDamage).toBe(48);
    expect(fullHit?.maxDamage).toBe(59);
  });

  it("applies HP, weather, and status-gated offensive abilities", () => {
    const blaze = calculateDamage({
      level: 50,
      attackerTypes: ["fire"],
      defenderTypes: ["normal"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 53, koreanName: "화염방사", englishName: "Flamethrower", showdownId: "flamethrower", type: "fire", category: "special", power: 90 },
      ability: { key: 66, koreanName: "맹화", englishName: "Blaze", showdownId: "blaze" },
      modifiers: {
        weather: "none",
        attacker: { atkStage: 0, defStage: 0, spaStage: 0, spdStage: 0, speStage: 0, hpCurrent: 50, hpMax: 180, reflect: false, lightScreen: false },
        defender: { atkStage: 0, defStage: 0, spaStage: 0, spdStage: 0, speStage: 0, reflect: false, lightScreen: false }
      }
    });
    const sandForce = calculateDamage({
      level: 50,
      attackerTypes: ["ground"],
      defenderTypes: ["normal"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 89, koreanName: "지진", englishName: "Earthquake", showdownId: "earthquake", type: "ground", category: "physical", power: 100 },
      ability: { key: 159, koreanName: "모래의힘", englishName: "Sand Force", showdownId: "sandforce" },
      modifiers: {
        weather: "sand",
        attacker: { atkStage: 0, defStage: 0, spaStage: 0, spdStage: 0, speStage: 0, reflect: false, lightScreen: false },
        defender: { atkStage: 0, defStage: 0, spaStage: 0, spdStage: 0, speStage: 0, reflect: false, lightScreen: false }
      }
    });

    expect(blaze?.abilityNotes?.join(" ")).toContain("맹화");
    expect(sandForce?.abilityNotes?.join(" ")).toContain("모래의힘");
  });

  it("applies stat stages, weather, and screens", () => {
    const neutral = calculateDamage({
      level: 50,
      attackerTypes: ["fire"],
      defenderTypes: ["normal"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 53, koreanName: "화염방사", englishName: "Flamethrower", type: "fire", category: "special", power: 90 }
    });
    const boosted = calculateDamage({
      level: 50,
      attackerTypes: ["fire"],
      defenderTypes: ["normal"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 53, koreanName: "화염방사", englishName: "Flamethrower", type: "fire", category: "special", power: 90 },
      modifiers: {
        weather: "sun",
        attacker: { atkStage: 0, defStage: 0, spaStage: 2, spdStage: 0, speStage: 0, reflect: false, lightScreen: false },
        defender: { atkStage: 0, defStage: 0, spaStage: 0, spdStage: -1, speStage: 0, reflect: false, lightScreen: false }
      }
    });
    const screened = calculateDamage({
      level: 50,
      attackerTypes: ["fire"],
      defenderTypes: ["normal"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 53, koreanName: "화염방사", englishName: "Flamethrower", type: "fire", category: "special", power: 90 },
      modifiers: {
        weather: "none",
        attacker: { atkStage: 0, defStage: 0, spaStage: 0, spdStage: 0, speStage: 0, reflect: false, lightScreen: false },
        defender: { atkStage: 0, defStage: 0, spaStage: 0, spdStage: 0, speStage: 0, reflect: false, lightScreen: true }
      }
    });

    expect(boosted!.minDamage).toBeGreaterThan(neutral!.minDamage);
    expect(screened!.maxDamage).toBeLessThan(neutral!.maxDamage);
  });

  it("uses current defender HP for KO summaries", () => {
    const result = calculateDamage({
      level: 50,
      attackerTypes: ["normal"],
      defenderTypes: ["normal"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 1, koreanName: "막치기", englishName: "Pound", type: "normal", category: "physical", power: 40 },
      modifiers: {
        weather: "none",
        attacker: { atkStage: 0, defStage: 0, spaStage: 0, spdStage: 0, speStage: 0, reflect: false, lightScreen: false },
        defender: { atkStage: 0, defStage: 0, spaStage: 0, spdStage: 0, speStage: 0, hpPercent: 20, reflect: false, lightScreen: false }
      }
    });

    expect(result?.koSummary).not.toBe("5타 이상");
  });

  it("uses current and max HP overrides for KO summaries and percentages", () => {
    const result = calculateDamage({
      level: 50,
      attackerTypes: ["normal"],
      defenderTypes: ["normal"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 1, koreanName: "막치기", englishName: "Pound", type: "normal", category: "physical", power: 40 },
      modifiers: {
        weather: "none",
        attacker: { atkStage: 0, defStage: 0, spaStage: 0, spdStage: 0, speStage: 0, reflect: false, lightScreen: false },
        defender: { atkStage: 0, defStage: 0, spaStage: 0, spdStage: 0, speStage: 0, hpCurrent: 30, hpMax: 200, reflect: false, lightScreen: false }
      }
    });

    expect(result?.koSummary).toBe("확정 1타");
    expect(result?.maxPercent).toBeLessThan(30);
  });

  it("applies custom move power multipliers", () => {
    const normal = calculateDamage({
      level: 50,
      attackerTypes: ["normal"],
      defenderTypes: ["normal"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 1, koreanName: "막치기", englishName: "Pound", type: "normal", category: "physical", power: 40 }
    });
    const boosted = calculateDamage({
      level: 50,
      attackerTypes: ["normal"],
      defenderTypes: ["normal"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 1, koreanName: "막치기", englishName: "Pound", type: "normal", category: "physical", power: 40 },
      modifiers: {
        weather: "none",
        attacker: { atkStage: 0, defStage: 0, spaStage: 0, spdStage: 0, speStage: 0, powerMultiplier: 2, reflect: false, lightScreen: false },
        defender: { atkStage: 0, defStage: 0, spaStage: 0, spdStage: 0, speStage: 0, reflect: false, lightScreen: false }
      }
    });

    expect(boosted!.minDamage).toBeGreaterThan(normal!.minDamage);
  });

  it("halves physical damage when the attacker is burned unless Guts is active", () => {
    const neutral = calculateDamage({
      level: 50,
      attackerTypes: ["normal"],
      defenderTypes: ["normal"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 1, koreanName: "막치기", englishName: "Pound", type: "normal", category: "physical", power: 40 }
    });
    const burned = calculateDamage({
      level: 50,
      attackerTypes: ["normal"],
      defenderTypes: ["normal"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 1, koreanName: "막치기", englishName: "Pound", type: "normal", category: "physical", power: 40 },
      modifiers: {
        weather: "none",
        attacker: { atkStage: 0, defStage: 0, spaStage: 0, spdStage: 0, speStage: 0, status: "burn", reflect: false, lightScreen: false },
        defender: { atkStage: 0, defStage: 0, spaStage: 0, spdStage: 0, speStage: 0, reflect: false, lightScreen: false }
      }
    });
    const gutsBurned = calculateDamage({
      level: 50,
      attackerTypes: ["normal"],
      defenderTypes: ["normal"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 1, koreanName: "막치기", englishName: "Pound", type: "normal", category: "physical", power: 40 },
      ability: { key: 62, koreanName: "근성", englishName: "Guts", showdownId: "guts" },
      modifiers: {
        weather: "none",
        attacker: { atkStage: 0, defStage: 0, spaStage: 0, spdStage: 0, speStage: 0, status: "burn", reflect: false, lightScreen: false },
        defender: { atkStage: 0, defStage: 0, spaStage: 0, spdStage: 0, speStage: 0, reflect: false, lightScreen: false }
      }
    });

    expect(burned!.maxDamage).toBeLessThan(neutral!.maxDamage);
    expect(gutsBurned!.maxDamage).toBe(neutral!.maxDamage);
  });

  it("applies sand and snow defensive weather boosts", () => {
    const neutralRock = calculateDamage({
      level: 50,
      attackerTypes: ["water"],
      defenderTypes: ["rock"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 57, koreanName: "파도타기", englishName: "Surf", type: "water", category: "special", power: 90 }
    });
    const sandRock = calculateDamage({
      level: 50,
      attackerTypes: ["water"],
      defenderTypes: ["rock"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 57, koreanName: "파도타기", englishName: "Surf", type: "water", category: "special", power: 90 },
      modifiers: {
        weather: "sand",
        attacker: { atkStage: 0, defStage: 0, spaStage: 0, spdStage: 0, speStage: 0, reflect: false, lightScreen: false },
        defender: { atkStage: 0, defStage: 0, spaStage: 0, spdStage: 0, speStage: 0, reflect: false, lightScreen: false }
      }
    });
    const neutralIce = calculateDamage({
      level: 50,
      attackerTypes: ["steel"],
      defenderTypes: ["ice"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 442, koreanName: "아이언헤드", englishName: "Iron Head", type: "steel", category: "physical", power: 80 }
    });
    const snowIce = calculateDamage({
      level: 50,
      attackerTypes: ["steel"],
      defenderTypes: ["ice"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 442, koreanName: "아이언헤드", englishName: "Iron Head", type: "steel", category: "physical", power: 80 },
      modifiers: {
        weather: "snow",
        attacker: { atkStage: 0, defStage: 0, spaStage: 0, spdStage: 0, speStage: 0, reflect: false, lightScreen: false },
        defender: { atkStage: 0, defStage: 0, spaStage: 0, spdStage: 0, speStage: 0, reflect: false, lightScreen: false }
      }
    });

    expect(sandRock!.maxDamage).toBeLessThan(neutralRock!.maxDamage);
    expect(snowIce!.maxDamage).toBeLessThan(neutralIce!.maxDamage);
  });

  it("applies defensive abilities such as Multiscale only when their condition is met", () => {
    const neutral = calculateDamage({
      level: 50,
      attackerTypes: ["normal"],
      defenderTypes: ["dragon", "flying"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 1, koreanName: "몸통박치기", englishName: "Tackle", showdownId: "tackle", type: "normal", category: "physical", power: 40 }
    });
    const multiscaleFullHp = calculateDamage({
      level: 50,
      attackerTypes: ["normal"],
      defenderTypes: ["dragon", "flying"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 1, koreanName: "몸통박치기", englishName: "Tackle", showdownId: "tackle", type: "normal", category: "physical", power: 40 },
      defenderAbility: { key: 136, koreanName: "멀티스케일", englishName: "Multiscale", showdownId: "multiscale" }
    });
    const multiscaleDamaged = calculateDamage({
      level: 50,
      attackerTypes: ["normal"],
      defenderTypes: ["dragon", "flying"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 1, koreanName: "몸통박치기", englishName: "Tackle", showdownId: "tackle", type: "normal", category: "physical", power: 40 },
      defenderAbility: { key: 136, koreanName: "멀티스케일", englishName: "Multiscale", showdownId: "multiscale" },
      modifiers: {
        weather: "none",
        attacker: { atkStage: 0, defStage: 0, spaStage: 0, spdStage: 0, speStage: 0, reflect: false, lightScreen: false },
        defender: { atkStage: 0, defStage: 0, spaStage: 0, spdStage: 0, speStage: 0, hpPercent: 99, reflect: false, lightScreen: false }
      }
    });

    expect(multiscaleFullHp!.maxDamage).toBeLessThan(neutral!.maxDamage);
    expect(multiscaleFullHp?.abilityNotes?.join(" ")).toContain("멀티스케일");
    expect(multiscaleDamaged!.maxDamage).toBe(neutral!.maxDamage);
  });

  it("applies common defensive ability damage modifiers", () => {
    const superEffective = calculateDamage({
      level: 50,
      attackerTypes: ["water"],
      defenderTypes: ["rock"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 57, koreanName: "파도타기", englishName: "Surf", showdownId: "surf", type: "water", category: "special", power: 90 }
    });
    const solidRock = calculateDamage({
      level: 50,
      attackerTypes: ["water"],
      defenderTypes: ["rock"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 57, koreanName: "파도타기", englishName: "Surf", showdownId: "surf", type: "water", category: "special", power: 90 },
      defenderAbility: { key: 116, koreanName: "하드록", englishName: "Solid Rock", showdownId: "solidrock" }
    });
    const physical = calculateDamage({
      level: 50,
      attackerTypes: ["normal"],
      defenderTypes: ["normal"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 1, koreanName: "몸통박치기", englishName: "Tackle", showdownId: "tackle", type: "normal", category: "physical", power: 40 }
    });
    const furCoat = calculateDamage({
      level: 50,
      attackerTypes: ["normal"],
      defenderTypes: ["normal"],
      attackerStats: garchompStats,
      defenderStats: garchompStats,
      move: { key: 1, koreanName: "몸통박치기", englishName: "Tackle", showdownId: "tackle", type: "normal", category: "physical", power: 40 },
      defenderAbility: { key: 169, koreanName: "퍼코트", englishName: "Fur Coat", showdownId: "furcoat" }
    });

    expect(solidRock!.maxDamage).toBeLessThan(superEffective!.maxDamage);
    expect(furCoat!.maxDamage).toBeLessThan(physical!.maxDamage);
  });
});

describe("summarizeKoChance", () => {
  it("reports guaranteed and random KO windows", () => {
    expect(summarizeKoChance([50, 60], 100)).toBe("확정 2타");
    expect(summarizeKoChance([30, 60], 100)).toBe("난수 2타 25.00%");
  });
});
