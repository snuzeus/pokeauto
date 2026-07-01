import { describe, expect, it } from "vitest";
import { calculateBulk } from "@/lib/calc/bulk";

describe("calculateBulk", () => {
  it("calculates physical and special bulk", () => {
    expect(calculateBulk({ hp: 185, atk: 182, def: 115, spa: 90, spd: 105, spe: 169 })).toEqual({
      physical: 21275,
      special: 19425
    });
  });
});
